<<<<<<< HEAD
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

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
        <Animated.View entering={FadeInDown.delay(60).springify()}
          style={[st.card, { backgroundColor: c.bgCard }]}>
          <Row icon="timer-outline" label="Focus দৈর্ঘ্য">
            <Stepper value={settings.pomodoroFocus} min={5} max={120} step={5}
              suffix="m" onChange={v => updateSettings({ pomodoroFocus: v })} />
          </Row>
          <Row icon="cafe-outline" label="Break দৈর্ঘ্য">
            <Stepper value={settings.pomodoroBreak} min={1} max={30} step={1}
              suffix="m" onChange={v => updateSettings({ pomodoroBreak: v })} />
          </Row>
          <Row icon="trophy-outline" label="দৈনিক Goal" iconColor="#F59E0B">
            <Stepper value={settings.dailyGoalMinutes} min={15} max={480} step={15}
              suffix="m" onChange={v => updateSettings({ dailyGoalMinutes: v })} />
          </Row>
        </Animated.View>

        <Section title="Appearance" />
        <Animated.View entering={FadeInDown.delay(100).springify()}
          style={[st.card, { backgroundColor: c.bgCard }]}>
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
        <Animated.View entering={FadeInDown.delay(140).springify()}
          style={[st.card, { backgroundColor: c.bgCard }]}>
          <Row icon="shield-checkmark-outline" label="Focus Guard" iconColor="#EF4444">
            <Switch value={settings.focusGuardEnabled}
              onValueChange={v => updateSettings({ focusGuardEnabled: v })}
              trackColor={{ true: c.destructive }} />
          </Row>
        </Animated.View>

        <Section title="Data" />
        <Animated.View entering={FadeInDown.delay(180).springify()}
          style={[st.card, { backgroundColor: c.bgCard }]}>
          <View style={[st.infoBox, { backgroundColor: c.bgSecondary }]}>
            <View style={st.infoRow}>
              <Text style={[st.infoLabel, { color: c.textMuted }]}>মোট Sessions</Text>
              <Text style={[st.infoVal, { color: c.text }]}>{state.sessions.filter(s => s.completed).length}</Text>
            </View>
            <View style={st.infoRow}>
              <Text style={[st.infoLabel, { color: c.textMuted }]}>Subjects</Text>
              <Text style={[st.infoVal, { color: c.text }]}>{state.subjects.length}</Text>
            </View>
            <View style={st.infoRow}>
              <Text style={[st.infoLabel, { color: c.textMuted }]}>Topics Completed</Text>
              <Text style={[st.infoVal, { color: c.text }]}>{state.totalTopicsCompleted}</Text>
            </View>
            <View style={[st.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={[st.infoLabel, { color: c.textMuted }]}>XP</Text>
              <Text style={[st.infoVal, { color: c.xpColor }]}>{state.xp} ⭐</Text>
            </View>
          </View>
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
  title: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 8 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 8, marginBottom: 4, marginLeft: 4,
  },
  card: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepVal: { fontSize: 15, fontWeight: '800', minWidth: 42, textAlign: 'center' },
  infoBox: { margin: 4, borderRadius: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E4E2FF20',
  },
  infoLabel: { fontSize: 14 },
  infoVal: { fontSize: 15, fontWeight: '700' },
});
=======
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { RADIUS } from '@/constants/theme';
import PaywallModal from '@/components/PaywallModal';

