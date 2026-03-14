package PACKAGE_NAME_PLACEHOLDER

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.net.Uri
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject

class AppBlockerAccessibilityService : AccessibilityService() {

    companion object {
        const val TAG = "AppBlocker"
        const val PREFS_NAME = "AppBlockingPrefs"
        const val KEY_BLOCKED_APPS = "blocked_apps"
        const val KEY_IS_BLOCKING = "is_blocking"
        const val KEY_IS_ROUTINE_BLOCKING = "is_routine_blocking"
        const val KEY_SERVICE_RUNNING = "service_running"
        const val KEY_ROUTINES = "block_routines"
        const val NOTIFICATION_CHANNEL_ID = "focus_on_blocking"

        private val REEL_PACKAGES = setOf(
            "com.instagram.android",
            "com.google.android.youtube",
            "com.facebook.katana",
            "com.facebook.orca",
            "com.zhiliaoapp.musically",
            "com.ss.android.ugc.trill",
            "com.snapchat.android",
        )

        private val REEL_ACTIVITY_CLASSES = setOf(
            "com.instagram.reels.activity.ReelsActivity",
            "com.instagram.igtv.igtv_gui.IgtvActivity",
            "com.google.android.apps.youtube.app.watchwhile.WatchWhileActivity",
            "com.facebook.reels.player.container.ReelsPlayerContainerActivity",
            "com.zhiliaoapp.musically.app.MainActivity",
        )

        private val REEL_VIEW_IDS = setOf(
            "com.instagram.android:id/clips_viewer_view_pager",
            "com.instagram.android:id/reel_viewer_root",
            "com.instagram.android:id/clips_swipe_refresh_container",
            "com.google.android.youtube:id/reel_player_page_container",
            "com.google.android.youtube:id/shorts_container",
            "com.google.android.youtube:id/reel_recycler",
            "com.facebook.katana:id/reels_container",
            "com.snapchat.android:id/spotlight_feed_container",
        )

        private val REEL_CONTENT_DESCS = setOf(
            "Reels", "Reel", "Shorts", "Short",
        )

        // Browser package names — for website blocking
        private val BROWSER_PACKAGES = setOf(
            "com.android.chrome",
            "org.mozilla.firefox",
            "com.microsoft.emmx",
            "com.opera.browser",
            "com.opera.mini.native",
            "com.brave.browser",
            "com.UCMobile.intl",
            "com.sec.android.app.sbrowser", // Samsung Browser
            "com.mi.globalbrowser",          // Mi Browser
            "com.android.browser",
            "com.google.android.browser",
        )
    }

    private lateinit var prefs: SharedPreferences
    private var lastBlockedPackage: String = ""
    private var lastOverlayTime: Long = 0L

    private var lastContentCheckPackage = ""
    private var lastContentCheckTime = 0L
    private val CONTENT_CHECK_DEBOUNCE_MS = 800L

    private val routineHandler = Handler(Looper.getMainLooper())
    private val routineSyncRunnable = object : Runnable {
        override fun run() {
            syncFromRoutines()
            routineHandler.postDelayed(this, 60_000L)
        }
    }

    private val prefListener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        if (key == KEY_ROUTINES) routineHandler.post { syncFromRoutines() }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putBoolean(KEY_SERVICE_RUNNING, true).apply()

