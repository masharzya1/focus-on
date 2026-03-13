package PACKAGE_NAME_PLACEHOLDER

import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*

/**
 * AppBlockingModule — New Architecture compatible.
 * All methods use Promise (no isBlockingSynchronousMethod).
 */
class AppBlockingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "AppBlockingModule"
        const val MODULE_NAME = "AppBlockingModule"
    }

    private val prefs: SharedPreferences by lazy {
        reactApplicationContext.getSharedPreferences(
            AppBlockerAccessibilityService.PREFS_NAME,
            android.content.Context.MODE_PRIVATE
        )
    }

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val result = WritableNativeArray()
            for (appInfo in packages) {
                val isUserApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) == 0
                val isOurApp = appInfo.packageName == reactApplicationContext.packageName
                if (isUserApp && !isOurApp) {
                    val map = WritableNativeMap()
                    map.putString("packageName", appInfo.packageName)
                    map.putString("name", pm.getApplicationLabel(appInfo).toString())
                    result.pushMap(map)
                }
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_APPS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun startBlocking(blockedAppsJson: String) {
        prefs.edit()
            .putString(AppBlockerAccessibilityService.KEY_BLOCKED_APPS, blockedAppsJson)
            .putBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, true)
            .apply()
        Log.d(TAG, "Blocking started: $blockedAppsJson")
    }

    @ReactMethod
    fun stopBlocking() {
        prefs.edit()
            .putBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, false)
            .apply()
        Log.d(TAG, "Blocking stopped")
    }

    @ReactMethod
    fun isBlockingActive(promise: Promise) {
        promise.resolve(prefs.getBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, false))
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        val context = reactApplicationContext
        val packageName = context.packageName
        val serviceName = "$packageName/${packageName}.AppBlockerAccessibilityService"
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: run { promise.resolve(false); return }
        promise.resolve(
            enabledServices.split(":").any { it.equals(serviceName, ignoreCase = true) }
        )
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        val json = prefs.getString(AppBlockerAccessibilityService.KEY_BLOCKED_APPS, "[]") ?: "[]"
        promise.resolve(json)
    }
}