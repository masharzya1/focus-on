import * as Notifications from 'expo-notifications';

import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android requires a notification channel — create on startup
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Focus On',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6C63FF',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
  await Notifications.setNotificationChannelAsync('study', {
    name: 'Study Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6C63FF',
    sound: 'default',
  });
}

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
        : "Ready to focus again? Let's go!",
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
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Time to study!',
      body: 'Keep your streak going. Open Focus On and start a session.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour, minute,
    },
  });
}

export async function scheduleStreakReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔥 Don't break your streak!",
      body: "You haven't studied today. Open Focus On to keep your streak alive.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21, minute: 0,
    },
  });
}

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
          body: "Review your study plan and make sure you're on track.",
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

export async function schedulePlanReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "📋 Today's study tasks are waiting!",
      body: 'You have tasks planned for today. Tap to get started.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8, minute: 30,
    },
  });
}

// ── Per-task notifications ─────────────────────────────────────────────────
// Fires a notification at the exact start time of each planned task
export async function scheduleTaskNotifications(tasks: {
  date: string;
  startTime?: string;
  topicName: string;
  subjectName: string;
  estimatedMinutes: number;
}[]): Promise<void> {
  for (const task of tasks) {
    if (!task.startTime || !task.date) continue;

    const [h, m] = task.startTime.split(':').map(Number);
    const taskDate = new Date(task.date);
    taskDate.setHours(h, m, 0, 0);

    // Allow up to 2 minutes grace (user just set it)
    if (taskDate <= new Date(Date.now() - 60 * 1000)) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📖 Time to study: ${task.topicName}`,
          body: `${task.subjectName} · Open Focus On to start!`,
          sound: 'default',
          data: { screen: 'timer', topicName: task.topicName },
          ...(Platform.OS === 'android' ? { android: { channelId: 'study' } } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: taskDate,
        },
      });
    } catch {
      // Silently fail per task — don't block saving
    }
  }
}

// ── Setup all notifications ────────────────────────────────────────────────
export async function setupAllNotifications(
  studyPlans: { examName: string; examDate: string }[],
  tasks?: {
    date: string; startTime?: string;
    topicName: string; subjectName: string; estimatedMinutes: number;
  }[]
): Promise<void> {
  await setupAndroidChannel();
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelAllNotifications();
  await scheduleDailyReminder(19, 0);
  await scheduleStreakReminder();
  await schedulePlanReminder();

  for (const plan of studyPlans) {
    await scheduleExamReminder(plan.examName, plan.examDate);
  }

  if (tasks && tasks.length > 0) {
    await scheduleTaskNotifications(tasks);
  }
}