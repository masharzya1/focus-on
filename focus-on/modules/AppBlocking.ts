import { NativeModules, Platform } from 'react-native';

const mod = () => NativeModules.AppBlockingModule;

const AppBlocking = {
  async getInstalledApps(): Promise<{ name: string; packageName: string }[]> {
    if (Platform.OS !== 'android' || !mod()) return [];
    try { return JSON.parse(await mod().getInstalledApps()); } catch { return []; }
  },

  startBlocking(blockedApps: string[], blockShorts = false, hardBlock = false, deviceAdmin = false): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try {
      const finalApps = [...blockedApps];
      if (blockShorts) {
        ['com.instagram.android', 'com.google.android.youtube',
         'com.facebook.katana', 'com.facebook.orca'].forEach(pkg => {
          if (!blockedApps.includes(pkg)) finalApps.push(`reels:${pkg}`);
        });
      }
      mod().startBlocking(JSON.stringify({ apps: finalApps, hardBlock, deviceAdmin }));
    } catch {}
  },

  stopBlocking(): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().stopBlocking(); } catch {}
  },

  async isBlockingActive(): Promise<boolean> {
    if (Platform.OS !== 'android' || !mod()) return false;
    try { return await mod().isBlockingActive(); } catch { return false; }
  },

  async isAccessibilityEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android' || !mod()) return false;
    try { return await mod().isAccessibilityEnabled(); } catch { return false; }
  },

  openAccessibilitySettings(): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().openAccessibilitySettings(); } catch {}
  },

  async getBlockedApps(): Promise<string[]> {
    if (Platform.OS !== 'android' || !mod()) return [];
    try { return JSON.parse(await mod().getBlockedApps()); } catch { return []; }
  },

  saveRoutines(routines: object[]): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().saveRoutines(JSON.stringify(routines)); } catch {}
  },

  // Called from AuthContext — syncs Pro status to native layer
  setProStatus(isPro: boolean): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().setProStatus(isPro); } catch {}
  },

  async requestDeviceAdmin(): Promise<boolean> {
    if (Platform.OS !== 'android' || !mod()) return false;
    try { return await mod().requestDeviceAdmin(); } catch { return false; }
  },
};

export default AppBlocking;