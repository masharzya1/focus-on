import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Pressable, TextInput, KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';
import type { ActiveTask, PlannedTask } from '@/types/study';
import { scheduleTaskNotifications, cancelAllNotifications, setupAndroidChannel, scheduleAllTaskNotifications } from '@/services/notifications';
import { useT } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

function getGreetingIcon() {
  const h = new Date().getHours();
  if (h < 12) return { key: 'greetMorning' as const, icon: 'sunny' as const, color: '#FF9500' };
  if (h < 17) return { key: 'greetAfternoon' as const, icon: 'partly-sunny' as const, color: '#FFB347' };
  return { key: 'greetEvening' as const, icon: 'moon' as const, color: '#8C85FF' };
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function to12h(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${ampm}`;
}

// ── Start Button ──────────────────────────────────────────────────────────────
function StartButton({ onPress, color, darkColor, label }: {
  onPress: () => void; color: string; darkColor: string; label?: string;
}) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.97 : 1, { duration: 80 }) }],
    shadowOpacity: withTiming(pressed.value ? 0.15 : 0.32, { duration: 80 }),
  }));
  return (
    <Animated.View style={[S.startOuter, { backgroundColor: darkColor, shadowColor: color }, anim]}>
      <TouchableOpacity
        style={[S.startInner, { backgroundColor: color }]}
        onPress={onPress} activeOpacity={1}
        onPressIn={() => { pressed.value = 1; }}
        onPressOut={() => { pressed.value = 0; }}
      >
        <Ionicons name="timer" size={26} color="#fff" />
        <Text style={S.startTxt}>{label ?? 'Start Focus'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Active Task Banner ────────────────────────────────────────────────────────
function ActiveTaskBanner({ task, onPress, t }: { task: ActiveTask; onPress: () => void; t: any }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.02, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1, true
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        style={[S.activeBanner, { backgroundColor: task.subjectColor + '15', borderColor: task.subjectColor + '40' }]}
        onPress={onPress} activeOpacity={0.88}
      >
        <View style={[S.bannerAccent, { backgroundColor: task.subjectColor }]} />
        <View style={[S.bannerIcon, { backgroundColor: task.subjectColor + '20' }]}>
          <Ionicons name={task.subjectIcon as any} size={22} color={task.subjectColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={S.bannerTopRow}>
            <View style={[S.liveDot, { backgroundColor: task.subjectColor }]} />
            <Text style={[S.bannerLive, { color: task.subjectColor }]}>
              {task.startTime ? t.homeStudyTime : t.homeUpNext}
            </Text>
            {!!task.startTime && !!task.endTime && (
              <Text style={[S.bannerTime, { color: task.subjectColor + 'AA' }]}>
                {task.startTime} – {task.endTime}
              </Text>
            )}
          </View>
          <Text style={[S.bannerTopic, { color: '#1E1B4B' }]} numberOfLines={1}>
            {task.topicName}
          </Text>
          <Text style={[S.bannerSubject, { color: task.subjectColor }]}>
            {task.subjectName}
          </Text>
        </View>
        <View style={[S.bannerBtn, { backgroundColor: task.subjectColor }]}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Morning Routine Modal ─────────────────────────────────────────────────────
function MorningRoutineModal({ visible, tasks, subjects, onSave, onClose, colors: c, t }: {
  visible: boolean;
  tasks: PlannedTask[];
  subjects: ReturnType<typeof useStudy>['state']['subjects'];
  onSave: (updated: { id: string; startTime: string; endTime: string }[]) => void;
  onClose: () => void;
  colors: any;
  t: any;
}) {
  // Each task has start + end time
  const [times, setTimes] = useState<Record<string, { sh: number; sm: number; eh: number; em: number }>>({});

  useEffect(() => {
    if (!visible) return;
    let curH = 8, curM = 0;
    const init: Record<string, { sh: number; sm: number; eh: number; em: number }> = {};
    for (const task of tasks) {
      const endMins = curH * 60 + curM + 60; // default 1hr per task
      const eh = Math.min(23, Math.floor(endMins / 60));
      const em = endMins % 60;
      init[task.id] = { sh: curH, sm: curM, eh, em };
      curH = eh; curM = em;
    }
    setTimes(init);
  }, [visible, tasks]);

  const adjust = (taskId: string, field: 'start' | 'end', dMin: number) => {
    setTimes(prev => {
      const cur = prev[taskId] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
      const next = { ...prev };

      if (field === 'start') {
        // Only move start, keep duration same
        let startTotal = cur.sh * 60 + cur.sm + dMin;
        startTotal = Math.max(0, Math.min(23 * 60 + 58, startTotal));
        const duration = (cur.eh * 60 + cur.em) - (cur.sh * 60 + cur.sm);
        const endTotal = Math.min(23 * 60 + 59, startTotal + Math.max(0, duration));
        next[taskId] = {
          sh: Math.floor(startTotal / 60), sm: startTotal % 60,
          eh: Math.floor(endTotal / 60), em: endTotal % 60,
        };
      } else {
        // Move end, cascade ALL subsequent tasks by same delta
        let endTotal = cur.eh * 60 + cur.em + dMin;
        endTotal = Math.max(cur.sh * 60 + cur.sm + 15, Math.min(23 * 60 + 59, endTotal)); // min 15 min duration
        next[taskId] = { ...cur, eh: Math.floor(endTotal / 60), em: endTotal % 60 };

        // Cascade all subsequent tasks
        let cascadeStart = endTotal;
        const idx = tasks.findIndex(t => t.id === taskId);
        for (let i = idx + 1; i < tasks.length; i++) {
          const nt = tasks[i];
          const nc = next[nt.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
          const dur = Math.max(15, (nc.eh * 60 + nc.em) - (nc.sh * 60 + nc.sm));
          const newEnd = Math.min(23 * 60 + 59, cascadeStart + dur);
          next[nt.id] = {
            sh: Math.floor(cascadeStart / 60), sm: cascadeStart % 60,
            eh: Math.floor(newEnd / 60), em: newEnd % 60,
          };
          cascadeStart = newEnd;
        }
      }
      return next;
    });
  };

  const getDisplayName = (task: PlannedTask) => {
    const subject = subjects.find(s => s.id === task.subjectId);
    if (!subject) return 'Task';
    const chapter = subject.chapters.find(ch => ch.id === task.chapterId);
    if (!chapter || chapter.topics.length === 0) return chapter?.name ?? 'Chapter';
    const topic = chapter.topics.find(t => t.id === task.topicId);
    return topic?.name ?? chapter.name;
  };

  const handleSave = () => {
    const updated = tasks.map(task => {
      const t = times[task.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
      return {
        id: task.id,
        startTime: `${pad(t.sh)}:${pad(t.sm)}`,
        endTime: `${pad(t.eh)}:${pad(t.em)}`,
      };
    });
    onSave(updated);
  };

  const Stepper = ({ value, onMinus, onPlus, color }: { value: string; onMinus: () => void; onPlus: () => void; color: string }) => (
    <View style={S.timeStepper}>
      <TouchableOpacity style={[S.timeStepBtn, { backgroundColor: c.bgSecondary }]} onPress={onMinus}>
        <Ionicons name="remove" size={14} color={color} />
      </TouchableOpacity>
      <View style={[S.timeDisplay, { backgroundColor: color + '18', borderRadius: 8 }]}>
        <Text style={[S.timeText, { color }]}>{value}</Text>
      </View>
      <TouchableOpacity style={[S.timeStepBtn, { backgroundColor: c.bgSecondary }]} onPress={onPlus}>
        <Ionicons name="add" size={14} color={color} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={S.modalBg} onPress={onClose}>
          <Pressable style={[S.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[S.handle, { backgroundColor: c.border }]} />

            <View style={S.sheetHeaderRow}>
              <View style={[S.routineIconCircle, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="sunny" size={22} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.sheetTitle, { color: c.text }]}>{t.homeRoutineModalTitle}</Text>
                <Text style={[S.sheetSub, { color: c.textMuted }]}>{t.homeRoutineModalSub}</Text>
              </View>
            </View>

            {/* Header row */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 4, marginBottom: 4 }}>
              <Text style={{ flex: 1, fontSize: 11, fontFamily: FONTS.bold, color: c.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 }}>{t.homeRoutineColTopic}</Text>
              <Text style={{ width: 120, fontSize: 11, fontFamily: FONTS.bold, color: c.textFaint, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' }}>Start → End</Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {tasks.map((task, i) => {
                const t = times[task.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
                const subject = subjects.find(s => s.id === task.subjectId);
                const displayName = getDisplayName(task);
                const color = subject?.color ?? c.accent;

                return (
                  <View key={task.id}
                    style={[S.routineTaskRow, { borderTopColor: c.border, borderTopWidth: i > 0 ? 1 : 0, flexWrap: 'wrap', gap: 8 }]}>
                    <View style={{ flex: 1, minWidth: 100 }}>
                      <Text style={[S.routineTaskName, { color: c.text }]} numberOfLines={1}>{displayName}</Text>
                      {subject && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                          <Text style={[S.routineTaskSub, { color: c.textFaint }]}>{subject.name}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Stepper
                        value={to12h(t.sh, t.sm)}
                        onMinus={() => adjust(task.id, 'start', -15)}
                        onPlus={() => adjust(task.id, 'start', 15)}
                        color={color}
                      />
                      <Text style={{ color: c.textFaint, fontSize: 12 }}>→</Text>
                      <Stepper
                        value={to12h(t.eh, t.em)}
                        onMinus={() => adjust(task.id, 'end', -15)}
                        onPlus={() => adjust(task.id, 'end', 15)}
                        color={color}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[S.saveBtn, { backgroundColor: c.accent, marginTop: 16 }]}
              onPress={handleSave}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={[S.saveTxt, { color: '#fff' }]}>{t.homeRoutineSetBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ color: c.textMuted, fontFamily: FONTS.regular, fontSize: 14 }}>
                {t.homeRoutineNoSchedule}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Pastel palette for task cards ────────────────────────────────────────────
const PASTEL = [
  { bg: '#E8F5F0', text: '#1B6B4A', dot: '#34C88A' },
  { bg: '#EEF0FF', text: '#3730A3', dot: '#6C63FF' },
  { bg: '#FFF4E5', text: '#92400E', dot: '#F59E0B' },
  { bg: '#FDE8F0', text: '#9D174D', dot: '#EC4899' },
  { bg: '#E5F3FF', text: '#1E3A5F', dot: '#3B82F6' },
];
function pastelForIndex(i: number) { return PASTEL[i % PASTEL.length]; }

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { state, getTodayMinutes, getActiveNowTask, rescheduleMissedTasks, updateStudyPlan, addBlockRoutine, updateBlockRoutine, deleteBlockRoutine } = useStudy();
  const t = useT();
  const { colors: c } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const greetingInfo = getGreetingIcon();
  const greeting = { ...greetingInfo, text: t[greetingInfo.key] };

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Champion';
  const todayMin  = getTodayMinutes();
  const goalMin   = state.settings.dailyGoalMinutes;
  const progress  = Math.min(todayMin / goalMin, 1);
  const today     = new Date().toISOString().split('T')[0];

  const todayTasks = state.studyPlans
    .flatMap(p => p.tasks.filter(tk => tk.date === today))
    .slice(0, 6);

  const examDayPlans  = state.studyPlans.filter(p =>
    Math.ceil((new Date(p.examDate).getTime() - Date.now()) / 86400000) <= 0);
  const examSoonPlans = state.studyPlans.filter(p =>
    Math.ceil((new Date(p.examDate).getTime() - Date.now()) / 86400000) === 1);
  const missedCount = state.studyPlans
    .flatMap(p => p.tasks)
    .filter(tk => !tk.completed && tk.date < today).length;

  const unscheduledTasks = state.studyPlans
    .flatMap(p => p.tasks.filter(tk => tk.date === today && !tk.completed && !tk.startTime));
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const needsRoutine = unscheduledTasks.length > 0;
  const [showRoutine, setShowRoutine] = useState(false);

  useFocusEffect(useCallback(() => {
    const refresh = () => setActiveTask(getActiveNowTask());
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [getActiveNowTask]));

  useEffect(() => {
    setupAndroidChannel().catch(() => {});
    const timer = setTimeout(() => rescheduleMissedTasks(), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (needsRoutine) {
      const timer = setTimeout(() => setShowRoutine(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [needsRoutine]);

  const handleSaveRoutine = async (
    updates: { id: string; startTime: string; endTime: string }[]
  ) => {
    for (const plan of state.studyPlans) {
      const hasUpdates = plan.tasks.some(tk => updates.find(u => u.id === tk.id));
      if (!hasUpdates) continue;
      const updatedTasks = plan.tasks.map(task => {
        const u = updates.find(x => x.id === task.id);
        if (!u) return task;
        return { ...task, startTime: u.startTime, endTime: u.endTime };
      });
      updateStudyPlan({ ...plan, tasks: updatedTasks });
    }
    try {
      const taskNotifs = updates.map(u => {
        const task    = state.studyPlans.flatMap(p => p.tasks).find(tk => tk.id === u.id);
        const subject = task ? state.subjects.find(s => s.id === task.subjectId) : null;
        const chapter = subject?.chapters.find(ch => ch.id === task?.chapterId);
        const topic   = chapter?.topics.find(tp => tp.id === task?.topicId);
        const name    = topic?.name ?? chapter?.name ?? 'Study task';
        return { id: u.id, date: today, startTime: u.startTime, endTime: u.endTime,
          topicName: name, subjectName: subject?.name ?? '', estimatedMinutes: task?.estimatedMinutes ?? 40 };
      });
      await scheduleAllTaskNotifications(taskNotifs);
    } catch {}
    const todayDay = new Date().getDay();
    for (const plan of state.studyPlans) {
      if (!plan.blockApps || plan.blockedApps.length === 0) continue;
      state.blockRoutines.filter(r => r.fromPlanId === plan.id).forEach(r => deleteBlockRoutine(r.id));
      for (const update of updates) {
        const task    = plan.tasks.find(tk => tk.id === update.id);
        if (!task || !update.startTime || !update.endTime) continue;
        const subject = state.subjects.find(s => s.id === task.subjectId);
        const chapter = subject?.chapters.find(ch => ch.id === task.chapterId);
        const topic   = chapter?.topics.find(tp => tp.id === task.topicId);
        const taskName = topic?.name ?? chapter?.name ?? 'Task';
        addBlockRoutine({
          id: `plan_${plan.id}_task_${task.id}`, name: `📚 ${taskName}`,
          startTime: update.startTime, endTime: update.endTime,
          days: [todayDay], blockedApps: plan.blockedApps, blockShorts: false,
          enabled: true, hardBlock: plan.hardBlock ?? false,
          deviceAdmin: plan.deviceAdmin ?? false, fromPlanId: plan.id,
        });
      }
    }
    setShowRoutine(false);
  };

  const goToTimer = (task?: ActiveTask) => {
    if (task) {
      router.push({
        pathname: '/(tabs)/timer',
        params: {
          taskId: task.taskId, topicId: task.topicId,
          chapterId: task.chapterId, subjectId: task.subjectId,
          topicName: task.topicName, subjectName: task.subjectName,
          subjectColor: task.subjectColor,
          estimatedMinutes: String(task.estimatedMinutes ?? 25),
        },
      });
    } else {
      router.push('/(tabs)/timer');
    }
  };

  return (
    <ScrollView
      style={[S.root, { backgroundColor: '#FFFFFF' }]}
      contentContainerStyle={S.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={S.header}>
        <View>
          <View style={S.greetRow}>
            <Ionicons name={greeting.icon} size={14} color={greeting.color} />
            <Text style={[S.greetTxt, { color: c.textMuted }]}> {greeting.text}</Text>
          </View>
          <Text style={[S.titleName, { color: '#1E1B4B' }]}>{firstName} 👋</Text>
        </View>
        <View style={S.headerRight}>
          <TouchableOpacity
            style={S.streakPill}
            onPress={() => router.push('/(tabs)/profile')}>
            <Text style={S.streakFire}>🔥</Text>
            <Text style={S.streakNum}>{state.streak}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={S.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person-circle-outline" size={32} color={c.accent} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Hero card ── */}
      <Animated.View entering={FadeInDown.delay(40).springify()}>
        <TouchableOpacity
          style={S.heroCard}
          onPress={() => router.push('/(tabs)/plan')}
          activeOpacity={0.88}>
          <View style={{ flex: 1 }}>
            <Text style={S.heroTitle}>
              {todayTasks.length > 0
                ? `${todayTasks.filter(tk => tk.completed).length}/${todayTasks.length} tasks today`
                : 'Plan your study day'}
            </Text>
            <Text style={S.heroSub}>
              {todayTasks.length > 0
                ? `${Math.round(progress * 100)}% of daily goal done`
                : 'Tap to create your first plan'}
            </Text>
            <View style={S.heroBtn}>
              <Text style={S.heroBtnTxt}>
                {todayTasks.length > 0 ? 'View plan →' : 'Create plan →'}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 56, lineHeight: 64 }}>📚</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Alert banners ── */}
      {examDayPlans.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.delay(60 + i * 20).springify()}>
          <TouchableOpacity
            style={[S.alertCard, { backgroundColor: '#FFFBE6', borderColor: '#FDE68A' }]}
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: p.id } })}>
            <Text style={{ fontSize: 22 }}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={[S.alertTitle, { color: '#92400E' }]}>Exam day — {p.examName}!</Text>
              <Text style={[S.alertSub, { color: '#B45309' }]}>Focus on what you know. You've got this!</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D97706" />
          </TouchableOpacity>
        </Animated.View>
      ))}
      {examSoonPlans.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.delay(60 + i * 20).springify()}>
          <TouchableOpacity
            style={[S.alertCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: p.id } })}>
            <Text style={{ fontSize: 22 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[S.alertTitle, { color: '#9F1239' }]}>Exam tomorrow — {p.examName}!</Text>
              <Text style={[S.alertSub, { color: '#BE123C' }]}>Last day to revise. Make it count.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#E11D48" />
          </TouchableOpacity>
        </Animated.View>
      ))}
      {missedCount > 0 && examDayPlans.length === 0 && (
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <TouchableOpacity
            style={[S.alertCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <Ionicons name="alert-circle" size={22} color="#E11D48" />
            <View style={{ flex: 1 }}>
              <Text style={[S.alertTitle, { color: '#9F1239' }]}>{missedCount} missed task{missedCount > 1 ? 's' : ''}</Text>
              <Text style={[S.alertSub, { color: '#BE123C' }]}>Tap to reschedule from your plan</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#E11D48" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Morning routine banner ── */}
      {needsRoutine && (
        <Animated.View entering={FadeInDown.delay(70).springify()}>
          <TouchableOpacity
            style={[S.alertCard, { backgroundColor: '#FFFBE6', borderColor: '#FDE68A' }]}
            onPress={() => setShowRoutine(true)}>
            <Text style={{ fontSize: 22 }}>🌅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[S.alertTitle, { color: '#92400E' }]}>{t.homeRoutineBannerTitle}</Text>
              <Text style={[S.alertSub, { color: '#B45309' }]}>{t.homeRoutineBannerSub(unscheduledTasks.length)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D97706" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Active task banner ── */}
      {activeTask && (
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <ActiveTaskBanner task={activeTask} onPress={() => goToTimer(activeTask)} t={t} />
        </Animated.View>
      )}

      {/* ── Daily goal pill ── */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={S.goalRow}>
        <View style={S.goalLeft}>
          <Text style={S.goalLabel}>{t.homeTodayGoal}</Text>
          <Text style={S.goalTime}>{todayMin}m <Text style={S.goalOf}>/ {goalMin}m</Text></Text>
        </View>
        <View style={S.goalBarWrap}>
          <View style={[S.goalBarBg, { backgroundColor: '#F0EFFF' }]}>
            <View style={[S.goalBarFill, {
              backgroundColor: progress >= 1 ? '#34C88A' : c.accent,
              width: `${Math.round(progress * 100)}%`,
            }]} />
          </View>
          {progress >= 1 && (
            <Text style={S.goalDone}>✓ {t.homeGoalComplete}</Text>
          )}
        </View>
      </Animated.View>

      {/* ── Start Focus button ── */}
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <StartButton
          onPress={() => goToTimer(activeTask ?? undefined)}
          color={activeTask ? activeTask.subjectColor : c.accent}
          darkColor={activeTask ? activeTask.subjectColor + 'CC' : c.accentDark}
          label={activeTask ? `${t.homeStudy} ${activeTask.topicName}` : t.homeStartFocus}
        />
      </Animated.View>

      {/* ── Today's tasks ── */}
      {todayTasks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <View style={S.sectionHeader}>
            <Text style={[S.sectionTitle, { color: '#1E1B4B' }]}>{t.homeTodayPlan}</Text>
            {needsRoutine && (
              <TouchableOpacity
                style={[S.seeAllBtn, { backgroundColor: c.accentSoft }]}
                onPress={() => setShowRoutine(true)}>
                <Ionicons name="time-outline" size={12} color={c.accent} />
                <Text style={[S.seeAllTxt, { color: c.accent }]}>{t.homeSetTimes}</Text>
              </TouchableOpacity>
            )}
          </View>

          {todayTasks.map((task, i) => {
            const subject     = state.subjects.find(s => s.id === task.subjectId);
            const chapter     = subject?.chapters.find(ch => ch.id === task.chapterId);
            const topic       = chapter?.topics.find(tp => tp.id === task.topicId);
            const displayName = topic?.name ?? chapter?.name ?? 'Task';
            const isActive    = activeTask?.taskId === task.id;
            const pastel      = pastelForIndex(i);

            return (
              <Animated.View key={task.id} entering={FadeInDown.delay(160 + i * 40).springify()}>
                <TouchableOpacity
                  style={[
                    S.taskCard,
                    { backgroundColor: task.completed ? '#F9FAFB' : pastel.bg },
                    isActive && S.taskCardActive,
                  ]}
                  onPress={() => {
                    if (!task.completed && subject) {
                      router.push({
                        pathname: '/(tabs)/timer',
                        params: {
                          taskId: task.id, topicId: task.topicId,
                          chapterId: task.chapterId, subjectId: task.subjectId,
                          topicName: displayName, subjectName: subject.name,
                          subjectColor: subject.color,
                          estimatedMinutes: String(task.estimatedMinutes ?? 40),
                        },
                      });
                    }
                  }}
                  activeOpacity={0.8}>
                  {/* Checkbox */}
                  <View style={[
                    S.taskCheck,
                    task.completed
                      ? { backgroundColor: '#34C88A', borderColor: '#34C88A' }
                      : { backgroundColor: 'transparent', borderColor: pastel.dot },
                  ]}>
                    {task.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[
                      S.taskName,
                      { color: task.completed ? '#9CA3AF' : pastel.text },
                      task.completed && S.taskDone,
                    ]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View style={[S.subjectPill, { backgroundColor: pastel.dot + '30' }]}>
                        <View style={[S.subjectDot, { backgroundColor: pastel.dot }]} />
                        <Text style={[S.subjectName, { color: pastel.text }]} numberOfLines={1}>
                          {subject?.name}
                        </Text>
                      </View>
                      {task.startTime && (
                        <Text style={[S.taskTime, { color: pastel.dot }]}>
                          {task.startTime}
                        </Text>
                      )}
                    </View>
                  </View>

                  {isActive && !task.completed && (
                    <View style={[S.playBtn, { backgroundColor: pastel.dot }]}>
                      <Ionicons name="play" size={12} color="#fff" />
                    </View>
                  )}
                  {task.completed && (
                    <Ionicons name="checkmark-circle" size={20} color="#34C88A" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          <TouchableOpacity
            style={[S.viewAllBtn, { borderColor: c.border }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <Text style={[S.viewAllTxt, { color: c.accent }]}>See all tasks</Text>
            <Ionicons name="arrow-forward" size={13} color={c.accent} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Empty state ── */}
      {todayTasks.length === 0 && (
        <Animated.View entering={FadeInDown.delay(160).springify()} style={S.emptyCard}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>🗓️</Text>
          <Text style={[S.emptyTitle, { color: '#1E1B4B' }]}>{t.homeNoPlan}</Text>
          <TouchableOpacity
            style={[S.emptyBtn, { backgroundColor: c.accent }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <Text style={S.emptyBtnTxt}>{t.homeCreatePlan}</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={{ height: 40 }} />

      {/* Morning Routine Modal */}
      <MorningRoutineModal
        visible={showRoutine}
        tasks={unscheduledTasks}
        subjects={state.subjects}
        onSave={handleSaveRoutine}
        onClose={() => setShowRoutine(false)}
        colors={c}
        t={t}
      />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 32, gap: 12 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  greetTxt: { fontSize: 13, fontFamily: FONTS.regular },
  titleName: { fontSize: 28, fontFamily: FONTS.bold, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  streakFire: { fontSize: 15 },
  streakNum: { fontSize: 15, fontFamily: FONTS.bold, color: '#E65100' },
  avatarBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  // Hero card
  heroCard: {
    backgroundColor: '#EEF0FF',
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 130,
  },
  heroTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#1E1B4B', marginBottom: 4 },
  heroSub: { fontSize: 13, fontFamily: FONTS.regular, color: '#6B7280', marginBottom: 14 },
  heroBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9, alignSelf: 'flex-start' },
  heroBtnTxt: { fontSize: 13, fontFamily: FONTS.bold, color: '#fff' },

  // Alert cards
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  alertTitle: { fontSize: 13, fontFamily: FONTS.bold, marginBottom: 2 },
  alertSub: { fontSize: 12, fontFamily: FONTS.regular },

  // Active task banner (kept from before, used by ActiveTaskBanner component)
  activeBanner: { borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingRight: 14, overflow: 'hidden' },
  bannerAccent: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  bannerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  bannerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  bannerLive: { fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerTime: { fontSize: 11, fontFamily: FONTS.regular },
  bannerTopic: { fontSize: 15, fontFamily: FONTS.bold, marginBottom: 1 },
  bannerSubject: { fontSize: 12, fontFamily: FONTS.medium },
  bannerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Goal
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FAFAFF', borderRadius: 18, padding: 16 },
  goalLeft: { gap: 2 },
  goalLabel: { fontSize: 11, fontFamily: FONTS.bold, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 },
  goalTime: { fontSize: 18, fontFamily: FONTS.bold, color: '#1E1B4B' },
  goalOf: { fontSize: 13, fontFamily: FONTS.regular, color: '#9CA3AF' },
  goalBarWrap: { flex: 1, gap: 4 },
  goalBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  goalBarFill: { height: '100%', borderRadius: 4 },
  goalDone: { fontSize: 11, fontFamily: FONTS.semibold, color: '#34C88A' },

  // Start button (unchanged — used by StartButton component)
  startOuter: { borderRadius: 20, paddingBottom: 5, shadowOffset: { width: 0, height: 5 }, shadowRadius: 14, elevation: 8 },
  startInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 16 },
  startTxt: { color: '#fff', fontSize: 18, fontFamily: FONTS.bold, letterSpacing: 0.2 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  seeAllTxt: { fontSize: 12, fontFamily: FONTS.bold },

  // Task cards
  taskCard: { borderRadius: 18, padding: 14, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskCardActive: { shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  taskCheck: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskName: { fontSize: 14, fontFamily: FONTS.semibold },
  taskDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  subjectPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  subjectDot: { width: 6, height: 6, borderRadius: 3 },
  subjectName: { fontSize: 11, fontFamily: FONTS.medium },
  taskTime: { fontSize: 11, fontFamily: FONTS.semibold },
  playBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  viewAllTxt: { fontSize: 13, fontFamily: FONTS.bold },

  // Empty state
  emptyCard: { backgroundColor: '#FAFAFF', borderRadius: 24, padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: FONTS.semibold, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  emptyBtnTxt: { fontSize: 14, fontFamily: FONTS.bold, color: '#fff' },

  // Morning routine modal
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  routineIconCircle: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 18, fontFamily: FONTS.bold },
  sheetSub: { fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  routineTaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  routineTaskName: { fontSize: 14, fontFamily: FONTS.semibold },
  routineTaskSub: { fontSize: 12, fontFamily: FONTS.regular },
  timeStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeStepBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timeDisplay: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timeText: { fontSize: 15, fontFamily: FONTS.bold },
  saveBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  saveTxt: { fontSize: 16, fontFamily: FONTS.bold },

  // Legacy style names referenced by old banners (kept for compat)
  routineBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  routineBannerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  routineBannerTitle: { fontSize: 14, fontFamily: FONTS.bold },
  routineBannerSub: { fontSize: 12, fontFamily: FONTS.regular },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  alertBannerTitle: { fontSize: 14, fontFamily: FONTS.bold, marginBottom: 2 },
  alertBannerSub: { fontSize: 12, fontFamily: FONTS.regular },
  progBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 4 },
});