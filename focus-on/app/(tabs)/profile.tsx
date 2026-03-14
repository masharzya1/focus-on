import React from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
=======
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

<<<<<<< HEAD
function xpForLevel(l: number) { return l * 100; }
function getLevelProgress(xp: number) {
  let remaining = xp, lvl = 1;
  while (remaining >= xpForLevel(lvl)) { remaining -= xpForLevel(lvl); lvl++; }
  return { lvl, earned: remaining, total: xpForLevel(lvl) };
}

const GRID = [
  { label: 'Analytics', icon: 'bar-chart-outline', route: '/analytics', color: '#6C63FF' },
  { label: 'Calendar', icon: 'calendar-outline', route: '/calendar', color: '#3B82F6' },
  { label: 'App Block', icon: 'shield-outline', route: '/(tabs)/app-block', color: '#EF4444' },
  { label: 'Plans', icon: 'clipboard-outline', route: '/(tabs)/plan', color: '#F59E0B' },
  { label: 'Settings', icon: 'settings-outline', route: '/settings', color: '#10B981' },
];

=======
const MENU_ITEMS = [
  {
    group: 'Study',
    items: [
      { label: 'Analytics',  icon: 'bar-chart-outline'   as const, route: '/(tabs)/analytics'  },
      { label: 'Calendar',   icon: 'calendar-outline'    as const, route: '/(tabs)/calendar'   },
    ],
  },
  {
    group: 'App',
    items: [
      { label: 'Settings',   icon: 'settings-outline'    as const, route: '/(tabs)/settings'   },
    ],
  },
];

function xpForLevel(l: number) { return l * 100; }

