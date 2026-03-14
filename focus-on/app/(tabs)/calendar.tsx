import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

export default function CalendarScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const dayData = useMemo(() => {
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
              <Ionicons name="chevron-forward" size={18} color={c.accent} />
            </TouchableOpacity>
          </View>

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
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={[cal.legend, { borderTopColor: c.border }]}>
            {[
              { color: c.success, label: 'Studied', icon: 'time-outline' as const },
              { color: c.accent, label: 'Task', icon: 'list-outline' as const },
              { color: c.destructive, label: 'Exam', icon: 'alert-circle-outline' as const },
            ].map(l => (
              <View key={l.label} style={cal.legendItem}>
                <View style={[cal.legendDot, { backgroundColor: l.color }]} />
                <Text style={[cal.legendText, { color: c.textMuted }]}>{l.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

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
});
