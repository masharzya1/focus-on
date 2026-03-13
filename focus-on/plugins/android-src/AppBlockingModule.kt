package PACKAGE_NAME_PLACEHOLDER

import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject

class AppBlockingModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AppBlockingModule"

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val apps = pm.getInstalledApplications(0)
            val arr = JSONArray()
            val own = reactContext.packageName
            for (app in apps) {
                if ((app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0) continue
                if (app.packageName == own) continue
                val obj = JSONObject()
                obj.put("packageName", app.packageName)
                obj.put("name", pm.getApplicationLabel(app).toString())
                arr.put(obj)
            }
            promise.resolve(arr.toString())
        } catch (e: Exception) {
            promise.reject("ERR", e.message)
        }
    }

    @ReactMethod
    fun startBlocking(json: String) {
        try {
            val obj = JSONObject(json)
            val blockedApps = obj.optJSONArray("blockedApps") ?: JSONArray()
            val blockShorts = obj.optBoolean("blockShorts", false)
            val prefs = reactContext.getSharedPreferences("AppBlockingPrefs", android.content.Context.MODE_PRIVATE)
            prefs.edit()
                .putString("blocked_apps", blockedApps.toString())
                .putBoolean("is_blocking", true)
                .putBoolean("block_shorts", blockShorts)
                .apply()
        } catch (_: Exception) {}
    }

    @ReactMethod
    fun stopBlocking() {
        val prefs = reactContext.getSharedPreferences("AppBlockingPrefs", android.content.Context.MODE_PRIVATE)
        prefs.edit().putBoolean("is_blocking", false).apply()
    }

    @ReactMethod
    fun isBlockingActive(promise: Promise) {
        val prefs = reactContext.getSharedPreferences("AppBlockingPrefs", android.content.Context.MODE_PRIVATE)
        promise.resolve(prefs.getBoolean("is_blocking", false))
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        try {
            val enabled = Settings.Secure.getString(
                reactContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            promise.resolve(enabled.contains(reactContext.packageName, ignoreCase = true))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        val prefs = reactContext.getSharedPreferences("AppBlockingPrefs", android.content.Context.MODE_PRIVATE)
        promise.resolve(prefs.getString("blocked_apps", "[]"))
    }
}
