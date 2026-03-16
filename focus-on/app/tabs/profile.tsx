import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

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

export default function ProfileScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();
  const { lvl, earned, total } = getLevelProgress(state.xp);

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Avatar & XP */}
      <Animated.View entering={FadeInDown.springify()} style={[styles.hero, { backgroundColor: c.bgCard }]}>
        <View style={[styles.avatar, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="person" size={40} color={c.accent} />
        </View>
        <Text style={[styles.levelBadge, { color: c.accent }]}>Level {lvl}</Text>
        <Text style={[styles.xpTotal, { color: c.textMuted }]}>{state.xp} XP total</Text>
        <View style={[styles.xpBg, { backgroundColor: c.border }]}>
          <View style={[styles.xpFill, { backgroundColor: c.xpColor, width: `${(earned/total)*100}%` }]} />
        </View>
        <Text style={[styles.xpNext, { color: c.textFaint }]}>{earned}/{total} XP to next level</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: c.text }]}>{state.streak}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Ionicons name="flame" size={13} color="#FF9500" /><Text style={[styles.statLabel, { color: c.textMuted }]}>Streak</Text></View>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: c.text }]}>{state.totalTopicsCompleted}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Topics done</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: c.text }]}>{state.subjects.length}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Subjects</Text>
          </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  hero: { borderRadius: RADIUS.xl, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  levelBadge: { fontSize: 20, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', marginBottom: 4 },
  xpTotal: { fontSize: 14, marginBottom: 12 },
  xpBg: { height: 8, width: '100%', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', borderRadius: 4 },
  xpNext: { fontSize: 12, marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 0, width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 36 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { borderRadius: RADIUS.xl, padding: 20, alignItems: 'center', gap: 10 },
  gridIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});
