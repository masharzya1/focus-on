package PACKAGE_NAME_PLACEHOLDER

import android.app.Activity
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
        const val EXTRA_APP_NAME      = "blocked_app_name"
        const val EXTRA_HARD_BLOCK    = "hard_block"
        const val EXTRA_DEVICE_ADMIN  = "device_admin"
        const val EXTRA_TIME_LIMIT    = "time_limit_reached"
        const val EXTRA_MINUTES_USED  = "minutes_used"
        const val EXTRA_LIMIT_MINUTES = "limit_minutes"

        private val QUOTES = arrayOf(
            "You're capable of more than this. 💪",
            "Your future self will thank you for this moment.",
            "Distraction is the enemy of your dream.",
            "1 hour of focus = 3 hours of random browsing.",
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

        val prefs     = getSharedPreferences(AppBlockerAccessibilityService.PREFS_NAME, MODE_PRIVATE)
        val isPro     = prefs.getBoolean("is_pro", false)
        val hardBlock = intent.getBooleanExtra(EXTRA_HARD_BLOCK, false)
        val devAdmin  = intent.getBooleanExtra(EXTRA_DEVICE_ADMIN, false)
        val timeLimit = intent.getBooleanExtra(EXTRA_TIME_LIMIT, false)
        val minsUsed  = intent.getIntExtra(EXTRA_MINUTES_USED, 0)
        val limitMins = intent.getIntExtra(EXTRA_LIMIT_MINUTES, 0)
        val appName   = intent.getStringExtra(EXTRA_APP_NAME) ?: "this app"

        buildUI(
            appName    = appName,
            showAd     = !isPro,
            hardBlock  = hardBlock || timeLimit,   // time limit also = permanent block
            deviceAdmin = devAdmin,
            timeLimit  = timeLimit,
            minsUsed   = minsUsed,
            limitMins  = limitMins
        )
    }

    private fun buildUI(
        appName: String, showAd: Boolean,
        hardBlock: Boolean, deviceAdmin: Boolean,
        timeLimit: Boolean, minsUsed: Int, limitMins: Int
    ) {
        val dp   = resources.displayMetrics.density
        val root = FrameLayout(this).apply { setBackgroundColor(0xF2_0A0A12.toInt()) }
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity     = Gravity.CENTER
            setPadding((32*dp).toInt(), (40*dp).toInt(), (32*dp).toInt(), (40*dp).toInt())
        }

        // Icon
        card.addView(TextView(this).apply {
            text     = if (timeLimit) "⏱️" else "🔒"
            textSize = 52f
            gravity  = Gravity.CENTER
        })

        // Title
        card.addView(TextView(this).apply {
            text      = if (timeLimit) "Daily limit reached" else "$appName is blocked"
            textSize  = if (timeLimit) 20f else 14f
            setTextColor(0xFF_6C63FF.toInt())
            gravity   = Gravity.CENTER
            setPadding(0, (16*dp).toInt(), 0, (4*dp).toInt())
            letterSpacing = 0.05f
        })

        // Body message
        val bodyText = when {
            timeLimit  -> "You've used $appName for ${minsUsed}m today.\nDaily limit: ${limitMins}m\n\nCome back tomorrow. 💪"
            hardBlock  -> "This block is active until the scheduled end time.\nStay focused — you're doing great."
            else       -> QUOTES.random()
        }
        card.addView(TextView(this).apply {
            text = bodyText; textSize = 18f
            setTextColor(0xFF_FFFFFF.toInt())
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.45f)
            setPadding(0, (10*dp).toInt(), 0, (28*dp).toInt())
        })

        // Badge
        val badgeText = when {
            timeLimit   -> "⏱️ Time limit enforced"
            deviceAdmin -> "🛡️ Device Admin block active"
            hardBlock   -> "🔒 Hard block — cannot dismiss"
            else        -> null
        }
        if (badgeText != null) {
            card.addView(TextView(this).apply {
                text = badgeText; textSize = 12f
                setTextColor(0xFF_8B85C1.toInt())
                gravity = Gravity.CENTER
                setPadding((12*dp).toInt(), (6*dp).toInt(), (12*dp).toInt(), (16*dp).toInt())
            })
        }

        // ── Countdown only for soft (non-hard) blocks ────────────────
        if (!hardBlock) {
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

            countdown = object : CountDownTimer(10_000, 100) {
                override fun onTick(ms: Long) {
                    progressBarRef?.progress  = (ms / 10.0).toInt().coerceIn(0, 1000)
                    countdownTextRef?.text    = "Redirecting in ${(ms / 1000).toInt() + 1}s..."
                }
                override fun onFinish() { progressBarRef?.progress = 0; goHome() }
            }.start()
        }

        // Ad banner (only for soft blocks — not distracting from hard block message)
        if (showAd && !hardBlock) {
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
        progressBarRef    = null
        countdownTextRef  = null
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { goHome() }

    override fun onPause() {
        super.onPause()
        // Hard/time-limit blocks: keep bouncing the user to home
        val hardBlock = intent.getBooleanExtra(EXTRA_HARD_BLOCK, false)
        val timeLimit = intent.getBooleanExtra(EXTRA_TIME_LIMIT, false)
        if (hardBlock || timeLimit) goHome()
    }
}
