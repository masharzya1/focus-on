package PACKAGE_NAME_PLACEHOLDER

import android.app.AppOpsManager
import android.app.admin.DevicePolicyManager
import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.provider.Settings
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayOutputStream
import java.util.Calendar

class AppBlockingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG                  = "AppBlockingModule"
        const val MODULE_NAME          = "AppBlockingModule"
        const val KEY_HARD_BLOCK       = "hard_block"
        const val KEY_DEVICE_ADMIN     = "device_admin"
        const val KEY_BLOCKED_WEBSITES = "blocked_websites"
        const val KEY_TIME_LIMITS      = "time_limits"
    }

    private val prefs by lazy {
        reactApplicationContext.getSharedPreferences(
            AppBlockerAccessibilityService.PREFS_NAME,
            android.content.Context.MODE_PRIVATE
        )
    }

    override fun getName(): String = MODULE_NAME

    private fun drawableToBase64(drawable: Drawable): String {
        return try {
            val bitmap = if (drawable is BitmapDrawable) drawable.bitmap else {
                val bmp = Bitmap.createBitmap(
                    drawable.intrinsicWidth.coerceAtLeast(1),
                    drawable.intrinsicHeight.coerceAtLeast(1),
                    Bitmap.Config.ARGB_8888
                )
                val canvas = Canvas(bmp)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                bmp
            }
            val scaled = Bitmap.createScaledBitmap(bitmap, 48, 48, true)
            val stream = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.PNG, 85, stream)
            Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
        } catch (e: Exception) { "" }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val jsonArray = org.json.JSONArray()
            pm.getInstalledApplications(PackageManager.GET_META_DATA)
                .filter { info ->
                    (info.flags and ApplicationInfo.FLAG_SYSTEM) == 0 &&
                    info.packageName != reactApplicationContext.packageName &&
                    pm.getLaunchIntentForPackage(info.packageName) != null
                }
                .sortedBy { pm.getApplicationLabel(it).toString().lowercase() }
                .forEach { info ->
                    val obj = org.json.JSONObject()
                    obj.put("packageName", info.packageName)
                    obj.put("name", pm.getApplicationLabel(info).toString())
                    obj.put("icon", try { drawableToBase64(pm.getApplicationIcon(info.packageName)) } catch (_: Exception) { "" })
                    jsonArray.put(obj)
                }
            promise.resolve(jsonArray.toString())
        } catch (e: Exception) { promise.reject("GET_APPS_ERROR", e.message) }
    }

    @ReactMethod
    fun startBlocking(paramsJson: String) {
        try {
            val params    = org.json.JSONObject(paramsJson)
            val appsArray = params.optJSONArray("apps") ?: org.json.JSONArray()
            val hardBlock = params.optBoolean("hardBlock", false)
            val devAdmin  = params.optBoolean("deviceAdmin", false)
            prefs.edit()
                .putString(AppBlockerAccessibilityService.KEY_BLOCKED_APPS, appsArray.toString())
                .putBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, true)
                .putBoolean(KEY_HARD_BLOCK, hardBlock)
                .putBoolean(KEY_DEVICE_ADMIN, devAdmin)
                .apply()
            Log.d(TAG, "Blocking started — apps:${appsArray.length()} hard:$hardBlock admin:$devAdmin")
        } catch (e: Exception) { Log.e(TAG, "startBlocking: ${e.message}") }
    }

    @ReactMethod
    fun stopBlocking() {
        try {
            prefs.edit()
                .putBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, false)
                .putBoolean(AppBlockerAccessibilityService.KEY_IS_ROUTINE_BLOCKING, false)
                .putBoolean(KEY_HARD_BLOCK, false)
                .putBoolean(KEY_DEVICE_ADMIN, false)
                .apply()
        } catch (e: Exception) { Log.e(TAG, "stopBlocking: ${e.message}") }
    }

    @ReactMethod
    fun isBlockingActive(promise: Promise) {
        try { promise.resolve(prefs.getBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, false)) }
        catch (e: Exception) { promise.resolve(false) }
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        try {
            val ctx     = reactApplicationContext
            val enabled = Settings.Secure.getString(ctx.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: ""
            promise.resolve(enabled.split(":").any { it.contains(ctx.packageName, ignoreCase = true) })
        } catch (e: Exception) { promise.resolve(false) }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        try {
            reactApplicationContext.startActivity(
                Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            )
        } catch (e: Exception) {}
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try { promise.resolve(prefs.getString(AppBlockerAccessibilityService.KEY_BLOCKED_APPS, "[]") ?: "[]") }
        catch (e: Exception) { promise.resolve("[]") }
    }

    @ReactMethod
    fun saveRoutines(routinesJson: String) {
        try { prefs.edit().putString(AppBlockerAccessibilityService.KEY_ROUTINES, routinesJson).apply() }
        catch (e: Exception) { Log.e(TAG, "saveRoutines: ${e.message}") }
    }

    @ReactMethod
    fun setProStatus(isPro: Boolean) {
        try { prefs.edit().putBoolean("is_pro", isPro).apply() }
        catch (e: Exception) {}
    }

    @ReactMethod
    fun saveBlockedWebsites(websitesJson: String) {
        try { prefs.edit().putString(KEY_BLOCKED_WEBSITES, websitesJson).apply() }
        catch (e: Exception) {}
    }

    @ReactMethod
    fun getBlockedWebsites(promise: Promise) {
        try { promise.resolve(prefs.getString(KEY_BLOCKED_WEBSITES, "[]") ?: "[]") }
        catch (e: Exception) { promise.resolve("[]") }
    }

    // ── Time limits ───────────────────────────────────────────────────────────

    @ReactMethod
    fun saveTimeLimits(limitsJson: String) {
        try { prefs.edit().putString(KEY_TIME_LIMITS, limitsJson).apply() }
        catch (e: Exception) { Log.e(TAG, "saveTimeLimits: ${e.message}") }
    }

    @ReactMethod
    fun getTimeLimits(promise: Promise) {
        try { promise.resolve(prefs.getString(KEY_TIME_LIMITS, "[]") ?: "[]") }
        catch (e: Exception) { promise.resolve("[]") }
    }

    // ── Usage stats ───────────────────────────────────────────────────────────

    @ReactMethod
    fun hasUsagePermission(promise: Promise) {
        try {
            val ctx    = reactApplicationContext
            val appOps = ctx.getSystemService(android.content.Context.APP_OPS_SERVICE) as AppOpsManager
            val mode   = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), ctx.packageName)
            else
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), ctx.packageName)
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) { promise.resolve(false) }
    }

    @ReactMethod
    fun openUsageSettings() {
        try {
            reactApplicationContext.startActivity(
                Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            )
        } catch (e: Exception) {}
    }

    @ReactMethod
    fun getAppUsageStats(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val usm = ctx.getSystemService(android.content.Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            if (usm == null) { promise.resolve("[]"); return }

            val cal = Calendar.getInstance()
            cal.set(Calendar.HOUR_OF_DAY, 0); cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0);       cal.set(Calendar.MILLISECOND, 0)
            val startOfDay = cal.timeInMillis

            // queryAndAggregateUsageStats returns one entry per package (correctly summed)
            val statsMap = usm.queryAndAggregateUsageStats(startOfDay, System.currentTimeMillis())
            val pm       = ctx.packageManager
            val result   = org.json.JSONArray()

            statsMap.values
                .filter { it.totalTimeInForeground > 0 && it.packageName != ctx.packageName }
                .sortedByDescending { it.totalTimeInForeground }
                .forEach { stat ->
                    try {
                        val appName = try {
                            pm.getApplicationLabel(pm.getApplicationInfo(stat.packageName, 0)).toString()
                        } catch (_: Exception) { stat.packageName.split(".").last() }
                        val obj = org.json.JSONObject()
                        obj.put("packageName", stat.packageName)
                        obj.put("name", appName)
                        obj.put("minutes", (stat.totalTimeInForeground / 60_000).toInt())
                        result.put(obj)
                    } catch (_: Exception) {}
                }
            promise.resolve(result.toString())
        } catch (e: Exception) {
            Log.e(TAG, "getAppUsageStats: ${e.message}")
            promise.resolve("[]")
        }
    }

    // ── Reels Block (always-on per-app reels blocking) ────────────────────────

    @ReactMethod
    fun saveReelsBlock(packagesJson: String) {
        try { prefs.edit().putString(AppBlockerAccessibilityService.KEY_REELS_BLOCK, packagesJson).apply() }
        catch (e: Exception) { Log.e(TAG, "saveReelsBlock: ${e.message}") }
    }

    @ReactMethod
    fun getReelsBlock(promise: Promise) {
        try { promise.resolve(prefs.getString(AppBlockerAccessibilityService.KEY_REELS_BLOCK, "[]") ?: "[]") }
        catch (e: Exception) { promise.resolve("[]") }
    }

    // ── Device Admin ──────────────────────────────────────────────────────────

    @ReactMethod
    fun requestDeviceAdmin(promise: Promise) {
        try {
            val ctx  = reactApplicationContext
            val dpm  = ctx.getSystemService(android.content.Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
            if (dpm == null) { promise.resolve(false); return }
            val comp = ComponentName(ctx, DeviceAdminReceiver::class.java)
            if (dpm.isAdminActive(comp)) { promise.resolve(true); return }
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, comp)
                putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "Grant Device Admin so Focus On cannot be uninstalled during active blocks.")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            ctx.startActivity(intent)
            promise.resolve(false)
        } catch (e: Exception) { promise.resolve(false) }
    }

    @ReactMethod
    fun isDeviceAdminActive(promise: Promise) {
        try {
            val ctx  = reactApplicationContext
            val dpm  = ctx.getSystemService(android.content.Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
            if (dpm == null) { promise.resolve(false); return }
            val comp = ComponentName(ctx, DeviceAdminReceiver::class.java)
            promise.resolve(dpm.isAdminActive(comp))
        } catch (e: Exception) { promise.resolve(false) }
    }
}