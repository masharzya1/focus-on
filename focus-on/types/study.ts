export interface Subject {
  id: string;
  name: string;
  color: string;   // e.g. "220 15% 25%"
  icon: string;    // icon name
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
}

export interface PlannedTask {
  id: string;
  date: string;
  topicId: string;
  subjectId: string;
  estimatedMinutes: number;
  completed: boolean;
  type: 'study' | 'revision';
}

export interface DifficultyLevel {
  id: number;
  label: string;
  minutes: number;
}

export interface AppBlockRoutine {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: number[];          // 0=Sun … 6=Sat, [] = every day
  blockedApps: string[];   // package names
  blockShorts: boolean;    // block Reels/Shorts/TikTok content
  enabled: boolean;
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
}

export const DEFAULT_DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { id: 1, label: 'Very Easy', minutes: 15 },
  { id: 2, label: 'Easy',      minutes: 25 },
  { id: 3, label: 'Medium',    minutes: 35 },
  { id: 4, label: 'Hard',      minutes: 50 },
  { id: 5, label: 'Very Hard', minutes: 60 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  dailyGoalMinutes: 120,
  theme: 'light',
  soundEnabled: true,
  focusGuardEnabled: true,
};

export const SUBJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

export const SUBJECT_ICONS = [
  'book-open', 'calculator', 'flask', 'globe',
  'laptop', 'palette', 'pencil', 'music',
  'atom', 'brain',
];
