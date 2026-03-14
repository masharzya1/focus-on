const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// ── Step 1: Copy Kotlin source files ────────────────────────────────────────
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
        'BlockOverlayActivity.kt',
        'DeviceAdminReceiver.kt',
      ];

      for (const file of kotlinFiles) {
        const src = path.join(pluginDir, file);
        const dest = path.join(kotlinDir, file);
        if (fs.existsSync(src)) {
          let content = fs.readFileSync(src, 'utf8');
          content = content.replace(/PACKAGE_NAME_PLACEHOLDER/g, packageName);
          fs.writeFileSync(dest, content);
          console.log(`Copied ${file}`);
        } else {
          console.warn(`Missing: ${src}`);
        }
      }

      // Copy res/xml
      const xmlDir = path.join(androidRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      const xmlSrc = path.join(pluginDir, 'accessibility_service_config.xml');
      const xmlDest = path.join(xmlDir, 'accessibility_service_config.xml');
      if (fs.existsSync(xmlSrc)) {
        let content = fs.readFileSync(xmlSrc, 'utf8');
        content = content.replace(/PACKAGE_NAME_PLACEHOLDER/g, packageName);
        fs.writeFileSync(xmlDest, content);
        console.log('Copied accessibility_service_config.xml');
      }

      // Create device_admin.xml for DeviceAdminReceiver
      const adminXmlDir = path.join(androidRoot, 'app/src/main/res/xml');
      const adminXmlDest = path.join(adminXmlDir, 'device_admin.xml');
      const adminXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<device-admin>
  <uses-policies>
    <limit-password />
    <watch-login />
  </uses-policies>
</device-admin>`;
      fs.writeFileSync(adminXmlDest, adminXmlContent);
      console.log('Created device_admin.xml');

      return config;
    },
  ]);
}

// ── Step 2: AndroidManifest.xml ──────────────────────────────────────────────
function withManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];
    const packageName = config.android?.package || 'com.focuson';

    // Permissions
    const requiredPermissions = [
      'android.permission.QUERY_ALL_PACKAGES',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.PACKAGE_USAGE_STATS',
    ];

    if (!manifest.manifest['uses-permission']) manifest.manifest['uses-permission'] = [];

    for (const perm of requiredPermissions) {
      const exists = manifest.manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm
      );
      if (!exists) {
        manifest.manifest['uses-permission'].push({ $: { 'android:name': perm } });
      }
    }

    if (!application.service) application.service = [];
    if (!application.activity) application.activity = [];
    if (!application.receiver) application.receiver = [];

    // AccessibilityService
    const serviceName = `${packageName}.AppBlockerAccessibilityService`;
    if (!application.service.some((s) => s.$?.['android:name'] === serviceName)) {
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
    }

    // BlockOverlayActivity
    const overlayName = `${packageName}.BlockOverlayActivity`;
    if (!application.activity.some((a) => a.$?.['android:name'] === overlayName)) {
      application.activity.push({
        $: {
          'android:name': overlayName,
          'android:exported': 'false',
          'android:theme': '@android:style/Theme.Black.NoTitleBar.Fullscreen',
          'android:launchMode': 'singleInstance',
          'android:excludeFromRecents': 'true',
          'android:showOnLockScreen': 'true',
        },
      });
    }

    // DeviceAdminReceiver
    const adminName = `${packageName}.DeviceAdminReceiver`;
    if (!application.receiver.some((r) => r.$?.['android:name'] === adminName)) {
      application.receiver.push({
        $: {
          'android:name': adminName,
          'android:permission': 'android.permission.BIND_DEVICE_ADMIN',
          'android:exported': 'true',
        },
        'meta-data': [{
          $: {
            'android:name': 'android.app.device_admin',
            'android:resource': '@xml/device_admin',
          },
        }],
        'intent-filter': [{
          action: [{ $: { 'android:name': 'android.app.action.DEVICE_ADMIN_ENABLED' } }],
        }],
      });
    }

    return config;
  });
}

// ── Step 3: Register NativeModule in MainApplication.kt ─────────────────────
function withMainApplication(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package || 'com.focuson';
      const packagePath = packageName.replace(/\./g, '/');
      const androidRoot = config.modRequest.platformProjectRoot;
      const mainAppPath = path.join(
        androidRoot, 'app/src/main/java', packagePath, 'MainApplication.kt'
      );

      if (!fs.existsSync(mainAppPath)) {
        console.warn('MainApplication.kt not found, skipping');
        return config;
      }

      let content = fs.readFileSync(mainAppPath, 'utf8');
      if (!content.includes('AppBlockingPackage')) {
        const lastImportIndex = content.lastIndexOf('\nimport ');
        const insertAfter = content.indexOf('\n', lastImportIndex + 1);
        content =
          content.slice(0, insertAfter) +
          `\nimport ${packageName}.AppBlockingPackage` +
          content.slice(insertAfter);

        content = content.replace(
          /PackageList\(this\)\.packages/,
          'PackageList(this).packages.also { it.add(AppBlockingPackage()) }'
        );

        fs.writeFileSync(mainAppPath, content);
        console.log('Registered AppBlockingPackage in MainApplication.kt');
      }

      return config;
    },
  ]);
}

module.exports = function withAppBlocking(config) {
  config = withKotlinFiles(config);
  config = withManifest(config);
  config = withMainApplication(config);
  return config;
};
