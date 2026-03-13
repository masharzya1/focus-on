package PACKAGE_NAME_PLACEHOLDER

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class AppBlockerAccessibilityService : AccessibilityService() {

    companion object {
        const val TAG = "AppBlocker"
        const val PREFS_NAME = "AppBlockingPrefs"
        const val KEY_BLOCKED_APPS = "blocked_apps"
        const val KEY_IS_BLOCKING = "is_blocking"
        const val KEY_SERVICE_RUNNING = "service_running"
        const val NOTIFICATION_CHANNEL_ID = "focus_on_blocking"
        const val NOTIFICATION_ID = 1001

        private val REEL_CLASS_NAMES = setOf(
            "com.instagram.igtv.igtv_gui.IgtvActivity",
            "com.instagram.reels.activity.ReelsActivity",
            "com.google.android.apps.youtube.app.watchwhile.WatchWhileActivity",
            "com.facebook.reels.player.container.ReelsPlayerContainerActivity"
        )
        private val REEL_PACKAGES = setOf(
            "com.instagram.android",
            "com.google.android.youtube",
            "com.facebook.katana",
            "com.facebook.orca"
        )
    }

    private lateinit var prefs: SharedPreferences
    private var lastBlockedPackage: String = ""
    private var lastOverlayTime: Long = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)

        // Mark service as running so JS side can read this
        prefs.edit().putBoolean(KEY_SERVICE_RUNNING, true).apply()

        serviceInfo = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                         AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
        }

        Log.d(TAG, "AppBlocker Service connected!")
        createNotificationChannel()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val isBlocking = prefs.getBoolean(KEY_IS_BLOCKING, false)
        if (!isBlocking) return

        val packageName = event.packageName?.toString() ?: return
        val ourPackage = applicationContext.packageName
        if (packageName == ourPackage) return

        // Cooldown: don't spam overlays for same app within 3s
        val now = System.currentTimeMillis()
        if (packageName == lastBlockedPackage && now - lastOverlayTime < 3000) return

        val blockedApps = parseBlockedApps(prefs.getString(KEY_BLOCKED_APPS, "[]") ?: "[]")

        if (blockedApps.contains(packageName)) {
            Log.d(TAG, "Blocked: $packageName")
            showOverlay(packageName)
            return
        }

        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            packageName in REEL_PACKAGES &&
            blockedApps.contains("reels:$packageName")
        ) {
            val className = event.className?.toString() ?: return
            if (REEL_CLASS_NAMES.any { className.contains(it) }) {
                Log.d(TAG, "Reel detected: $packageName / $className")
                showOverlay(packageName)
            }
        }
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

    private fun parseBlockedApps(json: String): Set<String> {
        return try {
            val arr = org.json.JSONArray(json)
            (0 until arr.length()).mapNotNull { arr.optString(it).takeIf { s -> s.isNotEmpty() } }.toSet()
        } catch (e: Exception) {
            try {
                json.trim().removePrefix("[").removeSuffix("]")
                    .split(",").map { it.trim().removeSurrounding("\"") }
                    .filter { it.isNotEmpty() }.toSet()
            } catch (e2: Exception) { emptySet() }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID, "Focus On - App Blocking",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Shows when Focus On is actively blocking apps" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    override fun onInterrupt() { Log.d(TAG, "Service interrupted") }

    override fun onDestroy() {
        prefs.edit().putBoolean(KEY_SERVICE_RUNNING, false).apply()
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
    }
}
