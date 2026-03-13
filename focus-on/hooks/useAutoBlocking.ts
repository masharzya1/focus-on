/**
 * hooks/useAutoBlocking.ts
 *
 * Background hook that:
 *  - Every 60s checks if any routine is active right now
 *  - If yes → automatically starts blocking (no need to press Start Focus)
 *  - If no  → stops blocking if it was auto-started
 *
 * Usage: call useAutoBlocking() in your root layout or focus-mode screen.
 */

import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppBlocking from '@/modules/AppBlocking';

interface Routine {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  blockedApps: string[];
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function useAutoBlocking() {
  // Track whether blocking was started by this hook (not by user pressing Start Focus)
  const autoStarted = useRef(false);

  const checkAndSync = async () => {
    if (Platform.OS !== 'android') return;

    try {
      const data = await AsyncStorage.getItem('focus_on_routines');
      if (!data) {
        // No routines — stop if we auto-started
        if (autoStarted.current) {
          AppBlocking.stopBlocking();
          autoStarted.current = false;
        }
        return;
      }

      const routines: Routine[] = JSON.parse(data);
      const now = getCurrentTime();
      const activeRoutine = routines.find(r => now >= r.startTime && now <= r.endTime);

      const isCurrentlyBlocking = await AppBlocking.isBlockingActive();

      if (activeRoutine && activeRoutine.blockedApps.length > 0) {
        if (!isCurrentlyBlocking) {
          // Auto-start blocking for this routine
          AppBlocking.startBlocking(activeRoutine.blockedApps);
          autoStarted.current = true;
          console.log(`[AutoBlocking] Started for routine: ${activeRoutine.name}`);
        }
      } else {
        // No active routine
        if (isCurrentlyBlocking && autoStarted.current) {
          AppBlocking.stopBlocking();
          autoStarted.current = false;
          console.log('[AutoBlocking] Stopped — no active routine');
        }
      }
    } catch (err) {
      console.error('[AutoBlocking] Error:', err);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkAndSync();

    // Check every 60 seconds
    const interval = setInterval(checkAndSync, 60_000);

    // Also check when app comes to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkAndSync();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
