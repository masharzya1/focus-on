import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, Subject, StudySession, StudyPlan, AppSettings, AppBlockRoutine } from '@/types/study';
import { DEFAULT_SETTINGS } from '@/types/study';
<<<<<<< HEAD

const STORAGE_KEY = 'focuson_data_v3';

const defaultState: AppState = {
  subjects: [], sessions: [], studyPlans: [], blockRoutines: [],
  settings: DEFAULT_SETTINGS, streak: 0, xp: 0, level: 1,
  totalTopicsCompleted: 0, todaySessionsCompleted: 0,
  onboardingCompleted: false,
=======
import { syncToFirestore, loadFromFirestore } from '@/services/sync';
import { setupAllNotifications } from '@/services/notifications';

const STORAGE_KEY = 'focuson_data_v2';
const TIMER_BLOCKED_APPS_KEY = 'focuson_timer_blocked_apps';
const TIMER_BLOCK_SHORTS_KEY = 'focuson_timer_block_shorts';

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
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
};

async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
<<<<<<< HEAD
      const p = JSON.parse(raw);
      return { ...defaultState, ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } };
    }
    // Migrate v2
    const old = await AsyncStorage.getItem('focuson_data_v2');
    if (old) {
      const p = JSON.parse(old);
      return { ...defaultState, ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings }, onboardingCompleted: true };
=======
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
    }
  } catch {}
  return defaultState;
}

<<<<<<< HEAD
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
=======
async function saveState(state: AppState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ── Context interface ─────────────────────────────────────────────────────────
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
  // Firebase sync
  syncWithFirebase: (uid: string) => Promise<void>;
  mergeFirebaseData: (uid: string) => Promise<void>;
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);
<<<<<<< HEAD

  useEffect(() => {
    loadState().then(s => { setState(s); setReady(true); isFirstLoad.current = false; });
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state]);

=======
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUid = useRef<string | null>(null);

  // Load on mount
  useEffect(() => {
    loadState().then(s => {
      setState(s);
      setReady(true);
      isFirstLoad.current = false;
    });
  }, []);

  // Auto-save locally + debounced Firebase sync
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveState(state);
      // Sync to Firebase if logged in
      if (currentUid.current) {
        if (syncTimer.current) clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => {
          if (currentUid.current) syncToFirestore(currentUid.current, state);
        }, 2000); // extra debounce for Firebase
      }
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  // Auto streak update
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
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

<<<<<<< HEAD
  const addSubject = useCallback((s: Subject) => setState(p => ({ ...p, subjects: [...p.subjects, s] })), []);
  const updateSubject = useCallback((s: Subject) => setState(p => ({ ...p, subjects: p.subjects.map(x => x.id === s.id ? s : x) })), []);
  const deleteSubject = useCallback((id: string) => setState(p => ({ ...p, subjects: p.subjects.filter(s => s.id !== id) })), []);
