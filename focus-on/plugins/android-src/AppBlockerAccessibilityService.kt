package PACKAGE_NAME_PLACEHOLDER

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import android.widget.TextView

// ── Overlay messages (user fills in their own later) ─────────────────────────
private val MOTIVATIONAL_TEXTS = arrayOf(
    "Stay focused. Your future self will thank you. 🎯",
    "You're stronger than the algorithm. 💪",
    "Every second counts. Get back to work!",
    "Discipline is choosing between what you want now and what you want most.",
    "The app will be back. Your exam won't wait. 📚",
    "Short-form content is designed to steal your attention. Don't let it.",
    "Champions don't scroll during study time. 🏆",
    "Your competitors are studying right now.",
    "One more topic, then rest. You've got this!",
    "Focus is a skill. You're training it right now.",
)

class AppBlockerAccessibilityService : AccessibilityService() {

    // SharedPrefs key for shorts-specific activity patterns
    private val SHORTS_PACKAGES = setOf(
        "com.zhiliaoapp.musically",  // TikTok
        "com.ss.android.ugc.trill",  // TikTok (alt)
        "com.instagram.android",
        "com.snapchat.android",
        "com.google.android.youtube",
    )
    private val SHORTS_ACTIVITIES = setOf(
        "ShortsActivity", "ReelActivity", "ReelsActivity",
        "VideoFeedActivity", "ShortsPlayerActivity",
        "com.google.android.youtube.ui.shorts",
    )

    private var overlayView: FrameLayout? = null
    private var windowManager: WindowManager? = null
    private val handler = Handler(Looper.getMainLooper())
    private var lastBlockedPackage = ""
    private var textIndex = 0

override fun onServiceConnected() {
    super.onServiceConnected()
    prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)

    val info = AccessibilityServiceInfo().apply {
        eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                     AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED  // ← Reels এর জন্য
        feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
        flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS  // ← এটা missing ছিল
        notificationTimeout = 100
    }
    serviceInfo = info

    Log.d(TAG, "AppBlocker Accessibility Service connected!")
    createNotificationChannel()
}

// Instagram/Facebook Reels এবং YouTube Shorts এর known class names
private val REEL_CLASS_NAMES = setOf(
    "com.instagram.android/com.instagram.igtv.igtv_gui.IgtvActivity",
    "com.google.android.youtube/com.google.android.apps.youtube.app.watchwhile.WatchWhileActivity",
    "com.facebook.katana/com.facebook.reels.player.container.ReelsPlayerContainerActivity"
)

// এই package গুলোর জন্য class name দিয়ে রeel চেক করো
private val REEL_PACKAGES = setOf(
    "com.instagram.android",
    "com.google.android.youtube",
    "com.facebook.katana",
    "com.facebook.orca" // Messenger
)

override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return

    val isBlocking = prefs.getBoolean(KEY_IS_BLOCKING, false)
    if (!isBlocking) return

    val packageName = event.packageName?.toString() ?: return
    val ourPackage = applicationContext.packageName
    if (packageName == ourPackage) return

    val blockedAppsJson = prefs.getString(KEY_BLOCKED_APPS, "[]") ?: "[]"
    val blockedApps = parseBlockedApps(blockedAppsJson)

    // Case 1: পুরো app blocked
    if (blockedApps.contains(packageName)) {
        Log.d(TAG, "Blocked app: $packageName")
        bringFocusOnToFront()
        return
    }

    // Case 2: Reel-specific blocking (app blocked না থাকলেও)
    if (blockedApps.contains("reels:$packageName") && packageName in REEL_PACKAGES) {
        val className = event.className?.toString() ?: return
        val fullName = "$packageName/$className"
        if (REEL_CLASS_NAMES.any { fullName.contains(it.split("/").last()) }) {
            Log.d(TAG, "Reel detected in $packageName, blocking!")
            bringFocusOnToFront()
        }
    }
}

    private fun showOverlay() {
        if (overlayView != null) return  // already showing

        val msg = MOTIVATIONAL_TEXTS[textIndex % MOTIVATIONAL_TEXTS.size]
        textIndex++

        handler.post {
            try {
                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    else
                        @Suppress("DEPRECATION")
                        WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    PixelFormat.TRANSLUCENT
                )
                params.gravity = Gravity.CENTER

                val container = FrameLayout(this)
                container.setBackgroundColor(Color.argb(230, 13, 14, 20))  // dark navy

                val tv = TextView(this)
                tv.text = msg
                tv.textSize = 20f
                tv.setTextColor(Color.parseColor("#EAE8DF"))
                tv.gravity = Gravity.CENTER
                tv.setPadding(60, 40, 60, 40)
                tv.typeface = android.graphics.Typeface.DEFAULT_BOLD

                val lp = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                )
                lp.gravity = Gravity.CENTER
                container.addView(tv, lp)

                windowManager?.addView(container, params)
                overlayView = container

                // Auto dismiss after 10 seconds and go back
                handler.postDelayed({
                    dismissOverlay()
                    goHome()
                }, 10_000)

            } catch (_: Exception) {}
        }
    }

    private fun dismissOverlay() {
        handler.post {
            try {
                overlayView?.let { windowManager?.removeView(it) }
            } catch (_: Exception) {}
            overlayView = null
        }
    }

    private fun goHome() {
        val intent = Intent(this, Class.forName("$packageName.MainActivity")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        }
        startActivity(intent)
    }

    override fun onInterrupt() { dismissOverlay() }

    override fun onDestroy() {
        dismissOverlay()
        super.onDestroy()
    }
}
