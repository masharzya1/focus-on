/**
 * withAppBlocking.js
 *
 * Expo Config Plugin for App Blocking Native Module.
 * This plugin:
 *   1. Copies Kotlin files to the Android project
 *   2. Adds required permissions to AndroidManifest.xml
 *   3. Registers the AccessibilityService in AndroidManifest.xml
 *   4. Registers the NativeModule in MainApplication.kt
 *
 * Usage in app.json:
 *   "plugins": ["./plugins/withAppBlocking"]
 */

const { withAndroidManifest, withDangerousMod, withAppBuildGradle } = require('@expo/config-plugins');
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
      ];

      for (const file of kotlinFiles) {
        const src = path.join(pluginDir, file);
        const dest = path.join(kotlinDir, file);
        if (fs.existsSync(src)) {
          let content = fs.readFileSync(src, 'utf8');
          // Replace placeholder package name with actual package name
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

// ── Step 2: Add permissions & service to AndroidManifest.xml ────────────────
function withManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];
    const packageName = config.android?.package || 'com.focuson';

    // Add permissions
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

    // Add AccessibilityService declaration
    if (!application.service) {
      application.service = [];
    }

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
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.accessibilityservice.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/accessibility_service_config',
            },
          },
        ],
      });
      console.log(`✅ Added AccessibilityService to AndroidManifest`);
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

      // Only patch if not already patched
      if (!content.includes('AppBlockingPackage')) {
        // Add import after the last import line
        content = content.replace(
          /(import [^\n]+\n)(?!import)/,
          `$1import ${packageName}.AppBlockingPackage\n`
        );

        // Add AppBlockingPackage to the packages list
        content = content.replace(
          /PackageList\(this\)\.packages/,
          'PackageList(this).packages.also { it.add(AppBlockingPackage()) }'
        );

        fs.writeFileSync(mainAppPath, content);
        console.log('✅ Registered AppBlockingPackage in MainApplication.kt');
      } else {
        console.log('ℹ️  AppBlockingPackage already registered in MainApplication.kt');
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
