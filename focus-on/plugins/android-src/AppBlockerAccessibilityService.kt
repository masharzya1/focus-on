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

/**
 * AppBlockerAccessibilityService
 *
 * Monitors foreground app. When a blocked app is detected:
 * → Launches BlockOverlayActivity (10s countdown + random quote)
 *
 * Also handles Reels/Shorts inside apps via TYPE_WINDOW_CONTENT_CHANGED.
 */
class AppBlockerAccessibilityService : AccessibilityService() {

    companion object {
        const val TAG = "AppBlocker"
        const val PREFS_NAME = "AppBlockingPrefs"
        const val KEY_BLOCKED_APPS = "blocked_apps"
        const val KEY_IS_BLOCKING = "is_blocking"
        const val NOTIFICATION_CHANNEL_ID = "focus_on_blocking"
        const val NOTIFICATION_ID = 1001

        // Reel/Shorts class names to detect in-app navigation
        private val REEL_CLASS_NAMES = setOf(
            "com.instagram.igtv.igtv_gui.IgtvActivity",
            "com.instagram.reels.activity.ReelsActivity",
            "com.google.android.apps.youtube.app.watchwhile.WatchWhileActivity",
            "com.facebook.reels.player.container.ReelsPlayerContainerActivity"
        )

        // Packages where we check class names for reel detection
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

        serviceInfo = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                         AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
        }

        Log.d(TAG, "AppBlocker Accessibility Service connected!")
        createNotificationChannel()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val isBlocking = prefs.getBoolean(KEY_IS_BLOCKING, false)
        if (!isBlocking) return

        val packageName = event.packageName?.toString() ?: return
        val ourPackage = applicationContext.packageName
        if (packageName == ourPackage) return

        // Don't spam overlays — 3s cooldown per package
        val now = System.currentTimeMillis()
        if (packageName == lastBlockedPackage && now - lastOverlayTime < 3000) return

        val blockedAppsJson = prefs.getString(KEY_BLOCKED_APPS, "[]") ?: "[]"
        val blockedApps = parseBlockedApps(blockedAppsJson)

        // Case 1: Whole app is blocked
        if (blockedApps.contains(packageName)) {
            Log.d(TAG, "Blocked app detected: $packageName")
            showOverlay(packageName)
            return
        }

        // Case 2: Reel/Shorts inside a non-blocked app (TYPE_WINDOW_STATE_CHANGED only)
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            packageName in REEL_PACKAGES &&
            blockedApps.contains("reels:$packageName")
        ) {
            val className = event.className?.toString() ?: return
            if (REEL_CLASS_NAMES.any { className.contains(it) }) {
                Log.d(TAG, "Reel detected in $packageName: $className")
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

        val intent = Intent(applicationContext, BlockOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra(BlockOverlayActivity.EXTRA_APP_NAME, appName)
        }
        applicationContext.startActivity(intent)
    }

    private fun parseBlockedApps(json: String): Set<String> {
        return try {
            val arr = org.json.JSONArray(json)
            val set = mutableSetOf<String>()
            for (i in 0 until arr.length()) {
                val s = arr.optString(i, "")
                if (s.isNotEmpty()) set.add(s)
            }
            set
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing blocked apps JSON: $e")
            // fallback manual parse
            try {
                val trimmed = json.trim().removePrefix("[").removeSuffix("]")
                if (trimmed.isEmpty()) emptySet()
                else trimmed.split(",")
                    .map { it.trim().removeSurrounding("\"") }
                    .filter { it.isNotEmpty() }
                    .toSet()
            } catch (e2: Exception) { emptySet() }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Focus On - App Blocking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when Focus On is actively blocking apps"
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "AppBlocker Service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "AppBlocker Service destroyed")
    }
}
