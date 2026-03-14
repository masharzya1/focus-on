import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

function AnimatedBar({ progress, color, height = 8 }: { progress: number; color: string; height?: number }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withDelay(400, withTiming(progress, { duration: 900 })); }, [progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));
  return (
    <View style={{ height, backgroundColor: '#00000010', borderRadius: height/2, overflow: 'hidden' }}>
      <Animated.View style={[{ height, backgroundColor: color, borderRadius: height/2 }, barStyle]} />
    </View>
  );
}

export default function AnalyticsScreen() {
  const { state, getStreak } = useStudy();
  const { colors: c } = useTheme();
  const streak = getStreak();

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const weekS = state.sessions.filter(s => s.completed && new Date(s.startTime) >= weekAgo);
    const weekMin = weekS.reduce((a, s) => a + s.durationMinutes, 0);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const monthS = state.sessions.filter(s => s.completed && new Date(s.startTime) >= monthAgo);
    const uniqueDays = new Set(monthS.map(s => s.startTime.split('T')[0])).size;
    const consistency = Math.round((uniqueDays / 30) * 100);
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6-i) * 86400000);
      const key = d.toISOString().split('T')[0];
      const mins = weekS.filter(s => s.startTime.startsWith(key)).reduce((a, s) => a + s.durationMinutes, 0);
      return { day: d.toLocaleDateString('en', { weekday: 'short' }), mins, isToday: i === 6 };
    });
    const maxDaily = Math.max(...dailyData.map(d => d.mins), 1);
    const allTopics = state.subjects.flatMap(s => s.chapters.flatMap(ch => ch.topics));
    const done = allTopics.filter(t => t.completed).length;
    const subjectTime: Record<string, number> = {};
    state.sessions.filter(s => s.completed && s.subjectId).forEach(s => {
      subjectTime[s.subjectId!] = (subjectTime[s.subjectId!] || 0) + s.durationMinutes;
    });
    const topSubjects = Object.entries(subjectTime)
      .map(([id, mins]) => ({ sub: state.subjects.find(s => s.id === id), mins }))
      .filter(x => x.sub).sort((a, b) => b.mins - a.mins).slice(0, 5);
    return { weekMin, dailyData, maxDaily, consistency, done, total: allTopics.length, topSubjects, weekSessions: weekS.length };
  }, [state.sessions, state.subjects]);

  const ICON_MAP: Record<string,string> = {
    calculator:'calculator-outline', flask:'flask-outline', globe:'globe-outline',
    laptop:'laptop-outline', book:'book-outline',
  };
  function getSubjectIcon(iconName: string): React.ComponentProps<typeof Ionicons>['name'] {
    return (ICON_MAP[iconName] || 'book-outline') as any;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(400)} style={an.header}>
        <Text style={[an.title, { color: c.text }]}>Analytics</Text>
        <Text style={[an.subtitle, { color: c.textMuted }]}>Your study insights</Text>
      </Animated.View>

      <View style={{ padding: 16 }}>
        {/* Top stats */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={an.statsGrid}>
          {[
            { label: 'This Week', value: `${Math.round(stats.weekMin/60*10)/10}h`, icon: 'time' as const, color: c.accent },
            { label: 'Streak',    value: `${streak}d`, icon: 'flame' as const, color: c.streakColor },
            { label: 'Consistency', value: `${stats.consistency}%`, icon: 'bar-chart' as const, color: c.success },
            { label: 'Topics Done', value: `${stats.done}/${stats.total}`, icon: 'checkmark-circle' as const, color: c.xpColor },
          ].map((s, i) => (
            <View key={i} style={[an.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <View style={[an.statIconBox, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={[an.statVal, { color: c.text }]}>{s.value}</Text>
              <Text style={[an.statLabel, { color: c.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Week chart */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={[an.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={an.cardHeader}>
            <Text style={[an.cardTitle, { color: c.text }]}>This Week</Text>
            <View style={[an.weekBadge, { backgroundColor: c.accentSoft }]}>
              <Text style={[an.weekBadgeText, { color: c.accent }]}>{stats.weekSessions} sessions</Text>
            </View>
          </View>
          <View style={an.chart}>
            {stats.dailyData.map((d, i) => (
              <View key={i} style={an.barCol}>
                {d.mins > 0 && <Text style={[an.barVal, { color: c.textFaint }]}>{d.mins}m</Text>}
                <View style={an.barWrap}>
                  <View style={[an.bar, {
                    height: Math.max(6, (d.mins / stats.maxDaily) * 90),
                    backgroundColor: d.isToday ? c.accent : d.mins > 0 ? c.accentSoft : c.border,
                    borderRadius: 8,
                  }]} />
                </View>
                <Text style={[an.barDay, { color: d.isToday ? c.accent : c.textMuted }, d.isToday && { fontWeight: '800' }]}>{d.day}</Text>
              </View>
            ))}
          </View>
          <View style={[an.divider, { backgroundColor: c.border }]} />
          <View style={an.summaryRow}>
            {[
              { label: 'Sessions', value: stats.weekSessions.toString() },
              { label: 'Study Time', value: `${Math.round(stats.weekMin/60*10)/10}h` },
              { label: 'Avg Session', value: `${stats.weekMin > 0 ? Math.round(stats.weekMin / (stats.weekSessions||1)) : 0}m` },
            ].map((item, i) => (
              <View key={i} style={an.summaryItem}>
                <Text style={[an.summaryVal, { color: c.text }]}>{item.value}</Text>
                <Text style={[an.summaryLabel, { color: c.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Subject breakdown */}
        {stats.topSubjects.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={[an.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[an.cardTitle, { color: c.text, marginBottom: 16 }]}>By Subject</Text>
            {stats.topSubjects.map(({ sub, mins }, i) => {
              if (!sub) return null;
              const pct = Math.round((mins / stats.topSubjects[0].mins) * 100);
              return (
                <View key={i} style={{ marginBottom: 14 }}>
                  <View style={an.subjectRow}>
                    <View style={[an.subjectIconBox, { backgroundColor: sub.color + '20' }]}>
                      <Ionicons name={getSubjectIcon(sub.icon)} size={16} color={sub.color} />
                    </View>
                    <Text style={[an.subjectName, { color: c.text }]}>{sub.name}</Text>
                    <Text style={[an.subjectMins, { color: c.textMuted }]}>{mins}m</Text>
                  </View>
                  <AnimatedBar progress={pct} color={sub.color} height={7} />
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Recent Sessions */}
        {state.sessions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(320).duration(400)} style={[an.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[an.cardTitle, { color: c.text, marginBottom: 14 }]}>Recent Sessions</Text>
            {[...state.sessions].reverse().slice(0, 10).map(s => {
              const sub = state.subjects.find(x => x.id === s.subjectId);
              const mins = Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
              const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : `${Math.floor(mins/1440)}d ago`;
              return (
                <View key={s.id} style={[an.sessionRow, { borderBottomColor: c.border }]}>
                  <View style={[an.sessionIcon, { backgroundColor: (sub?.color || c.accent) + '20' }]}>
                    <Ionicons name="book-outline" size={14} color={sub?.color || c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[an.sessionName, { color: c.text }]}>{sub?.name || 'Session'}</Text>
                    <Text style={[an.sessionSub, { color: c.textMuted }]}>{s.durationMinutes}m · {s.type}</Text>
                  </View>
                  <Text style={[an.sessionTime, { color: c.textFaint }]}>{timeAgo}</Text>
                </View>
              );
            })}
          </Animated.View>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const an = StyleSheet.create({
  header:    { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title:     { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle:  { fontSize: 13, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statCard:  { width: '48%', borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, alignItems: 'center', gap: 8 },
  statIconBox: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  statVal:   { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  card: { borderRadius: RADIUS.xl, padding: 18, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  weekBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full },
  weekBadgeText: { fontSize: 12, fontWeight: '700' },
  chart:     { flexDirection: 'row', height: 140, alignItems: 'flex-end', justifyContent: 'space-between' },
  barCol:    { flex: 1, alignItems: 'center' },
  barVal:    { fontSize: 9, marginBottom: 4 },
  barWrap:   { height: 96, justifyContent: 'flex-end', alignItems: 'center', width: '80%' },
  bar:       { width: '100%' },
  barDay:    { fontSize: 10, marginTop: 5 },
  divider:   { height: 1, marginVertical: 16 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 3 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  subjectIconBox: { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  subjectName: { flex: 1, fontSize: 13, fontWeight: '600' },
  subjectMins: { fontSize: 12 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  sessionIcon: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sessionName: { fontSize: 13, fontWeight: '600' },
  sessionSub:  { fontSize: 11, marginTop: 1 },
  sessionTime: { fontSize: 11 },
});
