import { NativeModules, Platform } from 'react-native';

const { AppBlockingModule } = NativeModules;

export interface InstalledApp {
  name: string;
  packageName: string;
}

const AppBlocking = {
  async getInstalledApps(): Promise<InstalledApp[]> {
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
      const reelPackages = [
        'com.instagram.android',
        'com.google.android.youtube',
        'com.facebook.katana',
        'com.facebook.orca',
      ];
      const finalApps = [...blockedApps];
      if (blockShorts) {
        for (const pkg of reelPackages) {
          if (!blockedApps.includes(pkg)) finalApps.push(`reels:${pkg}`);
        }
      }
      AppBlockingModule.startBlocking(JSON.stringify(finalApps));
    } catch {}
  },

  stopBlocking(): void {
    if (Platform.OS !== 'android') return;
    try { AppBlockingModule.stopBlocking(); } catch {}
  },

  async isBlockingActive(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try { return await AppBlockingModule.isBlockingActive(); } catch { return false; }
  },

  async isAccessibilityEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try { return await AppBlockingModule.isAccessibilityEnabled(); } catch { return false; }
  },

  openAccessibilitySettings(): void {
    if (Platform.OS !== 'android') return;
    try { AppBlockingModule.openAccessibilitySettings(); } catch {}
  },

  async getBlockedApps(): Promise<string[]> {
    if (Platform.OS !== 'android') return [];
    try {
      const json: string = await AppBlockingModule.getBlockedApps();
      return JSON.parse(json);
    } catch { return []; }
  },

  saveRoutines(routines: object[]): void {
    if (Platform.OS !== 'android') return;
    try { AppBlockingModule.saveRoutines(JSON.stringify(routines)); } catch {}
  },

  /**
   * Syncs Pro status to native SharedPreferences so BlockOverlayActivity
   * can conditionally show/hide ads without going through JS.
   */
  setProStatus(isPro: boolean): void {
    if (Platform.OS !== 'android') return;
    try { AppBlockingModule.setProStatus(isPro); } catch {}
  },
};

export default AppBlocking;
