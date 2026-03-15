/**
 * studyMonitor.ts — Duolingo-style smart study monitoring
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import AppBlocking from '@/modules/AppBlocking';

const CONFIRMED_KEY   = (id: string) => `study_confirmed_${id}`;
const CHECKIN_IDS_KEY = (id: string) => `study_checkin_ids_${id}`;

const DISTRACTION_APPS = new Set([
  'com.instagram.android','com.google.android.youtube','com.facebook.katana',
  'com.facebook.orca','com.snapchat.android','com.zhiliaoapp.musically',
  'com.ss.android.ugc.trill','com.twitter.android','com.reddit.frontpage',
  'com.pinterest','com.netflix.mediaclient','org.telegram.messenger','com.whatsapp',
]);

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Message pools ─────────────────────────────────────────────────────────────

const MSG_5MIN = (topic: string) => pick([
  { title: `ওই! পড়া শুরু করো 👀`, body: `${topic} নিজে নিজে পড়া হবে না। তুমি ছাড়া কে পড়বে?` },
  { title: `পরীক্ষা কিন্তু কাছে আসছে 😬`, body: `${topic} এখনো বাকি। Phone রেখে বই তোলো!` },
  { title: `Focus On তোমার জন্য ready 🕐`, body: `${topic} এর session শুরু হওয়ার কথা। চলো?` },
  { title: `তোমার future self ধন্যবাদ দেবে 🙏`, body: `এখন ${topic} পড়লে পরে অনেক চাপ কমবে।` },
  { title: `Duolingo owl রাগ করে, আমি কষ্ট পাই 😢`, body: `${topic} পড়ে আমাকে খুশি করো!` },
]);

const MSG_10MIN = (topic: string) => pick([
  { title: `১০ মিনিট হয়ে গেলো 😮`, body: `${topic} এখনো শুরু হয়নি। কী হচ্ছে ভাই?` },
  { title: `তোমার streak কাঁদছে 😭`, body: `এত কষ্টে বানানো streak নষ্ট হতে দিও না। ${topic} শুরু করো!` },
  { title: `ঠিক আছে, একটু rest নিচ্ছিলে 😅`, body: `কিন্তু এবার সত্যিই ${topic} পড়তে হবে। চলো!` },
  { title: `এখনো phone এ? 😑`, body: `${topic} এর notes তোমার দিকে তাকিয়ে আছে। হতাশ করো না।` },
  { title: `পরীক্ষার আগের রাতের কথা মনে আছে? 😬`, body: `সেই panic এড়াতে এখনই ${topic} পড়ো।` },
]);

const MSG_15MIN_PLAIN = (topic: string) => pick([
  { title: `১৫ মিনিট... 😶`, body: `${topic} এখনো শুরু হয়নি। কোনো সমস্যা? (পড়ো আসলে 😄)` },
  { title: `তোমার study plan কষ্ট পাচ্ছে 😔`, body: `${topic} এর জায়গা ফাঁকা পড়ে আছে। ভরো!` },
]);

const MSG_15MIN_APP = (appName: string, topic: string) => pick([
  { title: `${appName} কি এখন class দিচ্ছে? 🤔`, body: `সত্যিই class হলে ঠিক আছে! নাহলে ${topic} এ ফিরে এসো।` },
  { title: `${appName} তোমার marks বাড়াবে না 😅`, body: `${topic} পারবে। Switch করো!` },
  { title: `${appName} এ কী এত interesting? 👀`, body: `পরে বলো। আগে ${topic} শেষ করো!` },
]);

const MSG_APP_2ND = (appName: string, topic: string) => pick([
  { title: `আরো ${appName}? 😂`, body: `সত্যি বলো — class হচ্ছে? নাকি scroll? ${topic} মিস করছো কিন্তু।` },
  { title: `${appName} এর CEO তোমাকে thanks দিচ্ছে 😭`, body: `তুমি দাও তো সময়! একটু ${topic} কেও দাও।` },
  { title: `ঠিক আছে, last warning 🚨`, body: `${topic} এর জন্য এটুকুই বলার ছিল। তুমি বুদ্ধিমান মানুষ।` },
]);

const MSG_POST_GOOD = (topic: string) => pick([
  { title: `${topic} শেষ! তুমি awesome 🎉`, body: `Session count হয়ে গেলো। Streak চলছে!` },
  { title: `Well done! 🔥`, body: `${topic} হলো। এই momentum ধরে রাখো!` },
  { title: `Respect! 👏`, body: `${topic} শেষ। Future self সত্যিই ধন্যবাদ দেবে।` },
]);

const MSG_POST_BAD = (topic: string, mins: number) => pick([
  { title: `${topic}: সৎ feedback 😐`, body: `Session এ ~${mins} মিনিট অন্য app এ ছিলে। Phone রেখে পড়লেও হতো!` },
  { title: `হুম... ভালো হয়নি 🤔`, body: `${topic} এ distraction একটু বেশি হলো। পরেরবার?` },
  { title: `Data মিথ্যা বলে না 📊`, body: `${topic} এ ${mins}+ মিনিট অন্য জায়গায়। তুমি পারবে ভালো করতে!` },
]);

// ── Channel setup ─────────────────────────────────────────────────────────────
export async function setupStudyMonitorChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('study_monitor', {
    name: 'Study Monitor',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 200, 300],
    lightColor: '#6C63FF',
    sound: 'default',
    enableVibrate: true,
    showBadge: false,
  });
}

// ── Cancel check-ins ──────────────────────────────────────────────────────────
export async function cancelCheckInsForTask(taskId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CHECKIN_IDS_KEY(taskId));
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
      await AsyncStorage.removeItem(CHECKIN_IDS_KEY(taskId));
    }
  } catch {}
}

// ── Confirm studying ──────────────────────────────────────────────────────────
export async function confirmStudyingForTask(taskId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CONFIRMED_KEY(taskId), 'true');
    await cancelCheckInsForTask(taskId);
  } catch {}
}

export async function isStudyingConfirmedForTask(taskId: string): Promise<boolean> {
  try { return (await AsyncStorage.getItem(CONFIRMED_KEY(taskId))) === 'true'; }
  catch { return false; }
}

function secondsUntil(timeStr: string, date: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const t = new Date(date);
  t.setHours(h, m, 0, 0);
  return (t.getTime() - Date.now()) / 1000;
}

// ── Schedule check-ins ────────────────────────────────────────────────────────
export async function scheduleStudyCheckIns(task: {
  id: string; topicName: string; subjectName: string;
  startTime: string; endTime: string; date: string; estimatedMinutes: number;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  if (await isStudyingConfirmedForTask(task.id)) return;

  const secsToStart = secondsUntil(task.startTime, task.date);
  if (secsToStart < -5 * 60) return;

  const ids: string[] = [];
  const ch = Platform.OS === 'android' ? { android: { channelId: 'study_monitor' } } : {};

  const sched = async (delay: number, msg: { title: string; body: string }, type: string) => {
    if (delay < 10) return;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { ...msg, sound: 'default', data: { type, taskId: task.id, screen: 'home' }, ...ch },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(delay), repeats: false },
      });
      ids.push(id);
    } catch {}
  };

  await sched(secsToStart + 5 * 60,  MSG_5MIN(task.topicName),  'study_checkin');
  await sched(secsToStart + 10 * 60, MSG_10MIN(task.topicName), 'study_nudge');
  await sched(secsToStart + 15 * 60, MSG_15MIN_PLAIN(task.topicName), 'study_warn');

  if (ids.length > 0) {
    try { await AsyncStorage.setItem(CHECKIN_IDS_KEY(task.id), JSON.stringify(ids)); } catch {}
  }
}

// ── App-aware nudge ───────────────────────────────────────────────────────────
export async function sendContextualNudge(taskId: string, topicName: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (await isStudyingConfirmedForTask(taskId)) return;

  try {
    const hasPermission = await AppBlocking.hasUsagePermission();
    if (!hasPermission) return;

    const stats = await AppBlocking.getAppUsageStats();
    const top = stats
      .filter(s => DISTRACTION_APPS.has(s.packageName) && s.minutes >= 3)
      .sort((a, b) => b.minutes - a.minutes)[0];

    if (!top) return;

    const ch = { android: { channelId: 'study_monitor' } };
    await Notifications.scheduleNotificationAsync({
      content: { ...MSG_15MIN_APP(top.name, topicName), sound: 'default', data: { type: 'app_aware_nudge', taskId }, ...ch },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false },
    });
    await Notifications.scheduleNotificationAsync({
      content: { ...MSG_APP_2ND(top.name, topicName), sound: 'default', data: { type: 'app_soft_nudge', taskId }, ...ch },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 * 60 + 5, repeats: false },
    });
  } catch {}
}

// ── Post-task check ───────────────────────────────────────────────────────────
export async function schedulePostTaskUsageCheck(task: {
  id: string; topicName: string; endTime: string; date: string; estimatedMinutes: number;
}): Promise<void> {
  if (Platform.OS !== 'android') return;

  const delay = secondsUntil(task.endTime, task.date) + 5 * 60;
  if (delay < 0) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        ...MSG_POST_GOOD(task.topicName),
        sound: 'default',
        data: { type: 'post_task_check', taskId: task.id, estimatedMinutes: task.estimatedMinutes, topicName: task.topicName },
        android: { channelId: 'study_monitor' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(10, Math.round(delay)), repeats: false },
    });
  } catch {}
}

export async function checkAndNotifyPostTask(taskId: string, topicName: string, estimatedMinutes: number): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const hasPermission = await AppBlocking.hasUsagePermission();
    if (!hasPermission) return;

    const stats = await AppBlocking.getAppUsageStats();
    const distractionMins = stats
      .filter(s => DISTRACTION_APPS.has(s.packageName))
      .reduce((sum, s) => sum + s.minutes, 0);

    const msg = distractionMins >= estimatedMinutes * 0.5
      ? MSG_POST_BAD(topicName, Math.round(distractionMins))
      : MSG_POST_GOOD(topicName);

    await Notifications.scheduleNotificationAsync({
      content: { ...msg, sound: 'default', data: { type: 'post_task_result', taskId }, android: { channelId: 'study_monitor' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false },
    });
  } catch {}
}

// ── Notification tap handler ──────────────────────────────────────────────────
export function setupStudyMonitorNotificationHandler(
  onCheckIn: (taskId: string) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as any;
    if (!data?.taskId) return;
    const interactive = ['study_checkin', 'study_nudge', 'study_warn', 'app_aware_nudge', 'app_soft_nudge'];
    if (interactive.includes(data.type)) onCheckIn(data.taskId);
    if (data.type === 'post_task_check') {
      checkAndNotifyPostTask(data.taskId, data.topicName ?? '', data.estimatedMinutes ?? 40).catch(() => {});
    }
  });
  return () => sub.remove();
    }
