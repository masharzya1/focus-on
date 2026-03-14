export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  topicBased: boolean;
  chapters: Chapter[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  topics: Topic[];
  priority: 'low' | 'medium' | 'high';
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
  // Blocking options (plan-level)
  blockApps: boolean;
  hardBlock: boolean;   // can't unblock from inside app
  deviceAdmin: boolean; // can't uninstall without removing admin
  blockedApps: string[];
}

export interface PlannedTask {
  id: string;
  date: string;        // YYYY-MM-DD
  startTime?: string;  // HH:MM
  endTime?: string;    // HH:MM
  topicId: string;
  subjectId: string;
  chapterId: string;
  estimatedMinutes: number;
  completed: boolean;
  type: 'study' | 'revision';
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