>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
export default function ProfileScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();
<<<<<<< HEAD
  const { lvl, earned, total } = getLevelProgress(state.xp);

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar & XP */}
      <Animated.View entering={FadeInDown.springify()} style={[styles.hero, { backgroundColor: c.bgCard }]}>
        <View style={[styles.avatar, { backgroundColor: c.accentSoft }]}>
          <Text style={{ fontSize: 40 }}>🧑‍🎓</Text>
        </View>
        <Text style={[styles.levelBadge, { color: c.accent }]}>Level {lvl}</Text>
        <Text style={[styles.xpTotal, { color: c.textMuted }]}>{state.xp} XP total</Text>
        <View style={[styles.xpBg, { backgroundColor: c.border }]}>
          <View style={[styles.xpFill, { backgroundColor: c.xpColor, width: `${(earned/total)*100}%` }]} />
        </View>
        <Text style={[styles.xpNext, { color: c.textFaint }]}>{earned}/{total} XP to next level</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={[styles.statNum, { color: c.text }]}>{state.streak}</Text><Text style={[styles.statLabel, { color: c.textMuted }]}>🔥 Streak</Text></View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.stat}><Text style={[styles.statNum, { color: c.text }]}>{state.totalTopicsCompleted}</Text><Text style={[styles.statLabel, { color: c.textMuted }]}>✅ Topics</Text></View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.stat}><Text style={[styles.statNum, { color: c.text }]}>{state.subjects.length}</Text><Text style={[styles.statLabel, { color: c.textMuted }]}>📚 Subjects</Text></View>
        </View>
      </Animated.View>

      {/* Grid */}
      <View style={styles.grid}>
        {GRID.map((item, i) => (
          <Animated.View key={item.label} entering={FadeInDown.delay(i * 60).springify()} style={{ width: '48%' }}>
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: c.bgCard }]}
              onPress={() => router.push(item.route as any)}>
              <View style={[styles.gridIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={26} color={item.color} />
              </View>
              <Text style={[styles.gridLabel, { color: c.text }]}>{item.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
=======

  const allTopics = state.subjects.flatMap(s => s.chapters.flatMap(ch => ch.topics));
  const completed  = allTopics.filter(t => t.completed).length;
  const sessions   = state.sessions.filter(s => s.completed);
  const totalMins  = sessions.reduce((a, s) => a + s.durationMinutes, 0);

  let remaining = state.xp, lvl = 1;
  while (remaining >= xpForLevel(lvl)) { remaining -= xpForLevel(lvl); lvl++; }
  const xpTotal = xpForLevel(lvl);
  const xpPct   = Math.round((remaining / xpTotal) * 100);

  const STATS = [
    { icon: 'time-outline'            as const, color: c.accent,      label: 'Study time',   value: `${Math.round(totalMins / 60 * 10) / 10}h` },
    { icon: 'checkmark-done-outline'  as const, color: c.success,     label: 'Sessions',     value: sessions.length.toString() },
    { icon: 'book-outline'            as const, color: c.streakColor,  label: 'Topics done',  value: `${completed}/${allTopics.length}` },
    { icon: 'flame-outline'           as const, color: c.streakColor,  label: 'Streak',       value: `${state.streak}d` },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ps.header, { paddingTop: 56 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ps.backBtn}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={[ps.title, { color: c.text }]}>Profile</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      {/* Avatar + level */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ alignItems: 'center', paddingVertical: 24 }}>
        <View style={[ps.avatar, { backgroundColor: c.accentSoft, borderColor: c.accent + '40' }]}>
          <Ionicons name="person" size={42} color={c.accent} />
        </View>
        <Text style={[ps.name, { color: c.text }]}>Focus On User</Text>
        <View style={[ps.levelBadge, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="star" size={13} color={c.xpColor} />
          <Text style={[ps.levelText, { color: c.accent }]}>Level {lvl} · {state.xp} XP</Text>
        </View>

        {/* XP bar */}
        <View style={[ps.xpBarBg, { backgroundColor: c.border }]}>
          <View style={[ps.xpBarFill, { width: `${xpPct}%`, backgroundColor: c.accent }]} />
        </View>
        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>
          {remaining} / {xpTotal} XP to next level
        </Text>
      </Animated.View>

      {/* Stats grid */}
      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={ps.statsGrid}>
        {STATS.map((st, i) => (
          <View key={i} style={[ps.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={[ps.statIcon, { backgroundColor: st.color + '18' }]}>
              <Ionicons name={st.icon} size={16} color={st.color} />
            </View>
            <Text style={[ps.statValue, { color: c.text }]}>{st.value}</Text>
            <Text style={[ps.statLabel, { color: c.textMuted }]}>{st.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Menu groups */}
      <View style={{ padding: 16, gap: 20 }}>
        {MENU_ITEMS.map((group, gi) => (
          <Animated.View key={gi} entering={FadeInDown.delay(180 + gi * 60).duration(400)}>
            <Text style={[ps.groupLabel, { color: c.textMuted }]}>{group.group.toUpperCase()}</Text>
            <View style={[ps.menuCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              {group.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[ps.menuRow, {
                    borderBottomColor: c.border,
                    borderBottomWidth: ii < group.items.length - 1 ? 1 : 0,
                  }]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[ps.menuIcon, { backgroundColor: c.accentSoft }]}>
                    <Ionicons name={item.icon} size={18} color={c.accent} />
                  </View>
                  <Text style={[ps.menuLabel, { color: c.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={{ height: 100 }} />
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
    </ScrollView>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, paddingBottom: 100 },
  hero: { borderRadius: RADIUS.xl, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  levelBadge: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  xpTotal: { fontSize: 14, marginBottom: 12 },
  xpBg: { height: 8, width: '100%', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', borderRadius: 4 },
  xpNext: { fontSize: 11, marginBottom: 20 },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 36 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { borderRadius: RADIUS.xl, padding: 20, alignItems: 'center', gap: 10 },
  gridIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 14, fontWeight: '700' },
=======
const ps = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 18, fontWeight: '700' },
  avatar:    { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12 },
  name:      { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  levelBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, marginBottom: 14 },
  levelText: { fontSize: 13, fontWeight: '700' },
  xpBarBg:   { width: 200, height: 8, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: 8, borderRadius: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard:  { flex: 1, minWidth: '44%', borderRadius: RADIUS.xl, borderWidth: 1, padding: 16, alignItems: 'center', gap: 6 },
  statIcon:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  groupLabel:{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 },
  menuCard:  { borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden' },
  menuRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuIcon:  { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
});
