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
import androidx.core.content.ContextCompat

/**
 * BlockOverlayActivity
 *
 * Full-screen overlay shown for 10 seconds when a blocked app is detected.
 * Displays a random motivational quote and a countdown.
 * After 10s, automatically closes (blocked app goes to background).
 */
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make it full-screen and draw over other apps
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        val appName = intent.getStringExtra(EXTRA_APP_NAME) ?: "এই app"
        val quote = QUOTES.random()

        buildUI(appName, quote)
    }

    private fun buildUI(appName: String, quote: String) {
        val dp = resources.displayMetrics.density

        // Root: dark semi-transparent background
        val root = FrameLayout(this).apply {
            setBackgroundColor(0xF0_0F0F1A.toInt())
        }

        // Center card
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(
                (32 * dp).toInt(), (40 * dp).toInt(),
                (32 * dp).toInt(), (40 * dp).toInt()
            )
        }

        // Lock icon emoji
        val icon = TextView(this).apply {
            text = "🔒"
            textSize = 52f
            gravity = Gravity.CENTER
        }

        // "Blocked" label
        val blockedLabel = TextView(this).apply {
            text = "$appName এখন blocked"
            textSize = 14f
            setTextColor(0xFF_6C63FF.toInt())
            gravity = Gravity.CENTER
            setPadding(0, (16 * dp).toInt(), 0, (4 * dp).toInt())
            letterSpacing = 0.08f
        }

        // Quote text
        val quoteText = TextView(this).apply {
            text = quote
            textSize = 22f
            setTextColor(0xFF_FFFFFF.toInt())
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.4f)
            setPadding(0, (8 * dp).toInt(), 0, (32 * dp).toInt())
        }

        // Progress bar (countdown visual)
        val progressBar = ProgressBar(
            this, null, android.R.attr.progressBarStyleHorizontal
        ).apply {
            max = 100
            progress = 100
            progressDrawable?.setTint(0xFF_6C63FF.toInt())
            layoutParams = LinearLayout.LayoutParams(
                (260 * dp).toInt(),
                (6 * dp).toInt()
            ).also { it.gravity = Gravity.CENTER_HORIZONTAL }
        }

        // Countdown text
        val countdownText = TextView(this).apply {
            text = "10 সেকেন্ড পরে বন্ধ হবে"
            textSize = 13f
            setTextColor(0xFF_6B7280.toInt())
            gravity = Gravity.CENTER
            setPadding(0, (12 * dp).toInt(), 0, 0)
        }

        card.addView(icon)
        card.addView(blockedLabel)
        card.addView(quoteText)
        card.addView(progressBar)
        card.addView(countdownText)

        val cardParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER
        )
        root.addView(card, cardParams)
        setContentView(root)

        // Start 10s countdown
        countdown = object : CountDownTimer(10_000, 100) {
            override fun onTick(millisLeft: Long) {
                val seconds = (millisLeft / 1000).toInt() + 1
                val progress = (millisLeft / 100).toInt()
                progressBar.progress = progress
                countdownText.text = "${seconds} সেকেন্ড পরে বন্ধ হবে"
            }
            override fun onFinish() {
                progressBar.progress = 0
                finish()
            }
        }.start()
    }

    override fun onDestroy() {
        countdown?.cancel()
        super.onDestroy()
    }

    // Back button = stay in overlay (can't escape early)
    override fun onBackPressed() {
        // Do nothing — wait for countdown
    }
}