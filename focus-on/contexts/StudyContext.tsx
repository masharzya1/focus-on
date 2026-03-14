import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, Subject, StudySession, StudyPlan, AppSettings, AppBlockRoutine } from '@/types/study';
import { DEFAULT_SETTINGS } from '@/types/study';

const STORAGE_KEY = 'focuson_data_v3';

const defaultState: AppState = {
  subjects: [], sessions: [], studyPlans: [], blockRoutines: [],
  settings: DEFAULT_SETTINGS, streak: 0, xp: 0, level: 1,
  totalTopicsCompleted: 0, todaySessionsCompleted: 0,
  onboardingCompleted: false,
};

async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { ...defaultState, ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } };
    }
    // Migrate v2
    const old = await AsyncStorage.getItem('focuson_data_v2');
    if (old) {
      const p = JSON.parse(old);
      return { ...defaultState, ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings }, onboardingCompleted: true };
    }
  } catch {}
  return defaultState;
}

async function saveState(s: AppState) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

interface StudyContextValue {
  state: AppState; ready: boolean;
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
  updateSettings: (s: Partial<AppSettings>) => void;
  gainXp: (amount: number) => { newLevel: number; isLevelUp: boolean };
  completeOnboarding: () => void;
  getTodayMinutes: () => number;
  getStreak: () => number;
  getSubjectProgress: (subjectId: string) => number;
  getTodayPlanTasks: () => { planId: string; taskId: string; topicId: string; subjectId: string; chapterId: string; estimatedMinutes: number; type: 'study'|'revision'; completed: boolean; startTime?: string; endTime?: string }[];
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    loadState().then(s => { setState(s); setReady(true); isFirstLoad.current = false; });
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state]);

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

  const addSubject = useCallback((s: Subject) => setState(p => ({ ...p, subjects: [...p.subjects, s] })), []);
  const updateSubject = useCallback((s: Subject) => setState(p => ({ ...p, subjects: p.subjects.map(x => x.id === s.id ? s : x) })), []);
  const deleteSubject = useCallback((id: string) => setState(p => ({ ...p, subjects: p.subjects.filter(s => s.id !== id) })), []);

  const toggleTopicComplete = useCallback((subjectId: string, chapterId: string, topicId: string): boolean => {
    let wasCompleted = false;
    setState(p => {
      const subjects = p.subjects.map(s => {
        if (s.id !== subjectId) return s;
        return { ...s, chapters: s.chapters.map(c => {
          if (c.id !== chapterId) return c;
          return { ...c, topics: c.topics.map(t => {
            if (t.id !== topicId) return t;
            const nowCompleted = !t.completed;
            if (nowCompleted) wasCompleted = true;
            return { ...t, completed: nowCompleted, completedAt: nowCompleted ? new Date().toISOString() : undefined };
          })};
        })};
      });
      return { ...p, subjects, totalTopicsCompleted: wasCompleted ? p.totalTopicsCompleted + 1 : p.totalTopicsCompleted };
    });
    return wasCompleted;
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState(p => {
      const today = new Date().toISOString().split('T')[0];
      const isToday = p.todaySessionsDate === today;
      let ns = { ...p, sessions: [...p.sessions, session], todaySessionsCompleted: isToday ? p.todaySessionsCompleted + 1 : 1, todaySessionsDate: today };
      if (session.topicId) {
        ns = { ...ns, studyPlans: ns.studyPlans.map(plan => ({ ...plan, tasks: plan.tasks.map(t => t.topicId === session.topicId && !t.completed ? { ...t, completed: true } : t) })) };
      }
      return ns;
    });
  }, []);

  const addStudyPlan = useCallback((p: StudyPlan) => setState(s => ({ ...s, studyPlans: [...s.studyPlans, p] })), []);
  const updateStudyPlan = useCallback((p: StudyPlan) => setState(s => ({ ...s, studyPlans: s.studyPlans.map(x => x.id === p.id ? p : x) })), []);
  const deleteStudyPlan = useCallback((id: string) => setState(p => ({ ...p, studyPlans: p.studyPlans.filter(pl => pl.id !== id) })), []);
  const completePlanTask = useCallback((taskId: string) => {
    setState(p => ({ ...p, studyPlans: p.studyPlans.map(plan => ({ ...plan, tasks: plan.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t) })) }));
  }, []);

  const addBlockRoutine = useCallback((r: AppBlockRoutine) => setState(p => ({ ...p, blockRoutines: [...p.blockRoutines, r] })), []);
  const updateBlockRoutine = useCallback((r: AppBlockRoutine) => setState(p => ({ ...p, blockRoutines: p.blockRoutines.map(x => x.id === r.id ? r : x) })), []);
  const deleteBlockRoutine = useCallback((id: string) => setState(p => ({ ...p, blockRoutines: p.blockRoutines.filter(r => r.id !== id) })), []);
  const updateSettings = useCallback((s: Partial<AppSettings>) => setState(p => ({ ...p, settings: { ...p.settings, ...s } })), []);

  const gainXp = useCallback((amount: number): { newLevel: number; isLevelUp: boolean } => {
    let result = { newLevel: 1, isLevelUp: false };
    setState(p => {
      const newXp = p.xp + amount;
      let remaining = newXp, lvl = 1;
      while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
      const isLevelUp = lvl > p.level;
      result = { newLevel: lvl, isLevelUp };
      return { ...p, xp: newXp, level: lvl };
    });
    return result;
  }, []);

  const completeOnboarding = useCallback(() => setState(p => ({ ...p, onboardingCompleted: true })), []);

  const getTodayMinutes = useCallback((): number => {
    const today = new Date().toISOString().split('T')[0];
    return state.sessions.filter(s => s.completed && s.startTime.startsWith(today)).reduce((sum, s) => sum + s.durationMinutes, 0);
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
        result.push({ planId: plan.id, taskId: task.id, topicId: task.topicId, subjectId: task.subjectId, chapterId: task.chapterId, estimatedMinutes: task.estimatedMinutes, type: task.type, completed: task.completed, startTime: task.startTime, endTime: task.endTime });
      });
    });
    return result;
  }, [state.studyPlans]);

  return (
    <StudyContext.Provider value={{
      state, ready,
      addSubject, updateSubject, deleteSubject, toggleTopicComplete,
      addSession, addStudyPlan, updateStudyPlan, deleteStudyPlan, completePlanTask,
      addBlockRoutine, updateBlockRoutine, deleteBlockRoutine,
      updateSettings, gainXp, completeOnboarding,
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
