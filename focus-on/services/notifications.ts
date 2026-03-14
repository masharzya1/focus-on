import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY = 'focuson_notif_scheduled';

// ── Handler (show notification even when app is foregrounded) ──────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Timer done notification ────────────────────────────────────────────────
export async function scheduleTimerDoneNotification(
  mode: 'focus' | 'break',
  seconds: number
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: mode === 'focus' ? '🎯 Focus session complete!' : '☕ Break time over!',
      body: mode === 'focus'
        ? 'Great work! Time for a break.'
        : 'Ready to focus again? Let\'s go!',
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
  });
  return id;
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Daily study reminder ───────────────────────────────────────────────────
export async function scheduleDailyReminder(hour = 19, minute = 0): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Time to study!',
      body: 'Keep your streak going. Open Focus On and start a session.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ── Streak reminder ────────────────────────────────────────────────────────
export async function scheduleStreakReminder(): Promise<void> {
  // Every day at 9 PM — if they haven't studied, remind them
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Don\'t break your streak!',
      body: 'You haven\'t studied today. Open Focus On to keep your streak alive.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
}

// ── Exam deadline reminder ─────────────────────────────────────────────────
export async function scheduleExamReminder(
  examName: string,
  examDate: string,
  daysBeforeList = [7, 3, 1]
): Promise<void> {
  const exam = new Date(examDate);
  for (const daysBefore of daysBeforeList) {
    const notifDate = new Date(exam.getTime() - daysBefore * 86400000);
    if (notifDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📅 ${examName} in ${daysBefore} day${daysBefore > 1 ? 's' : ''}!`,
          body: 'Review your study plan and make sure you\'re on track.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifDate,
        },
      });
    }
  }
}

// ── Plan task reminder ─────────────────────────────────────────────────────
export async function schedulePlanReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📋 Today\'s study tasks are waiting!',
      body: 'You have tasks planned for today. Tap to get started.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 30,
    },
  });
}

// ── Setup all notifications ────────────────────────────────────────────────
export async function setupAllNotifications(
  studyPlans: { examName: string; examDate: string }[]
): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelAllNotifications();
  await scheduleDailyReminder(19, 0);
  await scheduleStreakReminder();
  await schedulePlanReminder();

  for (const plan of studyPlans) {
    await scheduleExamReminder(plan.examName, plan.examDate);
  }
}