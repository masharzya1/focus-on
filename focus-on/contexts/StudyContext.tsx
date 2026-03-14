/**
 * StudyContext — Zustand + AsyncStorage persist
 *
 * কেন Zustand AsyncStorage এর চেয়ে fast:
 * - শুধু changed slice re-render করে, পুরো tree না
 * - persist middleware smart — শুধু necessary data serialize করে
 * - No extra useEffect, no debounce timer, no race condition
 *
 * Install: npx expo install zustand
 * (AsyncStorage already আছে তোমার project এ)
 */

import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppState, Subject, StudySession,
  StudyPlan, AppSettings, AppBlockRoutine,
} from '@/types/study';
import { DEFAULT_SETTINGS } from '@/types/study';

// ── Default state ─────────────────────────────────────────────────────────────
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
  onboardingCompleted: false,
};

// ── Store type ────────────────────────────────────────────────────────────────
interface StudyStore extends AppState {
  ready: boolean;
  _setReady: (v: boolean) => void;
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
  getTodayPlanTasks: () => {
    planId: string; taskId: string; topicId: string;
    subjectId: string; chapterId: string;
    estimatedMinutes: number; type: 'study' | 'revision';
    completed: boolean; startTime?: string; endTime?: string;
  }[];
}

// ── Zustand store ─────────────────────────────────────────────────────────────
export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      ready: false,
      _setReady: (v) => set({ ready: v }),

      addSubject: (s) => set(p => ({ subjects: [...p.subjects, s] })),
      updateSubject: (s) => set(p => ({ subjects: p.subjects.map(x => x.id === s.id ? s : x) })),
      deleteSubject: (id) => set(p => ({ subjects: p.subjects.filter(s => s.id !== id) })),

      toggleTopicComplete: (subjectId, chapterId, topicId) => {
        let didComplete = false;
        set(p => {
          const subjects = p.subjects.map(s => {
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
          return { subjects, totalTopicsCompleted: didComplete ? p.totalTopicsCompleted + 1 : p.totalTopicsCompleted };
        });
        return didComplete;
      },

      addSession: (session) => {
        set(p => {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const newStreak = p.lastStudyDate === today ? p.streak
            : p.lastStudyDate === yesterday ? p.streak + 1 : 1;

          let studyPlans = p.studyPlans;
          if (session.topicId) {
            studyPlans = studyPlans.map(plan => ({
              ...plan,
              tasks: plan.tasks.map(t => t.topicId === session.topicId && !t.completed ? { ...t, completed: true } : t),
            }));
          }

          return {
            sessions: [...p.sessions, session],
            studyPlans,
            todaySessionsCompleted: p.todaySessionsDate === today ? p.todaySessionsCompleted + 1 : 1,
            todaySessionsDate: today,
            streak: newStreak,
            lastStudyDate: today,
          };
        });
      },

      addStudyPlan: (p) => set(s => ({ studyPlans: [...s.studyPlans, p] })),
      updateStudyPlan: (p) => set(s => ({ studyPlans: s.studyPlans.map(x => x.id === p.id ? p : x) })),
      deleteStudyPlan: (id) => set(p => ({ studyPlans: p.studyPlans.filter(pl => pl.id !== id) })),
      completePlanTask: (taskId) => set(p => ({
        studyPlans: p.studyPlans.map(plan => ({
          ...plan, tasks: plan.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
        })),
      })),

      addBlockRoutine: (r) => set(p => ({ blockRoutines: [...p.blockRoutines, r] })),
      updateBlockRoutine: (r) => set(p => ({ blockRoutines: p.blockRoutines.map(x => x.id === r.id ? r : x) })),
      deleteBlockRoutine: (id) => set(p => ({ blockRoutines: p.blockRoutines.filter(r => r.id !== id) })),

      updateSettings: (s) => set(p => ({ settings: { ...p.settings, ...s } })),

      gainXp: (amount) => {
        let result = { newLevel: 1, isLevelUp: false };
        set(p => {
          const newXp = p.xp + amount;
          let remaining = newXp, lvl = 1;
          while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
          result = { newLevel: lvl, isLevelUp: lvl > p.level };
          return { xp: newXp, level: lvl };
        });
        return result;
      },

      completeOnboarding: () => set({ onboardingCompleted: true }),

      getTodayMinutes: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().sessions
          .filter(s => s.completed && s.startTime.startsWith(today))
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getStreak: () => get().streak,

      getSubjectProgress: (subjectId) => {
        const s = get().subjects.find(x => x.id === subjectId);
        if (!s) return 0;
        const topics = s.chapters.flatMap(c => c.topics);
        if (topics.length === 0) return 0;
        return Math.round((topics.filter(t => t.completed).length / topics.length) * 100);
      },

      getTodayPlanTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        const result: any[] = [];
        get().studyPlans.forEach(plan => {
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
      },
    }),
    {
      name: 'focuson_data_v3',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persisted: any, version: number) => {
        // Migrate from old Context-based storage
        if (version < 3) {
          return { ...defaultState, ...persisted, settings: { ...DEFAULT_SETTINGS, ...persisted?.settings } };
        }
        return persisted as StudyStore;
      },
      onRehydrateStorage: () => (state) => {
        if (state) state._setReady(true);
      },
      // Don't persist computed/internal fields
      partialize: (state) => {
        const { ready, _setReady, addSubject, updateSubject, deleteSubject,
          toggleTopicComplete, addSession, addStudyPlan, updateStudyPlan,
          deleteStudyPlan, completePlanTask, addBlockRoutine, updateBlockRoutine,
          deleteBlockRoutine, updateSettings, gainXp, completeOnboarding,
          getTodayMinutes, getStreak, getSubjectProgress, getTodayPlanTasks,
          ...data } = state;
        return data;
      },
    },
  ),
);

// ── useStudy — drop-in replacement, সব screen এ কাজ করবে ────────────────────
export function useStudy() {
  const store = useStudyStore();
  return {
    state: {
      subjects: store.subjects,
      sessions: store.sessions,
      studyPlans: store.studyPlans,
      blockRoutines: store.blockRoutines,
      settings: store.settings,
      streak: store.streak,
      xp: store.xp,
      level: store.level,
      totalTopicsCompleted: store.totalTopicsCompleted,
      todaySessionsCompleted: store.todaySessionsCompleted,
      onboardingCompleted: store.onboardingCompleted,
      lastStudyDate: (store as any).lastStudyDate,
    } as AppState,
    ready: store.ready,
    addSubject: store.addSubject,
    updateSubject: store.updateSubject,
    deleteSubject: store.deleteSubject,
    toggleTopicComplete: store.toggleTopicComplete,
    addSession: store.addSession,
    addStudyPlan: store.addStudyPlan,
    updateStudyPlan: store.updateStudyPlan,
    deleteStudyPlan: store.deleteStudyPlan,
    completePlanTask: store.completePlanTask,
    addBlockRoutine: store.addBlockRoutine,
    updateBlockRoutine: store.updateBlockRoutine,
    deleteBlockRoutine: store.deleteBlockRoutine,
    updateSettings: store.updateSettings,
    gainXp: store.gainXp,
    completeOnboarding: store.completeOnboarding,
    getTodayMinutes: store.getTodayMinutes,
    getStreak: store.getStreak,
    getSubjectProgress: store.getSubjectProgress,
    getTodayPlanTasks: store.getTodayPlanTasks,
  };
}

// ── StudyProvider — wrapper only, Zustand এর কোনো Provider লাগে না ───────────
export function StudyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
                                         }