export default function SettingsScreen() {
  const { state, updateSettings } = useStudy();
  const { colors: c } = useTheme();
  const { user, isPro, signInWithGoogle, signOut } = useAuth();
  const { settings } = state;
  const [showPaywall, setShowPaywall] = useState(false);

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


        {/* Account */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[se.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={se.sectionHeader}>
            <View style={[se.sectionIcon, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="person-circle-outline" size={18} color={c.accent} />
            </View>
            <Text style={[se.sectionTitle, { color: c.text }]}>Account</Text>
          </View>
          {user ? (
            <View>
              <View style={[se.row, { borderBottomColor: c.border }]}>
                <View style={[se.statIconWrap, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="person-outline" size={16} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[se.rowLabel, { color: c.text }]}>{user.displayName || 'User'}</Text>
                  <Text style={[se.rowSub, { color: c.textMuted }]}>{user.email}</Text>
                </View>
                {isPro && (
                  <View style={[se.proBadge, { backgroundColor: c.accentSoft }]}>
                    <Ionicons name="star" size={12} color={c.accent} />
                    <Text style={[se.proBadgeText, { color: c.accent }]}>Pro</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[se.row, { borderBottomColor: 'transparent' }]}
                onPress={() => Alert.alert('Sign out', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign out', style: 'destructive', onPress: signOut },
                ])}
              >
                <View style={[se.statIconWrap, { backgroundColor: c.destructive + '18' }]}>
                  <Ionicons name="log-out-outline" size={16} color={c.destructive} />
                </View>
                <Text style={[se.rowLabel, { color: c.destructive }]}>Sign out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[se.row, { borderBottomColor: 'transparent' }]}
              onPress={signInWithGoogle}
            >
              <View style={[se.statIconWrap, { backgroundColor: '#EA433520' }]}>
                <Ionicons name="logo-google" size={16} color="#EA4335" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[se.rowLabel, { color: c.text }]}>Sign in with Google</Text>
                <Text style={[se.rowSub, { color: c.textMuted }]}>Required to purchase Pro & sync data</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Subscription */}
        <Animated.View entering={FadeInDown.delay(230).duration(400)} style={[se.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={se.sectionHeader}>
            <View style={[se.sectionIcon, { backgroundColor: '#FFD70020' }]}>
              <Ionicons name="star" size={18} color="#FFD700" />
            </View>
            <Text style={[se.sectionTitle, { color: c.text }]}>Plan</Text>
          </View>

          {!isPro ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              {/* Free */}
              <View style={[se.planCard, { backgroundColor: c.bgSecondary, borderColor: c.border }]}>
                <View style={se.planRow}>
                  <View>
                    <Text style={[se.planName, { color: c.text }]}>Free</Text>
                    <Text style={[se.planPrice, { color: c.textMuted }]}>Current plan</Text>
                  </View>
                  <View style={[se.planBadge, { backgroundColor: c.border }]}>
                    <Text style={[se.planBadgeText, { color: c.textMuted }]}>Active</Text>
                  </View>
                </View>
                {['1 block routine', '3 apps max per routine', 'Ads in overlay', 'Manual focus only'].map((f, i) => (
                  <View key={i} style={se.featureRow}>
                    <Ionicons name="checkmark-circle-outline" size={15} color={c.textMuted} />
                    <Text style={[se.featureText, { color: c.textMuted }]}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* Pro */}
              <View style={[se.planCard, { backgroundColor: c.accentSoft, borderColor: c.accent + '60', marginTop: 12 }]}>
                <View style={se.planRow}>
                  <View>
                    <Text style={[se.planName, { color: c.accent }]}>Pro ⭐</Text>
                    <Text style={[se.planPrice, { color: c.accent }]}>৳999 one-time · Lifetime</Text>
                  </View>
                  <TouchableOpacity
                    style={[se.upgradeBtn, { backgroundColor: c.accent, borderBottomColor: c.accentDark }]}
                    onPress={() => setShowPaywall(true)}
                  >
                    <Text style={se.upgradeBtnText}>Upgrade</Text>
                  </TouchableOpacity>
                </View>
                {['Unlimited routines & apps', 'Auto-blocking by schedule', 'Reels / Shorts blocking', 'Ad-free overlay', 'Cross-device sync', 'Smart reminders'].map((f, i) => (
                  <View key={i} style={se.featureRow}>
                    <Ionicons name="checkmark-circle" size={15} color={c.accent} />
                    <Text style={[se.featureText, { color: c.text }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <View style={[se.planCard, { backgroundColor: c.accentSoft, borderColor: c.accent + '60' }]}>
                <View style={se.planRow}>
                  <View>
                    <Text style={[se.planName, { color: c.accent }]}>Pro ⭐ Active</Text>
                    <Text style={[se.planPrice, { color: c.textMuted }]}>Lifetime · All features unlocked</Text>
                  </View>
                  <Ionicons name="shield-checkmark" size={28} color={c.accent} />
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />

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
  planCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: 16, gap: 10 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  planName: { fontSize: 17, fontWeight: '800' },
  planPrice: { fontSize: 13, marginTop: 2 },
  planBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full },
  planBadgeText: { fontSize: 12, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  featureText: { fontSize: 13 },
  upgradeBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.lg, borderBottomWidth: 3 },
  upgradeBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  proBadgeText: { fontSize: 12, fontWeight: '700' },
});
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
