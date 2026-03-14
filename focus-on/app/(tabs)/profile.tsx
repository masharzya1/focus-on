import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';

function xpForLevel(l: number) { return l * 100; }
function getLevelProgress(xp: number) {
  let remaining = xp, lvl = 1;
  while (remaining >= xpForLevel(lvl)) { remaining -= xpForLevel(lvl); lvl++; }
  return { lvl, earned: remaining, total: xpForLevel(lvl) };
}

const GRID = [
  { label: 'Analytics', icon: 'bar-chart', route: '/analytics', color: '#6C63FF' },
  { label: 'Calendar', icon: 'calendar', route: '/calendar', color: '#3B82F6' },
  { label: 'App Block', icon: 'shield', route: '/(tabs)/app-block', color: '#EF4444' },
  { label: 'Plans', icon: 'clipboard', route: '/(tabs)/plan', color: '#F59E0B' },
  { label: 'Settings', icon: 'settings', route: '/settings', color: '#10B981' },
];

const STATS = [
  { key: 'streak', icon: 'flame', color: '#FF9500', label: 'Streak' },
  { key: 'topics', icon: 'checkmark-circle', color: '#2DD4BF', label: 'Topics' },
  { key: 'subjects', icon: 'book', color: '#6C63FF', label: 'Subjects' },
];

export default function ProfileScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();
  const { lvl, earned, total } = getLevelProgress(state.xp);

  const statValues: Record<string, number> = {
    streak: state.streak,
    topics: state.totalTopicsCompleted,
    subjects: state.subjects.length,
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Hero card */}
      <Animated.View entering={FadeInDown.springify()} style={[styles.hero, { backgroundColor: c.bgCard }]}>
        {/* Avatar — icon instead of emoji */}
        <View style={[styles.avatar, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="person" size={38} color={c.accent} />
        </View>

        <Text style={[styles.levelBadge, { color: c.accent }]}>Level {lvl}</Text>
        <Text style={[styles.xpTotal, { color: c.textMuted }]}>{state.xp} XP total</Text>

        {/* XP progress bar */}
        <View style={[styles.xpBg, { backgroundColor: c.border }]}>
          <View style={[styles.xpFill, { backgroundColor: c.xpColor, width: `${(earned / total) * 100}%` }]} />
        </View>
        <Text style={[styles.xpNext, { color: c.textFaint }]}>{earned}/{total} XP to next level</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.key}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: c.border }]} />}
              <View style={styles.stat}>
                <View style={styles.statIconRow}>
                  <Ionicons name={stat.icon as any} size={14} color={stat.color} />
                  <Text style={[styles.statNum, { color: c.text }]}>{statValues[stat.key]}</Text>
                </View>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </Animated.View>

      {/* Quick nav grid */}
      <Text style={[styles.gridHeading, { color: c.textMuted }]}>Quick Access</Text>
      <View style={styles.grid}>
        {GRID.map((item, i) => (
          <Animated.View key={item.label} entering={FadeInDown.delay(i * 60).springify()} style={{ width: '48%' }}>
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: c.bgCard }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.gridLabel, { color: c.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={c.textFaint} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.black },
  hero: { borderRadius: RADIUS.xl, padding: 24, alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  levelBadge: { fontSize: 20, fontFamily: FONTS.black, marginBottom: 4 },
  xpTotal: { fontSize: 14, fontFamily: FONTS.medium, marginBottom: 12 },
  xpBg: { height: 8, width: '100%', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', borderRadius: 4 },
  xpNext: { fontSize: 12, fontFamily: FONTS.regular, marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statNum: { fontSize: 22, fontFamily: FONTS.black },
  statLabel: { fontSize: 11, fontFamily: FONTS.medium },
  statDivider: { width: 1, height: 36 },
  gridHeading: { fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { borderRadius: RADIUS.xl, padding: 18, alignItems: 'center', gap: 8 },
  gridIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 14, fontFamily: FONTS.bold },
});
