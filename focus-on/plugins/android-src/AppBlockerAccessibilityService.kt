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
        const val KEY_IS_ROUTINE_BLOCKING = "is_routine_blocking"  // set only by routine sync
        const val KEY_SERVICE_RUNNING = "service_running"
        const val KEY_ROUTINES = "block_routines"
        const val NOTIFICATION_CHANNEL_ID = "focus_on_blocking"

        // ── Whole-app blocking ───────────────────────────────────────────────
        // These packages get blocked entirely when added to the blocked list
        // (no special reel detection needed — whole app is blocked)

        // ── Reel/Shorts detection ────────────────────────────────────────────
        // Packages where we check for reel content even if whole app isn't blocked
        private val REEL_PACKAGES = setOf(
            "com.instagram.android",
            "com.google.android.youtube",
            "com.facebook.katana",
            "com.facebook.orca",
            "com.zhiliaoapp.musically",   // TikTok
            "com.ss.android.ugc.trill",   // TikTok (some regions)
            "com.snapchat.android",
        )

        // Activity class names that indicate reel/shorts is open
        // Checked via TYPE_WINDOW_STATE_CHANGED
        private val REEL_ACTIVITY_CLASSES = setOf(
            // Instagram
            "com.instagram.reels.activity.ReelsActivity",
            "com.instagram.igtv.igtv_gui.IgtvActivity",
            // YouTube
            "com.google.android.apps.youtube.app.watchwhile.WatchWhileActivity",
            // Facebook
            "com.facebook.reels.player.container.ReelsPlayerContainerActivity",
            // TikTok — whole app is reels, so any activity counts
            "com.zhiliaoapp.musically.app.MainActivity",
        )

        // View resource IDs that appear only in reel/shorts player
        // Checked via TYPE_WINDOW_CONTENT_CHANGED (catches in-app navigation)
        private val REEL_VIEW_IDS = setOf(
            // Instagram Reels
            "com.instagram.android:id/clips_viewer_view_pager",
            "com.instagram.android:id/reel_viewer_root",
            "com.instagram.android:id/clips_swipe_refresh_container",
            // YouTube Shorts
            "com.google.android.youtube:id/reel_player_page_container",
            "com.google.android.youtube:id/shorts_container",
            "com.google.android.youtube:id/reel_recycler",
            // Facebook Reels
            "com.facebook.katana:id/reels_container",
            // Snapchat Spotlight
            "com.snapchat.android:id/spotlight_feed_container",
        )

        // Content descriptions that appear in reel UI
        private val REEL_CONTENT_DESCS = setOf(
            "Reels", "Reel", "Shorts", "Short",
            "রিলস", "শর্টস",  // Bengali
        )
    }

    private lateinit var prefs: SharedPreferences
    private var lastBlockedPackage: String = ""
    private var lastOverlayTime: Long = 0L

    // Debounce content-changed events — fires hundreds of times per second
    private var lastContentCheckPackage = ""
    private var lastContentCheckTime = 0L
    private val CONTENT_CHECK_DEBOUNCE_MS = 800L

    // Routine-aware sync — runs every 60s independently of JS layer
    private val routineHandler = Handler(Looper.getMainLooper())
    private val routineSyncRunnable = object : Runnable {
        override fun run() {
            syncFromRoutines()
            routineHandler.postDelayed(this, 60_000L)
        }
    }

    // Immediate sync when JS saves new routines — fixes the "need to reopen app" bug
    private val prefListener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        if (key == KEY_ROUTINES) {
            routineHandler.post { syncFromRoutines() }
        }
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
        // Sync immediately, then every 60s — works even when app is closed
        routineHandler.post(routineSyncRunnable)
        // Listen for immediate routine changes from JS layer
        prefs.registerOnSharedPreferenceChangeListener(prefListener)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val isBlocking = prefs.getBoolean(KEY_IS_BLOCKING, false)
        if (!isBlocking) return

        val pkg = event.packageName?.toString() ?: return
        if (pkg == applicationContext.packageName) return

        // Global cooldown per package
        val now = System.currentTimeMillis()
        if (pkg == lastBlockedPackage && now - lastOverlayTime < 3000) return

        val blockedApps = parseBlockedApps(prefs.getString(KEY_BLOCKED_APPS, "[]") ?: "[]")

        // ── Case 1: Whole app blocked ────────────────────────────────────────
        if (blockedApps.contains(pkg)) {
            Log.d(TAG, "Whole-app block: $pkg")
            showOverlay(pkg)
            return
        }

        // ── Case 2: Reel-only block ──────────────────────────────────────────
        val reelKey = "reels:$pkg"
        if (!blockedApps.contains(reelKey)) return
        if (pkg !in REEL_PACKAGES) return

        when (event.eventType) {

            // Fast path: activity class name tells us reels is open
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val cls = event.className?.toString() ?: return
                val shortCls = cls.substringAfterLast('.')
                if (REEL_ACTIVITY_CLASSES.any { it.endsWith(shortCls) || cls == it }) {
                    Log.d(TAG, "Reel activity: $pkg / $cls")
                    showOverlay(pkg)
                }
            }

            // Slow path: scan view tree for reel-specific view IDs
            // Only run this every CONTENT_CHECK_DEBOUNCE_MS to avoid killing battery
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

    /**
     * Scans the active window's view hierarchy looking for any view whose
     * resource-id or content-description matches a known reel/shorts UI element.
     *
     * Uses BFS so it stops as soon as it finds a match — no full tree traversal.
     */
    private fun isReelViewVisible(): Boolean {
        val root = rootInActiveWindow ?: return false
        return try {
            bfsFind(root)
        } finally {
            root.recycle()
        }
    }

    private fun bfsFind(root: AccessibilityNodeInfo): Boolean {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        var checked = 0
        val MAX_NODES = 120  // Don't scan entire tree — stop early

        while (queue.isNotEmpty() && checked < MAX_NODES) {
            val node = queue.removeFirst()
            checked++

            // Check resource ID
            val viewId = node.viewIdResourceName
            if (viewId != null && REEL_VIEW_IDS.contains(viewId)) {
                recycleQueue(queue)
                return true
            }

            // Check content description
            val desc = node.contentDescription?.toString()
            if (desc != null && REEL_CONTENT_DESCS.any { desc.contains(it, ignoreCase = true) }) {
                recycleQueue(queue)
                return true
            }

            // Add children
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

        applicationContext.startActivity(
            Intent(applicationContext, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra(BlockOverlayActivity.EXTRA_APP_NAME, appName)
            }
        )
    }

    /**
     * Reads saved routines from SharedPreferences and decides whether blocking
     * should be active right now — completely independent of the JS layer.
     * Called every 60 seconds by routineSyncRunnable.
     */
    private fun syncFromRoutines() {
        try {
            val routinesJson = prefs.getString(KEY_ROUTINES, null) ?: return
            val routines = JSONArray(routinesJson)

            val now = currentTime()
            val todayIdx = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK) - 1 // 0=Sun

            val allApps = mutableSetOf<String>()
            var blockShorts = false
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

                if (!matchesDay) continue
                if (now < start || now > end) continue

                // This routine is active right now
                anyActive = true
                val apps = r.optJSONArray("blockedApps") ?: continue
                for (j in 0 until apps.length()) allApps.add(apps.getString(j))
                if (r.optBoolean("blockShorts", false)) blockShorts = true
            }

            if (anyActive && allApps.isNotEmpty()) {
                // Build the final list — add reels: prefixes if blockShorts
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
                    .apply()
                Log.d(TAG, "Routine sync: blocking ON — $appsJson")
            } else {
                // Only turn off blocking if a routine was the one that turned it on.
                // If a timer/manual call started blocking, leave it alone.
                val wasRoutineBlocking = prefs.getBoolean(KEY_IS_ROUTINE_BLOCKING, false)
                if (wasRoutineBlocking) {
                    prefs.edit()
                        .putBoolean(KEY_IS_BLOCKING, false)
                        .putBoolean(KEY_IS_ROUTINE_BLOCKING, false)
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

    private fun parseBlockedApps(json: String): Set<String> {
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).mapNotNull {
                arr.optString(it).takeIf { s -> s.isNotEmpty() }
            }.toSet()
        } catch (e: Exception) {
            try {
                json.trim().removePrefix("[").removeSuffix("]")
                    .split(",")
                    .map { it.trim().removeSurrounding("\"") }
                    .filter { it.isNotEmpty() }
                    .toSet()
            } catch (_: Exception) { emptySet() }
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