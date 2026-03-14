import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

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
    </View>
  );
}

export default function AnalyticsScreen() {
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
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Subject breakdown */}
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
});
