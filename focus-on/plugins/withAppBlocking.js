/**
 * withAppBlocking.js
 *
 * Expo Config Plugin for App Blocking Native Module.
 * This plugin:
 *   1. Copies Kotlin files to the Android project
 *   2. Adds required permissions to AndroidManifest.xml
 *   3. Registers the AccessibilityService in AndroidManifest.xml
 *   4. Registers BlockOverlayActivity in AndroidManifest.xml
 *   5. Registers the NativeModule in MainApplication.kt
 *
 * Usage in app.json:
 *   "plugins": ["./plugins/withAppBlocking"]
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// ── Step 1: Copy Kotlin source files into android/ ──────────────────────────
function withKotlinFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package || 'com.focuson';
      const packagePath = packageName.replace(/\./g, '/');
      const androidRoot = config.modRequest.platformProjectRoot;
      const kotlinDir = path.join(androidRoot, 'app/src/main/java', packagePath);

      fs.mkdirSync(kotlinDir, { recursive: true });

      const pluginDir = path.join(__dirname, 'android-src');
      const kotlinFiles = [
        'AppBlockingModule.kt',
        'AppBlockingPackage.kt',
        'AppBlockerAccessibilityService.kt',
        'BlockOverlayActivity.kt',   // ← new
      ];

      for (const file of kotlinFiles) {
        const src = path.join(pluginDir, file);
        const dest = path.join(kotlinDir, file);
        if (fs.existsSync(src)) {
          let content = fs.readFileSync(src, 'utf8');
          content = content.replace(/PACKAGE_NAME_PLACEHOLDER/g, packageName);
          fs.writeFileSync(dest, content);
          console.log(`✅ Copied ${file} → ${dest}`);
        } else {
          console.warn(`⚠️  Could not find ${src}`);
        }
      }

      // Copy res/xml file
      const xmlDir = path.join(androidRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      const xmlSrc = path.join(pluginDir, 'accessibility_service_config.xml');
      const xmlDest = path.join(xmlDir, 'accessibility_service_config.xml');
      if (fs.existsSync(xmlSrc)) {
        let content = fs.readFileSync(xmlSrc, 'utf8');
        content = content.replace(/PACKAGE_NAME_PLACEHOLDER/g, packageName);
        fs.writeFileSync(xmlDest, content);
        console.log(`✅ Copied accessibility_service_config.xml → ${xmlDest}`);
      }

      return config;
    },
  ]);
}

// ── Step 2: Add permissions, service & overlay activity to AndroidManifest ──
function withManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];
    const packageName = config.android?.package || 'com.focuson';

    // Permissions
    const requiredPermissions = [
      'android.permission.QUERY_ALL_PACKAGES',
      'android.permission.FOREGROUND_SERVICE',
    ];

    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }

    for (const perm of requiredPermissions) {
      const exists = manifest.manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm
      );
      if (!exists) {
        manifest.manifest['uses-permission'].push({ $: { 'android:name': perm } });
        console.log(`✅ Added permission: ${perm}`);
      }
    }

    if (!application.service) application.service = [];
    if (!application.activity) application.activity = [];

    // AccessibilityService
    const serviceName = `${packageName}.AppBlockerAccessibilityService`;
    const serviceExists = application.service.some(
      (s) => s.$?.['android:name'] === serviceName
    );

    if (!serviceExists) {
      application.service.push({
        $: {
          'android:name': serviceName,
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [{
          action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }],
        }],
        'meta-data': [{
          $: {
            'android:name': 'android.accessibilityservice',
            'android:resource': '@xml/accessibility_service_config',
          },
        }],
      });
      console.log(`✅ Added AccessibilityService to AndroidManifest`);
    }

    // BlockOverlayActivity
    const overlayActivityName = `${packageName}.BlockOverlayActivity`;
    const overlayExists = application.activity.some(
      (a) => a.$?.['android:name'] === overlayActivityName
    );

    if (!overlayExists) {
      application.activity.push({
        $: {
          'android:name': overlayActivityName,
          'android:exported': 'false',
          'android:theme': '@android:style/Theme.Black.NoTitleBar.Fullscreen',
          'android:launchMode': 'singleInstance',
          'android:excludeFromRecents': 'true',
          'android:showOnLockScreen': 'true',
        },
      });
      console.log(`✅ Added BlockOverlayActivity to AndroidManifest`);
    }

    return config;
  });
}

// ── Step 3: Register the NativeModule package in MainApplication.kt ─────────
function withMainApplication(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package || 'com.focuson';
      const packagePath = packageName.replace(/\./g, '/');
      const androidRoot = config.modRequest.platformProjectRoot;
      const mainAppPath = path.join(
        androidRoot,
        'app/src/main/java',
        packagePath,
        'MainApplication.kt'
      );

      if (!fs.existsSync(mainAppPath)) {
        console.warn('⚠️  MainApplication.kt not found, skipping module registration');
        return config;
      }

      let content = fs.readFileSync(mainAppPath, 'utf8');

      if (!content.includes('AppBlockingPackage')) {
        // Find the last import line and insert after it
        const lastImportIndex = content.lastIndexOf('\nimport ');
        const insertAfter = content.indexOf('\n', lastImportIndex + 1);
        content =
          content.slice(0, insertAfter) +
          `\nimport ${packageName}.AppBlockingPackage` +
          content.slice(insertAfter);

        // Add to packages list
        content = content.replace(
          /PackageList\(this\)\.packages/,
          'PackageList(this).packages.also { it.add(AppBlockingPackage()) }'
        );

        fs.writeFileSync(mainAppPath, content);
        console.log('✅ Registered AppBlockingPackage in MainApplication.kt');
      } else {
        console.log('ℹ️  AppBlockingPackage already registered');
      }

      return config;
    },
  ]);
}

// ── Main export ──────────────────────────────────────────────────────────────
module.exports = function withAppBlocking(config) {
  config = withKotlinFiles(config);
  config = withManifest(config);
  config = withMainApplication(config);
  return config;
};
