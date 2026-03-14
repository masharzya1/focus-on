import { NativeModules, Platform } from 'react-native';

const mod = () => NativeModules.AppBlockingModule;

const AppBlocking = {

  // ── Installed apps (now includes icon as base64) ──────────────────────────

  async getInstalledApps(): Promise<{ name: string; packageName: string; icon: string }[]> {
    if (Platform.OS !== 'android' || !mod()) return [];
    try {
      return JSON.parse(await mod().getInstalledApps());
    } catch {
      return [];
    }
  },

  // ── App blocking ──────────────────────────────────────────────────────────

  startBlocking(
    blockedApps: string[],
    blockShorts = false,
    hardBlock = false,
    deviceAdmin = false
  ): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try {
      const finalApps = [...blockedApps];
      if (blockShorts) {
        ['com.instagram.android', 'com.google.android.youtube',
         'com.facebook.katana', 'com.facebook.orca',
         'com.snapchat.android', 'com.zhiliaoapp.musically'].forEach(pkg => {
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

  async requestDeviceAdmin(): Promise<boolean> {
    if (Platform.OS !== 'android' || !mod()) return false;
    try { return await mod().requestDeviceAdmin(); } catch { return false; }
  },

  // ── Website blocking ──────────────────────────────────────────────────────

  /**
   * Save the full list of blocked websites/domains to native layer.
   * Call this whenever the list changes.
   * @param domains e.g. ["facebook.com", "reddit.com", "twitter.com"]
   */
  saveBlockedWebsites(domains: string[]): void {
    if (Platform.OS !== 'android' || !mod()) return;
    try { mod().saveBlockedWebsites(JSON.stringify(domains)); } catch {}
  },

  async getBlockedWebsites(): Promise<string[]> {
    if (Platform.OS !== 'android' || !mod()) return [];
    try { return JSON.parse(await mod().getBlockedWebsites()); } catch { return []; }
  },

  /**
   * Clean and normalize a domain input from user.
   * "https://www.facebook.com/feed" → "facebook.com"
   */
  normalizeDomain(input: string): string {
    try {
      const withScheme = input.startsWith('http') ? input : `https://${input}`;
      const url = new URL(withScheme);
      return url.hostname.replace(/^www\./, '').toLowerCase().trim();
    } catch {
      return input.replace(/^www\./, '').toLowerCase().trim();
    }
  },
};

export default AppBlocking;
