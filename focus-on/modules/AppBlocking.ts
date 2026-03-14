import { NativeModules, Platform } from 'react-native';

const { AppBlockingModule } = NativeModules;

const AppBlocking = {
  async getInstalledApps(): Promise<{ name: string; packageName: string }[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const json: string = await AppBlockingModule.getInstalledApps();
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  startBlocking(blockedApps: string[], blockShorts = false): void {
    if (Platform.OS !== 'android') return;
    try {
      // When blockShorts=true, also add "reels:<pkg>" entries for reel-capable apps
      const reelPackages = [
        'com.instagram.android',
        'com.google.android.youtube',
        'com.facebook.katana',
        'com.facebook.orca',
      ];
      const finalApps = [...blockedApps];
      if (blockShorts) {
        for (const pkg of reelPackages) {
          // Only add reels:<pkg> if the whole app is NOT already blocked
          if (!blockedApps.includes(pkg)) {
            finalApps.push(`reels:${pkg}`);
          }
        }
      }
      AppBlockingModule.startBlocking(JSON.stringify(finalApps));
    } catch {}
  },

  stopBlocking(): void {
    if (Platform.OS !== 'android') return;
    try {
      AppBlockingModule.stopBlocking();
    } catch {}
  },

  async isBlockingActive(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return await AppBlockingModule.isBlockingActive();
    } catch {
      return false;
    }
  },

  async isAccessibilityEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return await AppBlockingModule.isAccessibilityEnabled();
    } catch {
      return false;
    }
  },

  openAccessibilitySettings(): void {
    if (Platform.OS !== 'android') return;
    try {
      AppBlockingModule.openAccessibilitySettings();
    } catch {}
  },

  async getBlockedApps(): Promise<string[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const json: string = await AppBlockingModule.getBlockedApps();
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Saves all routines to native SharedPreferences so the AccessibilityService
   * can enforce them even when the app is fully closed.
   * Call this whenever routines change.
   */
  saveRoutines(routines: object[]): void {
    if (Platform.OS !== 'android') return;
    try {
      AppBlockingModule.saveRoutines(JSON.stringify(routines));
    } catch {}
  },
};

export default AppBlocking;
