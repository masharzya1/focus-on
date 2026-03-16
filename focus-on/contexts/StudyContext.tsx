import React, {
  createContext, useContext, useEffect, useReducer, useRef, useCallback,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import type {
  AppState, Subject, StudySession,
  StudyPlan, AppSettings, AppBlockRoutine, AppTimeLimit, ActiveTask,
} from '@/types/study';
import {
  rescheduleMissedTasks, calculateAdaptiveCapacity,
  type AcceptanceRecord,
} from '@/utils/smartSchedule';
import { DEFAULT_SETTINGS } from '@/types/study';
import AppBlocking from '@/modules/AppBlocking';

const STORAGE_KEY = 'focuson_data_v3';
const SESSION_TOKEN_KEY = 'focuson_session_token';

// Generate a unique session token for this device
function generateSessionToken(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

let deviceSessionToken = '';
(async () => {
  try {
    const stored = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    if (stored) {
      deviceSessionToken = stored;
    } else {
      deviceSessionToken = generateSessionToken();
      await AsyncStorage.setItem(SESSION_TOKEN_KEY, deviceSessionToken);
    }
  } catch {}
})();

// ── Default state ─────────────────────────────────────────────────────────────
const defaultState: AppState & {
  lastStudyDate?: string;
  todaySessionsDate?: string;
  acceptanceRecords: AcceptanceRecord[];
  confirmedStudyingTasks: string[];
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
  acceptanceRecords: [] as AcceptanceRecord[],
  confirmedStudyingTasks: [] as string[],
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
  | { type: 'COMPLETE_TASK_AND_TOPIC'; payload: { taskId: string; subjectId: string; chapterId: string; topicId: string } }
  | { type: 'ADD_ROUTINE'; payload: AppBlockRoutine }
  | { type: 'UPDATE_ROUTINE'; payload: AppBlockRoutine }
  | { type: 'DELETE_ROUTINE'; payload: string }
  | { type: 'ADD_TIME_LIMIT'; payload: AppTimeLimit }
  | { type: 'UPDATE_TIME_LIMIT'; payload: AppTimeLimit }
  | { type: 'DELETE_TIME_LIMIT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'GAIN_XP'; payload: number }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESCHEDULE_MISSED'; payload: { planId: string; updatedTasks: any[] } }
  | { type: 'RECORD_ACCEPTANCE'; payload: AcceptanceRecord }
  | { type: 'CONFIRM_STUDYING'; payload: string };

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
      return {
        ...state,
        studyPlans: state.studyPlans.filter(p => p.id !== action.payload),
        // Also remove any auto-created block routines that belonged to this plan
        blockRoutines: state.blockRoutines.filter(r => (r as any).fromPlanId !== action.payload),
      };

    case 'COMPLETE_TASK':
      return {
        ...state,
        studyPlans: state.studyPlans.map(plan => ({
          ...plan,
          tasks: plan.tasks.map(t => t.id === action.payload ? { ...t, completed: true } : t),
        })),
      };

    // Complete both the plan task AND the topic/chapter in the subject
    case 'COMPLETE_TASK_AND_TOPIC': {
      const { taskId, subjectId, chapterId, topicId } = action.payload;

      // Mark plan task done
      const studyPlans = state.studyPlans.map(plan => ({
        ...plan,
        tasks: plan.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
      }));

      // Mark topic or chapter done based on structure
      let totalTopicsCompleted = state.totalTopicsCompleted;
      const subjects = state.subjects.map(subj => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          chapters: subj.chapters.map(ch => {
            if (ch.id !== chapterId) return ch;
            // Chapter-only (no topics) → mark chapter completed
            if (ch.topics.length === 0) {
              if (!ch.completed) totalTopicsCompleted += 1;
              return { ...ch, completed: true, completedAt: new Date().toISOString() };
            }
            // Topic-based → mark specific topic done
            return {
              ...ch,
              topics: ch.topics.map(t => {
                if (t.id !== topicId) return t;
                if (!t.completed) totalTopicsCompleted += 1;
                return { ...t, completed: true, completedAt: new Date().toISOString() };
              }),
            };
          }),
        };
      });

      return { ...state, studyPlans, subjects, totalTopicsCompleted };
    }

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

    case 'RESCHEDULE_MISSED':
      return {
        ...state,
        studyPlans: state.studyPlans.map(p =>
          p.id === action.payload.planId
            ? { ...p, tasks: action.payload.updatedTasks }
            : p
        ),
      };

    case 'CONFIRM_STUDYING':
      return {
        ...state,
        confirmedStudyingTasks: state.confirmedStudyingTasks
          ? [...state.confirmedStudyingTasks, action.payload]
          : [action.payload],
      };

    case 'RECORD_ACCEPTANCE': {
      const records = [...(state.acceptanceRecords || []), action.payload];
      // Keep only last 14 days
      const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
      return { ...state, acceptanceRecords: records.filter(r => r.date >= cutoff) };
    }

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
  completeTaskAndTopic: (taskId: string, subjectId: string, chapterId: string, topicId: string) => void;
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
  getActiveNowTask: () => ActiveTask | null;
  rescheduleMissedTasks: () => number;
  confirmStudying: (taskId: string) => void;
  isStudyingConfirmed: (taskId: string) => boolean;
  getAcceptanceRate: () => number;
  getAdaptiveSuggestion: (planId: string) => string | null;
}

