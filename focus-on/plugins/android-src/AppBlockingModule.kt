package PACKAGE_NAME_PLACEHOLDER

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppBlockingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "AppBlockingModule"
        const val MODULE_NAME = "AppBlockingModule"
        const val KEY_HARD_BLOCK = "hard_block"
        const val KEY_DEVICE_ADMIN = "device_admin"
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

    /**
     * JS sends: JSON.stringify({ apps: string[], hardBlock: boolean, deviceAdmin: boolean })
     * We parse the object, save apps array + flags separately so AccessibilityService
     * can read them correctly. This fixes the critical bug where parseBlockedApps()
     * received an object string instead of an array string.
     */
    @ReactMethod
    fun startBlocking(paramsJson: String) {
        try {
            val params = org.json.JSONObject(paramsJson)
            val appsArray = params.optJSONArray("apps") ?: org.json.JSONArray()
            val hardBlock = params.optBoolean("hardBlock", false)
            val deviceAdmin = params.optBoolean("deviceAdmin", false)

            prefs.edit()
                .putString(AppBlockerAccessibilityService.KEY_BLOCKED_APPS, appsArray.toString())
                .putBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, true)
                .putBoolean(KEY_HARD_BLOCK, hardBlock)
                .putBoolean(KEY_DEVICE_ADMIN, deviceAdmin)
                .apply()

            Log.d(TAG, "Blocking started — apps:${appsArray.length()} hard:$hardBlock admin:$deviceAdmin")
        } catch (e: Exception) {
            Log.e(TAG, "startBlocking error: ${e.message}")
        }
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
            Log.d(TAG, "Blocking stopped")
        } catch (e: Exception) {
            Log.e(TAG, "stopBlocking error: ${e.message}")
        }
    }

    @ReactMethod
    fun isBlockingActive(promise: Promise) {
        try {
            promise.resolve(prefs.getBoolean(AppBlockerAccessibilityService.KEY_IS_BLOCKING, false))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val packageName = context.packageName
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: run { promise.resolve(false); return }
            val isEnabled = enabledServices.split(":").any { entry ->
                entry.contains(packageName, ignoreCase = true)
            }
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        try {
            reactApplicationContext.startActivity(
                Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            )
        } catch (e: Exception) {
            Log.e(TAG, "openAccessibilitySettings error: ${e.message}")
        }
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            promise.resolve(prefs.getString(AppBlockerAccessibilityService.KEY_BLOCKED_APPS, "[]") ?: "[]")
        } catch (e: Exception) {
            promise.resolve("[]")
        }
    }

    @ReactMethod
    fun saveRoutines(routinesJson: String) {
        try {
            prefs.edit()
                .putString(AppBlockerAccessibilityService.KEY_ROUTINES, routinesJson)
                .apply()
            Log.d(TAG, "Routines saved")
        } catch (e: Exception) {
            Log.e(TAG, "saveRoutines error: ${e.message}")
        }
    }

    @ReactMethod
    fun setProStatus(isPro: Boolean) {
        try {
            prefs.edit().putBoolean("is_pro", isPro).apply()
        } catch (e: Exception) {
            Log.e(TAG, "setProStatus error: ${e.message}")
        }
    }

    @ReactMethod
    fun requestDeviceAdmin(promise: Promise) {
        try {
            val context = reactApplicationContext
            val dpm = context.getSystemService(android.content.Context.DEVICE_POLICY_SERVICE)
                    as? DevicePolicyManager
            if (dpm == null) { promise.resolve(false); return }
            val component = ComponentName(context, DeviceAdminReceiver::class.java)
            if (dpm.isAdminActive(component)) { promise.resolve(true); return }
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, component)
                putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "Grant Device Admin to enable the strongest app blocking — apps cannot be uninstalled while blocking is active.")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            promise.resolve(false)
        } catch (e: Exception) {
            Log.e(TAG, "requestDeviceAdmin error: ${e.message}")
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isDeviceAdminActive(promise: Promise) {
        try {
            val context = reactApplicationContext
            val dpm = context.getSystemService(android.content.Context.DEVICE_POLICY_SERVICE)
                    as? DevicePolicyManager
            if (dpm == null) { promise.resolve(false); return }
            val component = ComponentName(context, DeviceAdminReceiver::class.java)
            promise.resolve(dpm.isAdminActive(component))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}
