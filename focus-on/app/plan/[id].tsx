import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, completePlanTask } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const plan = state.studyPlans.find(p => p.id === id);
  if (!plan) return null;

  const today = new Date().toISOString().split('T')[0];
  const doneTasks = plan.tasks.filter(t => t.completed).length;
  const prog = plan.tasks.length > 0 ? Math.round((doneTasks / plan.tasks.length) * 100) : 0;
  const daysLeft = Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / 86400000);

  // Group tasks by date
  const byDate: { [date: string]: typeof plan.tasks } = {};
  plan.tasks.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  });
  const dates = Object.keys(byDate).sort();

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgCard }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.planName, { color: c.text }]}>{plan.examName}</Text>
          <Text style={[styles.planSub, { color: daysLeft <= 7 ? c.destructive : c.textMuted }]}>
            {daysLeft > 0 ? `${daysLeft} দিন বাকি` : 'আজই!'} · {prog}% শেষ
          </Text>
        </View>
        {plan.blockApps && <Ionicons name="shield-checkmark" size={20} color={c.destructive} />}
      </View>

      <View style={[styles.progBg, { backgroundColor: c.border }]}>
        <View style={[styles.progFill, { backgroundColor: c.accent, width: `${prog}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {dates.map((date, di) => {
          const isToday = date === today;
          const tasks = byDate[date];
          return (
            <Animated.View key={date} entering={FadeInDown.delay(di * 50).springify()}>
              <View style={styles.dateHeader}>
                <Text style={[styles.dateLabel, { color: isToday ? c.accent : c.textMuted },
                  isToday && styles.todayLabel]}>
                  {isToday ? '📌 আজ' : date}
                </Text>
              </View>
              {tasks.map(task => {
                const subject = state.subjects.find(s => s.id === task.subjectId);
                const topic = subject?.chapters.flatMap(ch => ch.topics).find(t => t.id === task.topicId);
                return (
                  <TouchableOpacity key={task.id}
                    style={[styles.taskCard, { backgroundColor: isToday ? c.bgCard : c.bgSecondary,
                      borderLeftColor: task.completed ? c.success : isToday ? c.accent : c.border }]}
                    onPress={() => !task.completed && completePlanTask(task.id)}>
                    <View style={[styles.checkBox, { borderColor: task.completed ? c.success : c.border,
                      backgroundColor: task.completed ? c.success : 'transparent' }]}>
                      {task.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskName, { color: task.completed ? c.textMuted : c.text },
                        task.completed && styles.taskDone]} numberOfLines={1}>
                        {topic?.name || 'Topic'}
                      </Text>
                      <Text style={[styles.taskSub, { color: c.textFaint }]}>
                        {subject?.name}
                        {task.startTime ? ` · ${task.startTime}–${task.endTime}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.taskMins, { color: c.textFaint }]}>{task.estimatedMinutes}m</Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14 },
  backBtn: { padding: 4 },
  planName: { fontSize: 18, fontWeight: '800' },
  planSub: { fontSize: 12, marginTop: 2 },
  progBg: { height: 3 },
  progFill: { height: '100%' },
  content: { padding: 16 },
  dateHeader: { marginTop: 8, marginBottom: 8 },
  dateLabel: { fontSize: 13, fontWeight: '700' },
  todayLabel: { fontSize: 15 },
  taskCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: RADIUS.xl, marginBottom: 8, borderLeftWidth: 4 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  taskName: { fontSize: 14, fontWeight: '700' },
  taskDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskSub: { fontSize: 11, marginTop: 2 },
  taskMins: { fontSize: 12, fontWeight: '600' },
});
