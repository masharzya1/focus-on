import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getLocale } from '@/contexts/LanguageContext';

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
  const t = await getLocale();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: mode === 'focus' ? t.notifFocusDoneTitle : t.notifBreakDoneTitle,
      body: mode === 'focus' ? t.notifFocusDoneBody : t.notifBreakDoneBody,
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
  const t = await getLocale();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.notifDailyTitle,
      body: t.notifDailyBody,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour, minute,
    },
  });
}

export async function scheduleStreakReminder(): Promise<void> {
  const t = await getLocale();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.notifStreakTitle,
      body: t.notifStreakBody,
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
  const t = await getLocale();
  const exam = new Date(examDate);
  for (const daysBefore of daysBeforeList) {
    const notifDate = new Date(exam.getTime() - daysBefore * 86400000);
    if (notifDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t.notifExamTitle(examName, daysBefore),
          body: t.notifExamBody,
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

// Smart routine reminder — fires 1hr before first task of the day
// Call this every time tasks are updated/created
export async function scheduleRoutineReminder(tasks: {
  date: string;
  startTime?: string;
  topicName: string;
}[]): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel any existing routine reminder
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of allScheduled) {
    if ((n.content.data as any)?.type === 'routine_reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today && t.startTime);
  if (todayTasks.length === 0) return;

  // Find earliest startTime
  const sorted = [...todayTasks].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  const earliest = sorted[0];
  if (!earliest.startTime) return;

  const [h, m] = earliest.startTime.split(':').map(Number);
  const taskStart = new Date();
  taskStart.setHours(h, m, 0, 0);

  // Notify 1 hour before
  const notifyAt = new Date(taskStart.getTime() - 60 * 60 * 1000);
  const secsUntil = (notifyAt.getTime() - Date.now()) / 1000;
  if (secsUntil < 30) return; // too soon or already past

  const t = await getLocale();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.notifRoutineTitle,
      body: t.notifRoutineBody(sorted.length, earliest.topicName, earliest.startTime ?? ''),
      sound: true,
      data: { type: 'routine_reminder', screen: 'home' },
      ...(Platform.OS === 'android' ? { android: { channelId: 'study' } } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notifyAt,
    },
  });
}

// ── Per-task 5-minute pre-reminder ────────────────────────────────────────────
// Fires 5 min before each individual task starts.
// Cancel key: "pre_task_<taskId>"
// Call after handleSaveRoutine and on app focus if tasks have startTime today.
export async function schedulePreTaskReminders(tasks: {
  id: string;
  date: string;
  startTime: string;
  topicName: string;
  subjectName: string;
}[]): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel all existing pre-task reminders first
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of allScheduled) {
    if ((n.content.data as any)?.type === 'pre_task_reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const t = await getLocale();

  for (const task of tasks) {
    if (task.date !== today || !task.startTime) continue;

    const [h, m] = task.startTime.split(':').map(Number);
    const taskStart = new Date();
    taskStart.setHours(h, m, 0, 0);

    // Fire 5 minutes before task start
    const notifyAt = new Date(taskStart.getTime() - 5 * 60 * 1000);
    const secsUntil = (notifyAt.getTime() - Date.now()) / 1000;
    if (secsUntil < 10) continue; // already past or too soon

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t.notifPreTaskTitle(task.topicName),
          body: t.notifPreTaskBody(task.subjectName, task.startTime),
          sound: 'default',
          data: {
            type: 'pre_task_reminder',
            taskId: task.id,
            screen: 'home',
          },
          ...(Platform.OS === 'android' ? { android: { channelId: 'study' } } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifyAt,
        },
      });
    } catch {}
  }
}

