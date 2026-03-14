import React, { useState, useMemo } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
=======
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

<<<<<<< HEAD
const MONTH_BN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const DAY_BN = ['র','স','ম','বু','বৃ','শু','শ'];

export default function CalendarScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const year = date.getFullYear();
  const month = date.getMonth();
=======
export default function CalendarScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const dayData = useMemo(() => {
<<<<<<< HEAD
    const data: Record<string, { mins: number; tasks: number; examDay: boolean }> = {};
    state.sessions.filter(s => s.completed).forEach(s => {
      const d = s.startTime.split('T')[0];
      if (!data[d]) data[d] = { mins: 0, tasks: 0, examDay: false };
      data[d].mins += s.durationMinutes;
    });
    state.studyPlans.forEach(p => {
      p.tasks.forEach(t => {
        if (!data[t.date]) data[t.date] = { mins: 0, tasks: 0, examDay: false };
        data[t.date].tasks++;
      });
      if (data[p.examDate]) data[p.examDate].examDay = true;
      else data[p.examDate] = { mins: 0, tasks: 0, examDay: true };
    });
    return data;
  }, [state]);

  const selectedData = selected ? dayData[selected] : null;
  const selectedTasks = selected
    ? state.studyPlans.flatMap(p => p.tasks.filter(t => t.date === selected))
    : [];

  const prevMonth = () => setDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Calendar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <Animated.View entering={FadeInDown.delay(60).springify()}
          style={[styles.card, { backgroundColor: c.bgCard }]}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: c.bgSecondary }]}>
              <Ionicons name="chevron-back" size={18} color={c.accent} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: c.text }]}>
              {MONTH_BN[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, { backgroundColor: c.bgSecondary }]}>
