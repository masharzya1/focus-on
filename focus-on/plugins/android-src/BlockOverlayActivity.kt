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
        const val EXTRA_APP_NAME = "blocked_app_name"
        private val QUOTES = arrayOf(
            "তুমি এটার চেয়ে ভালো কিছু করতে পারো। 💪",
            "১০ সেকেন্ড ধরো, তারপর ফিরে যাও কাজে।",
            "ভবিষ্যতের তুমি এই মুহূর্তটার জন্য কৃতজ্ঞ থাকবে।",
            "Distraction হলো dream-এর সবচেয়ে বড় শত্রু।",
            "এক ঘণ্টার focus = ৩ ঘণ্টার random browsing।",
            "তুমি কি সত্যিই এখন এটা দেখতে চাও?",
            "Deep work করো — shallow scroll না।",
            "তোমার লক্ষ্য এই app-এর চেয়ে important।",
            "Focus করো। তুমি পারবে। 🎯",
            "এই মুহূর্তে কি এটাই সবচেয়ে দরকারি কাজ?",
            "Break নাও, কিন্তু এটা না। উঠে একটু হাঁটো।",
            "তোমার time তোমার সবচেয়ে মূল্যবান resource।",
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

        // Check Pro status from SharedPreferences
        val prefs = getSharedPreferences(AppBlockerAccessibilityService.PREFS_NAME, MODE_PRIVATE)
        val isPro = prefs.getBoolean("is_pro", false)

        buildUI(
            intent.getStringExtra(EXTRA_APP_NAME) ?: "এই app",
            QUOTES.random(),
            showAd = !isPro
        )
    }

    private fun buildUI(appName: String, quote: String, showAd: Boolean) {
        val dp = resources.displayMetrics.density
        val root = FrameLayout(this).apply { setBackgroundColor(0xF0_0F0F1A.toInt()) }
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding((32*dp).toInt(), (40*dp).toInt(), (32*dp).toInt(), (40*dp).toInt())
        }

        card.addView(TextView(this).apply { text = "\uD83D\uDD12"; textSize = 52f; gravity = Gravity.CENTER })
        card.addView(TextView(this).apply {
            text = "$appName \u098F\u0996\u09A8 blocked"; textSize = 14f
            setTextColor(0xFF_6C63FF.toInt()); gravity = Gravity.CENTER
            setPadding(0, (16*dp).toInt(), 0, (4*dp).toInt()); letterSpacing = 0.08f
        })
        card.addView(TextView(this).apply {
            text = quote; textSize = 22f; setTextColor(0xFF_FFFFFF.toInt())
            gravity = Gravity.CENTER; setLineSpacing(0f, 1.4f)
            setPadding(0, (8*dp).toInt(), 0, (32*dp).toInt())
        })

        val pb = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 1000; progress = 1000
            progressDrawable?.setTint(0xFF_6C63FF.toInt())
            layoutParams = LinearLayout.LayoutParams((260*dp).toInt(), (6*dp).toInt())
                .also { it.gravity = Gravity.CENTER_HORIZONTAL }
        }
        progressBarRef = pb
        card.addView(pb)

        val ct = TextView(this).apply {
            text = "10 \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1 \u09AA\u09B0\u09C7 \u09AC\u09A8\u09CD\u09A7 \u09B9\u09AC\u09C7"
            textSize = 13f; setTextColor(0xFF_6B7280.toInt())
            gravity = Gravity.CENTER; setPadding(0, (12*dp).toInt(), 0, 0)
        }
        countdownTextRef = ct
        card.addView(ct)

        // Show ad banner only for free users
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
            val adLabel = TextView(this).apply {
                text = "AD"; textSize = 9f
                setTextColor(0xFF_6B7280.toInt())
                setPadding(0, 0, (8*dp).toInt(), 0)
            }
            val adText = TextView(this).apply {
                text = "Remove ads — upgrade to Pro ⭐"
                textSize = 12f; setTextColor(0xFF_A78BFA.toInt())
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            adBanner.addView(adLabel)
            adBanner.addView(adText)
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
                countdownTextRef?.text = "${(millisLeft / 1000).toInt() + 1} \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1 \u09AA\u09B0\u09C7 \u09AC\u09A8\u09CD\u09A7 \u09B9\u09AC\u09C7"
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
        progressBarRef = null; countdownTextRef = null
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { /* block back during countdown */ }
}
