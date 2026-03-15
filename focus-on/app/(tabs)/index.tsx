import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import { scheduleTaskNotifications, cancelAllNotifications, setupAndroidChannel } from '@/services/notifications';


const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, gap: 14 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 64 : 52, paddingBottom: 12,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  greeting: { fontSize: 14, fontFamily: FONTS.medium },
  appName: { fontSize: 30, fontFamily: FONTS.bold, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  streakNum: { fontSize: 16, fontFamily: FONTS.bold },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  // Morning routine banner
  routineBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.xl, borderWidth: 1.5 },
  routineBannerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  routineBannerTitle: { fontSize: 14, fontFamily: FONTS.bold },
  routineBannerSub: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 1 },
  // Active task banner
  activeBanner: { borderRadius: RADIUS.xl, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingRight: 14, overflow: 'hidden' },
  bannerAccent: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  bannerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  bannerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  bannerLive: { fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerTime: { fontSize: 11, fontFamily: FONTS.regular },
  bannerTopic: { fontSize: 15, fontFamily: FONTS.bold, marginBottom: 1 },
  bannerSubject: { fontSize: 12, fontFamily: FONTS.medium },
  bannerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  // Goal card
  goalCard: { borderRadius: RADIUS.xl, padding: 18 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalLabelRow: { flexDirection: 'row', alignItems: 'center' },
  goalLabel: { fontSize: 14, fontFamily: FONTS.semibold },
  goalTime: { fontSize: 14, fontFamily: FONTS.bold },
  progBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 5 },
  goalDoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  goalDone: { fontSize: 13, fontFamily: FONTS.semibold },
  // Start button
  startOuter: { borderRadius: 20, paddingBottom: 5, shadowOffset: { width: 0, height: 5 }, shadowRadius: 14, elevation: 8 },
  startInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 16 },
  startTxt: { color: '#fff', fontSize: 18, fontFamily: FONTS.bold, letterSpacing: 0.2 },
  // Tasks card
  tasksCard: { borderRadius: RADIUS.xl, padding: 18 },
  tasksTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tasksTitle: { fontSize: 16, fontFamily: FONTS.bold, flex: 1 },
  setTimesBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  setTimesTxt: { fontSize: 12, fontFamily: FONTS.bold },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  taskDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  taskName: { fontSize: 14, fontFamily: FONTS.semibold },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskSub: { fontSize: 11, marginTop: 2, fontFamily: FONTS.regular },
  taskMins: { fontSize: 12, fontFamily: FONTS.semibold },
  // Empty plan
  emptyPlan: { borderRadius: RADIUS.xl, padding: 28, alignItems: 'center', gap: 12 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTxt: { fontSize: 14, fontFamily: FONTS.medium },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  planBtnTxt: { fontSize: 14, fontFamily: FONTS.bold },
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
  timeDisplay: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  timeText: { fontSize: 15, fontFamily: FONTS.bold },
  saveBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  saveTxt: { fontSize: 16, fontFamily: FONTS.bold },
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: 'sunny' as const, color: '#FF9500' };
  if (h < 17) return { text: 'Good afternoon', icon: 'partly-sunny' as const, color: '#FFB347' };
  return { text: 'Good evening', icon: 'moon' as const, color: '#8C85FF' };
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
    <Animated.View style={[styles.startOuter, { backgroundColor: darkColor, shadowColor: color }, anim]}>
      <TouchableOpacity
        style={[styles.startInner, { backgroundColor: color }]}
        onPress={onPress} activeOpacity={1}
        onPressIn={() => { pressed.value = 1; }}
        onPressOut={() => { pressed.value = 0; }}
      >
        <Ionicons name="timer" size={26} color="#fff" />
        <Text style={styles.startTxt}>{label ?? 'Start Focus'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Active Task Banner ────────────────────────────────────────────────────────
function ActiveTaskBanner({ task, onPress }: { task: ActiveTask; onPress: () => void }) {
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
        style={[styles.activeBanner, { backgroundColor: task.subjectColor + '15', borderColor: task.subjectColor + '40' }]}
        onPress={onPress} activeOpacity={0.88}
      >
        <View style={[styles.bannerAccent, { backgroundColor: task.subjectColor }]} />
        <View style={[styles.bannerIcon, { backgroundColor: task.subjectColor + '20' }]}>
          <Ionicons name={task.subjectIcon as any} size={22} color={task.subjectColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.bannerTopRow}>
            <View style={[styles.liveDot, { backgroundColor: task.subjectColor }]} />
            <Text style={[styles.bannerLive, { color: task.subjectColor }]}>
              {task.startTime ? 'Study Time!' : 'Up next'}
            </Text>
            {!!task.startTime && !!task.endTime && (
              <Text style={[styles.bannerTime, { color: task.subjectColor + 'AA' }]}>
                {task.startTime} – {task.endTime}
              </Text>
            )}
          </View>
          <Text style={[styles.bannerTopic, { color: '#1E1B4B' }]} numberOfLines={1}>
            {task.topicName}
          </Text>
          <Text style={[styles.bannerSubject, { color: task.subjectColor }]}>
            {task.subjectName}
          </Text>
        </View>
        <View style={[styles.bannerBtn, { backgroundColor: task.subjectColor }]}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Morning Routine Modal ─────────────────────────────────────────────────────
function MorningRoutineModal({ visible, tasks, subjects, onSave, onClose, colors: c }: {
  visible: boolean;
  tasks: PlannedTask[];
  subjects: ReturnType<typeof useStudy>['state']['subjects'];
  onSave: (updated: { id: string; startTime: string; endTime: string }[]) => void;
  onClose: () => void;
  colors: any;
}) {
  // Each task has start + end time
  const [times, setTimes] = useState<Record<string, { sh: number; sm: number; eh: number; em: number }>>({});
  // Prevent re-init when parent re-renders (tasks array is new ref every render → caused AM/PM reset bug)
  const initialized = useRef(false);

  useEffect(() => {
    if (!visible) { initialized.current = false; return; }
    if (initialized.current) return;
    initialized.current = true;

    // Start from current time rounded up to nearest 15 min (not hardcoded 8AM)
    const now = new Date();
    let curH = now.getHours();
    let curM = Math.ceil(now.getMinutes() / 15) * 15;
    if (curM >= 60) { curH += 1; curM = 0; }
    if (curH > 23) { curH = 23; curM = 0; }

    const init: Record<string, { sh: number; sm: number; eh: number; em: number }> = {};
    for (const task of tasks) {
      // Pre-fill from existing startTime/endTime if already set
      if (task.startTime && task.endTime) {
        const [sh, sm] = task.startTime.split(':').map(Number);
        const [eh, em] = task.endTime.split(':').map(Number);
        init[task.id] = { sh, sm, eh, em };
        curH = eh; curM = em;
      } else {
        const endMins = curH * 60 + curM + 60; // default 1hr per task
        const eh = Math.min(23, Math.floor(endMins / 60));
        const em = endMins % 60;
        init[task.id] = { sh: curH, sm: curM, eh, em };
        curH = eh; curM = em;
      }
    }
    setTimes(init);
  }, [visible]); // tasks excluded intentionally: new ref every render caused the AM/PM reset

  // Toggle AM/PM by jumping ±12 hours
  const toggleAmPm = (taskId: string, field: 'start' | 'end') => {
    setTimes(prev => {
      const cur = prev[taskId] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
      const next = { ...prev };
      if (field === 'start') {
        const newSh = (cur.sh + 12) % 24;
        const dur = (cur.eh * 60 + cur.em) - (cur.sh * 60 + cur.sm);
        const newEnd = Math.min(23 * 60 + 59, newSh * 60 + cur.sm + Math.max(0, dur));
        next[taskId] = { sh: newSh, sm: cur.sm, eh: Math.floor(newEnd / 60), em: newEnd % 60 };
      } else {
        next[taskId] = { ...cur, eh: (cur.eh + 12) % 24 };
      }
      return next;
    });
  };

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

        // Cascade all subsequent tasks — allow overflow past midnight (detected at save)
        let cascadeStart = endTotal;
        const idx = tasks.findIndex(t => t.id === taskId);
        for (let i = idx + 1; i < tasks.length; i++) {
          const nt = tasks[i];
          const nc = next[nt.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
          const dur = Math.max(15, (nc.eh * 60 + nc.em) - (nc.sh * 60 + nc.sm));
          const newEnd = cascadeStart + dur; // no midnight clamp — overflow detected in handleSave
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

  // Detect tasks that overflowed past midnight
  const overflowTasks = tasks.filter(task => {
    const t = times[task.id];
    return t && t.sh >= 24;
  });

  const handleSave = () => {
    const updated = tasks.map(task => {
      const t = times[task.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
      // Clamp to midnight for storage — overflow tasks will be moved to tomorrow
      const clampedSh = Math.min(23, t.sh);
      const clampedEh = Math.min(23, t.eh);
      return {
        id: task.id,
        startTime: `${pad(clampedSh)}:${pad(t.sm)}`,
        endTime: `${pad(clampedEh)}:${pad(t.em)}`,
        movedToTomorrow: t.sh >= 24,
      };
    });
    onSave(updated);
  };

  const Stepper = ({ value, onMinus, onPlus, onToggleAmPm, color }: {
    value: string; onMinus: () => void; onPlus: () => void; onToggleAmPm: () => void; color: string;
  }) => {
    const ampm = value.slice(-2); // 'AM' or 'PM'
    const timeOnly = value.slice(0, -3); // e.g. '9:00'
    return (
      <View style={styles.timeStepper}>
        <TouchableOpacity style={[styles.timeStepBtn, { backgroundColor: c.bgSecondary }]} onPress={onMinus}>
          <Ionicons name="remove" size={14} color={color} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeDisplay, { backgroundColor: color + '18', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 3 }]}
          onPress={onToggleAmPm}
          activeOpacity={0.7}
        >
          <Text style={[styles.timeText, { color }]}>{timeOnly}</Text>
          <View style={{ backgroundColor: color + '30', borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ fontSize: 11, fontFamily: 'System', fontWeight: '700', color }}>{ampm}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.timeStepBtn, { backgroundColor: c.bgSecondary }]} onPress={onPlus}>
          <Ionicons name="add" size={14} color={color} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={styles.modalBg} onPress={onClose}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />

            <View style={styles.sheetHeaderRow}>
              <View style={[styles.routineIconCircle, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="sunny" size={22} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: c.text }]}>Set Today's Routine</Text>
                <Text style={[styles.sheetSub, { color: c.textMuted }]}>Set start & end time for each topic</Text>
              </View>
            </View>

            {/* Header row */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 4, marginBottom: 4 }}>
              <Text style={{ flex: 1, fontSize: 11, fontFamily: FONTS.bold, color: c.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 }}>Topic</Text>
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
                    style={[styles.routineTaskRow, { borderTopColor: c.border, borderTopWidth: i > 0 ? 1 : 0, flexWrap: 'wrap', gap: 8 }]}>
                    <View style={{ flex: 1, minWidth: 100 }}>
                      <Text style={[styles.routineTaskName, { color: c.text }]} numberOfLines={1}>{displayName}</Text>
                      {subject && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                          <Text style={[styles.routineTaskSub, { color: c.textFaint }]}>{subject.name}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Stepper
                        value={to12h(t.sh, t.sm)}
                        onMinus={() => adjust(task.id, 'start', -15)}
                        onPlus={() => adjust(task.id, 'start', 15)}
                        onToggleAmPm={() => toggleAmPm(task.id, 'start')}
                        color={color}
                      />
                      <Text style={{ color: c.textFaint, fontSize: 12 }}>→</Text>
                      <Stepper
                        value={to12h(t.eh, t.em)}
                        onMinus={() => adjust(task.id, 'end', -15)}
                        onPlus={() => adjust(task.id, 'end', 15)}
                        onToggleAmPm={() => toggleAmPm(task.id, 'end')}
                        color={color}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {overflowTasks.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginTop: 8 }}>
                <Ionicons name="information-circle" size={16} color="#D97706" />
                <Text style={{ flex: 1, fontSize: 12, fontFamily: 'System', color: '#92400E' }}>
                  {overflowTasks.length} task{overflowTasks.length > 1 ? 's' : ''} will move to tomorrow's plan
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: c.accent, marginTop: 8 }]}
              onPress={handleSave}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={[styles.saveTxt, { color: '#fff' }]}>Set Routine & Get Notified</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ color: c.textMuted, fontFamily: FONTS.regular, fontSize: 14 }}>
                I'll study without a schedule
              </Text>
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
  const { colors: c } = useTheme();
  const router = useRouter();
  const greeting = getGreeting();

  const todayMin = getTodayMinutes();
  const goalMin  = state.settings.dailyGoalMinutes;
  const progress = Math.min(todayMin / goalMin, 1);
  const today    = new Date().toISOString().split('T')[0];

  // Today's tasks across all plans (max 5 shown in list)
  const todayTasks = useMemo(() =>
    state.studyPlans.flatMap(p => p.tasks.filter(t => t.date === today)).slice(0, 5),
    [state.studyPlans, today]
  );

  // Tasks without a time set yet (for banner count)
  const unscheduledTasks = useMemo(() =>
    state.studyPlans.flatMap(p => p.tasks.filter(t => t.date === today && !t.completed && !t.startTime)),
    [state.studyPlans, today]
  );
  const needsRoutine = unscheduledTasks.length > 0;

  // ALL today's incomplete tasks → passed to modal so all 4 appear (not just unscheduled 3)
  const todayIncompleteTasks = useMemo(() =>
    state.studyPlans.flatMap(p => p.tasks.filter(t => t.date === today && !t.completed)),
    [state.studyPlans, today]
  );

  const [showRoutine, setShowRoutine] = useState(false);

  // Active task — refreshes every 30s
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);

  useFocusEffect(useCallback(() => {
    const refresh = () => setActiveTask(getActiveNowTask());
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [getActiveNowTask]));

  // Setup Android notification channel on mount
  useEffect(() => {
    setupAndroidChannel().catch(() => {});
    const t = setTimeout(() => rescheduleMissedTasks(), 2000);
    return () => clearTimeout(t);
  }, []);

  // Show routine modal automatically in the morning (once per day)
  useEffect(() => {
    const h = new Date().getHours();
    if (needsRoutine) {
      const timer = setTimeout(() => setShowRoutine(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [needsRoutine]);

  const [movedCount, setMovedCount] = useState(0);

  const handleSaveRoutine = async (
    updates: { id: string; startTime: string; endTime: string; movedToTomorrow?: boolean }[]
  ) => {
    // 1. Save times to tasks
    for (const plan of state.studyPlans) {
      const hasUpdates = plan.tasks.some(t => updates.find(u => u.id === t.id));
      if (!hasUpdates) continue;
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const updatedTasks = plan.tasks.map(task => {
        const u = updates.find(x => x.id === task.id);
        if (!u) return task;
        // If task overflowed past midnight, move it to tomorrow's date
        if (u.movedToTomorrow) {
          return { ...task, date: tomorrow, startTime: u.startTime, endTime: u.endTime };
        }
        return { ...task, startTime: u.startTime, endTime: u.endTime };
      });
      updateStudyPlan({ ...plan, tasks: updatedTasks });

      // Block routine handled below after notifications
    }

    // 3. Schedule notifications
    try {
      const taskNotifs = updates.map(u => {
        const task = state.studyPlans.flatMap(p => p.tasks).find(t => t.id === u.id);
        const subject = task ? state.subjects.find(s => s.id === task.subjectId) : null;
        const chapter = subject?.chapters.find(ch => ch.id === task?.chapterId);
        const topic   = chapter?.topics.find(t => t.id === task?.topicId);
        const name    = topic?.name ?? chapter?.name ?? 'Study task';
        return {
          date: today,
          startTime: u.startTime,
          topicName: name,
          subjectName: subject?.name ?? '',
          estimatedMinutes: task?.estimatedMinutes ?? 40,
        };
      });
      await scheduleTaskNotifications(taskNotifs);
    } catch {}

    // Auto-create per-task block routines (one per task, exact time window)
    const todayDay = new Date().getDay();

    for (const plan of state.studyPlans) {
      if (!plan.blockApps || plan.blockedApps.length === 0) continue;

      // Remove ALL old system routines for this plan
      state.blockRoutines
        .filter(r => r.fromPlanId === plan.id)
        .forEach(r => deleteBlockRoutine(r.id));

      // Create one routine per task
      for (const update of updates) {
        const task = plan.tasks.find(t => t.id === update.id);
        if (!task) continue;
        if (!update.startTime || !update.endTime) continue;

        // Get topic/chapter name for label
        const subject = state.subjects.find(s => s.id === task.subjectId);
        const chapter = subject?.chapters.find(ch => ch.id === task.chapterId);
        const topic   = chapter?.topics.find(t => t.id === task.topicId);
        const taskName = topic?.name ?? chapter?.name ?? 'Task';

        addBlockRoutine({
          id: `plan_${plan.id}_task_${task.id}`,
          name: `📚 ${taskName}`,
          startTime: update.startTime,
          endTime: update.endTime,
          days: [todayDay],
          blockedApps: plan.blockedApps,
          blockShorts: false,
          enabled: true,
          hardBlock: plan.hardBlock ?? false,
          deviceAdmin: plan.deviceAdmin ?? false,
          fromPlanId: plan.id,
        });
      }
    }

    const moved = updates.filter(u => u.movedToTomorrow).length;
    if (moved > 0) setMovedCount(moved);
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
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Sticky Header - outside ScrollView so it stays fixed while scrolling */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={[styles.header, { backgroundColor: c.bg }]}>
        <View>
          <View style={styles.greetingRow}>
            <Ionicons name={greeting.icon} size={16} color={greeting.color} />
            <Text style={[styles.greeting, { color: c.textMuted }]}> {greeting.text}</Text>
          </View>
          <Text style={[styles.appName, { color: c.text }]}>Focus On</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: '#FFF3E0' }]}
            onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="flame" size={17} color="#E65100" />
            <Text style={[styles.streakNum, { color: '#E65100' }]}>{state.streak}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: c.accentSoft }]}
            onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person" size={20} color={c.accent} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

      {/* Morning routine banner */}
      {needsRoutine && (
        <Animated.View entering={FadeInDown.delay(30).springify()}>
          <TouchableOpacity
            style={[styles.routineBanner, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}
            onPress={() => setShowRoutine(true)}>
            <View style={[styles.routineBannerIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="sunny" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.routineBannerTitle, { color: '#92400E' }]}>
                Set today's study routine
              </Text>
              <Text style={[styles.routineBannerSub, { color: '#B45309' }]}>
                {unscheduledTasks.length} task{unscheduledTasks.length > 1 ? 's' : ''} waiting · tap to schedule
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Active Task Banner */}
      {activeTask && (
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <ActiveTaskBanner task={activeTask} onPress={() => goToTimer(activeTask)} />
        </Animated.View>
      )}

      {/* Daily goal */}
      <Animated.View entering={FadeInDown.delay(80).springify()}
        style={[styles.goalCard, { backgroundColor: c.bgCard }]}>
        <View style={styles.goalTop}>
          <View style={styles.goalLabelRow}>
            <Ionicons name="trophy" size={15} color={c.accent} />
            <Text style={[styles.goalLabel, { color: c.textMuted }]}> Today's Goal</Text>
          </View>
          <Text style={[styles.goalTime, { color: c.accent }]}>{todayMin}m / {goalMin}m</Text>
        </View>
        <View style={[styles.progBg, { backgroundColor: c.border }]}>
          <View style={[styles.progFill, {
            backgroundColor: progress >= 1 ? c.success : c.accent,
            width: `${Math.round(progress * 100)}%`,
          }]} />
        </View>
        {progress >= 1 && (
          <View style={styles.goalDoneRow}>
            <Ionicons name="checkmark-circle" size={15} color={c.success} />
            <Text style={[styles.goalDone, { color: c.success }]}> Goal complete!</Text>
          </View>
        )}
      </Animated.View>

      {/* Start button */}
      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <StartButton
          onPress={() => goToTimer(activeTask ?? undefined)}
          color={activeTask ? activeTask.subjectColor : c.accent}
          darkColor={activeTask ? activeTask.subjectColor + 'CC' : c.accentDark}
          label={activeTask ? `Study ${activeTask.topicName}` : 'Start Focus'}
        />
      </Animated.View>

      {/* Today's tasks */}
      {todayTasks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(240).springify()}
          style={[styles.tasksCard, { backgroundColor: c.bgCard }]}>
          <View style={styles.tasksTitleRow}>
            <Ionicons name="calendar" size={15} color={c.accent} />
            <Text style={[styles.tasksTitle, { color: c.text }]}> Today's Plan</Text>
            {needsRoutine && (
              <TouchableOpacity
                style={[styles.setTimesBtn, { backgroundColor: c.accentSoft }]}
                onPress={() => setShowRoutine(true)}>
                <Ionicons name="time-outline" size={12} color={c.accent} />
                <Text style={[styles.setTimesTxt, { color: c.accent }]}>Set times</Text>
              </TouchableOpacity>
            )}
          </View>
          {todayTasks.map((task, i) => {
            const subject     = state.subjects.find(s => s.id === task.subjectId);
            const chapter     = subject?.chapters.find(ch => ch.id === task.chapterId);
            const topic       = chapter?.topics.find(t => t.id === task.topicId);
            const displayName = topic?.name ?? chapter?.name ?? 'Task';
            const isActive    = activeTask?.taskId === task.id;

            return (
              <TouchableOpacity key={task.id}
                style={[
                  styles.taskRow,
                  i < todayTasks.length - 1 && { borderBottomWidth: 1, borderColor: c.border },
                  isActive && { backgroundColor: c.accentSoft, borderRadius: 10, paddingHorizontal: 8 },
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
                activeOpacity={task.completed ? 1 : 0.75}>
                <View style={[styles.taskDot, {
                  backgroundColor: task.completed ? c.success : isActive ? c.accent : c.border,
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskName, { color: task.completed ? c.textMuted : c.text },
                    task.completed && styles.done]} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={[styles.taskSub, { color: c.textFaint }]}>
                    {subject?.name}
                    {task.startTime ? ` · ${task.startTime}` : ''}
                    {isActive ? ' · Now' : ''}
                  </Text>
                </View>
                {task.completed
                  ? <Ionicons name="checkmark-circle" size={18} color={c.success} />
                  : isActive
                    ? <Ionicons name="play-circle" size={20} color={c.accent} />
                    : null
                }
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}

      {/* Empty plan state */}
      {todayTasks.length === 0 && (
        <Animated.View entering={FadeInDown.delay(240).springify()}
          style={[styles.emptyPlan, { backgroundColor: c.bgCard }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: c.accentSoft }]}>
            <Ionicons name="calendar-outline" size={34} color={c.accent} />
          </View>
          <Text style={[styles.emptyTxt, { color: c.textMuted }]}>No plan for today</Text>
          <TouchableOpacity style={[styles.planBtn, { backgroundColor: c.accentSoft }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <Text style={[styles.planBtnTxt, { color: c.accent }]}>Create a plan</Text>
            <Ionicons name="arrow-forward" size={14} color={c.accent} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={{ height: 40 }} />

      {/* Moved to tomorrow toast */}
      {movedCount > 0 && (
        <Animated.View entering={FadeInDown.springify()}
          style={{
            position: 'absolute', bottom: 90, left: 16, right: 16,
            backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14,
            flexDirection: 'row', alignItems: 'center', gap: 10,
            shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 8,
          }}>
          <Ionicons name="calendar" size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: FONTS.bold, color: '#92400E' }}>
              {movedCount} task{movedCount > 1 ? 's' : ''} moved to tomorrow
            </Text>
            <Text style={{ fontSize: 11, fontFamily: FONTS.regular, color: '#B45309', marginTop: 2 }}>
              Time was past midnight — auto-rescheduled
            </Text>
          </View>
          <TouchableOpacity onPress={() => setMovedCount(0)}>
            <Ionicons name="close" size={18} color="#D97706" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Morning Routine Modal */}
      <MorningRoutineModal
        visible={showRoutine}
        tasks={todayIncompleteTasks}
        subjects={state.subjects}
        onSave={handleSaveRoutine}
        onClose={() => setShowRoutine(false)}
        colors={c}
      />
    </ScrollView>
    </View>
  );
}