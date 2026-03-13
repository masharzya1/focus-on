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
      AppBlockingModule.startBlocking(JSON.stringify({ blockedApps, blockShorts }));
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
};

export default AppBlocking;
