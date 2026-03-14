import React, {
  createContext, useContext, useEffect, useReducer, useRef, useCallback,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppState, Subject, StudySession,
  StudyPlan, AppSettings, AppBlockRoutine, AppTimeLimit,
} from '@/types/study';
import { DEFAULT_SETTINGS } from '@/types/study';
import AppBlocking from '@/modules/AppBlocking';

const STORAGE_KEY = 'focuson_data_v3';

// ── Default state ─────────────────────────────────────────────────────────────
const defaultState: AppState & {
  lastStudyDate?: string;
  todaySessionsDate?: string;
} = {
  subjects: [],
  sessions: [],
  studyPlans: [],
  blockRoutines: [],
  timeLimits: [],
  settings: DEFAULT_SETTINGS,
  streak: 0,
  xp: 0,
  level: 1,
  totalTopicsCompleted: 0,
  todaySessionsCompleted: 0,
  onboardingCompleted: false,
  lastStudyDate: undefined,
  todaySessionsDate: undefined,
};

type State = typeof defaultState;

// ── Actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: 'HYDRATE'; payload: Partial<State> }
  | { type: 'ADD_SUBJECT'; payload: Subject }
  | { type: 'UPDATE_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SUBJECT'; payload: string }
  | { type: 'TOGGLE_TOPIC'; payload: { subjectId: string; chapterId: string; topicId: string } }
  | { type: 'ADD_SESSION'; payload: StudySession }
  | { type: 'ADD_PLAN'; payload: StudyPlan }
  | { type: 'UPDATE_PLAN'; payload: StudyPlan }
  | { type: 'DELETE_PLAN'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: string }
  | { type: 'ADD_ROUTINE'; payload: AppBlockRoutine }
  | { type: 'UPDATE_ROUTINE'; payload: AppBlockRoutine }
  | { type: 'DELETE_ROUTINE'; payload: string }
  | { type: 'ADD_TIME_LIMIT'; payload: AppTimeLimit }
  | { type: 'UPDATE_TIME_LIMIT'; payload: AppTimeLimit }
  | { type: 'DELETE_TIME_LIMIT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'GAIN_XP'; payload: number }
  | { type: 'COMPLETE_ONBOARDING' };

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state: State, action: Action): State {
  switch (action.type) {

    case 'HYDRATE':
      return { ...state, ...action.payload };

    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, action.payload] };

    case 'UPDATE_SUBJECT':
      return { ...state, subjects: state.subjects.map(s => s.id === action.payload.id ? action.payload : s) };

    case 'DELETE_SUBJECT':
      return { ...state, subjects: state.subjects.filter(s => s.id !== action.payload) };

    case 'TOGGLE_TOPIC': {
      const { subjectId, chapterId, topicId } = action.payload;
      let didComplete = false;
      const subjects = state.subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s, chapters: s.chapters.map(c => {
            if (c.id !== chapterId) return c;
            return {
              ...c, topics: c.topics.map(t => {
                if (t.id !== topicId) return t;
                const nowCompleted = !t.completed;
                if (nowCompleted) didComplete = true;
                return { ...t, completed: nowCompleted, completedAt: nowCompleted ? new Date().toISOString() : undefined };
              }),
            };
          }),
        };
      });
      return {
        ...state,
        subjects,
        totalTopicsCompleted: didComplete ? state.totalTopicsCompleted + 1 : state.totalTopicsCompleted,
      };
    }

    case 'ADD_SESSION': {
      const session = action.payload;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = state.lastStudyDate === today ? state.streak
        : state.lastStudyDate === yesterday ? state.streak + 1 : 1;

      let studyPlans = state.studyPlans;
      if (session.topicId) {
        studyPlans = studyPlans.map(plan => ({
          ...plan,
          tasks: plan.tasks.map(t =>
            t.topicId === session.topicId && !t.completed ? { ...t, completed: true } : t,
          ),
        }));
      }
      return {
        ...state,
        sessions: [...state.sessions, session],
        studyPlans,
        todaySessionsCompleted: state.todaySessionsDate === today ? state.todaySessionsCompleted + 1 : 1,
        todaySessionsDate: today,
        streak: newStreak,
        lastStudyDate: today,
      };
    }

    case 'ADD_PLAN':
      return { ...state, studyPlans: [...state.studyPlans, action.payload] };

    case 'UPDATE_PLAN':
      return { ...state, studyPlans: state.studyPlans.map(p => p.id === action.payload.id ? action.payload : p) };

    case 'DELETE_PLAN':
      return { ...state, studyPlans: state.studyPlans.filter(p => p.id !== action.payload) };

    case 'COMPLETE_TASK':
      return {
        ...state,
        studyPlans: state.studyPlans.map(plan => ({
          ...plan,
          tasks: plan.tasks.map(t => t.id === action.payload ? { ...t, completed: true } : t),
        })),
      };

    case 'ADD_ROUTINE':
      return { ...state, blockRoutines: [...state.blockRoutines, action.payload] };

    case 'UPDATE_ROUTINE':
      return { ...state, blockRoutines: state.blockRoutines.map(r => r.id === action.payload.id ? action.payload : r) };

    case 'DELETE_ROUTINE':
      return { ...state, blockRoutines: state.blockRoutines.filter(r => r.id !== action.payload) };

    case 'ADD_TIME_LIMIT':
      return { ...state, timeLimits: [...(state.timeLimits || []), action.payload] };
    case 'UPDATE_TIME_LIMIT':
      return { ...state, timeLimits: (state.timeLimits || []).map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TIME_LIMIT':
      return { ...state, timeLimits: (state.timeLimits || []).filter(t => t.id !== action.payload) };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'GAIN_XP': {
      const newXp = state.xp + action.payload;
      let remaining = newXp, lvl = 1;
      while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
      return { ...state, xp: newXp, level: lvl };
    }

    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingCompleted: true };

    default:
      return state;
  }
}

