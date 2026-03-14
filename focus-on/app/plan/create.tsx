import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import type { StudyPlan, PlannedTask } from '@/types/study';
import AppBlocking from '@/modules/AppBlocking';

const STEPS = ['Exam Info', 'Topics', 'Schedule', 'Block'];

// ── Simple time picker ────────────────────────────────────────────────────────
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, setH] = useState(() => { const [hh] = value.split(':'); return parseInt(hh) || 9; });
  const [m, setM] = useState(() => { const [, mm] = value.split(':'); return parseInt(mm) || 0; });

  const emit = (nh: number, nm: number) => {
    onChange(`${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {/* Hours */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <TouchableOpacity onPress={() => { const nh = (h + 1) % 24; setH(nh); emit(nh, m); }}><Ionicons name="chevron-up" size={16} color="#6C63FF" /></TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', minWidth: 28, textAlign: 'center' }}>{String(h).padStart(2,'0')}</Text>
        <TouchableOpacity onPress={() => { const nh = (h + 23) % 24; setH(nh); emit(nh, m); }}><Ionicons name="chevron-down" size={16} color="#6C63FF" /></TouchableOpacity>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800' }}>:</Text>
      {/* Minutes */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <TouchableOpacity onPress={() => { const nm = (Math.floor(m/5)+1)%12*5; setM(nm); emit(h, nm); }}><Ionicons name="chevron-up" size={16} color="#6C63FF" /></TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', minWidth: 28, textAlign: 'center' }}>{String(m).padStart(2,'0')}</Text>
        <TouchableOpacity onPress={() => { const nm = (Math.floor(m/5)+11)%12*5; setM(nm); emit(h, nm); }}><Ionicons name="chevron-down" size={16} color="#6C63FF" /></TouchableOpacity>
      </View>
    </View>
  );
}

export default function CreatePlanScreen() {
  const { state, addStudyPlan } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const [step, setStep] = useState(0);

  // Step 1
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(2);

  // Step 2 — selected topics per subject
  const [selectedTopics, setSelectedTopics] = useState<{subjectId:string;chapterId:string;topicId:string;name:string;minutes:number}[]>([]);

  // Step 3 — AI generated schedule (topic → {date, startTime, endTime})
  const [schedule, setSchedule] = useState<{[topicId:string]: {date:string;startTime:string;endTime:string}}>({});
  const [generating, setGenerating] = useState(false);

  // Step 4 — block options
  const [blockApps, setBlockApps] = useState(false);
  const [hardBlock, setHardBlock] = useState(false);
  const [deviceAdmin, setDeviceAdmin] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<{name:string;packageName:string}[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);

  // ── AI Schedule Generator ──────────────────────────────────────────────────
  const generateSchedule = () => {
    setGenerating(true);
    setTimeout(() => {
      const startDate = new Date();
      const endDate = new Date(examDate || Date.now() + 7 * 86400000);
      const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
      const slotsPerDay = Math.max(1, Math.floor(dailyHours * 60 / 30)); // 30-min slots

      let dayOffset = 0;
      let slotInDay = 0;
      const BASE_HOUR = 9; // start at 9am

      const newSchedule: typeof schedule = {};
      selectedTopics.forEach(topic => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + dayOffset);
        const dateStr = d.toISOString().split('T')[0];
        const startH = BASE_HOUR + slotInDay;
        const endH = startH + Math.ceil(topic.minutes / 60);

        newSchedule[topic.topicId] = {
          date: dateStr,
          startTime: `${String(startH).padStart(2,'0')}:00`,
          endTime: `${String(endH).padStart(2,'0')}:00`,
        };

        slotInDay++;
        if (slotInDay >= slotsPerDay) { slotInDay = 0; dayOffset++; }
      });

      setSchedule(newSchedule);
      setGenerating(false);
    }, 1400);
  };

  // ── Load installed apps ────────────────────────────────────────────────────
  const loadApps = async () => {
    setLoadingApps(true);
    const apps = await AppBlocking.getInstalledApps();
    setInstalledApps(apps.filter(a => !a.packageName.startsWith('com.android') && !a.packageName.startsWith('com.google.android.googlequicksearchbox')));
    setLoadingApps(false);
    setShowAppPicker(true);
  };

  // ── Save plan ──────────────────────────────────────────────────────────────
  const savePlan = () => {
    const tasks: PlannedTask[] = selectedTopics.map(tp => ({
      id: `task_${Date.now()}_${tp.topicId}`,
      date: schedule[tp.topicId]?.date || new Date().toISOString().split('T')[0],
      startTime: schedule[tp.topicId]?.startTime,
      endTime: schedule[tp.topicId]?.endTime,
      topicId: tp.topicId, subjectId: tp.subjectId, chapterId: tp.chapterId,
      estimatedMinutes: tp.minutes, completed: false, type: 'study',
    }));

    const plan: StudyPlan = {
      id: Date.now().toString(), examName, examDate,
      subjects: [...new Set(selectedTopics.map(t => t.subjectId))],
      dailyHours, createdAt: new Date().toISOString(), tasks,
      blockApps, hardBlock, deviceAdmin, blockedApps,
    };
    addStudyPlan(plan);
    router.replace('/(tabs)/plan');
  };

  const canNext = () => {
    if (step === 0) return examName.trim().length > 0 && examDate.length > 0;
    if (step === 1) return selectedTopics.length > 0;
    if (step === 2) return Object.keys(schedule).length > 0;
    return true;
  };

  const toggleTopic = (subjectId: string, chapterId: string, topicId: string, name: string, minutes: number) => {
    const exists = selectedTopics.find(t => t.topicId === topicId);
    if (exists) setSelectedTopics(s => s.filter(t => t.topicId !== topicId));
    else setSelectedTopics(s => [...s, { subjectId, chapterId, topicId, name, minutes }]);
  };

  // ── Step indicators ────────────────────────────────────────────────────────
  const StepBar = () => (
    <View style={styles.stepBar}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={{ alignItems: 'center' }}>
            <View style={[styles.stepDot, { backgroundColor: i <= step ? c.accent : c.border }]}>
              {i < step ? <Ionicons name="checkmark" size={12} color="#fff" /> :
                <Text style={{ color: i === step ? '#fff' : c.textFaint, fontSize: 11, fontWeight: '700' }}>{i+1}</Text>}
            </View>
            <Text style={[styles.stepLabel, { color: i === step ? c.accent : c.textFaint }]}>{s}</Text>
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < step ? c.accent : c.border }]} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s-1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>নতুন Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <StepBar />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Step 0: Exam Info ── */}
        {step === 0 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>Exam এর তথ্য দাও</Text>

            <Text style={[styles.label, { color: c.textMuted }]}>Exam / Plan এর নাম</Text>
            <TextInput style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="যেমন: Physics Final Exam" placeholderTextColor={c.textFaint}
              value={examName} onChangeText={setExamName} />

            <Text style={[styles.label, { color: c.textMuted }]}>Exam এর তারিখ (YYYY-MM-DD)</Text>
            <TextInput style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="2025-06-15" placeholderTextColor={c.textFaint}
              value={examDate} onChangeText={setExamDate} keyboardType="numeric" />

            <Text style={[styles.label, { color: c.textMuted }]}>প্রতিদিন কত ঘণ্টা পড়তে পারব?</Text>
            <View style={styles.hoursRow}>
              {[1,2,3,4,5,6].map(h => (
                <TouchableOpacity key={h} style={[styles.hourBtn,
                  { backgroundColor: dailyHours === h ? c.accent : c.inputBg, borderColor: dailyHours === h ? c.accent : c.border }]}
                  onPress={() => setDailyHours(h)}>
                  <Text style={[styles.hourTxt, { color: dailyHours === h ? '#fff' : c.textMuted }]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Step 1: Select Topics ── */}
        {step === 1 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>কোন Topics পড়বে?</Text>
            <Text style={[styles.stepDesc, { color: c.textMuted }]}>যেগুলো পড়তে হবে সেগুলো select করো</Text>
            {state.subjects.map(subject => (
              <View key={subject.id} style={[styles.subjectBlock, { backgroundColor: c.bgCard }]}>
                <View style={styles.subjectBlockHeader}>
                  <View style={[styles.subIconSm, { backgroundColor: subject.color + '22' }]}>
                    <Ionicons name={subject.icon as any} size={18} color={subject.color} />
                  </View>
                  <Text style={[styles.subjectBlockName, { color: c.text }]}>{subject.name}</Text>
                </View>
                {subject.chapters.flatMap(ch => ch.topics).length === 0 ? (
                  <Text style={[styles.noTopics, { color: c.textFaint }]}>Topics নেই — Subject detail এ গিয়ে যোগ করো</Text>
                ) : (
                  subject.chapters.map(ch => (
                    <View key={ch.id}>
                      {ch.topics.length > 0 && (
                        <Text style={[styles.chLabel, { color: c.textFaint }]}>{ch.name}</Text>
                      )}
                      {ch.topics.map(t => {
                        const sel = !!selectedTopics.find(x => x.topicId === t.id);
                        return (
                          <TouchableOpacity key={t.id} style={[styles.topicItem,
                            { backgroundColor: sel ? c.accentSoft : 'transparent', borderColor: sel ? c.accent : c.border }]}
                            onPress={() => toggleTopic(subject.id, ch.id, t.id, t.name, t.estimatedMinutes)}>
                            <View style={[styles.checkBox, { borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.accent : 'transparent' }]}>
                              {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                            </View>
                            <Text style={[styles.topicItemName, { color: sel ? c.accent : c.text }]}>{t.name}</Text>
                            <Text style={[styles.topicMins, { color: c.textFaint }]}>~{t.estimatedMinutes}m</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))
                )}
              </View>
            ))}
            <Text style={[styles.selCount, { color: c.textMuted }]}>{selectedTopics.length} topic selected</Text>
          </Animated.View>
        )}

        {/* ── Step 2: AI Schedule ── */}
        {step === 2 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>Schedule তৈরি করো</Text>

            {Object.keys(schedule).length === 0 ? (
              <View style={styles.genBox}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🤖</Text>
                <Text style={[styles.genDesc, { color: c.textMuted }]}>
                  AI তোমার {selectedTopics.length}টি topic কে exam এর আগে ভাগ করে schedule বানাবে।
                </Text>
                <TouchableOpacity style={[styles.genBtn, { backgroundColor: c.accent }]}
                  onPress={generateSchedule} disabled={generating}>
                  {generating ? <ActivityIndicator color="#fff" /> :
                    <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.genBtnTxt}>Schedule বানাও</Text></>}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={[styles.successBanner, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="checkmark-circle" size={20} color={c.accent} />
                  <Text style={[styles.successTxt, { color: c.accent }]}>Schedule তৈরি! চাইলে সময় বদলাও।</Text>
                </View>
                {selectedTopics.map(tp => {
                  const slot = schedule[tp.topicId];
                  const subject = state.subjects.find(s => s.id === tp.subjectId);
                  return (
                    <View key={tp.topicId} style={[styles.scheduleCard, { backgroundColor: c.bgCard }]}>
                      <View style={styles.scheduleTop}>
                        <Text style={[styles.scheduleName, { color: c.text }]} numberOfLines={1}>{tp.name}</Text>
                        <Text style={[styles.scheduleSub, { color: c.textMuted }]}>{subject?.name}</Text>
                      </View>
                      <View style={styles.scheduleTimeRow}>
                        <View>
                          <Text style={[styles.scheduleDate, { color: c.accent }]}>{slot?.date}</Text>
                          <View style={styles.timeRow}>
                            <TimePicker value={slot?.startTime || '09:00'} onChange={v =>
                              setSchedule(s => ({ ...s, [tp.topicId]: { ...s[tp.topicId], startTime: v } }))} />
                            <Text style={{ color: c.textMuted, marginHorizontal: 4 }}>→</Text>
                            <TimePicker value={slot?.endTime || '10:00'} onChange={v =>
                              setSchedule(s => ({ ...s, [tp.topicId]: { ...s[tp.topicId], endTime: v } }))} />
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
                <TouchableOpacity style={[styles.regenBtn, { borderColor: c.accent }]} onPress={generateSchedule}>
                  <Ionicons name="refresh" size={16} color={c.accent} />
                  <Text style={[styles.regenTxt, { color: c.accent }]}>আবার বানাও</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}

        {/* ── Step 3: Block Confirm ── */}
        {step === 3 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>App Block সেটআপ</Text>

            <View style={[styles.blockCard, { backgroundColor: c.bgCard }]}>
              <View style={styles.blockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.blockTitle, { color: c.text }]}>Study time এ apps block করব?</Text>
                  <Text style={[styles.blockDesc, { color: c.textMuted }]}>
                    Schedule করা time এ selected apps block হবে
                  </Text>
                </View>
                <Switch value={blockApps} onValueChange={setBlockApps} trackColor={{ true: c.accent }} />
              </View>
            </View>

            {blockApps && (
              <>
                <View style={[styles.blockCard, { backgroundColor: c.bgCard }]}>
                  <View style={styles.blockRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.blockTitle, { color: c.text }]}>🔒 Hard Block</Text>
                      <Text style={[styles.blockDesc, { color: c.textMuted }]}>
                        Block সময়ে app এর ভেতর থেকে unblock করা যাবে না, শুধু uninstall করলে বন্ধ হবে
                      </Text>
                    </View>
                    <Switch value={hardBlock} onValueChange={setHardBlock} trackColor={{ true: c.destructive }} />
                  </View>
                </View>

                <View style={[styles.blockCard, { backgroundColor: c.bgCard }]}>
                  <View style={styles.blockRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.blockTitle, { color: c.text }]}>🛡️ Device Admin</Text>
                      <Text style={[styles.blockDesc, { color: c.textMuted }]}>
                        Unblock ও না, uninstall ও না। Device admin permission লাগবে। সবচেয়ে কড়া block।
                      </Text>
                    </View>
                    <Switch value={deviceAdmin} onValueChange={async (v) => {
                      if (v) {
                        const granted = await AppBlocking.requestDeviceAdmin();
                        if (!granted) { Alert.alert('Permission দরকার', 'Device Admin permission দাও।'); return; }
                      }
                      setDeviceAdmin(v);
                      if (v) setHardBlock(true);
                    }} trackColor={{ true: '#DC2626' }} />
                  </View>
                </View>

                <TouchableOpacity style={[styles.appPickBtn, { backgroundColor: c.accentSoft, borderColor: c.accent }]}
                  onPress={loadApps}>
                  <Ionicons name="apps" size={18} color={c.accent} />
                  <Text style={[styles.appPickTxt, { color: c.accent }]}>
                    {blockedApps.length > 0 ? `${blockedApps.length}টি app selected` : 'Apps বেছে নাও'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.finalCard, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="information-circle" size={18} color={c.accent} />
              <Text style={[styles.finalTxt, { color: c.accent }]}>
                Plan save করলে সব schedule অনুযায়ী notification আসবে।
              </Text>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={[styles.bottomNav, { backgroundColor: c.bgCard, borderTopColor: c.border }]}>
        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: canNext() ? c.accent : c.border }]}
          onPress={() => {
            if (step === 1 && Object.keys(schedule).length === 0) generateSchedule();
            if (step < STEPS.length - 1) setStep(s => s + 1);
            else savePlan();
          }}
          disabled={!canNext()}>
          <Text style={[styles.nextTxt, { color: canNext() ? '#fff' : c.textFaint }]}>
            {step === STEPS.length - 1 ? '✅ Plan Save করো' : 'পরবর্তী →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  stepBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 9, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  stepLine: { flex: 1, height: 2, marginBottom: 14 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  stepTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  stepDesc: { fontSize: 14, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5 },
  hoursRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  hourBtn: { width: 56, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  hourTxt: { fontSize: 15, fontWeight: '700' },
  subjectBlock: { borderRadius: RADIUS.xl, padding: 14, marginBottom: 12 },
  subjectBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  subIconSm: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  subjectBlockName: { fontSize: 15, fontWeight: '700' },
  noTopics: { fontSize: 13, paddingVertical: 8 },
  chLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 4 },
  topicItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, marginBottom: 6, borderWidth: 1.5 },
  checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  topicItemName: { flex: 1, fontSize: 14, fontWeight: '600' },
  topicMins: { fontSize: 12 },
  selCount: { textAlign: 'center', fontSize: 13, marginVertical: 8 },
  genBox: { alignItems: 'center', paddingVertical: 40 },
  genDesc: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  genBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  successTxt: { fontSize: 14, fontWeight: '600', flex: 1 },
  scheduleCard: { borderRadius: RADIUS.xl, padding: 14, marginBottom: 10 },
  scheduleTop: { marginBottom: 10 },
  scheduleName: { fontSize: 15, fontWeight: '700' },
  scheduleSub: { fontSize: 12, marginTop: 2 },
  scheduleDate: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  scheduleTimeRow: {},
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  regenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderRadius: 14, paddingVertical: 12, marginTop: 8 },
  regenTxt: { fontSize: 14, fontWeight: '700' },
  blockCard: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  blockRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  blockTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  blockDesc: { fontSize: 13, lineHeight: 20 },
  appPickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  appPickTxt: { fontSize: 15, fontWeight: '700' },
  finalCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, marginTop: 4 },
  finalTxt: { fontSize: 13, lineHeight: 20, flex: 1 },
  bottomNav: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1 },
  nextBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nextTxt: { fontSize: 17, fontWeight: '800' },
});
