import { useEffect, useRef } from 'react';
<<<<<<< HEAD
import { AppState, Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BlockRoutine {
  id: string; startTime: string; endTime: string;
  days: number[]; blockedApps: string[]; blockShorts: boolean; enabled: boolean;
  hardBlock?: boolean; deviceAdmin?: boolean;
=======
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppBlocking from '@/modules/AppBlocking';

interface BlockRoutine {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: number[];
  blockedApps: string[];
  blockShorts: boolean;
  enabled: boolean;
}

interface AppStateData {
  blockRoutines?: BlockRoutine[];
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
}

function getCurrentTime(): string {
  const now = new Date();
<<<<<<< HEAD
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

// Safe wrapper — never throws
function safeNative(fn: () => any) {
  try {
    if (!NativeModules.AppBlockingModule) return null;
    return fn();
  } catch { return null; }
=======
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
}

export function useAutoBlocking() {
  const autoStarted = useRef(false);
<<<<<<< HEAD
  const mountedRef = useRef(true);

  const checkAndSync = async () => {
    if (!mountedRef.current) return;
    if (Platform.OS !== 'android') return;
    if (!NativeModules.AppBlockingModule) return; // module not ready — skip silently

    try {
      const raw = await AsyncStorage.getItem('focuson_data_v3');
      if (!raw) { stopIfNeeded(); return; }

      const data = JSON.parse(raw);
      const routines: BlockRoutine[] = data.blockRoutines || [];

      // Also check plan-based routines
      const planRoutines: BlockRoutine[] = (data.studyPlans || []).flatMap((plan: any) => {
        if (!plan.blockApps) return [];
        const today = new Date().toISOString().split('T')[0];
        return (plan.tasks || [])
          .filter((t: any) => t.date === today && t.startTime && t.endTime)
          .map((t: any) => ({
            id: `plan_${plan.id}_${t.id}`,
            startTime: t.startTime,
            endTime: t.endTime,
            days: [],
            blockedApps: plan.blockedApps || [],
            blockShorts: false,
            enabled: true,
            hardBlock: plan.hardBlock,
            deviceAdmin: plan.deviceAdmin,
          }));
      });

      const allRoutines = [...routines, ...planRoutines];
      safeNative(() => NativeModules.AppBlockingModule.saveRoutines(JSON.stringify(allRoutines)));
=======

  const checkAndSync = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const raw = await AsyncStorage.getItem('focuson_data_v2');
      if (!raw) { stopIfNeeded(); return; }

      const data: AppStateData = JSON.parse(raw);
      const routines = data.blockRoutines || [];

      // Always persist latest routines to native layer so the
      // AccessibilityService can enforce them when the app is closed
      AppBlocking.saveRoutines(routines);
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d

      const now = getCurrentTime();
      const todayIdx = new Date().getDay();

<<<<<<< HEAD
      const active = allRoutines.filter(r =>
        r.enabled &&
        now >= r.startTime && now <= r.endTime &&
        (r.days.length === 0 || r.days.includes(todayIdx))
      );

      if (active.length > 0) {
        const allApps = [...new Set(active.flatMap(r => r.blockedApps))];
        const blockShorts = active.some(r => r.blockShorts);
        const hardBlock = active.some(r => r.hardBlock);
        const deviceAdmin = active.some(r => r.deviceAdmin);
        safeNative(() => {
          const finalApps = [...allApps];
          if (blockShorts) {
            ['com.instagram.android','com.google.android.youtube',
             'com.facebook.katana','com.facebook.orca'].forEach(pkg => {
              if (!allApps.includes(pkg)) finalApps.push(`reels:${pkg}`);
            });
          }
          const params = JSON.stringify({ apps: finalApps, hardBlock, deviceAdmin });
          NativeModules.AppBlockingModule.startBlocking(params);
        });
=======
      const activeRoutines = routines.filter(r =>
        r.enabled &&
        now >= r.startTime &&
        now <= r.endTime &&
        (r.days.length === 0 || r.days.includes(todayIdx))
      );

      if (activeRoutines.length > 0) {
        const allApps = [...new Set(activeRoutines.flatMap(r => r.blockedApps))];
        const blockShorts = activeRoutines.some(r => r.blockShorts);
        AppBlocking.startBlocking(allApps, blockShorts);
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
        autoStarted.current = true;
      } else {
        stopIfNeeded();
      }
<<<<<<< HEAD
    } catch { /* silently ignore — never crash the app */ }
=======
    } catch (err) {
      console.error('[AutoBlocking] Error:', err);
    }
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
  };

  function stopIfNeeded() {
    if (autoStarted.current) {
<<<<<<< HEAD
      safeNative(() => NativeModules.AppBlockingModule.stopBlocking());
=======
      AppBlocking.stopBlocking();
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
      autoStarted.current = false;
    }
  }

  useEffect(() => {
<<<<<<< HEAD
    mountedRef.current = true;
    // Delay first check so app finishes rendering first
    const initTimer = setTimeout(() => checkAndSync(), 2000);
    const interval = setInterval(checkAndSync, 30_000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') checkAndSync(); });

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
=======
    checkAndSync();
    const interval = setInterval(checkAndSync, 30_000); // check every 30s
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkAndSync();
    });
    return () => {
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