=======
    const data: Record<string, { minutes: number; tasks: number; hasExam: boolean }> = {};
    state.sessions.forEach(s => {
      if (!s.completed) return;
      const d = s.startTime.split('T')[0];
      if (!data[d]) data[d] = { minutes: 0, tasks: 0, hasExam: false };
      data[d].minutes += s.durationMinutes;
    });
    state.studyPlans.forEach(p => {
      p.tasks.forEach(t => {
        if (!data[t.date]) data[t.date] = { minutes: 0, tasks: 0, hasExam: false };
        data[t.date].tasks += 1;
      });
      if (!data[p.examDate]) data[p.examDate] = { minutes: 0, tasks: 0, hasExam: false };
      data[p.examDate].hasExam = true;
    });
    return data;
  }, [state.sessions, state.studyPlans]);

  const [selectedDay, setSelectedDay] = useState<string|null>(today);
  const selData = selectedDay ? dayData[selectedDay] : null;
  const selTasks = selectedDay ? state.studyPlans.flatMap(p => p.tasks.filter(t => t.date === selectedDay).map(t => ({ ...t, examName: p.examName }))) : [];
  const selSessions = selectedDay ? state.sessions.filter(s => s.startTime.startsWith(selectedDay || '')) : [];

  const monthName = currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(400)} style={cal.header}>
        <Text style={[cal.title, { color: c.text }]}>Calendar</Text>
        <Text style={[cal.subtitle, { color: c.textMuted }]}>Your study schedule</Text>
      </Animated.View>

      <View style={{ padding: 16 }}>
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={[cal.calCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          {/* Month nav */}
          <View style={cal.monthNav}>
            <TouchableOpacity
              style={[cal.navBtn, { backgroundColor: c.accentSoft }]}
              onPress={() => setCurrentDate(new Date(year, month-1, 1))}
            >
              <Ionicons name="chevron-back" size={18} color={c.accent} />
            </TouchableOpacity>
            <Text style={[cal.monthName, { color: c.text }]}>{monthName}</Text>
            <TouchableOpacity
              style={[cal.navBtn, { backgroundColor: c.accentSoft }]}
              onPress={() => setCurrentDate(new Date(year, month+1, 1))}
            >
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
              <Ionicons name="chevron-forward" size={18} color={c.accent} />
            </TouchableOpacity>
          </View>

<<<<<<< HEAD
          {/* Day labels */}
          <View style={styles.dayLabels}>
            {DAY_BN.map(d => (
              <Text key={d} style={[styles.dayLabel, { color: c.textFaint }]}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e${i}`} style={styles.cell} />;
              const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const info = dayData[dateStr];
              const isToday = dateStr === today;
              const isSel = dateStr === selected;
              return (
                <TouchableOpacity key={i} style={[styles.cell, styles.cellBtn,
                  isToday && { backgroundColor: c.accent },
                  isSel && !isToday && { backgroundColor: c.accentSoft },
                ]}
                  onPress={() => setSelected(isSel ? null : dateStr)}>
                  <Text style={[styles.dayNum, { color: isToday ? '#fff' : c.text }]}>{day}</Text>
                  {info?.mins > 0 && <View style={[styles.dot, { backgroundColor: isToday ? '#fff' : c.success }]} />}
                  {info?.tasks > 0 && !info?.mins && <View style={[styles.dot, { backgroundColor: isToday ? '#fff' : c.accent }]} />}
                  {info?.examDay && <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />}
=======
          {/* Day names */}
          <View style={cal.dayNamesRow}>
            {DAY_NAMES.map(d => <Text key={d} style={[cal.dayName, { color: c.textFaint }]}>{d}</Text>)}
          </View>

          {/* Days grid */}
          <View style={cal.grid}>
            {Array.from({ length: firstDay }).map((_, i) => <View key={`e${i}`} style={cal.dayCell} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
              const dd = dayData[dateStr];
              const isToday = dateStr === today;
              const isSel = dateStr === selectedDay;
              return (
                <TouchableOpacity
                  key={dayNum}
                  style={[cal.dayCell, isSel && { backgroundColor: c.accent, borderRadius: RADIUS.md }]}
                  onPress={() => setSelectedDay(isSel ? null : dateStr)}
                >
                  <Text style={[cal.dayNum, {
                    color: isSel ? '#fff' : isToday ? c.accent : c.text,
                    fontWeight: (isToday || isSel) ? '800' : '500',
                  }]}>{dayNum}</Text>
                  <View style={cal.dayDots}>
                    {dd?.minutes > 0 && <View style={[cal.dot, { backgroundColor: isSel ? '#fff' : c.success }]} />}
                    {dd?.tasks > 0 && <View style={[cal.dot, { backgroundColor: isSel ? '#fff' : c.accent }]} />}
                    {dd?.hasExam && <View style={[cal.dot, { backgroundColor: isSel ? '#fff' : c.destructive }]} />}
                  </View>
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
<<<<<<< HEAD
          <View style={styles.legend}>
            {[
              { color: c.success, label: 'পড়া হয়েছে' },
              { color: c.accent, label: 'Plan আছে' },
              { color: '#EF4444', label: 'Exam' },
            ].map(item => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: c.textFaint }]}>{item.label}</Text>
=======
          <View style={[cal.legend, { borderTopColor: c.border }]}>
            {[
              { color: c.success, label: 'Studied', icon: 'time-outline' as const },
              { color: c.accent, label: 'Task', icon: 'list-outline' as const },
              { color: c.destructive, label: 'Exam', icon: 'alert-circle-outline' as const },
            ].map(l => (
              <View key={l.label} style={cal.legendItem}>
                <View style={[cal.legendDot, { backgroundColor: l.color }]} />
                <Text style={[cal.legendText, { color: c.textMuted }]}>{l.label}</Text>
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
              </View>
            ))}
          </View>
        </Animated.View>

<<<<<<< HEAD
        {/* Selected day detail */}
        {selected && (
          <Animated.View entering={FadeInDown.springify()}
            style={[styles.card, { backgroundColor: c.bgCard }]}>
            <Text style={[styles.selTitle, { color: c.text }]}>{selected}</Text>
            {selectedData?.mins ? (
              <View style={[styles.infoRow, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="time-outline" size={16} color={c.accent} />
                <Text style={[styles.infoTxt, { color: c.accent }]}>{selectedData.mins} মিনিট পড়া হয়েছে</Text>
              </View>
            ) : null}
            {selectedTasks.length === 0 && !selectedData?.mins ? (
              <Text style={[styles.noData, { color: c.textFaint }]}>এই দিনে কিছু নেই</Text>
            ) : null}
            {selectedTasks.map(task => {
              const subject = state.subjects.find(s => s.id === task.subjectId);
              const topic = subject?.chapters.flatMap(ch => ch.topics).find(t => t.id === task.topicId);
              return (
                <View key={task.id} style={[styles.taskRow, { borderColor: c.border }]}>
                  <View style={[styles.taskDot, { backgroundColor: task.completed ? c.success : c.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskName, { color: c.text }, task.completed && styles.done]}>{topic?.name || 'Topic'}</Text>
                    <Text style={[styles.taskSub, { color: c.textFaint }]}>
                      {subject?.name}{task.startTime ? ` · ${task.startTime}–${task.endTime}` : ''}
                    </Text>
                  </View>
                  {task.completed && <Ionicons name="checkmark-circle" size={16} color={c.success} />}
                </View>
              );
            })}
          </Animated.View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 14 },
  card: { borderRadius: RADIUS.xl, padding: 18 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 17, fontWeight: '800' },
  dayLabels: { flexDirection: 'row', marginBottom: 6 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellBtn: { borderRadius: 10 },
  dayNum: { fontSize: 13, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#E4E2FF' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11 },
  selTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginBottom: 10 },
  infoTxt: { fontSize: 14, fontWeight: '600' },
  noData: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskName: { fontSize: 14, fontWeight: '600' },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskSub: { fontSize: 11, marginTop: 2 },
=======
        {/* Selected day */}
        {selectedDay && (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={[cal.detailCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={cal.detailHeader}>
              <View style={[cal.detailIconBox, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="calendar" size={18} color={c.accent} />
              </View>
              <Text style={[cal.detailTitle, { color: c.text }]}>
                {selectedDay === today ? 'Today' : new Date(selectedDay).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              {selSessions.length > 0 && (
                <View style={[cal.timeBadge, { backgroundColor: c.success + '20' }]}>
                  <Ionicons name="time" size={12} color={c.success} />
                  <Text style={[cal.timeBadgeText, { color: c.success }]}>{selData?.minutes}m</Text>
                </View>
              )}
            </View>

            {selTasks.length > 0 ? selTasks.map(t => {
              let topicName = '';
              for (const sub of state.subjects) for (const ch of sub.chapters) {
                const tp = ch.topics.find(x => x.id === t.topicId);
                if (tp) { topicName = tp.name; break; }
              }
              const sub = state.subjects.find(s => s.id === t.subjectId);
              return (
                <View key={t.id} style={[cal.taskRow, { borderBottomColor: c.border }]}>
                  <View style={[cal.taskDot, { backgroundColor: sub?.color || c.accent }]} />
                  <Text style={[cal.taskText, { color: c.text }]} numberOfLines={1}>{topicName || 'Task'}</Text>
                  <Text style={[cal.taskMeta, { color: c.textMuted }]}>{t.type} · {t.estimatedMinutes}m</Text>
                </View>
              );
            }) : (
              <Text style={[{ color: c.textFaint, fontSize: 13, marginTop: 4 }]}>No tasks for this day</Text>
            )}
          </Animated.View>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const cal = StyleSheet.create({
  header:   { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  calCard:  { borderRadius: RADIUS.xl, padding: 18, borderWidth: 1, marginBottom: 12 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn:   { width: 38, height: 38, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  monthName: { fontSize: 17, fontWeight: '800' },
  dayNamesRow: { flexDirection: 'row', marginBottom: 8 },
  dayName: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  dayNum: { fontSize: 13 },
  dayDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 22, paddingTop: 14, marginTop: 10, borderTopWidth: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '500' },
  detailCard: { borderRadius: RADIUS.xl, padding: 18, borderWidth: 1 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  detailIconBox: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  timeBadgeText: { fontSize: 12, fontWeight: '700' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  taskDot:  { width: 10, height: 10, borderRadius: 5 },
  taskText: { flex: 1, fontSize: 13, fontWeight: '600' },
  taskMeta: { fontSize: 11 },
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
});
