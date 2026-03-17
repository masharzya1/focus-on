import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Pressable, TextInput, KeyboardAvoidingView, Image,
} from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS, SOFT_COLORS } from '@/constants/theme';
import type { ActiveTask, PlannedTask } from '@/types/study';
import { scheduleTaskNotifications, cancelAllNotifications, setupAndroidChannel, scheduleAllTaskNotifications } from '@/services/notifications';
import { useT } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

function getGreetingInfo() {
  const h = new Date().getHours();
  if (h < 12) return { key: 'greetMorning' as const, icon: 'sunny' as const, color: '#FF8C42', label: 'Morning' };
  if (h < 17) return { key: 'greetAfternoon' as const, icon: 'partly-sunny' as const, color: '#FFCB47', label: 'Afternoon' };
  return { key: 'greetEvening' as const, icon: 'moon' as const, color: '#9B90FF', label: 'Evening' };
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function to12h(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${ampm}`;
}

const PASTEL_CYCLE = [
  SOFT_COLORS.lavender,
  SOFT_COLORS.mint,
  SOFT_COLORS.peach,
  SOFT_COLORS.rose,
  SOFT_COLORS.sky,
  SOFT_COLORS.amber,
];
function pastelFor(i: number) { return PASTEL_CYCLE[i % PASTEL_CYCLE.length]; }

// ── Start Focus Button ─────────────────────────────────────────────────────────
function StartButton({ onPress, color, label }: { onPress: () => void; color: string; label?: string }) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.97 : 1, { duration: 80 }) }],
    shadowOpacity: withTiming(pressed.value ? 0.18 : 0.38, { duration: 80 }),
  }));
  return (
    <Animated.View style={[S.startOuter, { backgroundColor: color, shadowColor: color }, anim]}>
      <TouchableOpacity
        style={S.startInner}
        onPress={onPress} activeOpacity={1}
        onPressIn={() => { pressed.value = 1; }}
        onPressOut={() => { pressed.value = 0; }}
      >
        <View style={S.startIconCircle}>
          <Ionicons name="play" size={18} color={color} />
        </View>
        <Text style={S.startTxt}>{label ?? 'Start Focus'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Active Task Banner ─────────────────────────────────────────────────────────
function ActiveTaskBanner({ task, onPress, t }: { task: ActiveTask; onPress: () => void; t: any }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.015, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1, true
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        style={[S.activeBanner, { backgroundColor: task.subjectColor + '10', borderColor: task.subjectColor + '30' }]}
        onPress={onPress} activeOpacity={0.88}
      >
        <View style={[S.bannerAccent, { backgroundColor: task.subjectColor }]} />
        <View style={[S.bannerIcon, { backgroundColor: task.subjectColor + '18' }]}>
          <Ionicons name={task.subjectIcon as any} size={20} color={task.subjectColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <View style={[S.liveDot, { backgroundColor: task.subjectColor }]} />
            <Text style={[S.bannerLive, { color: task.subjectColor }]}>
              {task.startTime ? t.homeStudyTime : t.homeUpNext}
            </Text>
            {!!task.startTime && !!task.endTime && (
              <Text style={{ fontSize: 10, fontFamily: FONTS.regular, color: task.subjectColor + 'AA' }}>
                {task.startTime} – {task.endTime}
              </Text>
            )}
          </View>
          <Text style={[S.bannerTopic, { color: '#1A1240' }]} numberOfLines={1}>{task.topicName}</Text>
          <Text style={[S.bannerSubject, { color: task.subjectColor }]}>{task.subjectName}</Text>
        </View>
        <View style={[S.bannerBtn, { backgroundColor: task.subjectColor }]}>
          <Ionicons name="play" size={14} color="#fff" />
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
  const [times, setTimes] = useState<Record<string, { sh: number; sm: number; eh: number; em: number }>>({});

  useEffect(() => {
    if (!visible) return;
    let curH = 8, curM = 0;
    const init: Record<string, { sh: number; sm: number; eh: number; em: number }> = {};
    for (const task of tasks) {
      const endMins = curH * 60 + curM + 60;
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
        let startTotal = cur.sh * 60 + cur.sm + dMin;
        startTotal = Math.max(0, Math.min(23 * 60 + 58, startTotal));
        const duration = (cur.eh * 60 + cur.em) - (cur.sh * 60 + cur.sm);
        const endTotal = Math.min(23 * 60 + 59, startTotal + Math.max(0, duration));
        next[taskId] = { sh: Math.floor(startTotal / 60), sm: startTotal % 60, eh: Math.floor(endTotal / 60), em: endTotal % 60 };
      } else {
        let endTotal = cur.eh * 60 + cur.em + dMin;
        endTotal = Math.max(cur.sh * 60 + cur.sm + 15, Math.min(23 * 60 + 59, endTotal));
        next[taskId] = { ...cur, eh: Math.floor(endTotal / 60), em: endTotal % 60 };
        let cascadeStart = endTotal;
        const idx = tasks.findIndex(t => t.id === taskId);
        for (let i = idx + 1; i < tasks.length; i++) {
          const nt = tasks[i];
          const nc = next[nt.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
          const dur = Math.max(15, (nc.eh * 60 + nc.em) - (nc.sh * 60 + nc.sm));
          const newEnd = Math.min(23 * 60 + 59, cascadeStart + dur);
          next[nt.id] = { sh: Math.floor(cascadeStart / 60), sm: cascadeStart % 60, eh: Math.floor(newEnd / 60), em: newEnd % 60 };
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
      const tm = times[task.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
      return { id: task.id, startTime: `${pad(tm.sh)}:${pad(tm.sm)}`, endTime: `${pad(tm.eh)}:${pad(tm.em)}` };
    });
    onSave(updated);
  };

  const Stepper = ({ value, onMinus, onPlus, color }: { value: string; onMinus: () => void; onPlus: () => void; color: string }) => (
    <View style={S.timeStepper}>
      <TouchableOpacity style={[S.timeStepBtn, { backgroundColor: c.bgSecondary }]} onPress={onMinus}>
        <Ionicons name="remove" size={14} color={color} />
      </TouchableOpacity>
      <View style={[S.timeDisplay, { backgroundColor: color + '15', borderRadius: 8 }]}>
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
              <View style={[S.routineIconCircle, { backgroundColor: '#FFF0E6' }]}>
                <Ionicons name="sunny" size={22} color="#FF8C42" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.sheetTitle, { color: c.text }]}>{t.homeRoutineModalTitle}</Text>
                <Text style={[S.sheetSub, { color: c.textMuted }]}>{t.homeRoutineModalSub}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', paddingHorizontal: 4, marginBottom: 8 }}>
              <Text style={[S.colLabel, { color: c.textFaint }]}>{t.homeRoutineColTopic}</Text>
              <Text style={[S.colLabel, { color: c.textFaint, width: 120, textAlign: 'center' }]}>Start → End</Text>
            </View>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {tasks.map((task, i) => {
                const tm = times[task.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
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
                      <Stepper value={to12h(tm.sh, tm.sm)} onMinus={() => adjust(task.id, 'start', -15)} onPlus={() => adjust(task.id, 'start', 15)} color={color} />
                      <Text style={{ color: c.textFaint, fontSize: 12 }}>→</Text>
                      <Stepper value={to12h(tm.eh, tm.em)} onMinus={() => adjust(task.id, 'end', -15)} onPlus={() => adjust(task.id, 'end', 15)} color={color} />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[S.saveBtn, { backgroundColor: c.accent, marginTop: 16 }]} onPress={handleSave}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={[S.saveTxt, { color: '#fff' }]}>{t.homeRoutineSetBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ color: c.textMuted, fontFamily: FONTS.regular, fontSize: 14 }}>{t.homeRoutineNoSchedule}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { state, getTodayMinutes, getActiveNowTask, rescheduleMissedTasks, updateStudyPlan, addBlockRoutine, updateBlockRoutine, deleteBlockRoutine } = useStudy();
  const t = useT();
  const { colors: c } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const greetInfo = getGreetingInfo();
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
  const missedCount = state.studyPlans.flatMap(p => p.tasks)
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

  const handleSaveRoutine = async (updates: { id: string; startTime: string; endTime: string }[]) => {
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
        const task = plan.tasks.find(tk => tk.id === update.id);
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

  const completedToday = todayTasks.filter(tk => tk.completed).length;
  const accentColor = activeTask ? activeTask.subjectColor : c.accent;

  return (
    <ScrollView
      style={[S.root, { backgroundColor: c.bg }]}
      contentContainerStyle={S.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={S.header}>
        <View style={{ flex: 1 }}>
          <View style={S.greetRow}>
            <Ionicons name={greetInfo.icon} size={13} color={greetInfo.color} />
            <Text style={[S.greetTxt, { color: c.textMuted }]}> Good {greetInfo.label}</Text>
          </View>
          <Text style={[S.titleName, { color: c.text }]}>
            {firstName}
          </Text>
        </View>
        <View style={S.headerRight}>
          <TouchableOpacity
            style={[S.streakPill, { backgroundColor: '#FFF0E6' }]}
            onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="flame" size={16} color="#FF8C42" />
            <Text style={[S.streakNum, { color: '#CC5500' }]}>{state.streak}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.xpPill, { backgroundColor: '#FFF8E0' }]}
            onPress={() => router.push('/(tabs)/profile')}>
            <Text style={[S.xpNum, { color: '#8A5C00' }]}>{state.xp} XP</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Hero Card ── */}
      <Animated.View entering={FadeInDown.delay(40).springify()}>
        <LinearGradient
          colors={['#7C6FF7', '#9B90FF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={S.heroCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={S.heroLabel}>TODAY'S GOAL</Text>
            <Text style={S.heroTitle}>
              {todayTasks.length > 0
                ? `${completedToday}/${todayTasks.length} tasks`
                : 'Plan your day'}
            </Text>
            <View style={S.heroProgBg}>
              <View style={[S.heroProgFill, {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: progress >= 1 ? '#30D9A4' : '#fff',
              }]} />
            </View>
            <Text style={S.heroSub}>
              {Math.round(progress * 100)}% complete · {todayMin}m studied
            </Text>
            <TouchableOpacity
              style={S.heroBtn}
              onPress={() => router.push('/(tabs)/plan')}
              activeOpacity={0.85}
            >
              <Text style={S.heroBtnTxt}>
                {todayTasks.length > 0 ? 'View plan' : 'Create plan'}
              </Text>
              <Ionicons name="arrow-forward" size={13} color="#7C6FF7" />
            </TouchableOpacity>
          </View>

          {/* Illustration placeholder — replace with Icons8 3D image */}
          <View style={S.heroIllustrationSlot}>
            <View style={S.heroIllustrationPlaceholder}>
              <Ionicons name="book" size={48} color="rgba(255,255,255,0.5)" />
            </View>
          </View>

          {/* Decorative circles */}
          <View style={[S.heroDeco1, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
          <View style={[S.heroDeco2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
        </LinearGradient>
      </Animated.View>

      {/* ── Alert banners ── */}
      {examDayPlans.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.delay(60 + i * 20).springify()}>
          <TouchableOpacity
            style={[S.alertCard, { backgroundColor: '#FFF8E0', borderColor: '#FFCB47' + '60' }]}
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: p.id } })}>
            <View style={[S.alertIcon, { backgroundColor: '#FFF0B3' }]}>
              <Ionicons name="flag" size={18} color="#8A5C00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.alertTitle, { color: '#8A5C00' }]}>Exam day — {p.examName}!</Text>
              <Text style={[S.alertSub, { color: '#A07000' }]}>Focus on what you know. You've got this!</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#A07000" />
          </TouchableOpacity>
        </Animated.View>
      ))}
      {examSoonPlans.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.delay(60 + i * 20).springify()}>
          <TouchableOpacity
            style={[S.alertCard, { backgroundColor: '#FFE8EE', borderColor: '#FF5F6D' + '40' }]}
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: p.id } })}>
            <View style={[S.alertIcon, { backgroundColor: '#FFD0D8' }]}>
              <Ionicons name="warning" size={18} color="#9B1239" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.alertTitle, { color: '#9B1239' }]}>Exam tomorrow — {p.examName}!</Text>
              <Text style={[S.alertSub, { color: '#B42040' }]}>Last day to revise. Make it count.</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#B42040" />
          </TouchableOpacity>
        </Animated.View>
      ))}
      {missedCount > 0 && examDayPlans.length === 0 && (
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <TouchableOpacity
            style={[S.alertCard, { backgroundColor: '#FFE8EE', borderColor: '#FF5F6D' + '40' }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <View style={[S.alertIcon, { backgroundColor: '#FFD0D8' }]}>
              <Ionicons name="alert-circle" size={18} color="#9B1239" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.alertTitle, { color: '#9B1239' }]}>{missedCount} missed task{missedCount > 1 ? 's' : ''}</Text>
              <Text style={[S.alertSub, { color: '#B42040' }]}>Tap to reschedule from your plan</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#B42040" />
          </TouchableOpacity>
        </Animated.View>
      )}
      {needsRoutine && (
        <Animated.View entering={FadeInDown.delay(70).springify()}>
          <TouchableOpacity
            style={[S.alertCard, { backgroundColor: '#FFF8E0', borderColor: '#FFCB47' + '50' }]}
            onPress={() => setShowRoutine(true)}>
            <View style={[S.alertIcon, { backgroundColor: '#FFF0B3' }]}>
              <Ionicons name="time" size={18} color="#8A5C00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.alertTitle, { color: '#8A5C00' }]}>{t.homeRoutineBannerTitle}</Text>
              <Text style={[S.alertSub, { color: '#A07000' }]}>{t.homeRoutineBannerSub(unscheduledTasks.length)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#A07000" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Active Task ── */}
      {activeTask && (
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <ActiveTaskBanner task={activeTask} onPress={() => goToTimer(activeTask)} t={t} />
        </Animated.View>
      )}

      {/* ── Start Focus ── */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <StartButton
          onPress={() => goToTimer(activeTask ?? undefined)}
          color={accentColor}
          label={activeTask ? `Study ${activeTask.topicName}` : t.homeStartFocus}
        />
      </Animated.View>

      {/* ── Quick Stats Row ── */}
      <Animated.View entering={FadeInDown.delay(120).springify()} style={S.statsRow}>
        <View style={[S.statCard, { backgroundColor: '#E4FAF3' }]}>
          <Ionicons name="time-outline" size={18} color="#14B888" />
          <Text style={[S.statNum, { color: '#0C6E4E' }]}>{todayMin}m</Text>
          <Text style={[S.statLabel, { color: '#14B888' }]}>Studied</Text>
        </View>
        <View style={[S.statCard, { backgroundColor: '#EAE8FF' }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#7C6FF7" />
          <Text style={[S.statNum, { color: '#3730A3' }]}>{completedToday}</Text>
          <Text style={[S.statLabel, { color: '#7C6FF7' }]}>Done</Text>
        </View>
        <View style={[S.statCard, { backgroundColor: '#FFF0E6' }]}>
          <Ionicons name="flame-outline" size={18} color="#FF8C42" />
          <Text style={[S.statNum, { color: '#954A00' }]}>{state.streak}d</Text>
          <Text style={[S.statLabel, { color: '#FF8C42' }]}>Streak</Text>
        </View>
      </Animated.View>

      {/* ── Today's Tasks ── */}
      {todayTasks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <View style={S.sectionHeader}>
            <Text style={[S.sectionTitle, { color: c.text }]}>{t.homeTodayPlan}</Text>
            {needsRoutine && (
              <TouchableOpacity
                style={[S.seeAllBtn, { backgroundColor: c.accentSoft }]}
                onPress={() => setShowRoutine(true)}>
                <Ionicons name="time-outline" size={11} color={c.accent} />
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
            const p           = pastelFor(i);

            return (
              <Animated.View key={task.id} entering={FadeInDown.delay(150 + i * 35).springify()}>
                <TouchableOpacity
                  style={[
                    S.taskCard,
                    { backgroundColor: task.completed ? c.bgSecondary : p.bg },
                    isActive && { shadowColor: p.dot, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
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
                  activeOpacity={0.82}>
                  <View style={[
                    S.taskCheck,
                    task.completed
                      ? { backgroundColor: '#30D9A4', borderColor: '#30D9A4' }
                      : { backgroundColor: 'transparent', borderColor: p.dot },
                  ]}>
                    {task.completed && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[
                      S.taskName,
                      { color: task.completed ? c.textFaint : p.text },
                      task.completed && { textDecorationLine: 'line-through', opacity: 0.5 },
                    ]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View style={[S.subjectChip, { backgroundColor: p.dot + '22' }]}>
                        <View style={[S.subjectDot, { backgroundColor: p.dot }]} />
                        <Text style={[S.subjectName, { color: p.text }]} numberOfLines={1}>
                          {subject?.name}
                        </Text>
                      </View>
                      {task.startTime && (
                        <Text style={[S.taskTime, { color: p.dot }]}>{task.startTime}</Text>
                      )}
                    </View>
                  </View>

                  {isActive && !task.completed && (
                    <View style={[S.playBtn, { backgroundColor: p.dot }]}>
                      <Ionicons name="play" size={11} color="#fff" />
                    </View>
                  )}
                  {task.completed && (
                    <Ionicons name="checkmark-circle" size={18} color="#30D9A4" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          <TouchableOpacity
            style={[S.viewAllBtn, { borderColor: c.border, backgroundColor: c.bgCard }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <Text style={[S.viewAllTxt, { color: c.accent }]}>See all tasks</Text>
            <Ionicons name="arrow-forward" size={13} color={c.accent} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Empty State ── */}
      {todayTasks.length === 0 && (
        <Animated.View entering={FadeInDown.delay(160).springify()} style={[S.emptyCard, { backgroundColor: c.bgCard }]}>
          {/* Illustration placeholder — replace with Icons8 3D empty state image */}
          <View style={S.emptyIllustration}>
            <Ionicons name="calendar-outline" size={56} color={c.accent + '60'} />
          </View>
          <Text style={[S.emptyTitle, { color: c.text }]}>{t.homeNoPlan}</Text>
          <Text style={[S.emptySub, { color: c.textMuted }]}>Create your first study plan to get started</Text>
          <TouchableOpacity
            style={[S.emptyBtn, { backgroundColor: c.accent }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <Text style={S.emptyBtnTxt}>{t.homeCreatePlan}</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={{ height: 40 }} />

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
  content: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 64 : 50, paddingBottom: 32, gap: 14 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  greetTxt: { fontSize: 13, fontFamily: FONTS.regular },
  titleName: { fontSize: 30, fontFamily: FONTS.bold, letterSpacing: -0.8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full },
  streakNum: { fontSize: 14, fontFamily: FONTS.bold },
  xpPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full },
  xpNum: { fontSize: 13, fontFamily: FONTS.bold },

  // Hero
  heroCard: { borderRadius: RADIUS.xxl, padding: 24, minHeight: 170, flexDirection: 'row', overflow: 'hidden' },
  heroLabel: { fontSize: 10, fontFamily: FONTS.bold, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' },
  heroTitle: { fontSize: 24, fontFamily: FONTS.bold, color: '#fff', letterSpacing: -0.5, marginBottom: 12 },
  heroProgBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  heroProgFill: { height: '100%', borderRadius: 3 },
  heroSub: { fontSize: 12, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full },
  heroBtnTxt: { fontSize: 13, fontFamily: FONTS.bold, color: '#7C6FF7' },
  heroIllustrationSlot: { width: 90, alignItems: 'flex-end', justifyContent: 'flex-end' },
  heroIllustrationPlaceholder: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroDeco1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, right: -30, top: -30 },
  heroDeco2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, right: 60, bottom: -20 },

  // Alerts
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.xl, borderWidth: 1.5 },
  alertIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontFamily: FONTS.bold, marginBottom: 2 },
  alertSub: { fontSize: 12, fontFamily: FONTS.regular },

  // Active banner
  activeBanner: { borderRadius: RADIUS.xl, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingRight: 14, overflow: 'hidden' },
  bannerAccent: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  bannerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  bannerLive: { fontSize: 10, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerTopic: { fontSize: 14, fontFamily: FONTS.bold, marginBottom: 1 },
  bannerSubject: { fontSize: 11, fontFamily: FONTS.medium },
  bannerBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // Start button
  startOuter: { borderRadius: RADIUS.xl, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 10 },
  startInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 62, borderRadius: RADIUS.xl },
  startIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  startTxt: { color: '#fff', fontSize: 17, fontFamily: FONTS.bold, letterSpacing: 0.2 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: RADIUS.lg, gap: 3 },
  statNum: { fontSize: 18, fontFamily: FONTS.bold },
  statLabel: { fontSize: 10, fontFamily: FONTS.semibold },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  seeAllTxt: { fontSize: 11, fontFamily: FONTS.bold },

  // Task cards
  taskCard: { borderRadius: RADIUS.lg, padding: 14, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskCheck: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskName: { fontSize: 14, fontFamily: FONTS.semibold },
  subjectChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  subjectDot: { width: 5, height: 5, borderRadius: 3 },
  subjectName: { fontSize: 11, fontFamily: FONTS.medium },
  taskTime: { fontSize: 11, fontFamily: FONTS.semibold },
  playBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1.5 },
  viewAllTxt: { fontSize: 13, fontFamily: FONTS.bold },

  // Empty
  emptyCard: { borderRadius: RADIUS.xxl, padding: 36, alignItems: 'center', gap: 10 },
  emptyIllustration: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#EAE8FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontFamily: FONTS.bold, textAlign: 'center' },
  emptySub: { fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 22, paddingVertical: 13, borderRadius: RADIUS.lg },
  emptyBtnTxt: { fontSize: 14, fontFamily: FONTS.bold, color: '#fff' },

  // Modal
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  routineIconCircle: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 18, fontFamily: FONTS.bold },
  sheetSub: { fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  colLabel: { flex: 1, fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
  routineTaskRow: { paddingVertical: 14 },
  routineTaskName: { fontSize: 13, fontFamily: FONTS.semibold },
  routineTaskSub: { fontSize: 11, fontFamily: FONTS.regular },
  timeStepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeStepBtn: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  timeDisplay: { paddingHorizontal: 8, paddingVertical: 4 },
  timeText: { fontSize: 12, fontFamily: FONTS.bold },
  saveBtn: { height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveTxt: { fontSize: 15, fontFamily: FONTS.bold },
});
