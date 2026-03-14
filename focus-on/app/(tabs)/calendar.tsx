import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

const MONTH_BN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_BN = ['S','M','T','W','T','F','S'];

export default function CalendarScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const dayData = useMemo(() => {
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
              <Ionicons name="chevron-forward" size={18} color={c.accent} />
            </TouchableOpacity>
          </View>

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
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {[
              { color: c.success, label: 'Studied' },
              { color: c.accent, label: 'Planned' },
              { color: '#EF4444', label: 'Exam' },
            ].map(item => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: c.textFaint }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Selected day detail */}
        {selected && (
          <Animated.View entering={FadeInDown.springify()}
            style={[styles.card, { backgroundColor: c.bgCard }]}>
            <Text style={[styles.selTitle, { color: c.text }]}>{selected}</Text>
            {selectedData?.mins ? (
              <View style={[styles.infoRow, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="time-outline" size={16} color={c.accent} />
                <Text style={[styles.infoTxt, { color: c.accent }]}>{selectedData.mins}  minutes studied</Text>
              </View>
            ) : null}
            {selectedTasks.length === 0 && !selectedData?.mins ? (
              <Text style={[styles.noData, { color: c.textFaint }]}>Nothing scheduled this day.</Text>
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
});
