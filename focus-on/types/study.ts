export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  topicBased: boolean;
  chapters: Chapter[];
  createdAt: string;
}

export interface ChapterTodo {
  id: string;
  text: string;
  completed: boolean;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  topics: Topic[];
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  todos?: ChapterTodo[];
}

export interface Topic {
  id: string;
  chapterId: string;
  subjectId: string;
  name: string;
  difficulty: number;
  estimatedMinutes: number;
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
  dailyHours: number;
  createdAt: string;
  tasks: PlannedTask[];
  blockApps: boolean;
  hardBlock: boolean;
  deviceAdmin: boolean;
  blockedApps: string[];
}

export interface PlannedTask {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  topicId: string;
  subjectId: string;
  chapterId: string;
  estimatedMinutes: number;
  completed: boolean;
  type: 'study' | 'revision';
}

// Active task — returned by getActiveNowTask()
export interface ActiveTask {
  planId: string;
  taskId: string;
  topicId: string;
  subjectId: string;
  chapterId: string;
  estimatedMinutes: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
  topicName: string;       // topic name OR chapter name for chapter-only subjects
  isChapterOnly: boolean;
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
  // Emergency override settings
  emergencyUnlockCount?: number;   // how many times unlocked today
  maxEmergencyUnlocks?: number;    // default 3
  emergencyPassword?: string;      // optional PIN/password
  lastUnlockDate?: string;         // YYYY-MM-DD, to reset daily count
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
