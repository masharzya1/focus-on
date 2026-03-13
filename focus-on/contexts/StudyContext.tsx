import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, Subject, StudySession, StudyPlan, AppSettings, AppBlockRoutine } from '@/types/study';
import { DEFAULT_SETTINGS } from '@/types/study';

const STORAGE_KEY = 'focuson_data_v2';

const defaultState: AppState = {
  subjects: [],
  sessions: [],
  studyPlans: [],
  blockRoutines: [],
  settings: DEFAULT_SETTINGS,
  streak: 0,
  xp: 0,
  level: 1,
  totalTopicsCompleted: 0,
  todaySessionsCompleted: 0,
};

async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
    }
  } catch {}
  return defaultState;
}

async function saveState(state: AppState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ── Context interface ────────────────────────────────────────────────────────
interface StudyContextValue {
  state: AppState;
  ready: boolean;
  // Subjects
  addSubject: (s: Subject) => void;
  updateSubject: (s: Subject) => void;
  deleteSubject: (id: string) => void;
  // Topics
  toggleTopicComplete: (subjectId: string, chapterId: string, topicId: string) => boolean;
  // Sessions
  addSession: (s: StudySession) => void;
  // Plans
  addStudyPlan: (p: StudyPlan) => void;
  deleteStudyPlan: (id: string) => void;
  completePlanTask: (taskId: string) => void;
  // Block Routines
  addBlockRoutine: (r: AppBlockRoutine) => void;
  updateBlockRoutine: (r: AppBlockRoutine) => void;
  deleteBlockRoutine: (id: string) => void;
  // Settings
  updateSettings: (s: Partial<AppSettings>) => void;
  // XP
  gainXp: (amount: number) => { newLevel: number; isLevelUp: boolean };
  // Computed
  getTodayMinutes: () => number;
  getStreak: () => number;
  getSubjectProgress: (subjectId: string) => number;
  getTodayPlanTasks: () => { planId: string; taskId: string; topicId: string; subjectId: string; estimatedMinutes: number; type: 'study'|'revision'; completed: boolean }[];
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Load on mount
  useEffect(() => {
    loadState().then(s => {
      setState(s);
      setReady(true);
      isFirstLoad.current = false;
    });
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state]);

  // Auto streak update
  useEffect(() => {
    if (!ready) return;
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = state.sessions.filter(s => s.completed && s.startTime.startsWith(today));
    if (todaySessions.length > 0 && state.lastStudyDate !== today) {
      setState(prev => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = prev.lastStudyDate === yesterday ? prev.streak + 1 : 1;
        return { ...prev, streak: newStreak, lastStudyDate: today };
      });
    }
  }, [state.sessions, ready]);

  const addSubject = useCallback((subject: Subject) => {
    setState(p => ({ ...p, subjects: [...p.subjects, subject] }));
  }, []);

  const updateSubject = useCallback((subject: Subject) => {
    setState(p => ({ ...p, subjects: p.subjects.map(s => s.id === subject.id ? subject : s) }));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setState(p => ({ ...p, subjects: p.subjects.filter(s => s.id !== id) }));
  }, []);

  const toggleTopicComplete = useCallback((subjectId: string, chapterId: string, topicId: string): boolean => {
    let wasCompleted = false;
    setState(p => {
      const subjects = p.subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id !== chapterId) return c;
            return {
              ...c,
              topics: c.topics.map(t => {
                if (t.id !== topicId) return t;
                const nowCompleted = !t.completed;
                if (nowCompleted) wasCompleted = true;
                return { ...t, completed: nowCompleted, completedAt: nowCompleted ? new Date().toISOString() : undefined };
              }),
            };
          }),
        };
      });
      const totalTopicsCompleted = wasCompleted ? p.totalTopicsCompleted + 1 : p.totalTopicsCompleted;
      return { ...p, subjects, totalTopicsCompleted };
    });
    return wasCompleted;
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState(p => {
      const today = new Date().toISOString().split('T')[0];
      const isToday = p.todaySessionsDate === today;
      let newState = {
        ...p,
        sessions: [...p.sessions, session],
        todaySessionsCompleted: isToday ? p.todaySessionsCompleted + 1 : 1,
        todaySessionsDate: today,
      };
      // Auto-complete plan task
      if (session.topicId) {
        newState = {
          ...newState,
          studyPlans: newState.studyPlans.map(plan => ({
            ...plan,
            tasks: plan.tasks.map(t =>
              t.topicId === session.topicId && !t.completed ? { ...t, completed: true } : t
            ),
          })),
        };
      }
      return newState;
    });
  }, []);

  const addStudyPlan = useCallback((plan: StudyPlan) => {
    setState(p => ({ ...p, studyPlans: [...p.studyPlans, plan] }));
  }, []);

  const deleteStudyPlan = useCallback((id: string) => {
    setState(p => ({ ...p, studyPlans: p.studyPlans.filter(pl => pl.id !== id) }));
  }, []);

  const completePlanTask = useCallback((taskId: string) => {
    setState(p => ({
      ...p,
      studyPlans: p.studyPlans.map(plan => ({
        ...plan,
        tasks: plan.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
      })),
    }));
  }, []);

  const addBlockRoutine = useCallback((r: AppBlockRoutine) => {
    setState(p => ({ ...p, blockRoutines: [...p.blockRoutines, r] }));
  }, []);

  const updateBlockRoutine = useCallback((r: AppBlockRoutine) => {
    setState(p => ({ ...p, blockRoutines: p.blockRoutines.map(x => x.id === r.id ? r : x) }));
  }, []);

  const deleteBlockRoutine = useCallback((id: string) => {
    setState(p => ({ ...p, blockRoutines: p.blockRoutines.filter(r => r.id !== id) }));
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setState(p => ({ ...p, settings: { ...p.settings, ...s } }));
  }, []);

  const gainXp = useCallback((amount: number): { newLevel: number; isLevelUp: boolean } => {
    let result = { newLevel: 1, isLevelUp: false };
    setState(p => {
      const newXp = p.xp + amount;
      const xpPerLevel = (l: number) => l * 100;
      let remaining = newXp;
      let lvl = 1;
      while (remaining >= xpPerLevel(lvl)) { remaining -= xpPerLevel(lvl); lvl++; }
      const isLevelUp = lvl > p.level;
      result = { newLevel: lvl, isLevelUp };
      return { ...p, xp: newXp, level: lvl };
    });
    return result;
  }, []);

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
    const result: { planId: string; taskId: string; topicId: string; subjectId: string; estimatedMinutes: number; type: 'study'|'revision'; completed: boolean }[] = [];
    state.studyPlans.forEach(plan => {
      plan.tasks.filter(t => t.date === today).forEach(task => {
        result.push({ planId: plan.id, taskId: task.id, topicId: task.topicId, subjectId: task.subjectId, estimatedMinutes: task.estimatedMinutes, type: task.type, completed: task.completed });
      });
    });
    return result;
  }, [state.studyPlans]);

  return (
    <StudyContext.Provider value={{
      state, ready,
      addSubject, updateSubject, deleteSubject, toggleTopicComplete,
      addSession, addStudyPlan, deleteStudyPlan, completePlanTask,
      addBlockRoutine, updateBlockRoutine, deleteBlockRoutine,
      updateSettings, gainXp,
      getTodayMinutes, getStreak, getSubjectProgress, getTodayPlanTasks,
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used inside StudyProvider');
  return ctx;
}
