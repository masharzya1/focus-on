import { useEffect, useRef } from 'react';
import { AppState, Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BlockRoutine {
  id: string; startTime: string; endTime: string;
  days: number[]; blockedApps: string[]; blockShorts: boolean; enabled: boolean;
  hardBlock?: boolean; deviceAdmin?: boolean;
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

// Safe wrapper — never throws
function safeNative(fn: () => any) {
  try {
    if (!NativeModules.AppBlockingModule) return null;
    return fn();
  } catch { return null; }
}

export function useAutoBlocking() {
  const autoStarted = useRef(false);
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

      const now = getCurrentTime();
      const todayIdx = new Date().getDay();

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
        autoStarted.current = true;
      } else {
        stopIfNeeded();
      }
    } catch { /* silently ignore — never crash the app */ }
  };

  function stopIfNeeded() {
    if (autoStarted.current) {
      safeNative(() => NativeModules.AppBlockingModule.stopBlocking());
      autoStarted.current = false;
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    // Delay first check so app finishes rendering first
    const initTimer = setTimeout(() => checkAndSync(), 2000);
    const interval = setInterval(checkAndSync, 30_000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') checkAndSync(); });

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
