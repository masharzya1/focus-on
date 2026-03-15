/**
 * smartSchedule.ts — v2
 *
 * Improvements over v1:
 * 1. Review sessions never go past exam date
 * 2. Adaptive spaced repetition — more reviews for heavier items
 * 3. Missed day detection — rescheduled items pushed forward
 * 4. User acceptance tracking — if user consistently skips, daily capacity auto-adjusts
 * 5. Subject interleaving improved — tracks "last seen" to avoid same subject twice in a row
 */

import type { PlannedTask } from '@/types/study';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScheduleItem {
  subjectId: string;
  chapterId: string;
  topicId: string;
  name: string;
  subjectName: string;
  weight: number; // 1=Light, 2=Medium, 3=Heavy, 4=Very Heavy
  isChapterOnly: boolean;
}

export interface ScheduleConfig {
  items: ScheduleItem[];
  examDate: string;
  dailyCapacity: number;
  studyDays: number[];    // 0=Sun…6=Sat
  revisionDays: number;
}

export interface ScheduleResult {
  tasks: Omit<PlannedTask, 'startTime' | 'endTime'>[];
  stats: {
    totalWeight: number;
    daysNeeded: number;
    daysAvailable: number;
    willFinish: boolean;
    reviewCount: number;
    suggestion?: string; // shown to user if tight
  };
}

