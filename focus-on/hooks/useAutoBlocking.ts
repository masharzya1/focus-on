import { useEffect, useRef } from 'react';
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
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function useAutoBlocking() {
  const autoStarted = useRef(false);

  const checkAndSync = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const raw = await AsyncStorage.getItem('focuson_data_v2');
      if (!raw) { stopIfNeeded(); return; }

      const data: AppStateData = JSON.parse(raw);
      const routines = data.blockRoutines || [];

      const now = getCurrentTime();
      const todayIdx = new Date().getDay();

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
        autoStarted.current = true;
      } else {
        stopIfNeeded();
      }
    } catch (err) {
      console.error('[AutoBlocking] Error:', err);
    }
  };

  function stopIfNeeded() {
    if (autoStarted.current) {
      AppBlocking.stopBlocking();
      autoStarted.current = false;
    }
  }

  useEffect(() => {
    checkAndSync();
    const interval = setInterval(checkAndSync, 30_000); // check every 30s
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkAndSync();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