// ── Morning summary notification ──────────────────────────────────────────────
// Fires once at a fixed morning time (default 07:00) summarising today's tasks.
// If first task is before 07:00, fires 1hr before that task instead.
// Cancel key: type === 'morning_summary'
export async function scheduleMorningSummary(tasks: {
  date: string;
  startTime?: string;
  topicName: string;
}[]): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel existing morning summary
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of allScheduled) {
    if ((n.content.data as any)?.type === 'morning_summary') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today);
  if (todayTasks.length === 0) return;

  const t = await getLocale();

  // Find earliest task with a startTime
  const withTime = todayTasks
    .filter(t => t.startTime)
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  let notifyAt: Date;

  if (withTime.length > 0) {
    // Fire 1 hour before earliest task, but no earlier than 06:00
    const [h, m] = (withTime[0].startTime ?? '07:00').split(':').map(Number);
    const taskStart = new Date();
    taskStart.setHours(h, m, 0, 0);
    const oneHourBefore = new Date(taskStart.getTime() - 60 * 60 * 1000);

    // Clamp: never before 06:00
    const sixAM = new Date(); sixAM.setHours(6, 0, 0, 0);
    notifyAt = oneHourBefore < sixAM ? sixAM : oneHourBefore;
  } else {
    // No timed tasks — fire at 07:00
    notifyAt = new Date(); notifyAt.setHours(7, 0, 0, 0);
  }

  const secsUntil = (notifyAt.getTime() - Date.now()) / 1000;
  if (secsUntil < 30) return; // already past today

  const count = todayTasks.length;
  const firstName = withTime[0]?.topicName ?? todayTasks[0].topicName;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.notifMorningSummaryTitle,
      body: t.notifMorningSummaryBody(count, firstName),
      sound: true,
      data: { type: 'morning_summary', screen: 'home' },
      ...(Platform.OS === 'android' ? { android: { channelId: 'study' } } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notifyAt,
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
      const _t = await getLocale();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: _t.notifTaskTitle(task.topicName),
          body: _t.notifTaskBody(task.subjectName),
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

// ── Master scheduler — call this whenever plan/tasks change ───────────────────
// Handles the complete notification flow for a given day's tasks:
//   1. Midnight nudge  → "Tomorrow you have N tasks, set your routine"
//   2. Morning summary → fires 1hr before first task (min 06:00)
//   3. 1hr reminder    → before first task (scheduleRoutineReminder)
//   4. 5-min reminder  → before each individual task
//   5. Exact-time      → at each task's startTime
//
// Pass ALL tasks across all plans. The function figures out today/tomorrow itself.
export async function scheduleAllTaskNotifications(allTasks: {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  topicName: string;
  subjectName: string;
  estimatedMinutes: number;
}[]): Promise<void> {
  if (Platform.OS === 'web') return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  const todayTasks    = allTasks.filter(t => t.date === today);
  const tomorrowTasks = allTasks.filter(t => t.date === tomorrow);
  const timedToday    = todayTasks.filter(t => t.startTime);

  // ── 1. Midnight nudge (fires at 00:01 the next day) ──────────────────────
  await scheduleNewDayRoutineReminder(tomorrowTasks);

  // ── 2. Morning summary ────────────────────────────────────────────────────
  await scheduleMorningSummary(todayTasks);

  // ── 3. 1-hour reminder before first timed task ────────────────────────────
  await scheduleRoutineReminder(timedToday);

  // ── 4. 5-minute pre-task reminder per task ────────────────────────────────
  await schedulePreTaskReminders(
    timedToday.map(t => ({
      id: t.id,
      date: t.date,
      startTime: t.startTime!,
      topicName: t.topicName,
      subjectName: t.subjectName,
    }))
  );

  // ── 5. Exact-time notification at task start ──────────────────────────────
  await scheduleTaskNotifications(timedToday);
}

// ── Setup all notifications ────────────────────────────────────────────────
export async function setupAllNotifications(
  studyPlans: { examName: string; examDate: string }[],
  tasks?: {
    id?: string;
    date: string; startTime?: string; endTime?: string;
    topicName: string; subjectName: string; estimatedMinutes: number;
  }[]
): Promise<void> {
  await setupAndroidChannel();
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelAllNotifications();
  await scheduleDailyReminder(19, 0);
  await scheduleStreakReminder();

  if (studyPlans.length > 0) {
    await schedulePlanReminder();
  }

  for (const plan of studyPlans) {
    if (new Date(plan.examDate) > new Date()) {
      await scheduleExamReminder(plan.examName, plan.examDate);
    }
  }

  if (tasks && tasks.length > 0) {
    // Use master scheduler so all 5 notification types are set up
    await scheduleAllTaskNotifications(
      tasks.map(t => ({
        id: t.id ?? `task_${Math.random()}`,
        date: t.date,
        startTime: t.startTime,
        endTime: t.endTime,
        topicName: t.topicName,
        subjectName: t.subjectName,
        estimatedMinutes: t.estimatedMinutes,
      }))
    );
  }
}
// ── Daily "set your routine" reminder ────────────────────────────────────────
// Fires every morning when the user has tasks for today but hasn't set routine yet.
// Call once on app start and whenever a new plan is created.
// ── New day routine reminder ─────────────────────────────────────────────────
// Fires at 00:01 AM when the new day starts — if tomorrow has unscheduled tasks.
// Call this every evening after routine is set (or when plan is created).
export async function scheduleNewDayRoutineReminder(
  tomorrowTasks: { topicName: string }[],
): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel any existing new-day reminder
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    if ((n.content.data as any)?.type === 'daily_routine_set') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  if (tomorrowTasks.length === 0) return;

  // Fire at 00:01 AM tonight (next midnight + 1 min)
  const midnight = new Date();
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 1, 0, 0);

  const secsUntil = (midnight.getTime() - Date.now()) / 1000;
  if (secsUntil < 10) return;

  const count = tomorrowTasks.length;
  const t = await getLocale();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.notifNewDayTitle,
      body: t.notifNewDayBody(count),
      sound: true,
      data: { type: 'daily_routine_set', screen: 'home' },
      ...(Platform.OS === 'android' ? { android: { channelId: 'study' } } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: midnight,
    },
  });
}

// Keep old name as alias for backward compat
export async function scheduleDailyRoutineSetReminder(
  hasTodayTasks: boolean,
): Promise<void> {
  // No-op — replaced by scheduleNewDayRoutineReminder
  return;
    }

// ── Plan reminder (stub used in setupAllNotifications) ───────────────────────
export async function schedulePlanReminder(): Promise<void> {
  const t = await getLocale();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.notifPlanReminderTitle,
      body: t.notifPlanReminderBody,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8, minute: 0,
    },
  }).catch(() => {});
}