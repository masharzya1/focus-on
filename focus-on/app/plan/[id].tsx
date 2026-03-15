import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';
import { isChapterOnly, type PlannedTask } from '@/types/study';
import { scheduleStudyCheckIns, schedulePostTaskUsageCheck } from '@/services/studyMonitor';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatDate(dateStr: string): string {
  const todayStr    = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dateStr === todayStr)    return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  const d = new Date(dateStr);
  return `${DAY_NAMES[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

// ── Date Picker Modal ─────────────────────────────────────────────────────────
function DatePickerModal({ visible, current, onClose, onSelect, colors: c }: {
  visible: boolean; current: string; onClose: () => void;
  onSelect: (d: string) => void; colors: any;
}) {
  const [offset, setOffset] = useState(0);
  const base = new Date();

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(base.getTime() + (offset * 14 + i) * 86400000);
    return {
      dateStr: d.toISOString().split('T')[0],
      label: String(d.getDate()),
      dayName: ['S','M','T','W','T','F','S'][d.getDay()],
    };
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={[{ borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 }, { backgroundColor: c.bgCard }]}
          onPress={e => e.stopPropagation()}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: c.text, marginBottom: 16 }}>Move to date</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setOffset(o => Math.max(0, o - 1))} style={{ opacity: offset === 0 ? 0.3 : 1, padding: 8 }}>
              <Ionicons name="chevron-back" size={22} color={c.accent} />
            </TouchableOpacity>
            <Text style={{ fontFamily: FONTS.semibold, color: c.textMuted, fontSize: 13 }}>
              {MONTHS_SHORT[new Date(days[0].dateStr).getMonth()]} – {MONTHS_SHORT[new Date(days[13].dateStr).getMonth()]}
            </Text>
            <TouchableOpacity onPress={() => setOffset(o => o + 1)} style={{ padding: 8 }}>
              <Ionicons name="chevron-forward" size={22} color={c.accent} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {days.map(day => {
              const isSel  = day.dateStr === current;
              const isPast = day.dateStr < new Date().toISOString().split('T')[0];
              return (
                <TouchableOpacity key={day.dateStr}
                  style={{
                    width: 44, height: 56, borderRadius: 12, alignItems: 'center',
                    justifyContent: 'center', borderWidth: 1.5,
                    backgroundColor: isSel ? c.accent : isPast ? c.bgSecondary : c.inputBg,
                    borderColor: isSel ? c.accent : c.border,
                    opacity: isPast ? 0.35 : 1,
                  }}
                  onPress={() => { if (!isPast) { onSelect(day.dateStr); onClose(); } }}>
                  <Text style={{ fontSize: 9, fontFamily: FONTS.semibold, color: isSel ? '#ffffffAA' : c.textFaint }}>{day.dayName}</Text>
                  <Text style={{ fontSize: 16, fontFamily: FONTS.bold, color: isSel ? '#fff' : c.text }}>{day.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0'); }
function to12h(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return { time: `${h12}:${pad(m)}`, ampm };
}
function parseTime(s?: string): { h: number; m: number } | null {
  if (!s) return null;
  const [h, m] = s.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { h, m };
}

// ── Time Edit Modal (per-task) ─────────────────────────────────────────────────
function TimeEditModal({ visible, task, taskName, subjectColor, onClose, onSave, colors: c }: {
  visible: boolean;
  task: { id: string; startTime?: string; endTime?: string; date: string } | null;
  taskName: string;
  subjectColor: string;
  onClose: () => void;
  onSave: (taskId: string, startTime: string, endTime: string, newDate?: string) => void;
  colors: any;
}) {
  const [sh, setSh] = useState(8);
  const [sm, setSm] = useState(0);
  const [eh, setEh] = useState(9);
  const [em, setEm] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!visible) { initialized.current = false; return; }
    if (initialized.current) return;
    initialized.current = true;

    if (task?.startTime && task?.endTime) {
      const s = parseTime(task.startTime);
      const e = parseTime(task.endTime);
      if (s) { setSh(s.h); setSm(s.m); }
      if (e) { setEh(e.h); setEm(e.m); }
    } else {
      // Default: current time rounded to nearest 15
      const now = new Date();
      let ch = now.getHours();
      let cm = Math.ceil(now.getMinutes() / 15) * 15;
      if (cm >= 60) { ch += 1; cm = 0; }
      if (ch > 23) { ch = 23; cm = 0; }
      setSh(ch); setSm(cm);
      const endM = ch * 60 + cm + 60; // allow overflow past midnight for display
      setEh(Math.floor(endM / 60)); setEm(endM % 60);
    }
  }, [visible]);

  if (!task) return null;

  const adjustStart = (dMin: number) => {
    let t = sh * 60 + sm + dMin;
    t = Math.max(0, t); // allow up to overflow
    const dur = (eh * 60 + em) - (sh * 60 + sm);
    const newEnd = t + Math.max(15, dur);
    setSh(Math.floor(t / 60)); setSm(t % 60);
    setEh(Math.floor(newEnd / 60)); setEm(newEnd % 60);
  };

  const adjustEnd = (dMin: number) => {
    let t = eh * 60 + em + dMin;
    t = Math.max(sh * 60 + sm + 15, t); // min 15 min
    setEh(Math.floor(t / 60)); setEm(t % 60);
  };

  const startOverflowsCheck = sh >= 24; // only start matters for moving to tomorrow
  const overflowsToTomorrow = startOverflowsCheck;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleSave = () => {
    // Store actual times — midnight crossing uses modulo
    // e.g. 23:45 start → 00:15 end is valid (task stays on today's date)
    // Only if START overflows does the task move to tomorrow
    const startOverflows = sh >= 24;
    const savedSh = sh % 24;
    const savedEh = eh % 24; // 24:00 → 00:00, 24:15 → 00:15, etc.
    const newDate = startOverflows ? tomorrow : undefined;
    onSave(task.id, `${pad(savedSh)}:${pad(sm)}`, `${pad(savedEh)}:${pad(em)}`, newDate);
    onClose();
  };

  const Stepper = ({ h, m, onMinus, onPlus, onToggleAmPm }: {
    h: number; m: number; onMinus: () => void; onPlus: () => void; onToggleAmPm: () => void;
  }) => {
    const { time, ampm } = to12h(h >= 24 ? h - 24 : h, m);
    const displayAmPm = h >= 24 ? (h - 24 >= 12 ? 'PM' : 'AM') : ampm;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TouchableOpacity
          style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.bgSecondary, alignItems: 'center', justifyContent: 'center' }}
          onPress={onMinus}>
          <Ionicons name="remove" size={15} color={subjectColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: subjectColor + '18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }}
          onPress={onToggleAmPm}>
          <Text style={{ fontSize: 16, fontFamily: 'System', fontWeight: '700', color: subjectColor }}>{time}</Text>
          <View style={{ backgroundColor: subjectColor + '30', borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: subjectColor }}>{displayAmPm}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.bgSecondary, alignItems: 'center', justifyContent: 'center' }}
          onPress={onPlus}>
          <Ionicons name="add" size={15} color={subjectColor} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={[{ borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 }, { backgroundColor: c.bgCard }]}
          onPress={e => e.stopPropagation()}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 20 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: subjectColor + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="time-outline" size={22} color={subjectColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: 'System', fontWeight: '700', color: c.text }}>{taskName}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Set start & end time</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Stepper
              h={sh} m={sm}
              onMinus={() => adjustStart(-15)}
              onPlus={() => adjustStart(15)}
              onToggleAmPm={() => {
                const t = sh * 60 + sm;
                const newT = t + (sh < 12 ? 12 * 60 : -12 * 60);
                const dur = (eh * 60 + em) - (sh * 60 + sm);
                setSh(Math.floor(Math.max(0, newT) / 60)); setSm(newT % 60);
                const ne = Math.max(0, newT) + Math.max(15, dur);
                setEh(Math.floor(ne / 60)); setEm(ne % 60);
              }}
            />
            <Text style={{ color: c.textFaint, fontSize: 16 }}>→</Text>
            <Stepper
              h={eh} m={em}
              onMinus={() => adjustEnd(-15)}
              onPlus={() => adjustEnd(15)}
              onToggleAmPm={() => {
                const cur = eh * 60 + em;
                const newT = cur + (eh < 12 ? 12 * 60 : -12 * 60);
                setEh(Math.floor(Math.max(sh * 60 + sm + 15, newT) / 60)); setEm(newT % 60);
              }}
            />
          </View>

          {(sh >= 24 || eh >= 24) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginTop: 14 }}>
              <Ionicons name="information-circle" size={16} color="#D97706" />
              <Text style={{ flex: 1, fontSize: 12, color: '#92400E' }}>{sh >= 24 ? "This task will move to tomorrow's plan" : 'End time clamped to 11:59 PM'}</Text>
            </View>
          )}

          <TouchableOpacity
            style={{ marginTop: 20, height: 52, borderRadius: 16, backgroundColor: subjectColor, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
            onPress={handleSave}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'System', fontWeight: '700' }}>Save Time</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: c.textMuted, fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    state, updateStudyPlan,
    rescheduleMissedTasks, getAdaptiveSuggestion, getAcceptanceRate,
  } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const plan = state.studyPlans.find(p => p.id === id);
  if (!plan) return null;

  const todayStr   = new Date().toISOString().split('T')[0];
  const doneTasks  = plan.tasks.filter(t => t.completed).length;
  const totalTasks = plan.tasks.length;
  const prog       = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;
  const daysLeft   = Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / 86400000);

  // Missed tasks count
  const missedCount = plan.tasks.filter(t => !t.completed && t.date < todayStr).length;

  // Adaptive suggestion
  const suggestion    = getAdaptiveSuggestion(plan.id);
  const acceptanceRate = getAcceptanceRate();

  // Date picker
  const [movingTask, setMovingTask] = useState<PlannedTask | null>(null);
  const [editingTimeTask, setEditingTimeTask] = useState<PlannedTask | null>(null);
  const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);
  const [rescheduledCount, setRescheduledCount] = useState(0);

  // Auto-check for missed tasks on mount
  useEffect(() => {
    if (missedCount > 0) setShowRescheduleConfirm(true);
  }, []);

  // Group tasks by date
  const byDate: Record<string, PlannedTask[]> = {};
  plan.tasks.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  });
  const dates = Object.keys(byDate).sort();

  const moveTask = (taskId: string, newDate: string) => {
    updateStudyPlan({
      ...plan,
      tasks: plan.tasks.map(t => t.id === taskId ? { ...t, date: newDate } : t),
    });
  };

  const deleteTask = (taskId: string) => {
    updateStudyPlan({ ...plan, tasks: plan.tasks.filter(t => t.id !== taskId) });
  };

  const toggleTask = (task: PlannedTask) => {
    updateStudyPlan({
      ...plan,
      tasks: plan.tasks.map(t =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      ),
    });
  };

  const saveTaskTime = (taskId: string, startTime: string, endTime: string, newDate?: string) => {
    const task = plan.tasks.find(t => t.id === taskId);
    updateStudyPlan({
      ...plan,
      tasks: plan.tasks.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, startTime, endTime, ...(newDate ? { date: newDate } : {}) };
      }),
    });
    // Schedule study monitor check-ins when time is set from plan page
    if (task) {
      const subject = state.subjects.find(s => s.id === task.subjectId);
      const chapter = subject?.chapters.find(ch => ch.id === task.chapterId);
      const topic = chapter?.topics.find(t => t.id === task.topicId);
      const taskDate = newDate ?? task.date;
      const topicName = topic?.name ?? chapter?.name ?? 'Study task';
      scheduleStudyCheckIns({
        id: taskId, topicName, subjectName: subject?.name ?? '',
        startTime, endTime, date: taskDate,
        estimatedMinutes: task.estimatedMinutes ?? 40,
      }).catch(() => {});
      schedulePostTaskUsageCheck({
        id: taskId, topicName, endTime, date: taskDate,
        estimatedMinutes: task.estimatedMinutes ?? 40,
      }).catch(() => {});
    }
  };

  const clearTaskTime = (taskId: string) => {
    updateStudyPlan({
      ...plan,
      tasks: plan.tasks.map(t => t.id === taskId ? { ...t, startTime: undefined, endTime: undefined } : t),
    });
  };

  const handleReschedule = () => {
    const count = rescheduleMissedTasks();
    setRescheduledCount(count);
    setShowRescheduleConfirm(false);
  };

  const getDisplayName = (task: PlannedTask): string => {
    const subject = state.subjects.find(s => s.id === task.subjectId);
    if (!subject) return 'Task';
    const chapter = subject.chapters.find(ch => ch.id === task.chapterId);
    if (!chapter || isChapterOnly(chapter)) return chapter?.name ?? 'Chapter';
    const topic = chapter.topics.find(t => t.id === task.topicId);
    return topic?.name ?? chapter.name;
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.bgCard }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.planName, { color: c.text }]}>{plan.examName}</Text>
          <Text style={[styles.planSub, { color: daysLeft <= 7 ? c.destructive : c.textMuted }]}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Exam day!'} · {prog}% done
          </Text>
        </View>
        {plan.blockApps && <Ionicons name="shield-checkmark" size={20} color={c.destructive} />}
      </View>

      {/* Progress */}
      <View style={[styles.progBg, { backgroundColor: c.border }]}>
        <View style={[styles.progFill, { backgroundColor: prog >= 100 ? c.success : c.accent, width: `${prog}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Acceptance rate card ── */}
        {(state as any).acceptanceRecords?.length >= 3 && (
          <Animated.View entering={FadeInDown.springify()}
            style={[styles.acceptanceCard, {
              backgroundColor: acceptanceRate >= 0.7 ? c.accentSoft : '#FEF3C7',
              borderColor: acceptanceRate >= 0.7 ? c.accent + '40' : '#FCD34D',
            }]}>
            <View style={styles.acceptanceLeft}>
              <Text style={[styles.acceptanceRate, { color: acceptanceRate >= 0.7 ? c.accent : '#D97706' }]}>
                {Math.round(acceptanceRate * 100)}%
              </Text>
              <Text style={[styles.acceptanceLabel, { color: acceptanceRate >= 0.7 ? c.accent : '#92400E' }]}>
                completion rate
              </Text>
            </View>
            {suggestion && (
              <Text style={[styles.acceptanceSug, { color: acceptanceRate >= 0.7 ? c.accent : '#92400E' }]}>
                {suggestion}
              </Text>
            )}
          </Animated.View>
        )}

        {/* ── Rescheduled confirmation ── */}
        {rescheduledCount > 0 && (
          <Animated.View entering={FadeInDown.springify()}
            style={[styles.rescheduledBanner, { backgroundColor: c.accentSoft, borderColor: c.accent + '40' }]}>
            <Ionicons name="checkmark-circle" size={18} color={c.accent} />
            <Text style={[styles.rescheduledTxt, { color: c.accent }]}>
              {rescheduledCount} missed task{rescheduledCount > 1 ? 's' : ''} moved to upcoming days
            </Text>
          </Animated.View>
        )}

        {/* Hint */}
        <View style={[styles.hintBar, { backgroundColor: c.bgSecondary }]}>
          <Ionicons name="information-circle-outline" size={12} color={c.textFaint} />
          <Text style={[styles.hintTxt, { color: c.textFaint }]}>
            Tap to complete · Calendar icon to reschedule · Long press to delete
          </Text>
        </View>

        {dates.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: c.textMuted, fontFamily: FONTS.regular }}>No tasks scheduled.</Text>
          </View>
        )}

        {dates.map((date, di) => {
          const isToday = date === todayStr;
          const isPast  = date < todayStr;
          const tasks   = byDate[date];
          const allDone = tasks.every(t => t.completed);

          return (
            <Animated.View key={date} entering={FadeInDown.delay(di * 35).springify()}>
              {/* Date header */}
              <View style={styles.dateHeader}>
                <View style={styles.dateLabelRow}>
                  {isPast && !allDone && (
                    <Ionicons name="alert-circle" size={14} color={c.destructive} />
                  )}
                  <Text style={[styles.dateLabel, {
                    color: isToday ? c.accent : isPast ? (allDone ? c.textFaint : c.destructive) : c.textMuted,
                    fontSize: isToday ? 15 : 13,
                  }]}>
                    {formatDate(date)}
                  </Text>
                </View>
                <View style={[styles.taskCountBadge, {
                  backgroundColor: isToday ? c.accentSoft : allDone ? c.success + '18' : c.bgSecondary,
                }]}>
                  <Text style={{
                    fontSize: 11, fontFamily: FONTS.bold,
                    color: isToday ? c.accent : allDone ? c.success : c.textFaint,
                  }}>
                    {tasks.filter(t => t.completed).length}/{tasks.length}
                  </Text>
                </View>
              </View>

              {tasks.map(task => {
                const subject     = state.subjects.find(s => s.id === task.subjectId);
                const displayName = getDisplayName(task);
                const isReview    = task.type === 'revision';

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskCard, {
                      backgroundColor: isToday ? c.bgCard : c.bgSecondary,
                      borderLeftColor: task.completed ? c.success
                        : isReview ? '#8B5CF6'
                        : isToday ? c.accent
                        : isPast ? c.destructive
                        : c.border,
                      opacity: isPast && !task.completed ? 0.8 : 1,
                    }]}
                    onPress={() => toggleTask(task)}
                    onLongPress={() => deleteTask(task.id)}
                    activeOpacity={0.8}
                  >
                    {/* Checkbox */}
                    <View style={[styles.checkBox, {
                      borderColor: task.completed ? c.success : c.border,
                      backgroundColor: task.completed ? c.success : 'transparent',
                    }]}>
                      {task.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskName, { color: task.completed ? c.textMuted : c.text },
                        task.completed && styles.taskDone]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <View style={styles.taskMeta}>
                        {subject && (
                          <>
                            <View style={[styles.subjectDot, { backgroundColor: subject.color }]} />
                            <Text style={[styles.taskSub, { color: c.textFaint }]}>{subject.name}</Text>
                          </>
                        )}
                        {isReview && (
                          <View style={[styles.reviewBadge, { backgroundColor: '#8B5CF6' + '20' }]}>
                            <Text style={{ fontSize: 10, fontFamily: FONTS.bold, color: '#8B5CF6' }}>REVIEW</Text>
                          </View>
                        )}
                        {task.startTime && (
                          <Text style={[styles.taskSub, { color: c.textFaint }]}> · {task.startTime}–{task.endTime}</Text>
                        )}
                      </View>
                    </View>

                    {/* Action buttons: time + date */}
                    {!task.completed && (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {/* Time edit button */}
                        <TouchableOpacity
                          style={[styles.moveBtn, {
                            backgroundColor: task.startTime ? (subject?.color ?? c.accent) + '20' : c.bgSecondary,
                          }]}
                          onPress={() => setEditingTimeTask(task)}>
                          <Ionicons
                            name={task.startTime ? 'time' : 'time-outline'}
                            size={15}
                            color={task.startTime ? (subject?.color ?? c.accent) : c.textFaint}
                          />
                        </TouchableOpacity>
                        {/* Date move button */}
                        <TouchableOpacity
                          style={[styles.moveBtn, { backgroundColor: c.accentSoft }]}
                          onPress={() => setMovingTask(task)}>
                          <Ionicons name="calendar-outline" size={15} color={c.accent} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          );
        })}

        {/* Revision days footer */}
        {(plan.revisionDays ?? 0) > 0 && (
          <View style={[styles.revisionBanner, { backgroundColor: c.accentSoft }]}>
            <Ionicons name="refresh-circle-outline" size={18} color={c.accent} />
            <Text style={{ fontFamily: FONTS.medium, color: c.accent, fontSize: 13 }}>
              {plan.revisionDays} revision day{plan.revisionDays > 1 ? 's' : ''} reserved before exam
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Missed tasks modal ── */}
      <Modal visible={showRescheduleConfirm} transparent animationType="fade"
        onRequestClose={() => setShowRescheduleConfirm(false)}>
        <Pressable style={{ flex: 1, backgroundColor: '#00000077', alignItems: 'center', justifyContent: 'center', padding: 32 }}
          onPress={() => setShowRescheduleConfirm(false)}>
          <Animated.View entering={FadeInUp.springify()}
            style={[styles.rescheduleCard, { backgroundColor: c.bgCard }]}
            onStartShouldSetResponder={() => true}>
            <View style={[styles.rescheduleIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar" size={30} color="#D97706" />
            </View>
            <Text style={[styles.rescheduleTitle, { color: c.text }]}>
              {missedCount} missed task{missedCount > 1 ? 's' : ''}
            </Text>
            <Text style={[styles.rescheduleDesc, { color: c.textMuted }]}>
              You have incomplete tasks from previous days. Move them to upcoming study days?
            </Text>
            <TouchableOpacity
              style={[styles.rescheduleBtn, { backgroundColor: c.accent }]}
              onPress={handleReschedule}>
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 15 }}>Reschedule Automatically</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rescheduleBtn, { backgroundColor: c.bgSecondary }]}
              onPress={() => setShowRescheduleConfirm(false)}>
              <Text style={{ color: c.textMuted, fontFamily: FONTS.medium, fontSize: 14 }}>Keep as is</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Date picker */}
      {movingTask && (
        <DatePickerModal
          visible={!!movingTask}
          current={movingTask.date}
          colors={c}
          onClose={() => setMovingTask(null)}
          onSelect={newDate => { moveTask(movingTask.id, newDate); setMovingTask(null); }}
        />
      )}

      {/* Time editor */}
      {editingTimeTask && (() => {
        const subject = state.subjects.find(s => s.id === editingTimeTask.subjectId);
        const taskName = getDisplayName(editingTimeTask);
        return (
          <TimeEditModal
            visible={!!editingTimeTask}
            task={editingTimeTask}
            taskName={taskName}
            subjectColor={subject?.color ?? c.accent}
            colors={c}
            onClose={() => setEditingTimeTask(null)}
            onSave={(taskId, startTime, endTime, newDate) => {
              saveTaskTime(taskId, startTime, endTime, newDate);
              setEditingTimeTask(null);
            }}
          />
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14 },
  backBtn: { padding: 4 },
  planName: { fontSize: 18, fontFamily: FONTS.bold },
  planSub: { fontSize: 12, marginTop: 2, fontFamily: FONTS.regular },
  progBg: { height: 3 },
  progFill: { height: '100%' },
  content: { padding: 16 },
  acceptanceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  acceptanceLeft: { alignItems: 'center' },
  acceptanceRate: { fontSize: 22, fontFamily: FONTS.bold },
  acceptanceLabel: { fontSize: 10, fontFamily: FONTS.medium },
  acceptanceSug: { flex: 1, fontSize: 13, fontFamily: FONTS.regular, lineHeight: 18 },
  rescheduledBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  rescheduledTxt: { fontSize: 13, fontFamily: FONTS.semibold },
  hintBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  hintTxt: { fontSize: 11, fontFamily: FONTS.regular },
  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  dateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateLabel: { fontFamily: FONTS.bold },
  taskCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  taskCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.xl, marginBottom: 8, borderLeftWidth: 3 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskName: { fontSize: 14, fontFamily: FONTS.semibold, marginBottom: 3 },
  taskDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  subjectDot: { width: 7, height: 7, borderRadius: 4 },
  taskSub: { fontSize: 11, fontFamily: FONTS.regular },
  reviewBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  moveBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  revisionBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: RADIUS.xl, marginTop: 16 },
  // Reschedule modal
  rescheduleCard: { borderRadius: 28, padding: 28, alignItems: 'center', width: '100%', gap: 12 },
  rescheduleIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  rescheduleTitle: { fontSize: 20, fontFamily: FONTS.bold },
  rescheduleDesc: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  rescheduleBtn: { width: '100%', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
});
