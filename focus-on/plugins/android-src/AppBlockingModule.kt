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
            val jsonArray = org.json.JSONArray()
            pm.getInstalledApplications(PackageManager.GET_META_DATA).forEach { appInfo ->
                if ((appInfo.flags and ApplicationInfo.FLAG_SYSTEM) == 0 &&
                    appInfo.packageName != reactApplicationContext.packageName) {
                    val obj = org.json.JSONObject()
                    obj.put("packageName", appInfo.packageName)
                    obj.put("name", pm.getApplicationLabel(appInfo).toString())
                    jsonArray.put(obj)
                }
            }
            promise.resolve(jsonArray.toString())
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
            .putBoolean(AppBlockerAccessibilityService.KEY_IS_ROUTINE_BLOCKING, false)
            .apply()
        Log.d(TAG, "Blocking stopped")
    }

    @ReactMethod
    fun isBlockingActive(promise: Promise) {
        promise.resolve(prefs.getBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, false))
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val packageName = context.packageName
            // Android stores enabled services as "package/ServiceClass:package/ServiceClass"
            // We must check for our specific service class, not just the package name
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: run { promise.resolve(false); return }

            val serviceComponent = "$packageName/AppBlockerAccessibilityService"
            val serviceComponentFull = "$packageName/${packageName}.AppBlockerAccessibilityService"
            val isEnabled = enabledServices.split(":").any { entry ->
                entry.equals(serviceComponent, ignoreCase = true) ||
                entry.equals(serviceComponentFull, ignoreCase = true) ||
                entry.contains(packageName, ignoreCase = true)
            }
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
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

    /**
     * Saves all block routines to SharedPreferences so the AccessibilityService
     * can read and enforce them even when the app is closed.
     * Call this whenever routines are created, updated, or deleted.
     */
    @ReactMethod
    fun saveRoutines(routinesJson: String) {
        prefs.edit()
            .putString(AppBlockerAccessibilityService.KEY_ROUTINES, routinesJson)
            .apply()
        Log.d(TAG, "Routines saved: $routinesJson")
    }
    }