// ── Context type ──────────────────────────────────────────────────────────────
interface StudyContextValue {
  state: AppState;
  ready: boolean;
  addSubject: (s: Subject) => void;
  updateSubject: (s: Subject) => void;
  deleteSubject: (id: string) => void;
  toggleTopicComplete: (subjectId: string, chapterId: string, topicId: string) => boolean;
  addSession: (s: StudySession) => void;
  addStudyPlan: (p: StudyPlan) => void;
  updateStudyPlan: (p: StudyPlan) => void;
  deleteStudyPlan: (id: string) => void;
  completePlanTask: (taskId: string) => void;
  addBlockRoutine: (r: AppBlockRoutine) => void;
  updateBlockRoutine: (r: AppBlockRoutine) => void;
  deleteBlockRoutine: (id: string) => void;
  addTimeLimit: (t: AppTimeLimit) => void;
  updateTimeLimit: (t: AppTimeLimit) => void;
  deleteTimeLimit: (id: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  gainXp: (amount: number) => { newLevel: number; isLevelUp: boolean };
  completeOnboarding: () => void;
  getTodayMinutes: () => number;
  getStreak: () => number;
  getSubjectProgress: (subjectId: string) => number;
  getTodayPlanTasks: () => {
    planId: string; taskId: string; topicId: string;
    subjectId: string; chapterId: string;
    estimatedMinutes: number; type: 'study' | 'revision';
    completed: boolean; startTime?: string; endTime?: string;
  }[];
}

const StudyContext = createContext<StudyContextValue | null>(null);

// ── Storage helpers ───────────────────────────────────────────────────────────
// Web এ localStorage, native এ AsyncStorage।
// localStorage কে AsyncStorage এর মতো wrap করা হয়েছে।
const store = Platform.OS === 'web'
  ? {
      getItem: async (key: string) => {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, value);
      },
    }
  : {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    };