// For acceptance tracking
export interface AcceptanceRecord {
  date: string;
  scheduled: number; // tasks scheduled
  completed: number; // tasks completed
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

function isStudyDay(date: string, studyDays: number[]): boolean {
  if (studyDays.length === 0) return true;
  return studyDays.includes(new Date(date).getDay());
}

function nextStudyDay(from: string, studyDays: number[], limit: string): string | null {
  let cursor = from;
  for (let i = 0; i < 400; i++) {
    if (cursor >= limit) return null;
    if (isStudyDay(cursor, studyDays)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

export function countStudyDays(from: string, to: string, studyDays: number[]): number {
  let count = 0;
  let cursor = from;
  while (cursor < to) {
    if (isStudyDay(cursor, studyDays)) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}

// ── Step 1: Order items ───────────────────────────────────────────────────────
// Heavy first, subjects strictly interleaved (never same subject twice in a row)

function orderItems(items: ScheduleItem[]): ScheduleItem[] {
  const bySubject: Record<string, ScheduleItem[]> = {};
  for (const item of items) {
    if (!bySubject[item.subjectId]) bySubject[item.subjectId] = [];
    bySubject[item.subjectId].push(item);
  }

  // Sort each subject: heavy first
  for (const sid of Object.keys(bySubject)) {
    bySubject[sid].sort((a, b) => b.weight - a.weight);
  }

  // Strict interleaving — never same subject twice in a row
  const subjectIds = Object.keys(bySubject);
  const result: ScheduleItem[] = [];
  const indices = Object.fromEntries(subjectIds.map(s => [s, 0]));
  let lastSubject = '';

  while (true) {
    // Find subjects that still have items
    const available = subjectIds.filter(s => indices[s] < bySubject[s].length);
    if (available.length === 0) break;

    // Prefer a subject that's not the last one used
    const preferred = available.filter(s => s !== lastSubject);
    const pick = preferred.length > 0 ? preferred[0] : available[0];

    result.push(bySubject[pick][indices[pick]]);
    indices[pick]++;
    lastSubject = pick;
  }

  return result;
}

// ── Step 2: Pack into days ────────────────────────────────────────────────────

function packIntoDays(
  items: ScheduleItem[],
  effectiveCapacity: number,
  studyDays: number[],
  lastDate: string,
): { date: string; items: ScheduleItem[] }[] {
  const days: { date: string; items: ScheduleItem[]; usedCapacity: number }[] = [];
  let cursor = today();
  let currentDay: { date: string; items: ScheduleItem[]; usedCapacity: number } | null = null;

  for (const item of items) {
    if (!currentDay) {
      const d = nextStudyDay(cursor, studyDays, lastDate);
      if (!d) break;
      currentDay = { date: d, items: [], usedCapacity: 0 };
      cursor = addDays(d, 1);
    }

    if (currentDay.usedCapacity + item.weight <= effectiveCapacity) {
      currentDay.items.push(item);
      currentDay.usedCapacity += item.weight;
    } else {
      days.push(currentDay);
      const d = nextStudyDay(cursor, studyDays, lastDate);
      if (!d) break;
      currentDay = { date: d, items: [item], usedCapacity: item.weight };
      cursor = addDays(d, 1);
    }
  }

  if (currentDay && currentDay.items.length > 0) {
    days.push(currentDay);
  }

  return days;
}

// ── Step 3: Adaptive spaced repetition ───────────────────────────────────────
// Weight 2 → 1 review (5 days later)
// Weight 3 → 2 reviews (4 days, then 8 days)
// Weight 4 → 3 reviews (3 days, 6 days, 12 days)
// Reviews NEVER go past (examDate - revisionDays)

function addSpacedReviews(
  days: { date: string; items: ScheduleItem[] }[],
  studyDays: number[],
  lastDate: string,  // last day to schedule (exam - revisionDays)
  effectiveCapacity: number,
): { date: string; items: ScheduleItem[]; isReview?: boolean }[] {
  const result = [...days.map(d => ({ ...d, isReview: false }))];
  const reviewsToSchedule: { date: string; item: ScheduleItem }[] = [];

  for (const day of days) {
    for (const item of day.items) {
      // Determine review intervals based on weight
      const intervals: number[] = [];
      if (item.weight === 2) intervals.push(5);
      if (item.weight === 3) intervals.push(4, 9);
      if (item.weight === 4) intervals.push(3, 7, 14);

      for (const interval of intervals) {
        const reviewDate = nextStudyDay(addDays(day.date, interval), studyDays, lastDate);
        if (reviewDate && reviewDate < lastDate) {
          reviewsToSchedule.push({
            date: reviewDate,
            item: { ...item, name: `📖 Review: ${item.name}`, weight: 1 },
          });
        }
      }
    }
  }

  // Merge reviews into existing days (with grace capacity)
  for (const { date, item } of reviewsToSchedule) {
    const existing = result.find(d => d.date === date);
    if (existing) {
      const used = existing.items.reduce((s, i) => s + i.weight, 0);
      if (used + 1 <= effectiveCapacity + 2) { // reviews get +2 grace
        existing.items.push(item);
      }
    } else {
      result.push({ date, items: [item], isReview: true });
    }
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

// ── Step 4: Acceptance-based capacity adjustment ──────────────────────────────
// If user's recent completion rate is low → reduce effective capacity
// If completion rate is high → keep or slightly increase

export function calculateAdaptiveCapacity(
  baseDailyCapacity: number,
  recentRecords: AcceptanceRecord[], // last 7 days
): { adjustedCapacity: number; completionRate: number; message: string | null } {
  if (recentRecords.length < 3) {
    return { adjustedCapacity: baseDailyCapacity, completionRate: 1, message: null };
  }

  const totalScheduled = recentRecords.reduce((s, r) => s + r.scheduled, 0);
  const totalCompleted = recentRecords.reduce((s, r) => s + r.completed, 0);

  if (totalScheduled === 0) {
    return { adjustedCapacity: baseDailyCapacity, completionRate: 1, message: null };
  }

  const rate = totalCompleted / totalScheduled;

  if (rate < 0.4) {
    // Consistently struggling — reduce by 30%
    const adjusted = Math.max(1, Math.floor(baseDailyCapacity * 0.7));
    return {
      adjustedCapacity: adjusted,
      completionRate: rate,
      message: `You've been completing about ${Math.round(rate * 100)}% of tasks. Plan auto-adjusted to a lighter load.`,
    };
  }

  if (rate < 0.7) {
    // Slightly struggling — reduce by 15%
    const adjusted = Math.max(1, Math.floor(baseDailyCapacity * 0.85));
    return {
      adjustedCapacity: adjusted,
      completionRate: rate,
      message: `Completing ${Math.round(rate * 100)}% of tasks. Slightly reduced daily load.`,
    };
  }

  if (rate >= 0.95) {
    // Crushing it — suggest increasing
    return {
      adjustedCapacity: baseDailyCapacity,
      completionRate: rate,
      message: `You're completing ${Math.round(rate * 100)}% of tasks! Consider increasing daily capacity.`,
    };
  }

  return { adjustedCapacity: baseDailyCapacity, completionRate: rate, message: null };
}

// ── Step 5: Missed day rescheduler ────────────────────────────────────────────
// Called when user opens app — checks for incomplete past tasks and pushes them forward

export function rescheduleMissedTasks(
  tasks: PlannedTask[],
  studyDays: number[],
  examDate: string,
  revisionDays: number,
): { updatedTasks: PlannedTask[]; rescheduledCount: number } {
  const todayStr = today();
  const lastDate = addDays(examDate, -revisionDays);
  let rescheduledCount = 0;

  const updatedTasks = tasks.map(task => {
    // Only reschedule: past date, not completed, not a revision
    if (task.date >= todayStr) return task;
    if (task.completed) return task;

    // Find next available study day from today
    const newDate = nextStudyDay(todayStr, studyDays, lastDate);
    if (!newDate) return task; // no room — leave as is

    rescheduledCount++;
    return { ...task, date: newDate };
  });

  // Sort so tasks on same day are in original order
  updatedTasks.sort((a, b) => a.date.localeCompare(b.date));

  return { updatedTasks, rescheduledCount };
}

// ── Main entry ────────────────────────────────────────────────────────────────

export function generateSmartSchedule(
  config: ScheduleConfig,
  recentRecords?: AcceptanceRecord[],
): ScheduleResult {
  const { items, examDate, dailyCapacity, studyDays, revisionDays } = config;

  const lastStudyDate = addDays(examDate, -revisionDays);
  const daysAvailable = countStudyDays(today(), lastStudyDate, studyDays);

  // Acceptance-based capacity adjustment
  const { adjustedCapacity, message } = recentRecords && recentRecords.length >= 3
    ? calculateAdaptiveCapacity(dailyCapacity, recentRecords)
    : { adjustedCapacity: dailyCapacity, message: null };

  // 15% buffer on top of any acceptance adjustment
  const effectiveCapacity = Math.max(1, Math.floor(adjustedCapacity * 0.85));

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const daysNeeded  = totalWeight === 0 ? 0 : Math.max(1, Math.ceil(totalWeight / effectiveCapacity));

  // Build schedule
  const ordered     = orderItems(items);
  const packed      = packIntoDays(ordered, effectiveCapacity, studyDays, lastStudyDate);
  const withReviews = addSpacedReviews(packed, studyDays, lastStudyDate, effectiveCapacity);

  // Convert to tasks
  let idx = 0;
  const tasks: Omit<PlannedTask, 'startTime' | 'endTime'>[] = [];

  for (const day of withReviews) {
    for (const item of day.items) {
      const weightToMins: Record<number, number> = { 1: 20, 2: 40, 3: 60, 4: 90 };
      tasks.push({
        id: `t_${Date.now()}_${idx++}_${Math.random().toString(36).slice(2, 5)}`,
        date: day.date,
        topicId: item.topicId,
        subjectId: item.subjectId,
        chapterId: item.chapterId,
        completed: false,
        type: item.name.startsWith('📖 Review:') ? 'revision' : 'study',
        estimatedMinutes: weightToMins[item.weight] ?? 40,
      });
    }
  }

  const reviewCount = tasks.filter(t => t.type === 'revision').length;
  const willFinish  = daysNeeded <= daysAvailable;

  // Helpful suggestion if tight
  let suggestion: string | undefined;
  if (!willFinish) {
    const deficit = daysNeeded - daysAvailable;
    if (deficit <= 3) suggestion = 'Add 1–2 more study days per week to finish on time.';
    else if (deficit <= 7) suggestion = 'Reduce revision days or increase daily capacity.';
    else suggestion = 'Remove some items or push the exam date further.';
  }
  if (message) suggestion = message;

  return {
    tasks,
    stats: { totalWeight, daysNeeded, daysAvailable, willFinish, reviewCount, suggestion },
  };
}