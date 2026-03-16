import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS } from '@/constants/theme';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CompletedTasksScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  // Completed plan tasks
  const completedPlanTasks = state.studyPlans.flatMap(plan =>
    plan.tasks.filter(t => t.completed).map(t => {
      const subject = state.subjects.find(s => s.id === t.subjectId);
      const chapter = subject?.chapters.find(ch => ch.id === t.chapterId);
      const topic   = chapter?.topics.find(tp => tp.id === t.topicId);
      return {
        id: t.id,
        name: topic?.name ?? chapter?.name ?? 'Task',
        subjectName: subject?.name ?? '',
        subjectColor: subject?.color ?? c.accent,
        subjectIcon: (subject?.icon ?? 'book-outline') as any,
        planName: plan.examName,
        date: t.date,
      };
    })
  ).sort((a, b) => b.date.localeCompare(a.date));

  // Completed topics (directly)
  const completedTopics = state.subjects.flatMap(sub =>
    sub.chapters.flatMap(ch => {
      const chCompleted = ch.completed && ch.topics.length === 0 ? [{
        id: ch.id,
        name: ch.name,
        subjectName: sub.name,
        subjectColor: sub.color,
        subjectIcon: (sub.icon) as any,
        completedAt: ch.completedAt ?? '',
        isChapter: true,
      }] : [];
      const topicsDone = ch.topics.filter(t => t.completed).map(t => ({
        id: t.id,
        name: t.name,
        subjectName: sub.name,
        subjectColor: sub.color,
        subjectIcon: (sub.icon) as any,
        completedAt: t.completedAt ?? '',
        isChapter: false,
      }));
      return [...chCompleted, ...topicsDone];
    })
  ).sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const total = completedPlanTasks.length + completedTopics.length;

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: c.text }]}>Completed Tasks</Text>
        <View style={[st.countBadge, { backgroundColor: c.accentSoft }]}>
          <Text style={[st.countTxt, { color: c.accent }]}>{total}</Text>
        </View>
      </View>

      {total === 0 ? (
        <View style={st.empty}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={c.textFaint} />
          <Text style={[st.emptyTxt, { color: c.textMuted }]}>No completed tasks yet</Text>
          <Text style={[st.emptySub, { color: c.textFaint }]}>Complete topics and plan tasks to see them here</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

          {completedTopics.length > 0 && (
            <>
              <Text style={[st.sectionLabel, { color: c.textMuted }]}>TOPICS & CHAPTERS</Text>
              <View style={[st.card, { backgroundColor: c.bgCard }]}>
                {completedTopics.map((item, i) => (
                  <View key={item.id}
                    style={[st.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                    <View style={[st.iconWrap, { backgroundColor: item.subjectColor + '20' }]}>
                      <Ionicons name={item.subjectIcon} size={16} color={item.subjectColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.rowTitle, { color: c.text }]}>{item.name}</Text>
                      <Text style={[st.rowSub, { color: c.textFaint }]}>
                        {item.subjectName}
                        {item.completedAt ? ` · ${formatDate(item.completedAt)}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                ))}
              </View>
            </>
          )}

          {completedPlanTasks.length > 0 && (
            <>
              <Text style={[st.sectionLabel, { color: c.textMuted }]}>PLAN TASKS</Text>
              <View style={[st.card, { backgroundColor: c.bgCard }]}>
                {completedPlanTasks.map((item, i) => (
                  <View key={item.id}
                    style={[st.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                    <View style={[st.iconWrap, { backgroundColor: item.subjectColor + '20' }]}>
                      <Ionicons name={item.subjectIcon} size={16} color={item.subjectColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.rowTitle, { color: c.text }]}>{item.name}</Text>
                      <Text style={[st.rowSub, { color: c.textFaint }]}>
                        {item.subjectName} · {item.planName} · {item.date}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                ))}
              </View>
            </>
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: FONTS.bold },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countTxt: { fontSize: 13, fontFamily: FONTS.bold },
  content: { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, paddingHorizontal: 4, paddingTop: 4 },
  card: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontFamily: FONTS.semibold },
  rowSub: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTxt: { fontSize: 18, fontFamily: FONTS.bold },
  emptySub: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', paddingHorizontal: 32 },
});