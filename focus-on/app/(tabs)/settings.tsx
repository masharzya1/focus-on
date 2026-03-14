import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';

function Stepper({ value, min, max, step = 1, onChange, suffix = '' }:
  { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string }) {
  const { colors: c } = useTheme();
  return (
    <View style={st.stepper}>
      <TouchableOpacity style={[st.stepBtn, { backgroundColor: c.accentSoft }]}
        onPress={() => onChange(Math.max(min, value - step))}>
        <Ionicons name="remove" size={18} color={c.accent} />
      </TouchableOpacity>
      <Text style={[st.stepVal, { color: c.text }]}>{value}{suffix}</Text>
      <TouchableOpacity style={[st.stepBtn, { backgroundColor: c.accentSoft }]}
        onPress={() => onChange(Math.min(max, value + step))}>
        <Ionicons name="add" size={18} color={c.accent} />
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen() {
  const { state, updateSettings } = useStudy();
  const { colors: c, toggleTheme, isDark } = useTheme();
  const router = useRouter();
  const { settings } = state;

  const Section = ({ title }: { title: string }) => (
    <Text style={[st.sectionTitle, { color: c.textMuted }]}>{title}</Text>
  );

  const Row = ({ icon, label, children, iconColor = c.accent }:
    { icon: any; label: string; children: React.ReactNode; iconColor?: string }) => (
    <View style={[st.row, { borderBottomColor: c.border }]}>
      <View style={[st.rowIcon, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[st.rowLabel, { color: c.text }]}>{label}</Text>
      {children}
    </View>
  );

  // Data stats with icons instead of emoji
  const dataStats = [
    { label: 'Total Sessions', value: state.sessions.filter(s => s.completed).length, icon: 'time-outline', color: c.accent },
    { label: 'Subjects', value: state.subjects.length, icon: 'book-outline', color: '#3B82F6' },
    { label: 'Topics Completed', value: state.totalTopicsCompleted, icon: 'checkmark-circle-outline', color: '#10B981' },
    { label: 'Total XP', value: state.xp, icon: 'star-outline', color: c.xpColor },
  ];

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[st.title, { color: c.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

        <Section title="Timer" />
        <Animated.View entering={FadeInDown.delay(60).springify()} style={[st.card, { backgroundColor: c.bgCard }]}>
          <Row icon="timer-outline" label="Focus Duration">
            <Stepper value={settings.pomodoroFocus} min={5} max={120} step={5}
              suffix="m" onChange={v => updateSettings({ pomodoroFocus: v })} />
          </Row>
          <Row icon="cafe-outline" label="Break Duration">
            <Stepper value={settings.pomodoroBreak} min={1} max={30} step={1}
              suffix="m" onChange={v => updateSettings({ pomodoroBreak: v })} />
          </Row>
          <Row icon="trophy-outline" label="Daily Goal" iconColor="#F59E0B">
            <Stepper value={settings.dailyGoalMinutes} min={15} max={480} step={15}
              suffix="m" onChange={v => updateSettings({ dailyGoalMinutes: v })} />
          </Row>
        </Animated.View>

        <Section title="Appearance" />
        <Animated.View entering={FadeInDown.delay(100).springify()} style={[st.card, { backgroundColor: c.bgCard }]}>
          <Row icon={isDark ? 'moon' : 'sunny'} label="Dark Mode" iconColor="#6C63FF">
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: c.accent }} />
          </Row>
          <Row icon="volume-medium-outline" label="Sound" iconColor="#10B981">
            <Switch value={settings.soundEnabled}
              onValueChange={v => updateSettings({ soundEnabled: v })}
              trackColor={{ true: c.accent }} />
          </Row>
        </Animated.View>

        <Section title="Focus" />
        <Animated.View entering={FadeInDown.delay(140).springify()} style={[st.card, { backgroundColor: c.bgCard }]}>
          <Row icon="shield-checkmark-outline" label="Focus Guard" iconColor="#EF4444">
            <Switch value={settings.focusGuardEnabled}
              onValueChange={v => updateSettings({ focusGuardEnabled: v })}
              trackColor={{ true: c.destructive }} />
          </Row>
        </Animated.View>

        <Section title="Data" />
        <Animated.View entering={FadeInDown.delay(180).springify()} style={[st.card, { backgroundColor: c.bgCard }]}>
          {dataStats.map((item, i) => (
            <View key={item.label} style={[st.dataRow, { borderBottomColor: c.border },
              i === dataStats.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[st.dataIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={[st.dataLabel, { color: c.textMuted }]}>{item.label}</Text>
              <Text style={[st.dataVal, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: FONTS.black },
  content: { padding: 16, gap: 8 },
  sectionTitle: {
    fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 8, marginBottom: 4, marginLeft: 4,
  },
  card: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: FONTS.semibold },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepVal: { fontSize: 15, fontFamily: FONTS.black, minWidth: 42, textAlign: 'center' },
  dataRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1,
  },
  dataIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  dataLabel: { flex: 1, fontSize: 14, fontFamily: FONTS.medium },
  dataVal: { fontSize: 15, fontFamily: FONTS.black },
});
