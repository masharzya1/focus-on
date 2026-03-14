package PACKAGE_NAME_PLACEHOLDER

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.os.CountDownTimer
import android.view.Gravity
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

class BlockOverlayActivity : Activity() {

    companion object {
        const val EXTRA_APP_NAME = "blocked_app_name"
        const val EXTRA_HARD_BLOCK = "hard_block"
        const val EXTRA_DEVICE_ADMIN = "device_admin"

        private val QUOTES = arrayOf(
            "You're capable of more than this. 💪",
            "Hold on for 10 seconds, then get back to work.",
            "Your future self will thank you for this moment.",
            "Distraction is the enemy of your dream.",
            "1 hour of focus = 3 hours of random browsing.",
            "Do you really need to check this right now?",
            "Deep work > shallow scroll.",
            "Your goal matters more than this app.",
            "Focus. You've got this. 🎯",
            "Is this the most important thing right now?",
            "Take a break — but not like this. Go for a walk.",
            "Your time is your most valuable resource.",
        )
    }

    private var countdown: CountDownTimer? = null
    private var progressBarRef: ProgressBar? = null
    private var countdownTextRef: TextView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        val prefs = getSharedPreferences(AppBlockerAccessibilityService.PREFS_NAME, MODE_PRIVATE)
        val isPro = prefs.getBoolean("is_pro", false)
        val hardBlock = intent.getBooleanExtra(EXTRA_HARD_BLOCK, false)
        val deviceAdmin = intent.getBooleanExtra(EXTRA_DEVICE_ADMIN, false)

        buildUI(
            appName = intent.getStringExtra(EXTRA_APP_NAME) ?: "this app",
            quote = QUOTES.random(),
            showAd = !isPro,
            hardBlock = hardBlock,
            deviceAdmin = deviceAdmin
        )
    }

    private fun buildUI(appName: String, quote: String, showAd: Boolean,
                        hardBlock: Boolean, deviceAdmin: Boolean) {
        val dp = resources.displayMetrics.density
        val root = FrameLayout(this).apply { setBackgroundColor(0xF0_0F0F1A.toInt()) }
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding((32*dp).toInt(), (40*dp).toInt(), (32*dp).toInt(), (40*dp).toInt())
        }

        card.addView(TextView(this).apply {
            text = "\uD83D\uDD12"; textSize = 52f; gravity = Gravity.CENTER
        })

        card.addView(TextView(this).apply {
            text = "$appName is blocked"
            textSize = 14f
            setTextColor(0xFF_6C63FF.toInt())
            gravity = Gravity.CENTER
            setPadding(0, (16*dp).toInt(), 0, (4*dp).toInt())
            letterSpacing = 0.08f
        })

        card.addView(TextView(this).apply {
            text = quote; textSize = 22f
            setTextColor(0xFF_FFFFFF.toInt())
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.4f)
            setPadding(0, (8*dp).toInt(), 0, (32*dp).toInt())
        })

        // Hard block / Device admin label
        if (hardBlock || deviceAdmin) {
            card.addView(TextView(this).apply {
                text = if (deviceAdmin) "🛡️ Device Admin block active" else "🔒 Hard block active"
                textSize = 11f
                setTextColor(0xFF_8B85C1.toInt())
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, (16*dp).toInt())
            })
        }

        val pb = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 1000; progress = 1000
            progressDrawable?.setTint(0xFF_6C63FF.toInt())
            layoutParams = LinearLayout.LayoutParams((260*dp).toInt(), (6*dp).toInt())
                .also { it.gravity = Gravity.CENTER_HORIZONTAL }
        }
        progressBarRef = pb
        card.addView(pb)

        val ct = TextView(this).apply {
            text = "Redirecting in 10 seconds..."
            textSize = 13f
            setTextColor(0xFF_6B7280.toInt())
            gravity = Gravity.CENTER
            setPadding(0, (12*dp).toInt(), 0, 0)
        }
        countdownTextRef = ct
        card.addView(ct)

        if (showAd) {
            val adBanner = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                setBackgroundColor(0xFF_1C1A3E.toInt())
                setPadding((12*dp).toInt(), (10*dp).toInt(), (12*dp).toInt(), (10*dp).toInt())
                gravity = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).also { it.topMargin = (20*dp).toInt() }
            }
            adBanner.addView(TextView(this).apply {
                text = "AD"; textSize = 9f
                setTextColor(0xFF_6B7280.toInt())
                setPadding(0, 0, (8*dp).toInt(), 0)
            })
            adBanner.addView(TextView(this).apply {
                text = "Remove ads — upgrade to Pro ⭐"
                textSize = 12f; setTextColor(0xFF_A78BFA.toInt())
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            })
            card.addView(adBanner)
        }

        root.addView(card, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER
        ))
        setContentView(root)

        countdown = object : CountDownTimer(10_000, 100) {
            override fun onTick(millisLeft: Long) {
                progressBarRef?.progress = (millisLeft / 10.0).toInt().coerceIn(0, 1000)
                countdownTextRef?.text = "Redirecting in ${(millisLeft / 1000).toInt() + 1}s..."
            }
            override fun onFinish() {
                progressBarRef?.progress = 0
                goHome()
            }
        }.start()
    }

    private fun goHome() {
        startActivity(Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        })
        finish()
    }

    override fun onDestroy() {
        countdown?.cancel()
        progressBarRef = null
        countdownTextRef = null
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Block back button — go home instead (this prevents bypassing block)
        goHome()
    }

    override fun onPause() {
        super.onPause()
        // If user tries to navigate away, keep sending them home
        goHome()
    }
}