// ── Provider ──────────────────────────────────────────────────────────────────
export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [ready, setReady] = React.useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from storage on mount
  useEffect(() => {
    store.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            dispatch({ type: 'HYDRATE', payload: { ...defaultState, ...saved, settings: { ...DEFAULT_SETTINGS, ...saved?.settings } } });
          } catch {
            // corrupt data — start fresh
          }
        }
      })
      .catch(() => {/* storage unavailable — start fresh */})
      .finally(() => setReady(true));
  }, []);

  // Debounced save to storage on every state change
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      store.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
      // Sync time limits to native layer
      if (state.timeLimits && state.timeLimits.length >= 0) {
        AppBlocking.saveTimeLimits(
          state.timeLimits.map(t => ({
            packageName: t.packageName,
            limitMinutes: t.limitMinutes,
            enabled: t.enabled,
          }))
        );
      }
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, ready]);

  // ── Action wrappers ─────────────────────────────────────────────────────────
  const addSubject = useCallback((s: Subject) => dispatch({ type: 'ADD_SUBJECT', payload: s }), []);
  const updateSubject = useCallback((s: Subject) => dispatch({ type: 'UPDATE_SUBJECT', payload: s }), []);
  const deleteSubject = useCallback((id: string) => dispatch({ type: 'DELETE_SUBJECT', payload: id }), []);

  const toggleTopicComplete = useCallback((subjectId: string, chapterId: string, topicId: string): boolean => {
    const subject = state.subjects.find(s => s.id === subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    const topic = chapter?.topics.find(t => t.id === topicId);
    const willComplete = topic ? !topic.completed : false;
    dispatch({ type: 'TOGGLE_TOPIC', payload: { subjectId, chapterId, topicId } });
    return willComplete;
  }, [state.subjects]);

  const addSession = useCallback((s: StudySession) => dispatch({ type: 'ADD_SESSION', payload: s }), []);
  const addStudyPlan = useCallback((p: StudyPlan) => dispatch({ type: 'ADD_PLAN', payload: p }), []);
  const updateStudyPlan = useCallback((p: StudyPlan) => dispatch({ type: 'UPDATE_PLAN', payload: p }), []);
  const deleteStudyPlan = useCallback((id: string) => dispatch({ type: 'DELETE_PLAN', payload: id }), []);
  const completePlanTask = useCallback((taskId: string) => dispatch({ type: 'COMPLETE_TASK', payload: taskId }), []);
  const addBlockRoutine = useCallback((r: AppBlockRoutine) => dispatch({ type: 'ADD_ROUTINE', payload: r }), []);
  const updateBlockRoutine = useCallback((r: AppBlockRoutine) => dispatch({ type: 'UPDATE_ROUTINE', payload: r }), []);
  const deleteBlockRoutine = useCallback((id: string) => dispatch({ type: 'DELETE_ROUTINE', payload: id }), []);
  const addTimeLimit = useCallback((t: AppTimeLimit) => dispatch({ type: 'ADD_TIME_LIMIT', payload: t }), []);
  const updateTimeLimit = useCallback((t: AppTimeLimit) => dispatch({ type: 'UPDATE_TIME_LIMIT', payload: t }), []);
  const deleteTimeLimit = useCallback((id: string) => dispatch({ type: 'DELETE_TIME_LIMIT', payload: id }), []);
  const updateSettings = useCallback((s: Partial<AppSettings>) => dispatch({ type: 'UPDATE_SETTINGS', payload: s }), []);

  const gainXp = useCallback((amount: number): { newLevel: number; isLevelUp: boolean } => {
    const newXp = state.xp + amount;
    let remaining = newXp, lvl = 1;
    while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
    dispatch({ type: 'GAIN_XP', payload: amount });
    return { newLevel: lvl, isLevelUp: lvl > state.level };
  }, [state.xp, state.level]);

  const completeOnboarding = useCallback(() => dispatch({ type: 'COMPLETE_ONBOARDING' }), []);

  // ── Computed helpers ────────────────────────────────────────────────────────
  const getTodayMinutes = useCallback((): number => {
    const today = new Date().toISOString().split('T')[0];
    return state.sessions
      .filter(s => s.completed && s.startTime.startsWith(today))
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [state.sessions]);

  const getStreak = useCallback((): number => state.streak, [state.streak]);

  const getSubjectProgress = useCallback((subjectId: string): number => {
    const s = state.subjects.find(x => x.id === subjectId);
    if (!s) return 0;
    const topics = s.chapters.flatMap(c => c.topics);
    if (topics.length === 0) return 0;
    return Math.round((topics.filter(t => t.completed).length / topics.length) * 100);
  }, [state.subjects]);

  const getTodayPlanTasks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const result: any[] = [];
    state.studyPlans.forEach(plan => {
      plan.tasks.filter(t => t.date === today).forEach(task => {
        result.push({
          planId: plan.id, taskId: task.id, topicId: task.topicId,
          subjectId: task.subjectId, chapterId: task.chapterId,
          estimatedMinutes: task.estimatedMinutes, type: task.type,
          completed: task.completed, startTime: task.startTime, endTime: task.endTime,
        });
      });
    });
    return result;
  }, [state.studyPlans]);

  return (
    <StudyContext.Provider value={{
      state: state as AppState,
      ready,
      addSubject, updateSubject, deleteSubject,
      toggleTopicComplete,
      addSession,
      addStudyPlan, updateStudyPlan, deleteStudyPlan, completePlanTask,
      addBlockRoutine, updateBlockRoutine, deleteBlockRoutine,
      addTimeLimit, updateTimeLimit, deleteTimeLimit,
      updateSettings,
      gainXp,
      completeOnboarding,
      getTodayMinutes, getStreak, getSubjectProgress, getTodayPlanTasks,
    }}>
      {children}
    </StudyContext.Provider>
  );
}

// ── useStudy — drop-in replacement ───────────────────────────────────────────
export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used inside <StudyProvider>');
  return ctx;
}