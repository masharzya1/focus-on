import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FONTS, RADIUS } from '@/constants/theme';

export default function PersonalInfoScreen() {
  const { state, updateSettings } = useStudy();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const t = useT();
  const router = useRouter();
  const [tab, setTab] = useState<'personal' | 'academic'>('personal');

  // Academic settings
  const [dailyGoal, setDailyGoal] = useState(state.settings.dailyGoalMinutes);
  const [focusDur,  setFocusDur]  = useState(state.settings.pomodoroFocus);
  const [breakDur,  setBreakDur]  = useState(state.settings.pomodoroBreak);

  const saveAcademic = () => {
    updateSettings({ dailyGoalMinutes: dailyGoal, pomodoroFocus: focusDur, pomodoroBreak: breakDur });
    Alert.alert('Saved', 'Your settings have been updated.');
  };

  const Field = ({ label, value, editable = false, onChange }: {
    label: string; value: string; editable?: boolean; onChange?: (v: string) => void;
  }) => (
    <View style={[st.field, { borderBottomColor: c.border }]}>
      <Text style={[st.fieldLabel, { color: c.textMuted }]}>{label}</Text>
      {editable && onChange ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={[st.fieldInput, { color: c.text }]}
          placeholderTextColor={c.textFaint}
        />
      ) : (
        <Text style={[st.fieldValue, { color: c.text }]}>{value || '—'}</Text>
      )}
    </View>
  );

  const Stepper = ({ val, min, max, step = 5, onChange, suffix = '' }: {
    val: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string;
  }) => (
    <View style={st.stepper}>
      <TouchableOpacity
        style={[st.stepBtn, { backgroundColor: c.bgSecondary }]}
        onPress={() => onChange(Math.max(min, val - step))}>
        <Ionicons name="remove" size={16} color={c.accent} />
      </TouchableOpacity>
      <Text style={[st.stepVal, { color: c.text }]}>{val}{suffix}</Text>
      <TouchableOpacity
        style={[st.stepBtn, { backgroundColor: c.bgSecondary }]}
        onPress={() => onChange(Math.min(max, val + step))}>
        <Ionicons name="add" size={16} color={c.accent} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: c.text }]}>Personal Information</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[st.tabBar, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        {(['personal', 'academic'] as const).map(t => (
          <TouchableOpacity key={t} style={st.tabBtn} onPress={() => setTab(t)}>
            <Text style={[st.tabTxt, {
              color: tab === t ? c.accent : c.textMuted,
              fontFamily: tab === t ? FONTS.bold : FONTS.regular,
            }]}>
              {t === 'personal' ? 'Personal' : 'Academic'}
            </Text>
            {tab === t && <View style={[st.tabLine, { backgroundColor: c.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {tab === 'personal' ? (
          <View style={[st.card, { backgroundColor: c.bgCard }]}>
            <Field label="Full Name"    value={user?.displayName ?? ''} />
            <Field label="Email"        value={user?.email ?? ''} />
            <Field label="Joined"       value={user?.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : '—'} />
            <Field label="Account Type" value={user ? 'Google Account' : 'Guest'} />
          </View>
        ) : (
          <>
            <View style={[st.card, { backgroundColor: c.bgCard }]}>
              <Text style={[st.sectionLabel, { color: c.textMuted }]}>STUDY GOALS</Text>

              <View style={[st.settingRow, { borderBottomColor: c.border }]}>
                <View style={st.settingLeft}>
                  <View style={[st.settingIcon, { backgroundColor: '#EDE9FF' }]}>
                    <Ionicons name="trophy-outline" size={17} color="#6C63FF" />
                  </View>
                  <View>
                    <Text style={[st.settingLabel, { color: c.text }]}>Daily Goal</Text>
                    <Text style={[st.settingDesc, { color: c.textFaint }]}>Minutes per day</Text>
                  </View>
                </View>
                <Stepper val={dailyGoal} min={30} max={480} step={15} suffix="m" onChange={setDailyGoal} />
              </View>

              <View style={[st.settingRow, { borderBottomColor: c.border }]}>
                <View style={st.settingLeft}>
                  <View style={[st.settingIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="timer-outline" size={17} color="#10B981" />
                  </View>
                  <View>
                    <Text style={[st.settingLabel, { color: c.text }]}>Focus Duration</Text>
                    <Text style={[st.settingDesc, { color: c.textFaint }]}>Default timer length</Text>
                  </View>
                </View>
                <Stepper val={focusDur} min={5} max={120} step={5} suffix="m" onChange={setFocusDur} />
              </View>

              <View style={[st.settingRow, { borderBottomColor: 'transparent' }]}>
                <View style={st.settingLeft}>
                  <View style={[st.settingIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="cafe-outline" size={17} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={[st.settingLabel, { color: c.text }]}>Break Duration</Text>
                    <Text style={[st.settingDesc, { color: c.textFaint }]}>Rest between sessions</Text>
                  </View>
                </View>
                <Stepper val={breakDur} min={1} max={30} step={1} suffix="m" onChange={setBreakDur} />
              </View>
            </View>

            <TouchableOpacity style={[st.saveBtn, { backgroundColor: c.accent }]} onPress={saveAcademic}>
              <Text style={st.saveTxt}>Save Changes</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabTxt: { fontSize: 15 },
  tabLine: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, borderRadius: 1 },
  content: { padding: 16, gap: 12 },
  card: { borderRadius: 16, overflow: 'hidden' },
  sectionLabel: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, padding: 16, paddingBottom: 8 },
  field: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  fieldLabel: { fontSize: 12, fontFamily: FONTS.medium, marginBottom: 4 },
  fieldValue: { fontSize: 15, fontFamily: FONTS.semibold },
  fieldInput: { fontSize: 15, fontFamily: FONTS.semibold, padding: 0 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontFamily: FONTS.semibold },
  settingDesc: { fontSize: 12, fontFamily: FONTS.regular },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepVal: { fontSize: 15, fontFamily: FONTS.bold, minWidth: 42, textAlign: 'center' },
  saveBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
});