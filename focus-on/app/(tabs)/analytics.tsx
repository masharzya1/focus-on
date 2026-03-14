import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';
import AppBlocking from '@/modules/AppBlocking';
import { useFocusEffect } from 'expo-router';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const h = useSharedValue(0);
  const pct = max > 0 ? value / max : 0;
  useEffect(() => { h.value = withDelay(300, withTiming(pct, { duration: 700 })); }, [pct]);
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
  const [usageStats, setUsageStats] = useState<{ packageName: string; name: string; minutes: number }[]>([]);
  const [hasUsagePerm, setHasUsagePerm] = useState(false);

  useFocusEffect(React.useCallback(() => {
    AppBlocking.hasUsagePermission().then(ok => {
      setHasUsagePerm(ok);
      if (ok) AppBlocking.getAppUsageStats().then(setUsageStats).catch(() => {});
    });
  }, []));

  const stats = useMemo(() => {
    const now = new Date();
    const weekSessions = state.sessions.filter(s => {
      if (!s.completed) return false;
      return (now.getTime() - new Date(s.startTime).getTime()) < 7 * 86400000;
    });

    const totalMins = state.sessions.filter(s => s.completed).reduce((a, s) => a + s.durationMinutes, 0);
    const weekMins = weekSessions.reduce((a, s) => a + s.durationMinutes, 0);
    const avgDaily = Math.round(weekMins / 7);
    const completedTopics = state.subjects.flatMap(s => s.chapters.flatMap(c => c.topics)).filter(t => t.completed).length;

    const days: { label: string; mins: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const mins = state.sessions.filter(s => s.completed && s.startTime.startsWith(dateStr)).reduce((a, s) => a + s.durationMinutes, 0);
      days.push({ label: DAY_LABELS[d.getDay()], mins });
    }

    const subjectStats = state.subjects.map(sub => {
      const topics = sub.chapters.flatMap(ch => ch.topics);
      const done = topics.filter(t => t.completed).length;
      const total = topics.length;
      const mins = state.sessions.filter(s => s.completed && s.subjectId === sub.id).reduce((a, s) => a + s.durationMinutes, 0);
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
          <StatCard icon="time-outline" label="Total" value={`${Math.floor(stats.totalMins / 60)}h`} color="#6C63FF" bg={c.bgCard} />
          <StatCard icon="calendar-outline" label="This Week" value={`${stats.weekMins}m`} color="#3B82F6" bg={c.bgCard} />
          <StatCard icon="trending-up-outline" label="Daily Avg" value={`${stats.avgDaily}m`} color="#10B981" bg={c.bgCard} />
          <StatCard icon="checkmark-circle-outline" label="Topics" value={String(stats.completedTopics)} color="#F59E0B" bg={c.bgCard} />
        </Animated.View>

        {/* Weekly bar chart */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={[s.card, { backgroundColor: c.bgCard }]}>
          <Text style={[s.cardTitle, { color: c.text }]}>Last 7 Days</Text>
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
          <Animated.View entering={FadeInDown.delay(180).springify()} style={[s.card, { backgroundColor: c.bgCard }]}>
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
                    <View style={[s.progFill, { backgroundColor: sub.color, width: `${sub.progress}%` }]} />
                  </View>
                  <Text style={[s.subStats, { color: c.textFaint }]}>
                    {sub.done}/{sub.total} topics · {sub.mins}m studied
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Empty state — icon instead of emoji */}
        {stats.subjectStats.length === 0 && (
          <Animated.View entering={FadeInDown.delay(120).springify()} style={s.empty}>
            <View style={[s.emptyIconCircle, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="bar-chart-outline" size={40} color={c.accent} />
            </View>
            <Text style={[s.emptyTitle, { color: c.text }]}>No data yet</Text>
            <Text style={[s.emptyTxt, { color: c.textMuted }]}>Start studying to see your analytics</Text>
          </Animated.View>
        )}

        {/* ── App Usage Today ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={[s.card, { backgroundColor: c.bgCard }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={[s.cardTitle, { color: c.text }]}>Today's App Usage</Text>
            {!hasUsagePerm && (
              <TouchableOpacity onPress={() => AppBlocking.openUsageSettings()}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: '#7C3AED18', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                <Ionicons name="lock-closed" size={12} color="#7C3AED" />
                <Text style={{ fontSize: 11, color: '#7C3AED', fontWeight: '700' }}>Grant Access</Text>
              </TouchableOpacity>
            )}
          </View>
          {!hasUsagePerm ? (
            <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
              <Ionicons name="time-outline" size={36} color={c.textFaint} />
              <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>
                Usage Access permission needed{'
'}to track daily app usage
              </Text>
            </View>
          ) : usageStats.length === 0 ? (
            <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
              No usage data for today yet
            </Text>
          ) : (
            usageStats.slice(0, 8).map((app, i) => {
              const maxMins = usageStats[0].minutes || 1;
              const pct = app.minutes / maxMins;
              return (
                <View key={app.packageName} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1}>{app.name}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>
                      {app.minutes >= 60
                        ? `${Math.floor(app.minutes / 60)}h ${app.minutes % 60}m`
                        : `${app.minutes}m`}
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: c.border, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct * 100}%`,
                      backgroundColor: i === 0 ? c.destructive : i < 3 ? '#F59E0B' : c.accent,
                      borderRadius: 3 }} />
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>

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
  title: { fontSize: 18, fontFamily: FONTS.black },
  content: { padding: 16, gap: 14 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: RADIUS.xl, padding: 12, alignItems: 'center', gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 18, fontFamily: FONTS.black },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontFamily: FONTS.semibold, textAlign: 'center' },
  card: { borderRadius: RADIUS.xl, padding: 18 },
  cardTitle: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 16 },
  barChart: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
  barLabel: { fontSize: 10, fontFamily: FONTS.semibold },
  barVal: { fontSize: 9, fontFamily: FONTS.regular },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  subIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subName: { fontSize: 14, fontFamily: FONTS.bold },
  subPct: { fontSize: 14, fontFamily: FONTS.black },
  progBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progFill: { height: '100%', borderRadius: 3 },
  subStats: { fontSize: 11, fontFamily: FONTS.regular },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold },
  emptyTxt: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center' },
});
