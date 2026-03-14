package PACKAGE_NAME_PLACEHOLDER

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * AppBlockingPackage — TurboReactPackage (New Architecture compatible)
 *
 * TurboReactPackage works in BOTH Old and New Architecture.
 * ReactPackage (old) was not correctly initialized in New Architecture,
 * causing the app to crash on startup.
 */
class AppBlockingPackage : TurboReactPackage() {

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return if (name == AppBlockingModule.MODULE_NAME) {
            AppBlockingModule(reactContext)
        } else null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                AppBlockingModule.MODULE_NAME to ReactModuleInfo(
                    AppBlockingModule.MODULE_NAME,        // name
                    AppBlockingModule::class.java.name,   // className
                    false,  // canOverrideExistingModule
                    false,  // needsEagerInit
                    false,  // hasConstants
                    false,  // isCxxModule
                    false   // isTurboModule
                )
            )
        }
    }
}
