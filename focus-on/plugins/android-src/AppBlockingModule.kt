package PACKAGE_NAME_PLACEHOLDER

import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*

class AppBlockingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "AppBlockingModule"
        const val MODULE_NAME = "AppBlockingModule"
    }

    private val prefs by lazy {
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
            val result = WritableNativeArray()
            pm.getInstalledApplications(PackageManager.GET_META_DATA).forEach { appInfo ->
                if ((appInfo.flags and ApplicationInfo.FLAG_SYSTEM) == 0 &&
                    appInfo.packageName != reactApplicationContext.packageName) {
                    WritableNativeMap().apply {
                        putString("packageName", appInfo.packageName)
                        putString("name", pm.getApplicationLabel(appInfo).toString())
                        result.pushMap(this)
                    }
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
        prefs.edit().putBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, false).apply()
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
        val enabledServices = Settings.Secure.getString(
            context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: run { promise.resolve(false); return }

        val isEnabled = enabledServices.split(":").any { it.contains(packageName, ignoreCase = true) }
        promise.resolve(isEnabled)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        reactApplicationContext.startActivity(
            Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        )
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        promise.resolve(prefs.getString(AppBlockerAccessibilityService.KEY_BLOCKED_APPS, "[]") ?: "[]")
    }
    }
