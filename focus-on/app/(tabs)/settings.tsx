import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

export default function SettingsScreen() {
  const { state, updateSettings } = useStudy();
  const { colors: c } = useTheme();
  const { settings } = state;

  const allTopics = state.subjects.flatMap(s => s.chapters.flatMap(ch => ch.topics));
  const sessions = state.sessions.filter(s => s.completed);
  const totalMins = sessions.reduce((a, s) => a + s.durationMinutes, 0);

  function Stepper({ value, min, max, step = 1, onChange }: {
    value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
  }) {
    return (
      <View style={se.stepper}>
        <TouchableOpacity
          style={[se.stepBtn, { backgroundColor: c.accentSoft }]}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Ionicons name="remove" size={18} color={c.accent} />
        </TouchableOpacity>
        <Text style={[se.stepVal, { color: c.text }]}>{value}</Text>
        <TouchableOpacity
          style={[se.stepBtn, { backgroundColor: c.accentSoft }]}
          onPress={() => onChange(Math.min(max, value + step))}
        >
          <Ionicons name="add" size={18} color={c.accent} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(400)} style={se.header}>
        <Text style={[se.title, { color: c.text }]}>Settings</Text>
        <Text style={[se.subtitle, { color: c.textMuted }]}>Customize your experience</Text>
      </Animated.View>

      <View style={{ padding: 16, gap: 14 }}>

        {/* Appearance */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={[se.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={se.sectionHeader}>
            <View style={[se.sectionIcon, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="color-palette-outline" size={18} color={c.accent} />
            </View>
            <Text style={[se.sectionTitle, { color: c.text }]}>Appearance</Text>
          </View>
          <View style={se.themeRow}>
            {([
              { key: 'light', label: 'Light', icon: 'sunny-outline' as const },
              { key: 'dark',  label: 'Dark',  icon: 'moon-outline' as const },
            ] as const).map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => updateSettings({ theme: opt.key })}
                style={[se.themeBtn, {
                  backgroundColor: settings.theme === opt.key ? c.accent : c.bgSecondary,
                  borderBottomWidth: settings.theme === opt.key ? 3 : 0,
                  borderBottomColor: c.accentDark,
                }]}
              >
                <Ionicons name={opt.icon} size={18} color={settings.theme === opt.key ? '#fff' : c.textMuted} />
                <Text style={[se.themeBtnText, { color: settings.theme === opt.key ? '#fff' : c.textMuted }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Timer */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={[se.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={se.sectionHeader}>
            <View style={[se.sectionIcon, { backgroundColor: c.success + '20' }]}>
              <Ionicons name="timer-outline" size={18} color={c.success} />
            </View>
            <Text style={[se.sectionTitle, { color: c.text }]}>Focus Timer</Text>
          </View>
          {[
            { label: 'Focus Duration', sub: 'Minutes per session', val: settings.pomodoroFocus, min: 5, max: 120, step: 5, key: 'pomodoroFocus' },
            { label: 'Break Duration', sub: 'Minutes per break',   val: settings.pomodoroBreak, min: 1, max: 30,  step: 1, key: 'pomodoroBreak' },
            { label: 'Daily Goal',     sub: 'Target study minutes',val: settings.dailyGoalMinutes, min: 15, max: 720, step: 15, key: 'dailyGoalMinutes' },
          ].map((item, i) => (
            <View key={i} style={[se.row, { borderBottomColor: c.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[se.rowLabel, { color: c.text }]}>{item.label}</Text>
                <Text style={[se.rowSub, { color: c.textMuted }]}>{item.sub}</Text>
              </View>
              <Stepper
                value={item.val}
                min={item.min}
                max={item.max}
                step={item.step}
                onChange={v => updateSettings({ [item.key]: v } as any)}
              />
            </View>
          ))}
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[se.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={se.sectionHeader}>
            <View style={[se.sectionIcon, { backgroundColor: c.xpColor + '20' }]}>
              <Ionicons name="stats-chart-outline" size={18} color={c.xpColor} />
            </View>
            <Text style={[se.sectionTitle, { color: c.text }]}>Your Stats</Text>
          </View>
          {[
            { label: 'Total Sessions',   value: sessions.length.toString(),                icon: 'checkmark-done-circle-outline' as const, color: c.accent },
            { label: 'Total Study Time', value: `${Math.round(totalMins/60*10)/10}h`,      icon: 'time-outline' as const, color: c.success },
            { label: 'Topics Completed', value: `${allTopics.filter(t=>t.completed).length}/${allTopics.length}`, icon: 'book-outline' as const, color: c.streakColor },
            { label: 'Current Streak',   value: `${state.streak} days`,                   icon: 'flame-outline' as const, color: c.streakColor },
            { label: 'XP / Level',       value: `${state.xp} XP · Lv ${state.level}`,    icon: 'star-outline' as const, color: c.xpColor },
          ].map((item, i) => (
            <View key={i} style={[se.row, { borderBottomColor: c.border }]}>
              <View style={[se.statIconWrap, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <Text style={[se.rowLabel, { color: c.text, flex: 1 }]}>{item.label}</Text>
              <Text style={[se.statValue, { color: c.textMuted }]}>{item.value}</Text>
            </View>
          ))}
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)} style={[se.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={se.sectionHeader}>
            <View style={[se.sectionIcon, { backgroundColor: c.bgSecondary }]}>
              <Ionicons name="information-circle-outline" size={18} color={c.textMuted} />
            </View>
            <Text style={[se.sectionTitle, { color: c.text }]}>About</Text>
          </View>
          {[
            { label: 'App',        value: 'Focus On' },
            { label: 'Version',    value: '2.0.0' },
            { label: 'Framework',  value: 'Expo · React Native' },
          ].map((item, i) => (
            <View key={i} style={[se.row, { borderBottomColor: c.border }]}>
              <Text style={[se.rowLabel, { color: c.text }]}>{item.label}</Text>
              <Text style={[se.statValue, { color: c.textMuted }]}>{item.value}</Text>
            </View>
          ))}
        </Animated.View>

      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const se = StyleSheet.create({
  header:   { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  section:  { borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 },
  sectionIcon: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  themeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: RADIUS.lg },
  themeBtnText: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowSub: { fontSize: 11, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  stepVal: { fontSize: 16, fontWeight: '800', minWidth: 40, textAlign: 'center' },
  statIconWrap: { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 13, fontWeight: '600' },
});