        serviceInfo = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                         AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 50
        }
        Log.d(TAG, "Service connected")
        createNotificationChannel()
        routineHandler.post(routineSyncRunnable)
        prefs.registerOnSharedPreferenceChangeListener(prefListener)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val isBlocking = prefs.getBoolean(KEY_IS_BLOCKING, false)
        if (!isBlocking) return

        val pkg = event.packageName?.toString() ?: return
        if (pkg == applicationContext.packageName) return

        val now = System.currentTimeMillis()
        if (pkg == lastBlockedPackage && now - lastOverlayTime < 3000) return

        val blockedApps = parseBlockedApps(prefs.getString(KEY_BLOCKED_APPS, "[]") ?: "[]")

        // Whole-app block
        if (blockedApps.contains(pkg)) {
            Log.d(TAG, "Whole-app block: $pkg")
            showOverlay(pkg)
            return
        }

        // Website block — only in browser apps
        if (pkg in BROWSER_PACKAGES) {
            checkAndBlockWebsite()
        }

        // Reel-only block
        val reelKey = "reels:$pkg"
        if (!blockedApps.contains(reelKey)) return
        if (pkg !in REEL_PACKAGES) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val cls = event.className?.toString() ?: return
                val shortCls = cls.substringAfterLast('.')
                if (REEL_ACTIVITY_CLASSES.any { it.endsWith(shortCls) || cls == it }) {
                    Log.d(TAG, "Reel activity: $pkg / $cls")
                    showOverlay(pkg)
                }
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                if (pkg == lastContentCheckPackage &&
                    now - lastContentCheckTime < CONTENT_CHECK_DEBOUNCE_MS) return
                lastContentCheckPackage = pkg
                lastContentCheckTime = now
                if (isReelViewVisible()) {
                    Log.d(TAG, "Reel view detected in $pkg")
                    showOverlay(pkg)
                }
            }
        }
    }

    private fun isReelViewVisible(): Boolean {
        val root = rootInActiveWindow ?: return false
        return try { bfsFind(root) } finally { root.recycle() }
    }

    private fun bfsFind(root: AccessibilityNodeInfo): Boolean {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        var checked = 0
        val MAX_NODES = 120

        while (queue.isNotEmpty() && checked < MAX_NODES) {
            val node = queue.removeFirst()
            checked++
            val viewId = node.viewIdResourceName
            if (viewId != null && REEL_VIEW_IDS.contains(viewId)) {
                recycleQueue(queue); return true
            }
            val desc = node.contentDescription?.toString()
            if (desc != null && REEL_CONTENT_DESCS.any { desc.contains(it, ignoreCase = true) }) {
                recycleQueue(queue); return true
            }
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { queue.add(it) }
            }
        }
        recycleQueue(queue)
        return false
    }

    private fun recycleQueue(queue: ArrayDeque<AccessibilityNodeInfo>) {
        queue.forEach { try { it.recycle() } catch (_: Exception) {} }
        queue.clear()
    }

    /**
     * Shows the block overlay. Reads hardBlock and deviceAdmin from prefs
     * (saved by AppBlockingModule.startBlocking or syncFromRoutines) and
     * passes them to BlockOverlayActivity so it can display the correct UI.
     */
    // ── Website blocking ──────────────────────────────────────────────────
    private var lastWebBlockTime = 0L

    private fun checkAndBlockWebsite() {
        val now = System.currentTimeMillis()
        if (now - lastWebBlockTime < 1500) return // debounce

        val blockedJson = prefs.getString(AppBlockingModule.KEY_BLOCKED_WEBSITES, "[]") ?: "[]"
        val blockedDomains = try {
            val arr = org.json.JSONArray(blockedJson)
            (0 until arr.length()).map { arr.getString(it).lowercase().trim() }.toSet()
        } catch (e: Exception) { emptySet() }

        if (blockedDomains.isEmpty()) return

        val root = rootInActiveWindow ?: return
        val urlText = findAddressBarText(root)
        root.recycle()

        if (urlText.isNullOrBlank()) return
        val domain = extractDomain(urlText).lowercase()

        if (blockedDomains.any { domain == it || domain.endsWith(".${'$'}it") }) {
            android.util.Log.d(TAG, "Website blocked: $domain")
            lastWebBlockTime = now
            performGlobalAction(GLOBAL_ACTION_BACK)
        }
    }

    private fun findAddressBarText(root: AccessibilityNodeInfo): String? {
        // Search for URL/address bar in browser — common resource IDs
        val urlBarIds = listOf(
            "com.android.chrome:id/url_bar",
            "com.android.chrome:id/search_box_text",
            "org.mozilla.firefox:id/url_edit_text",
            "org.mozilla.firefox:id/mozac_browser_toolbar_url_view",
            "com.microsoft.emmx:id/url_bar",
            "com.brave.browser:id/url_bar",
            "com.sec.android.app.sbrowser:id/location_bar_edit_text",
        )
        for (id in urlBarIds) {
            val nodes = root.findAccessibilityNodeInfosByViewId(id)
            if (nodes.isNotEmpty()) {
                val text = nodes[0].text?.toString()
                if (!text.isNullOrBlank()) return text
            }
        }
        // Fallback: BFS search for EditText with URL-like content
        return findUrlTextBfs(root)
    }

    private fun findUrlTextBfs(root: AccessibilityNodeInfo): String? {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        var checked = 0
        while (queue.isNotEmpty() && checked < 80) {
            val node = queue.removeFirst()
            checked++
            val cls = node.className?.toString() ?: ""
            if ((cls.contains("EditText") || cls.contains("TextView")) && node.isClickable) {
                val text = node.text?.toString() ?: ""
                if (text.contains(".") && (text.startsWith("http") || text.contains("www.") ||
                    text.matches(Regex("[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}.*")))) {
                    return text
                }
            }
            for (i in 0 until node.childCount) node.getChild(i)?.let { queue.add(it) }
        }
        return null
    }

    private fun extractDomain(url: String): String {
        return try {
            val withScheme = if (!url.startsWith("http")) "https://$url" else url
            Uri.parse(withScheme).host?.removePrefix("www.") ?: url
        } catch (e: Exception) { url }
    }
    // ── End website blocking ──────────────────────────────────────────────────

    private fun showOverlay(packageName: String) {
        lastBlockedPackage = packageName
        lastOverlayTime = System.currentTimeMillis()

        val appName = try {
            packageManager.getApplicationLabel(
                packageManager.getApplicationInfo(packageName, 0)
            ).toString()
        } catch (e: Exception) {
            packageName.split(".").last()
        }

        // Read flags saved by startBlocking or syncFromRoutines
        val hardBlock = prefs.getBoolean(AppBlockingModule.KEY_HARD_BLOCK, false)
        val deviceAdmin = prefs.getBoolean(AppBlockingModule.KEY_DEVICE_ADMIN, false)

        applicationContext.startActivity(
            Intent(applicationContext, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra(BlockOverlayActivity.EXTRA_APP_NAME, appName)
                putExtra(BlockOverlayActivity.EXTRA_HARD_BLOCK, hardBlock)
                putExtra(BlockOverlayActivity.EXTRA_DEVICE_ADMIN, deviceAdmin)
            }
        )
    }

    /**
     * Reads saved routines from SharedPreferences and decides whether blocking
     * should be active right now — completely independent of the JS layer.
     * Also saves hardBlock/deviceAdmin flags so showOverlay can pass them to
     * BlockOverlayActivity correctly.
     */
    private fun syncFromRoutines() {
        try {
            val routinesJson = prefs.getString(KEY_ROUTINES, null) ?: return
            val routines = JSONArray(routinesJson)

            val now = currentTime()
            val todayIdx = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK) - 1

            val allApps = mutableSetOf<String>()
            var blockShorts = false
            var hardBlock = false
            var deviceAdmin = false
            var anyActive = false

            for (i in 0 until routines.length()) {
                val r: JSONObject = routines.getJSONObject(i)
                if (!r.optBoolean("enabled", false)) continue

                val start = r.optString("startTime", "")
                val end = r.optString("endTime", "")
                if (start.isEmpty() || end.isEmpty()) continue

                val days = r.optJSONArray("days")
                val matchesDay = days == null || days.length() == 0 ||
                    (0 until days.length()).any { days.getInt(it) == todayIdx }

                if (!matchesDay || now < start || now > end) continue

                anyActive = true
                val apps = r.optJSONArray("blockedApps") ?: continue
                for (j in 0 until apps.length()) allApps.add(apps.getString(j))
                if (r.optBoolean("blockShorts", false)) blockShorts = true
                if (r.optBoolean("hardBlock", false)) hardBlock = true
                if (r.optBoolean("deviceAdmin", false)) deviceAdmin = true
            }

            if (anyActive && allApps.isNotEmpty()) {
                val reelPackages = setOf(
                    "com.instagram.android", "com.google.android.youtube",
                    "com.facebook.katana", "com.facebook.orca"
                )
                val finalApps = allApps.toMutableSet()
                if (blockShorts) {
                    for (pkg in reelPackages) {
                        if (!finalApps.contains(pkg)) finalApps.add("reels:$pkg")
                    }
                }
                val appsJson = JSONArray(finalApps.toList()).toString()
                prefs.edit()
                    .putString(KEY_BLOCKED_APPS, appsJson)
                    .putBoolean(KEY_IS_BLOCKING, true)
                    .putBoolean(KEY_IS_ROUTINE_BLOCKING, true)
                    .putBoolean(AppBlockingModule.KEY_HARD_BLOCK, hardBlock)
                    .putBoolean(AppBlockingModule.KEY_DEVICE_ADMIN, deviceAdmin)
                    .apply()
                Log.d(TAG, "Routine sync: blocking ON — ${finalApps.size} apps, hard:$hardBlock admin:$deviceAdmin")
            } else {
                val wasRoutineBlocking = prefs.getBoolean(KEY_IS_ROUTINE_BLOCKING, false)
                if (wasRoutineBlocking) {
                    prefs.edit()
                        .putBoolean(KEY_IS_BLOCKING, false)
                        .putBoolean(KEY_IS_ROUTINE_BLOCKING, false)
                        .putBoolean(AppBlockingModule.KEY_HARD_BLOCK, false)
                        .putBoolean(AppBlockingModule.KEY_DEVICE_ADMIN, false)
                        .apply()
                    Log.d(TAG, "Routine sync: blocking OFF")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncFromRoutines error: ${e.message}")
        }
    }

    private fun currentTime(): String {
        val cal = java.util.Calendar.getInstance()
        return "${String.format("%02d", cal.get(java.util.Calendar.HOUR_OF_DAY))}:" +
               "${String.format("%02d", cal.get(java.util.Calendar.MINUTE))}"
    }

    /**
     * Parses the blocked apps list. Handles a plain JSON array of strings.
     * The object format {"apps":[...]} is now parsed by AppBlockingModule.startBlocking
     * before saving, so this method only ever sees plain arrays.
     */
    private fun parseBlockedApps(json: String): Set<String> {
        return try {
            val trimmed = json.trim()
            // Safety: if somehow an object arrived, extract the apps array
            if (trimmed.startsWith("{")) {
                val obj = JSONObject(trimmed)
                val arr = obj.optJSONArray("apps") ?: return emptySet()
                (0 until arr.length()).mapNotNull {
                    arr.optString(it).takeIf { s -> s.isNotEmpty() }
                }.toSet()
            } else {
                val arr = JSONArray(trimmed)
                (0 until arr.length()).mapNotNull {
                    arr.optString(it).takeIf { s -> s.isNotEmpty() }
                }.toSet()
            }
        } catch (e: Exception) {
            Log.e(TAG, "parseBlockedApps error: ${e.message} — json: $json")
            emptySet()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Focus On - App Blocking",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Active when Focus On is blocking apps" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    override fun onInterrupt() { Log.d(TAG, "Interrupted") }

    override fun onDestroy() {
        routineHandler.removeCallbacks(routineSyncRunnable)
        prefs.unregisterOnSharedPreferenceChangeListener(prefListener)
        prefs.edit().putBoolean(KEY_SERVICE_RUNNING, false).apply()
        super.onDestroy()
    }
}
