import React, { useMemo, useEffect } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
=======
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

<<<<<<< HEAD
const DAY_LABELS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const h = useSharedValue(0);
  const pct = max > 0 ? value / max : 0;
  useEffect(() => {
    h.value = withDelay(300, withTiming(pct, { duration: 700 }));
  }, [pct]);
  const anim = useAnimatedStyle(() => ({ height: `${h.value * 100}%` as any }));
  return (
    <View style={{ flex: 1, height: 80, justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
      <View style={{ width: '60%', height: '100%', backgroundColor: color + '18', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' }}>
        <Animated.View style={[{ backgroundColor: color, borderRadius: 6 }, anim]} />
      </View>
    </View>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[s.statCard, { backgroundColor: bg }]}>
      <View style={[s.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
=======
function AnimatedBar({ progress, color, height = 8 }: { progress: number; color: string; height?: number }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withDelay(400, withTiming(progress, { duration: 900 })); }, [progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));
  return (
    <View style={{ height, backgroundColor: '#00000010', borderRadius: height/2, overflow: 'hidden' }}>
      <Animated.View style={[{ height, backgroundColor: color, borderRadius: height/2 }, barStyle]} />
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
    </View>
  );
}

export default function AnalyticsScreen() {
<<<<<<< HEAD
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const stats = useMemo(() => {
    const now = new Date();
    const weekSessions = state.sessions.filter(s => {
      if (!s.completed) return false;
      const d = new Date(s.startTime);
      return (now.getTime() - d.getTime()) < 7 * 86400000;
    });

    const totalMins = state.sessions.filter(s => s.completed).reduce((a, s) => a + s.durationMinutes, 0);
    const weekMins = weekSessions.reduce((a, s) => a + s.durationMinutes, 0);
    const avgDaily = Math.round(weekMins / 7);
    const completedTopics = state.subjects.flatMap(s => s.chapters.flatMap(c => c.topics)).filter(t => t.completed).length;

    // Last 7 days bar data
    const days: { label: string; mins: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const mins = state.sessions
        .filter(s => s.completed && s.startTime.startsWith(dateStr))
        .reduce((a, s) => a + s.durationMinutes, 0);
      days.push({ label: DAY_LABELS[d.getDay()], mins });
    }

    // Subject breakdown
    const subjectStats = state.subjects.map(sub => {
      const topics = sub.chapters.flatMap(ch => ch.topics);
      const done = topics.filter(t => t.completed).length;
      const total = topics.length;
      const mins = state.sessions
        .filter(s => s.completed && s.subjectId === sub.id)
        .reduce((a, s) => a + s.durationMinutes, 0);
      return { ...sub, done, total, mins, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
    });

    return { totalMins, weekMins, avgDaily, completedTopics, days, subjectStats };
  }, [state]);

  const maxDayMins = Math.max(...stats.days.map(d => d.mins), 1);

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: c.text }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Stat cards */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.statRow}>
          <StatCard icon="time-outline" label="মোট" value={`${Math.floor(stats.totalMins / 60)}h`} color="#6C63FF" bg={c.bgCard} />
          <StatCard icon="calendar-outline" label="এই সপ্তাহ" value={`${stats.weekMins}m`} color="#3B82F6" bg={c.bgCard} />
          <StatCard icon="trending-up-outline" label="দৈনিক গড়" value={`${stats.avgDaily}m`} color="#10B981" bg={c.bgCard} />
          <StatCard icon="checkmark-circle-outline" label="Topics" value={String(stats.completedTopics)} color="#F59E0B" bg={c.bgCard} />
        </Animated.View>

        {/* Weekly bar chart */}
        <Animated.View entering={FadeInDown.delay(120).springify()}
          style={[s.card, { backgroundColor: c.bgCard }]}>
          <Text style={[s.cardTitle, { color: c.text }]}>গত ৭ দিন</Text>
          <View style={s.barChart}>
            {stats.days.map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Bar value={d.mins} max={maxDayMins} color={c.accent} />
                <Text style={[s.barLabel, { color: c.textFaint }]}>{d.label}</Text>
                {d.mins > 0 && <Text style={[s.barVal, { color: c.textMuted }]}>{d.mins}m</Text>}
=======
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
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Subject breakdown */}
<<<<<<< HEAD
        {stats.subjectStats.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).springify()}
            style={[s.card, { backgroundColor: c.bgCard }]}>
            <Text style={[s.cardTitle, { color: c.text }]}>Subject Progress</Text>
            {stats.subjectStats.map((sub, i) => (
              <View key={sub.id} style={[s.subRow, i > 0 && { borderTopColor: c.border, borderTopWidth: 1 }]}>
                <View style={[s.subIcon, { backgroundColor: sub.color + '22' }]}>
                  <Ionicons name={sub.icon as any} size={18} color={sub.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.subTop}>
                    <Text style={[s.subName, { color: c.text }]}>{sub.name}</Text>
                    <Text style={[s.subPct, { color: sub.color }]}>{sub.progress}%</Text>
                  </View>
                  <View style={[s.progBg, { backgroundColor: c.border }]}>
                    <Animated.View style={[s.progFill, { backgroundColor: sub.color, width: `${sub.progress}%` }]} />
                  </View>
                  <Text style={[s.subStats, { color: c.textFaint }]}>
                    {sub.done}/{sub.total} topics · {sub.mins}m studied
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {stats.subjectStats.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
            <Text style={[s.emptyTxt, { color: c.textMuted }]}>এখনো কোনো data নেই।{'\n'}পড়া শুরু করলে এখানে দেখা যাবে।</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 14 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: RADIUS.xl, padding: 12, alignItems: 'center', gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },
  card: { borderRadius: RADIUS.xl, padding: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  barChart: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
  barLabel: { fontSize: 10, fontWeight: '600' },
  barVal: { fontSize: 9 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  subIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subName: { fontSize: 14, fontWeight: '700' },
  subPct: { fontSize: 14, fontWeight: '800' },
  progBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progFill: { height: '100%', borderRadius: 3 },
  subStats: { fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTxt: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
=======
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
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
});
