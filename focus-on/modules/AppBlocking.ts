import { NativeModules, Platform } from 'react-native';

const mod = () => NativeModules.AppBlockingModule;

const AppBlocking = {

  async getInstalledApps(): Promise<{ name: string; packageName: string; icon: string }[]> {
    if (Platform.OS !== 'android' || !mod()) return [];
    try { return JSON.parse(await mod().getInstalledApps()); } catch { return []; }
  },

  startBlocking(blockedApps: string[], blockShorts = false, hardBlock = false, deviceAdmin = false): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try {
      const finalApps = [...blockedApps];
      if (blockShorts) {
        ['com.instagram.android','com.google.android.youtube',
         'com.facebook.katana','com.facebook.orca',
         'com.snapchat.android','com.zhiliaoapp.musically'].forEach(pkg => {
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

  setProStatus(isPro: boolean): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().setProStatus(isPro); } catch {}
  },

  // ── Website blocking ──────────────────────────────────────────────────────

  saveBlockedWebsites(domains: string[]): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().saveBlockedWebsites(JSON.stringify(domains)); } catch {}
  },

  async getBlockedWebsites(): Promise<string[]> {
    if (Platform.OS !== 'android' || !mod()) return [];
    try { return JSON.parse(await mod().getBlockedWebsites()); } catch { return []; }
  },

  normalizeDomain(input: string): string {
    try {
      const withScheme = input.startsWith('http') ? input : `https://${input}`;
      const url = new URL(withScheme);
      return url.hostname.replace(/^www\./, '').toLowerCase().trim();
    } catch {
      return input.replace(/^www\./, '').toLowerCase().trim();
    }
  },

  // ── Time limits ───────────────────────────────────────────────────────────

  saveTimeLimits(limits: { packageName: string; limitMinutes: number; enabled: boolean }[]): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().saveTimeLimits(JSON.stringify(limits)); } catch {}
  },

  async getTimeLimits(): Promise<{ packageName: string; limitMinutes: number; enabled: boolean }[]> {
    if (Platform.OS !== 'android' || !mod()) return [];
    try { return JSON.parse(await mod().getTimeLimits()); } catch { return []; }
  },

  // ── Usage stats ───────────────────────────────────────────────────────────

  async hasUsagePermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !mod()) return false;
    try { return await mod().hasUsagePermission(); } catch { return false; }
  },

  openUsageSettings(): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().openUsageSettings(); } catch {}
  },

  async getAppUsageStats(): Promise<{ packageName: string; name: string; minutes: number }[]> {
    if (Platform.OS !== 'android' || !mod()) return [];
    try { return JSON.parse(await mod().getAppUsageStats()); } catch { return []; }
  },

  // ── Device Admin ──────────────────────────────────────────────────────────

  async requestDeviceAdmin(): Promise<boolean> {
    if (Platform.OS !== 'android' || !mod()) return false;
    try { return await mod().requestDeviceAdmin(); } catch { return false; }
  },

  async isDeviceAdminActive(): Promise<boolean> {
    if (Platform.OS !== 'android' || !mod()) return false;
    try { return await mod().isDeviceAdminActive(); } catch { return false; }
  },
};

export default AppBlocking;