const StudyContext = createContext<StudyContextValue | null>(null);

// ── Storage helpers ───────────────────────────────────────────────────────────
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


// ── Sanitize state for Firestore (remove undefined values) ───────────────────
function sanitizeForFirestore(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (obj !== null && typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) {
        clean[k] = null; // Firestore needs null, not undefined
      } else {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean;
  }
  return obj;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [ready, setReady] = React.useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const firestoreUnsub = useRef<(() => void) | null>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    store.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            dispatch({ type: 'HYDRATE', payload: { ...defaultState, ...saved, settings: { ...DEFAULT_SETTINGS, ...saved?.settings } } });
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      store.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
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
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state, ready]);

  // ── Firebase auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Register this device session — force signout other devices
        try {
          await setDoc(
            doc(db, 'users', user.uid, 'session', 'current'),
            { token: deviceSessionToken, updatedAt: serverTimestamp() },
            { merge: false }
          );
        } catch {}

        // Load data from Firestore on login — merge with local data
        try {
          const snap = await getDoc(doc(db, 'users', user.uid, 'data', 'app'));
          // Get current local state at the time of login
          const localSnapshot = await store.getItem(STORAGE_KEY); // use platform-aware store
          const local = localSnapshot ? JSON.parse(localSnapshot) : null;

          if (snap.exists()) {
            const cloud = snap.data();
            delete cloud.updatedAt;

            if (local) {
              // Merge: combine subjects, sessions, plans, routines from both
              // Use id-based dedup so nothing is lost from either device
              const mergeById = (a: any[], b: any[]): any[] => {
                const map = new Map<string, any>();
                (a ?? []).forEach((x: any) => map.set(x.id, x));
                (b ?? []).forEach((x: any) => map.set(x.id, x)); // cloud wins on conflict
                return Array.from(map.values());
              };

              const merged: Partial<State> = {
                ...defaultState,
                ...cloud,
                subjects:      mergeById(local.subjects ?? [], cloud.subjects ?? []),
                sessions:      mergeById(local.sessions ?? [], cloud.sessions ?? []),
                studyPlans:    mergeById(local.studyPlans ?? [], cloud.studyPlans ?? []),
                blockRoutines: mergeById(local.blockRoutines ?? [], cloud.blockRoutines ?? []),
                // Take the higher value for streak/xp/level
                streak: Math.max(local.streak ?? 0, cloud.streak ?? 0),
                xp:     Math.max(local.xp ?? 0, cloud.xp ?? 0),
                level:  Math.max(local.level ?? 1, cloud.level ?? 1),
                totalTopicsCompleted: Math.max(local.totalTopicsCompleted ?? 0, cloud.totalTopicsCompleted ?? 0),
                settings: { ...DEFAULT_SETTINGS, ...cloud.settings },
                onboardingCompleted: cloud.onboardingCompleted || local.onboardingCompleted,
              };
              dispatch({ type: 'HYDRATE', payload: merged });
              // Push merged result back to cloud so both devices are in sync
              try {
                await setDoc(
                  doc(db, 'users', user.uid, 'data', 'app'),
                  { ...sanitizeForFirestore(merged), updatedAt: serverTimestamp() },
                  { merge: true }
                );
              } catch {}
            } else {
              // No local data — just use cloud
              dispatch({ type: 'HYDRATE', payload: { ...defaultState, ...cloud, settings: { ...DEFAULT_SETTINGS, ...cloud?.settings } } });
            }
          } else if (local) {
            // No cloud data yet — local stays, then immediately push to cloud
            dispatch({ type: 'HYDRATE', payload: { ...defaultState, ...local, settings: { ...DEFAULT_SETTINGS, ...local?.settings } } });
            // Immediately upload local data to Firestore so other devices can see it
            try {
              await setDoc(
                doc(db, 'users', user.uid, 'data', 'app'),
                { ...sanitizeForFirestore(local), updatedAt: serverTimestamp() },
                { merge: true }
              );
              console.log('[Sync] Local data uploaded to Firestore on first login');
            } catch (e) {
              console.error('[Sync] Failed to upload local data on login:', e);
            }
          }
        } catch {}

        // Subscribe to real-time session invalidation (force signout other devices)
        if (firestoreUnsub.current) firestoreUnsub.current();
        firestoreUnsub.current = onSnapshot(
          doc(db, 'users', user.uid, 'session', 'current'),
          (snap) => {
            if (snap.exists()) {
              const token = snap.data()?.token;
              if (token && token !== deviceSessionToken) {
                // Another device logged in — sign out this device
                auth.signOut().catch(() => {});
              }
            }
          }
        );
      } else {
        // User signed out — stop syncing
        if (firestoreUnsub.current) { firestoreUnsub.current(); firestoreUnsub.current = null; }
      }
    });
    return () => { unsub(); if (firestoreUnsub.current) firestoreUnsub.current(); };
  }, []);

  // ── Sync state to Firestore (debounced, only when logged in) ───────────────
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready || !currentUser) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      try {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'data', 'app'),
          { ...sanitizeForFirestore(state), updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (e) {
        console.error('[Sync] Failed to write to Firestore:', e);
      } finally {
        isSyncing.current = false;
      }
    }, 2000); // 2s debounce — avoid too many writes
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [state, ready, currentUser]);

  // ── Auto-remove block routines whose task end time has passed ───────────────
  useEffect(() => {
    if (!ready) return;
    const now = new Date();
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    state.blockRoutines.forEach(routine => {
      if (!(routine as any).fromPlanId) return; // only auto-routines
      if (!routine.endTime) return;

      // Find the task this routine belongs to
      const taskId = routine.id.replace(`plan_${(routine as any).fromPlanId}_task_`, '');
      const task = state.studyPlans
        .find(p => p.id === (routine as any).fromPlanId)
        ?.tasks.find(t => t.id === taskId);

      if (!task) {
        // Task deleted → remove routine
        dispatch({ type: 'DELETE_ROUTINE', payload: routine.id });
        return;
      }

      // If task date is today and endTime has passed → remove routine
      if (task.date === todayStr && routine.endTime < nowStr) {
        dispatch({ type: 'DELETE_ROUTINE', payload: routine.id });
      }
      // If task date is in the past → remove routine
      if (task.date < todayStr) {
        dispatch({ type: 'DELETE_ROUTINE', payload: routine.id });
      }
    });
  }, [ready]); // runs once on mount — enough for cleanup

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

  const completeTaskAndTopic = useCallback((
    taskId: string, subjectId: string, chapterId: string, topicId: string
  ) => {
    dispatch({ type: 'COMPLETE_TASK_AND_TOPIC', payload: { taskId, subjectId, chapterId, topicId } });
  }, []);

  const rescheduleMissed = useCallback((): number => {
    let totalRescheduled = 0;
    state.studyPlans.forEach(plan => {
      if (plan.tasks.some(t => !t.completed && t.date < new Date().toISOString().split('T')[0])) {
        const { updatedTasks, rescheduledCount } = rescheduleMissedTasks(
          plan.tasks,
          plan.studyDays ?? [],
          plan.examDate,
          plan.revisionDays ?? 3,
        );
        if (rescheduledCount > 0) {
          dispatch({ type: 'RESCHEDULE_MISSED', payload: { planId: plan.id, updatedTasks } });
          totalRescheduled += rescheduledCount;
        }
      }
    });
    return totalRescheduled;
  }, [state.studyPlans]);

  const recordAcceptance = useCallback((date: string) => {
    const todayTasks = state.studyPlans
      .flatMap(p => p.tasks)
      .filter(t => t.date === date);
    if (todayTasks.length === 0) return;
    dispatch({
      type: 'RECORD_ACCEPTANCE',
      payload: {
        date,
        scheduled: todayTasks.length,
        completed: todayTasks.filter(t => t.completed).length,
      },
    });
  }, [state.studyPlans]);

  const getAcceptanceRate = useCallback((): number => {
    const records = state.acceptanceRecords || [];
    if (records.length < 3) return 1;
    const total = records.reduce((s: number, r: AcceptanceRecord) => s + r.scheduled, 0);
    const done  = records.reduce((s: number, r: AcceptanceRecord) => s + r.completed, 0);
    return total === 0 ? 1 : done / total;
  }, [state.acceptanceRecords]);

  const getAdaptiveSuggestion = useCallback((planId: string): string | null => {
    const plan = state.studyPlans.find(p => p.id === planId);
    if (!plan) return null;
    const records = state.acceptanceRecords || [];
    const { message } = calculateAdaptiveCapacity(plan.dailyCount, records);
    return message ?? null;
  }, [state.studyPlans, state.acceptanceRecords]);

  const confirmStudying = useCallback((taskId: string) => {
    dispatch({ type: 'CONFIRM_STUDYING', payload: taskId });
  }, []);

  const isStudyingConfirmed = useCallback((taskId: string): boolean => {
    return (state as any).confirmedStudyingTasks?.includes(taskId) ?? false;
  }, [(state as any).confirmedStudyingTasks]);

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
          estimatedMinutes: task.estimatedMinutes ?? 40, type: task.type,
          completed: task.completed, startTime: task.startTime, endTime: task.endTime,
        });
      });
    });
    return result;
  }, [state.studyPlans]);

  // ── Active now task — finds the task that should be happening RIGHT NOW ─────
  const getActiveNowTask = useCallback((): ActiveTask | null => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (const plan of state.studyPlans) {
      for (const task of plan.tasks) {
        if (task.completed) continue;

        const isToday = task.date === today;
        const isYesterday = task.date === yesterday;
        if (!isToday && !isYesterday) continue;

        if (task.startTime && task.endTime) {
          const crossesMidnight = task.endTime < task.startTime; // e.g. start=23:45 end=00:15

          if (isYesterday) {
            // Only show yesterday's task if it crosses midnight AND we're still before its endTime
            if (!crossesMidnight) continue;
            if (nowStr > task.endTime) continue; // e.g. now=00:20 > end=00:15 → done
          } else {
            // Today's task
            if (crossesMidnight) {
              // Active from startTime until midnight (00:00+)
              // nowStr is HH:MM — if we're before startTime today, not started yet
              if (nowStr < task.startTime) continue;
              // If nowStr > endTime and not crossing midnight zone, it's done
              // But crossing midnight means: active if nowStr >= startTime (already checked above)
            } else {
              if (nowStr < task.startTime || nowStr > task.endTime) continue;
            }
          }
        } else if (isYesterday) {
          continue; // no time set on yesterday's task, skip
        }

        // Found an active task — build the full info
        const subject = state.subjects.find(s => s.id === task.subjectId);
        if (!subject) continue;

        const isChapterOnly = !subject.chapters.some(ch => ch.topics.length > 0);
        let topicName = '';

        if (isChapterOnly) {
          const chapter = subject.chapters.find(ch => ch.id === task.chapterId);
          topicName = chapter?.name ?? 'Chapter';
        } else {
          const topic = subject.chapters
            .flatMap(ch => ch.topics)
            .find(t => t.id === task.topicId);
          topicName = topic?.name ?? 'Topic';
        }

        return {
          planId: plan.id,
          taskId: task.id,
          topicId: task.topicId,
          subjectId: task.subjectId,
          chapterId: task.chapterId,
          estimatedMinutes: task.estimatedMinutes ?? 40,
          startTime: task.startTime,
          endTime: task.endTime,
          subjectName: subject.name,
          subjectColor: subject.color,
          subjectIcon: subject.icon,
          topicName,
          isChapterOnly,
          blockApps: plan.blockApps,
          hardBlock: plan.hardBlock,
          deviceAdmin: plan.deviceAdmin,
        };
      }
    }
    return null;
  }, [state.studyPlans, state.subjects]);

  return (
    <StudyContext.Provider value={{
      state: state as AppState,
      ready,
      addSubject, updateSubject, deleteSubject,
      toggleTopicComplete,
      addSession,
      addStudyPlan, updateStudyPlan, deleteStudyPlan, completePlanTask,
      completeTaskAndTopic,
      addBlockRoutine, updateBlockRoutine, deleteBlockRoutine,
      addTimeLimit, updateTimeLimit, deleteTimeLimit,
      updateSettings,
      gainXp,
      completeOnboarding,
      getTodayMinutes, getStreak, getSubjectProgress, getTodayPlanTasks,
      getActiveNowTask,
      rescheduleMissedTasks: rescheduleMissed,
      confirmStudying,
      isStudyingConfirmed,
      getAcceptanceRate,
      getAdaptiveSuggestion,
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used inside <StudyProvider>');
  return ctx;
              }