=======
  // Reschedule notifications when plans change
  useEffect(() => {
    if (!ready || state.studyPlans.length === 0) return;
    setupAllNotifications(
      state.studyPlans.map(p => ({ examName: p.examName, examDate: p.examDate }))
    );
  }, [state.studyPlans, ready]);

  // ── Firebase sync methods ──────────────────────────────────────────────────
  const syncWithFirebase = useCallback(async (uid: string) => {
    currentUid.current = uid;
    await syncToFirestore(uid, state);
  }, [state]);

  // Merge Firebase data with local (Firebase wins for isPro, local wins for content)
  const mergeFirebaseData = useCallback(async (uid: string) => {
    currentUid.current = uid;
    const remoteState = await loadFromFirestore(uid);
    if (!remoteState) {
      // First login — push local data to Firebase
      await syncToFirestore(uid, state);
      return;
    }
    // Merge: take whichever has more data
    setState(prev => {
      const merged: AppState = {
        ...prev,
        subjects: remoteState.subjects?.length >= prev.subjects.length
          ? remoteState.subjects : prev.subjects,
        sessions: remoteState.sessions?.length >= prev.sessions.length
          ? remoteState.sessions : prev.sessions,
        studyPlans: remoteState.studyPlans?.length >= prev.studyPlans.length
          ? remoteState.studyPlans : prev.studyPlans,
        blockRoutines: remoteState.blockRoutines?.length >= prev.blockRoutines.length
          ? remoteState.blockRoutines : prev.blockRoutines,
        xp: Math.max(prev.xp, remoteState.xp || 0),
        streak: Math.max(prev.streak, remoteState.streak || 0),
        level: Math.max(prev.level, remoteState.level || 1),
        totalTopicsCompleted: Math.max(prev.totalTopicsCompleted, remoteState.totalTopicsCompleted || 0),
        settings: { ...DEFAULT_SETTINGS, ...prev.settings },
      };
      return merged;
    });
  }, [state]);

  const addSubject = useCallback((subject: Subject) => {
    setState(p => ({ ...p, subjects: [...p.subjects, subject] }));
  }, []);

  const updateSubject = useCallback((subject: Subject) => {
    setState(p => ({ ...p, subjects: p.subjects.map(s => s.id === subject.id ? subject : s) }));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setState(p => ({ ...p, subjects: p.subjects.filter(s => s.id !== id) }));
  }, []);
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d

  const toggleTopicComplete = useCallback((subjectId: string, chapterId: string, topicId: string): boolean => {
    let wasCompleted = false;
    setState(p => {
      const subjects = p.subjects.map(s => {
        if (s.id !== subjectId) return s;
<<<<<<< HEAD
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
=======
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
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
    });
    return wasCompleted;
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState(p => {
      const today = new Date().toISOString().split('T')[0];
      const isToday = p.todaySessionsDate === today;
<<<<<<< HEAD
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
=======
      let newState = {
        ...p,
        sessions: [...p.sessions, session],
        todaySessionsCompleted: isToday ? p.todaySessionsCompleted + 1 : 1,
        todaySessionsDate: today,
      };
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
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d

  const gainXp = useCallback((amount: number): { newLevel: number; isLevelUp: boolean } => {
    let result = { newLevel: 1, isLevelUp: false };
    setState(p => {
      const newXp = p.xp + amount;
<<<<<<< HEAD
      let remaining = newXp, lvl = 1;
      while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
=======
      const xpPerLevel = (l: number) => l * 100;
      let remaining = newXp;
      let lvl = 1;
      while (remaining >= xpPerLevel(lvl)) { remaining -= xpPerLevel(lvl); lvl++; }
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
      const isLevelUp = lvl > p.level;
      result = { newLevel: lvl, isLevelUp };
      return { ...p, xp: newXp, level: lvl };
    });
    return result;
  }, []);

<<<<<<< HEAD
  const completeOnboarding = useCallback(() => setState(p => ({ ...p, onboardingCompleted: true })), []);

  const getTodayMinutes = useCallback((): number => {
    const today = new Date().toISOString().split('T')[0];
    return state.sessions.filter(s => s.completed && s.startTime.startsWith(today)).reduce((sum, s) => sum + s.durationMinutes, 0);
=======
  const getTodayMinutes = useCallback((): number => {
    const today = new Date().toISOString().split('T')[0];
    return state.sessions
      .filter(s => s.completed && s.startTime.startsWith(today))
      .reduce((sum, s) => sum + s.durationMinutes, 0);
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
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
<<<<<<< HEAD
    const result: any[] = [];
    state.studyPlans.forEach(plan => {
      plan.tasks.filter(t => t.date === today).forEach(task => {
        result.push({ planId: plan.id, taskId: task.id, topicId: task.topicId, subjectId: task.subjectId, chapterId: task.chapterId, estimatedMinutes: task.estimatedMinutes, type: task.type, completed: task.completed, startTime: task.startTime, endTime: task.endTime });
=======
    const result: { planId: string; taskId: string; topicId: string; subjectId: string; estimatedMinutes: number; type: 'study'|'revision'; completed: boolean }[] = [];
    state.studyPlans.forEach(plan => {
      plan.tasks.filter(t => t.date === today).forEach(task => {
        result.push({ planId: plan.id, taskId: task.id, topicId: task.topicId, subjectId: task.subjectId, estimatedMinutes: task.estimatedMinutes, type: task.type, completed: task.completed });
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
      });
    });
    return result;
  }, [state.studyPlans]);

  return (
    <StudyContext.Provider value={{
      state, ready,
      addSubject, updateSubject, deleteSubject, toggleTopicComplete,
<<<<<<< HEAD
      addSession, addStudyPlan, updateStudyPlan, deleteStudyPlan, completePlanTask,
      addBlockRoutine, updateBlockRoutine, deleteBlockRoutine,
      updateSettings, gainXp, completeOnboarding,
      getTodayMinutes, getStreak, getSubjectProgress, getTodayPlanTasks,
=======
      addSession, addStudyPlan, deleteStudyPlan, completePlanTask,
      addBlockRoutine, updateBlockRoutine, deleteBlockRoutine,
      updateSettings, gainXp,
      getTodayMinutes, getStreak, getSubjectProgress, getTodayPlanTasks,
      syncWithFirebase, mergeFirebaseData,
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
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
<<<<<<< HEAD
=======

// ── Timer blocked apps persistence ─────────────────────────────────────────
// These are stored separately so they persist across app restarts
export async function saveTimerBlockedApps(apps: string[], blockShorts: boolean): Promise<void> {
  await AsyncStorage.setItem(TIMER_BLOCKED_APPS_KEY, JSON.stringify(apps));
  await AsyncStorage.setItem(TIMER_BLOCK_SHORTS_KEY, JSON.stringify(blockShorts));
}

export async function loadTimerBlockedApps(): Promise<{ blockedApps: string[]; blockShorts: boolean }> {
  try {
    const appsRaw = await AsyncStorage.getItem(TIMER_BLOCKED_APPS_KEY);
    const shortsRaw = await AsyncStorage.getItem(TIMER_BLOCK_SHORTS_KEY);
    return {
      blockedApps: appsRaw ? JSON.parse(appsRaw) : [],
      blockShorts: shortsRaw ? JSON.parse(shortsRaw) : false,
    };
  } catch {
    return { blockedApps: [], blockShorts: false };
  }
}
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
