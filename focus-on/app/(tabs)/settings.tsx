import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS, SPACING, HEADER_TOP, TYPE } from '@/constants/theme';
import * as Notifications from 'expo-notifications';

// ── Stepper component ─────────────────────────────────────────────────────────
function Stepper({ value, min, max, step = 1, onChange, suffix = '' }:
  { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string }) {
  const { colors: c } = useTheme();
  return (
    <View style={st.stepper}>
      <TouchableOpacity
        style={[st.stepBtn, { backgroundColor: c.bgSecondary }]}
        onPress={() => onChange(Math.max(min, value - step))}
        hitSlop={8}
      >
        <Ionicons name="remove" size={16} color={c.accent} />
      </TouchableOpacity>
      <Text style={[st.stepVal, { color: c.text }]}>{value}{suffix}</Text>
      <TouchableOpacity
        style={[st.stepBtn, { backgroundColor: c.bgSecondary }]}
        onPress={() => onChange(Math.min(max, value + step))}
        hitSlop={8}
      >
        <Ionicons name="add" size={16} color={c.accent} />
      </TouchableOpacity>
    </View>
  );
}

// ── Row types ─────────────────────────────────────────────────────────────────
type RowBase = { icon: string; label: string; iconBg?: string; iconColor?: string };

function ToggleRow({ icon, label, iconBg, iconColor, value, onValueChange }: RowBase & {
  value: boolean; onValueChange: (v: boolean) => void;
}) {
  const { colors: c } = useTheme();
  return (
    <View style={[st.row, { borderBottomColor: c.border }]}>
      <View style={[st.rowIcon, { backgroundColor: iconBg ?? c.accentSoft }]}>
        <Ionicons name={icon as any} size={17} color={iconColor ?? c.accent} />
      </View>
      <Text style={[TYPE.body, st.rowLabel, { color: c.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: c.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}

function StepperRow({ icon, label, iconBg, iconColor, ...stepperProps }: RowBase & {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  const { colors: c } = useTheme();
  return (
    <View style={[st.row, { borderBottomColor: c.border }]}>
      <View style={[st.rowIcon, { backgroundColor: iconBg ?? c.accentSoft }]}>
        <Ionicons name={icon as any} size={17} color={iconColor ?? c.accent} />
      </View>
      <Text style={[TYPE.body, st.rowLabel, { color: c.text }]}>{label}</Text>
      <Stepper {...stepperProps} />
    </View>
  );
}

function NavRow({ icon, label, iconBg, iconColor, onPress }: RowBase & { onPress: () => void }) {
  const { colors: c } = useTheme();
  return (
    <TouchableOpacity
      style={[st.row, { borderBottomColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[st.rowIcon, { backgroundColor: iconBg ?? c.accentSoft }]}>
        <Ionicons name={icon as any} size={17} color={iconColor ?? c.accent} />
      </View>
      <Text style={[TYPE.body, st.rowLabel, { color: c.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
    </TouchableOpacity>
  );
}

function SectionLabel({ title }: { title: string }) {
  const { colors: c } = useTheme();
  return <Text style={[TYPE.label, st.sectionLabel, { color: c.textMuted }]}>{title}</Text>;
}

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { colors: c } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}
      style={[st.card, { backgroundColor: c.bgCard }]}>
      {children}
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { state, updateSettings } = useStudy();
  const { colors: c, toggleTheme, isDark } = useTheme();
  const router = useRouter();
  const { settings } = state;
  const [testTitle, setTestTitle] = useState('📖 Study Time!');
  const [testBody,  setTestBody]  = useState('Time to focus on your studies.');

  const sendTestNotification = async () => {
    try {
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== 'granted') {
          Alert.alert('Permission denied', 'Enable notifications in device settings.'); return;
        }
      }
      await Notifications.scheduleNotificationAsync({
        content: { title: testTitle || '📖 Study Time!', body: testBody || 'Time to focus.', sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
      });
      Alert.alert('✅ Sent!', 'Notification will arrive in 3 seconds.');
    } catch (e: any) { Alert.alert('Error', e?.message ?? 'Failed'); }
  };

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>

      {/* Header */}
      <View style={[st.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[TYPE.title3, { color: c.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

        {/* Timer */}
        <SectionLabel title="Timer" />
        <Card delay={40}>
          <StepperRow
            icon="timer-outline" label="Focus Duration"
            value={settings.pomodoroFocus} min={5} max={120} step={5} suffix="m"
            onChange={v => updateSettings({ pomodoroFocus: v })}
          />
          <StepperRow
            icon="cafe-outline" label="Short Break"
            value={settings.pomodoroBreak} min={1} max={30} step={1} suffix="m"
            onChange={v => updateSettings({ pomodoroBreak: v })}
          />
          <StepperRow
            icon="trophy-outline" label="Daily Goal"
            iconBg="#FEF3C7" iconColor="#F59E0B"
            value={settings.dailyGoalMinutes} min={15} max={480} step={15} suffix="m"
            onChange={v => updateSettings({ dailyGoalMinutes: v })}
          />
        </Card>

        {/* Appearance */}
        <SectionLabel title="Appearance" />
        <Card delay={80}>
          <ToggleRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            label="Dark Mode"
            iconBg="#EDE9FE" iconColor="#6C63FF"
            value={isDark}
            onValueChange={toggleTheme}
          />
        </Card>

        {/* Sound & Notifications */}
        <SectionLabel title="Sound & Notifications" />
        <Card delay={120}>
          <ToggleRow
            icon="volume-medium-outline" label="Timer Sounds"
            iconBg="#D1FAE5" iconColor="#10B981"
            value={settings.soundEnabled}
            onValueChange={v => updateSettings({ soundEnabled: v })}
          />
        </Card>

        {/* Focus */}
        <SectionLabel title="Focus" />
        <Card delay={160}>
          <ToggleRow
            icon="shield-checkmark-outline" label="Focus Guard"
            iconBg="#FEE2E2" iconColor="#EF4444"
            value={settings.focusGuardEnabled}
            onValueChange={v => updateSettings({ focusGuardEnabled: v })}
          />
          <NavRow
            icon="apps-outline" label="Blocked Apps"
            iconBg="#FEE2E2" iconColor="#EF4444"
            onPress={() => router.push('/(tabs)/app-block' as any)}
          />
        </Card>

        {/* About */}
        <SectionLabel title="About" />
        <Card delay={200}>
          <View style={[st.row, { borderBottomColor: c.border }]}>
            <View style={[st.rowIcon, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="information-circle-outline" size={17} color={c.accent} />
            </View>
            <Text style={[TYPE.body, st.rowLabel, { color: c.text }]}>Version</Text>
            <Text style={[TYPE.callout, { color: c.textMuted }]}>2.0.0</Text>
          </View>
        </Card>

        {/* ── 🧪 TEST NOTIFICATION — remove before release ── */}
        <Card>
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: c.textMuted }}>
              🧪 Test Notification (remove before release)
            </Text>
            <TextInput
              value={testTitle}
              onChangeText={setTestTitle}
              placeholder="Title"
              placeholderTextColor={c.textFaint}
              style={{
                backgroundColor: c.bgSecondary, borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 10,
                color: c.text, fontFamily: FONTS.regular, fontSize: 14,
              }}
            />
            <TextInput
              value={testBody}
              onChangeText={setTestBody}
              placeholder="Body"
              placeholderTextColor={c.textFaint}
              style={{
                backgroundColor: c.bgSecondary, borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 10,
                color: c.text, fontFamily: FONTS.regular, fontSize: 14,
              }}
            />
            <TouchableOpacity
              style={{
                backgroundColor: c.accent, borderRadius: 12,
                paddingVertical: 14, alignItems: 'center',
              }}
              onPress={sendTestNotification}
            >
              <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 15 }}>
                Send Test Notification (3s delay)
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={{ height: SPACING.xxxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: HEADER_TOP,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
  },

  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  },

  sectionLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },

  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,          // Apple HIG: 44pt minimum touch target + breathing room
    borderBottomWidth: 1,
  },

  rowIcon: {
    width: 32, height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  rowLabel: { flex: 1 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepBtn: {
    width: 30, height: 30,
    borderRadius: RADIUS.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  stepVal: {
    fontSize: 15,
    fontFamily: FONTS.black,
    minWidth: 44,
    textAlign: 'center',
  },
});