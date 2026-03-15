export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  chapters: Chapter[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  topics: Topic[];       // empty = chapter itself is the completable unit
  completed?: boolean;   // used when no topics
  completedAt?: string;
  priority: 'low' | 'medium' | 'high';
}

// Chapter has no sub-topics → chapter itself is the todo
export function isChapterOnly(chapter: Chapter): boolean {
  return chapter.topics.length === 0;
}

// Subject is topic-based if ANY chapter has topics
export function isSubjectTopicBased(subject: Subject): boolean {
  return subject.chapters.some(ch => ch.topics.length > 0);
}

// Subject progress:
// topic-based → % of topics completed
// chapter-only → % of chapters completed
export function getSubjectProgressValue(subject: Subject): number {
  const topicBased = isSubjectTopicBased(subject);
  if (topicBased) {
    const all  = subject.chapters.flatMap(c => c.topics);
    if (all.length === 0) return 0;
    return Math.round(all.filter(t => t.completed).length / all.length * 100);
  } else {
    if (subject.chapters.length === 0) return 0;
    return Math.round(subject.chapters.filter(c => c.completed).length / subject.chapters.length * 100);
  }
}

export interface Topic {
  id: string;
  chapterId: string;
  subjectId: string;
  name: string;
  difficulty: number;
  completed: boolean;
  completedAt?: string;
  notes: string;
  revisionDates: string[];
}

export interface StudySession {
  id: string;
  topicId?: string;
  subjectId?: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  type: 'focus' | 'break' | 'revision';
  completed: boolean;
  distractionCount?: number;
  focusScore?: number;
}

export interface StudyPlan {
  id: string;
  examDate: string;
  examName: string;
  subjects: string[];
  dailyCount: number;      // how many topics/chapters per day
  studyDays: number[];     // 0=Sun ... 6=Sat
  revisionDays: number;    // days before exam kept for revision
  createdAt: string;
  tasks: PlannedTask[];
  blockApps: boolean;
  hardBlock: boolean;
  deviceAdmin: boolean;
  blockedApps: string[];
}

export interface PlannedTask {
  id: string;
  date: string;            // YYYY-MM-DD
  startTime?: string;      // set by user in daily routine
  endTime?: string;
  topicId: string;         // topicId OR chapterId for chapter-only
  subjectId: string;
  chapterId: string;
  completed: boolean;
  type: 'study' | 'revision';
  estimatedMinutes?: number; // optional - used by timer
}

// Active task — what should be studied right now
export interface ActiveTask {
  planId: string;
  taskId: string;
  topicId: string;
  subjectId: string;
  chapterId: string;
  startTime?: string;
  endTime?: string;
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
  topicName: string;
  isChapterOnly: boolean;
  estimatedMinutes: number;
  blockApps: boolean;
  hardBlock: boolean;
  deviceAdmin: boolean;
}

export interface AppTimeLimit {
  id: string;
  packageName: string;
  appName: string;
  limitMinutes: number;
  enabled: boolean;
}

export interface AppBlockRoutine {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: number[];
  blockedApps: string[];
  blockShorts: boolean;
  enabled: boolean;
  hardBlock?: boolean;
  deviceAdmin?: boolean;
  fromPlanId?: string;
  emergencyUnlockCount?: number;
  maxEmergencyUnlocks?: number;
  emergencyPassword?: string;
  lastUnlockDate?: string;
}

export interface AppSettings {
  pomodoroFocus: number;
  pomodoroBreak: number;
  dailyGoalMinutes: number;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  focusGuardEnabled: boolean;
}

export interface AppState {
  subjects: Subject[];
  sessions: StudySession[];
  studyPlans: StudyPlan[];
  blockRoutines: AppBlockRoutine[];
  timeLimits: AppTimeLimit[];
  settings: AppSettings;
  streak: number;
  lastStudyDate?: string;
  xp: number;
  level: number;
  totalTopicsCompleted: number;
  todaySessionsCompleted: number;
  todaySessionsDate?: string;
  onboardingCompleted: boolean;
  acceptanceRecords: { date: string; scheduled: number; completed: number }[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  dailyGoalMinutes: 120,
  theme: 'light',
  soundEnabled: true,
  focusGuardEnabled: true,
};

export const SUBJECT_COLORS = [
  '#6C63FF','#3B82F6','#10B981','#F59E0B',
  '#EF4444','#EC4899','#06B6D4','#84CC16',
];

export const SUBJECT_ICONS = [
  'book-outline','calculator-outline','flask-outline','globe-outline',
  'laptop-outline','color-palette-outline','musical-notes-outline',
  'leaf-outline','pulse-outline','planet-outline','school-outline',
  'code-slash-outline',
];