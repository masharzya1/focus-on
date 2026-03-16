import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FONTS } from '@/constants/theme';

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d >= today) return 'Today';
  if (d >= yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDur(min: number) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function SessionHistoryScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const t = useT();
  const router = useRouter();

  const sessions = [...state.sessions]
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const totalMin = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: c.text }]}>Session History</Text>
        <View style={{ width: 24 }} />
      </View>

      {sessions.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="timer-outline" size={48} color={c.textFaint} />
          <Text style={[st.emptyTxt, { color: c.textMuted }]}>No sessions yet</Text>
          <Text style={[st.emptySub, { color: c.textFaint }]}>Complete focus sessions to see your history</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <View style={[st.summaryCard, { backgroundColor: c.bgCard }]}>
            <View style={st.summaryItem}>
              <Text style={[st.summaryVal, { color: c.accent }]}>{sessions.length}</Text>
              <Text style={[st.summaryLbl, { color: c.textMuted }]}>Total Sessions</Text>
            </View>
            <View style={[st.summaryDiv, { backgroundColor: c.border }]} />
            <View style={st.summaryItem}>
              <Text style={[st.summaryVal, { color: c.accent }]}>{formatDur(totalMin)}</Text>
              <Text style={[st.summaryLbl, { color: c.textMuted }]}>Total Time</Text>
            </View>
            <View style={[st.summaryDiv, { backgroundColor: c.border }]} />
            <View style={st.summaryItem}>
              <Text style={[st.summaryVal, { color: c.accent }]}>
                {sessions.length > 0 ? formatDur(Math.round(totalMin / sessions.length)) : '0m'}
              </Text>
              <Text style={[st.summaryLbl, { color: c.textMuted }]}>Avg Session</Text>
            </View>
          </View>

          {/* List */}
          <View style={[st.listCard, { backgroundColor: c.bgCard }]}>
            {sessions.map((sess, i) => {
              const subject = state.subjects.find(s => s.id === sess.subjectId);
              return (
                <View key={sess.id}
                  style={[st.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                  <View style={[st.dot, { backgroundColor: subject?.color ?? c.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[st.rowTitle, { color: c.text }]}>
                      {subject?.name ?? 'Focus Session'}
                    </Text>
                    <Text style={[st.rowSub, { color: c.textFaint }]}>
                      {formatDate(sess.startTime)} · {formatTime(sess.startTime)}
                    </Text>
                  </View>
                  <View style={[st.durChip, { backgroundColor: c.accentSoft }]}>
                    <Text style={[st.durTxt, { color: c.accent }]}>{formatDur(sess.durationMinutes)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  content: { padding: 16, gap: 12 },
  summaryCard: { borderRadius: 16, flexDirection: 'row', paddingVertical: 20 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryVal: { fontSize: 20, fontFamily: FONTS.bold },
  summaryLbl: { fontSize: 12, fontFamily: FONTS.regular },
  summaryDiv: { width: 1, alignSelf: 'stretch', marginVertical: 4 },
  listCard: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { fontSize: 14, fontFamily: FONTS.semibold },
  rowSub: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  durChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  durTxt: { fontSize: 12, fontFamily: FONTS.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTxt: { fontSize: 18, fontFamily: FONTS.bold },
  emptySub: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', paddingHorizontal: 32 },
});