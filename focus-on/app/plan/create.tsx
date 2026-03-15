import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Platform, ActivityIndicator, Alert, FlatList, Modal,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import type { StudyPlan, PlannedTask } from '@/types/study';
import AppBlocking from '@/modules/AppBlocking';
import { setupAllNotifications } from '@/services/notifications';

const STEPS = ['Exam Info', 'Topics', 'Schedule', 'Block'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ITEM_H = 48;
const VISIBLE = 5; // odd number — center is selected

function daysInMonth(m: number, y: number) { return new Date(y, m + 1, 0).getDate(); }

// ── Single scroll column ───────────────────────────────────────────────────
function ScrollColumn({
  items, index, onIndexChange, width, colors: c,
}: {
  items: string[]; index: number; onIndexChange: (i: number) => void;
  width: number; colors: any;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const initialScroll = useRef(false);

  // Scroll to selected index
  const scrollTo = (idx: number, animated = true) => {
    scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated });
  };

  React.useEffect(() => {
    // Initial position without animation
    const timer = setTimeout(() => scrollTo(index, false), 10);
    return () => clearTimeout(timer);
  }, []);

  // When external index changes (e.g. month changes -> day count changes)
  React.useEffect(() => {
    scrollTo(index, true);
  }, [index]);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const snapped = Math.round(y / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, snapped));
    if (clamped !== index) onIndexChange(clamped);
  };

  const handleMomentumEnd = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const snapped = Math.round(y / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, snapped));
    scrollTo(clamped, true);
    onIndexChange(clamped);
  };

  const padding = Math.floor(VISIBLE / 2);

  return (
    <View style={{ width, alignItems: 'center' }}>
      {/* Selection highlight bar */}
      <View style={{
        position: 'absolute', top: padding * ITEM_H,
        height: ITEM_H, width: '100%',
        backgroundColor: c.accentSoft,
        borderRadius: 14, zIndex: 0,
      }} pointerEvents="none" />

      {/* Fade top */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: padding * ITEM_H, zIndex: 2,
        backgroundColor: 'transparent',
      }} pointerEvents="none">
        {[...Array(padding)].map((_, i) => (
          <View key={i} style={{
            height: ITEM_H, opacity: 1 - i * (1 / (padding + 1)),
            backgroundColor: c.bg,
          }} />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ height: VISIBLE * ITEM_H, width }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: padding * ITEM_H }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - index);
          const isSelected = dist === 0;
          return (
            <TouchableOpacity
              key={i}
              style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { onIndexChange(i); scrollTo(i, true); }}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: isSelected ? 20 : 16,
                fontWeight: isSelected ? '800' : '400',
                color: isSelected ? c.accent : dist === 1 ? c.textMuted : c.textFaint,
                opacity: dist >= 2 ? 0.4 : 1,
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Fade bottom */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: padding * ITEM_H, zIndex: 2,
      }} pointerEvents="none">
        {[...Array(padding)].reverse().map((_, i) => (
          <View key={i} style={{
            height: ITEM_H, opacity: 1 - i * (1 / (padding + 1)),
            backgroundColor: c.bg,
          }} />
        ))}
      </View>
    </View>
  );
}

// ── Date Picker ───────────────────────────────────────────────────────────
function DatePicker({ value, onChange, colors: c }: {
  value: string; onChange: (v: string) => void; colors: any;
}) {
  const today = new Date();
  const parsed = value ? new Date(value) : today;
  const isValid = !isNaN(parsed.getTime());
  const init = isValid ? parsed : today;

  const [dayIdx, setDayIdx] = useState(init.getDate() - 1);
  const [monIdx, setMonIdx] = useState(init.getMonth());
  const [yrIdx, setYrIdx] = useState(Math.max(0, init.getFullYear() - today.getFullYear()));

  const YEARS = Array.from({ length: 8 }, (_, i) => String(today.getFullYear() + i));

  const getDays = (m: number, y: number) => {
    const count = daysInMonth(m, today.getFullYear() + y);
    return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'));
  };

  const emit = (d: number, m: number, y: number) => {
    const yr = today.getFullYear() + y;
    const days = getDays(m, y);
    const safeD = Math.min(d, days.length - 1);
    const dateStr = `${yr}-${String(m + 1).padStart(2,'0')}-${String(safeD + 1).padStart(2,'0')}`;
    onChange(dateStr);
  };

  const handleDay = (i: number) => { setDayIdx(i); emit(i, monIdx, yrIdx); };
  const handleMon = (i: number) => {
    const days = getDays(i, yrIdx);
    const safeD = Math.min(dayIdx, days.length - 1);
    setDayIdx(safeD); setMonIdx(i); emit(safeD, i, yrIdx);
  };
  const handleYr = (i: number) => {
    const days = getDays(monIdx, i);
    const safeD = Math.min(dayIdx, days.length - 1);
    setDayIdx(safeD); setYrIdx(i); emit(safeD, monIdx, i);
  };

  const days = getDays(monIdx, yrIdx);

  // Friendly display
  const yr = today.getFullYear() + yrIdx;
  const displayDate = `${MONTHS_FULL[monIdx]} ${dayIdx + 1}, ${yr}`;
  const daysLeft = Math.ceil((new Date(yr, monIdx, dayIdx + 1).getTime() - Date.now()) / 86400000);

  return (
    <View style={{ marginTop: 4, marginBottom: 8 }}>
      {/* Picker */}
      <View style={[styles.pickerCard, { backgroundColor: c.bgCard }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ScrollColumn items={days}    index={dayIdx} onIndexChange={handleDay} width={64}  colors={c} />
          <View style={{ width: 1, height: VISIBLE * ITEM_H * 0.6, backgroundColor: c.border }} />
          <ScrollColumn items={MONTHS}  index={monIdx} onIndexChange={handleMon} width={72}  colors={c} />
          <View style={{ width: 1, height: VISIBLE * ITEM_H * 0.6, backgroundColor: c.border }} />
          <ScrollColumn items={YEARS}   index={yrIdx}  onIndexChange={handleYr}  width={76}  colors={c} />
        </View>
      </View>

      {/* Friendly label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold', color: c.text }}>{displayDate}</Text>
        {daysLeft > 0 && (
          <View style={[styles.daysLeftBadge, { backgroundColor: daysLeft <= 7 ? '#FEE2E2' : c.accentSoft }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold', color: daysLeft <= 7 ? '#DC2626' : c.accent }}>
              {daysLeft}d to go
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Scroll-wheel time picker (with AM/PM) ────────────────────────────────────
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors: c } = useTheme();
  const h24 = parseInt(value.split(':')[0]) || 9;
  const m   = parseInt(value.split(':')[1]) || 0;
  const isPM = h24 >= 12;
  const h12  = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;

  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const ampm    = ['AM', 'PM'];

  const emit = (newH12: number, newM: number, newPM: boolean) => {
    let h = newH12 % 12;
    if (newPM) h += 12;
    onChange(`${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <ScrollColumn items={hours}   index={h12 - 1}  onIndexChange={i => emit(i + 1, m, isPM)}  width={44} colors={c} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: c.textMuted, marginBottom: 2 }}>:</Text>
      <ScrollColumn items={minutes} index={m}         onIndexChange={i => emit(h12, i, isPM)}    width={44} colors={c} />
      <ScrollColumn items={ampm}    index={isPM ? 1 : 0} onIndexChange={i => emit(h12, m, i === 1)} width={46} colors={c} />
    </View>
  );
}

export default function CreatePlanScreen() {
  const { state, addStudyPlan } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const [step, setStep] = useState(0);

  // Step 0
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1); // default: 1 month from today
    return d.toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState(2);

  // Step 1 — selected items (topic or chapter depending on subject type)
  const [selectedItems, setSelectedItems] = useState<{
    subjectId: string; chapterId: string; topicId: string; name: string; minutes: number;
  }[]>([]);

  // Step 2 — schedule
  const [schedule, setSchedule] = useState<{[id:string]: {date:string;startTime:string;endTime:string}}>({});
  const [generating, setGenerating] = useState(false);

  // Step 3 — block
  const [blockApps, setBlockApps] = useState(false);
  const [hardBlock, setHardBlock] = useState(false);
  const [deviceAdmin, setDeviceAdmin] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<{name:string;packageName:string}[]>([]);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appSearch, setAppSearch] = useState('');

  // ── Generate schedule ──────────────────────────────────────────────────────
  const generateSchedule = () => {
    if (selectedItems.length === 0) return;
    setGenerating(true);
    setTimeout(() => {
      const startDate = new Date();
      const endDate = examDate ? new Date(examDate) : new Date(Date.now() + 7 * 86400000);
      const slotsPerDay = Math.max(1, Math.floor(dailyHours * 60 / 30));
      let dayOffset = 0, slotInDay = 0;
      const BASE_HOUR = 9;
      const newSchedule: typeof schedule = {};

      selectedItems.forEach(item => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + dayOffset);
        const startH = BASE_HOUR + slotInDay;
        const endH = Math.min(startH + Math.ceil(item.minutes / 60), 23);
        newSchedule[item.topicId] = {
          date: d.toISOString().split('T')[0],
          startTime: `${String(startH).padStart(2,'0')}:00`,
          endTime: `${String(endH).padStart(2,'0')}:00`,
        };
        slotInDay++;
        if (slotInDay >= slotsPerDay) { slotInDay = 0; dayOffset++; }
      });

      setSchedule(newSchedule);
      setGenerating(false);
    }, 1200);
  };

  // ── Load installed apps ────────────────────────────────────────────────────
  const loadApps = async () => {
    setLoadingApps(true);
    try {
      const apps = await AppBlocking.getInstalledApps();
      setInstalledApps(apps.filter(a =>
        !a.packageName.startsWith('com.android') &&
        !a.packageName.startsWith('com.google.android.googlequicksearchbox')
      ));
    } catch {
      Alert.alert('Error', 'Could not load installed apps.');
    }
    setLoadingApps(false);
    setShowAppPicker(true);
  };

  // ── Save plan ──────────────────────────────────────────────────────────────
  const savePlan = async () => {
    const tasks: PlannedTask[] = selectedItems.map(tp => ({
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      date: schedule[tp.topicId]?.date || new Date().toISOString().split('T')[0],
      startTime: schedule[tp.topicId]?.startTime,
      endTime: schedule[tp.topicId]?.endTime,
      topicId: tp.topicId, subjectId: tp.subjectId, chapterId: tp.chapterId,
      estimatedMinutes: tp.minutes, completed: false, type: 'study',
    }));

    const plan: StudyPlan = {
      id: Date.now().toString(), examName, examDate,
      subjects: [...new Set(selectedItems.map(t => t.subjectId))],
      dailyHours, createdAt: new Date().toISOString(), tasks,
      blockApps, hardBlock, deviceAdmin,
      blockedApps: blockApps ? blockedApps : [],
    };

    addStudyPlan(plan);

    // Schedule notifications for this plan + per-task notifications
    try {
      const allPlans = [...state.studyPlans, plan];
      const taskNotifs = plan.tasks
        .filter(t => t.startTime)
        .map(t => {
          const item = selectedItems.find(s => s.topicId === t.topicId);
          return {
            date: t.date,
            startTime: t.startTime,
            topicName: item?.name ?? 'Study task',
            subjectName: state.subjects.find(s => s.id === t.subjectId)?.name ?? '',
            estimatedMinutes: t.estimatedMinutes,
          };
        });
      await setupAllNotifications(
        allPlans.map(p => ({ examName: p.examName, examDate: p.examDate })),
        taskNotifs
      );
    } catch { /* silently fail — don't block save */ }

    router.replace('/(tabs)/plan');
  };

  const canNext = () => {
    if (step === 0) return examName.trim().length > 0 && examDate.length > 0;
    if (step === 1) return selectedItems.length > 0;
    if (step === 2) return Object.keys(schedule).length > 0;
    return true;
  };

  const toggleItem = (
    subjectId: string, chapterId: string, topicId: string, name: string, minutes: number
  ) => {
    const exists = selectedItems.find(t => t.topicId === topicId);
    if (exists) setSelectedItems(s => s.filter(t => t.topicId !== topicId));
    else setSelectedItems(s => [...s, { subjectId, chapterId, topicId, name, minutes }]);
  };

  // ── Step indicator ─────────────────────────────────────────────────────────
  const StepBar = () => (
    <View style={styles.stepBar}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={{ alignItems: 'center' }}>
            <View style={[styles.stepDot, { backgroundColor: i <= step ? c.accent : c.border }]}>
              {i < step
                ? <Ionicons name="checkmark" size={12} color="#fff" />
                : <Text style={{ color: i === step ? '#fff' : c.textFaint, fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>{i+1}</Text>}
            </View>
            <Text style={[styles.stepLabel, { color: i === step ? c.accent : c.textFaint }]}>{s}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, { backgroundColor: i < step ? c.accent : c.border }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const filteredApps = installedApps.filter(a =>
    !appSearch ||
    a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.packageName.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s-1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>New Study Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <StepBar />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Step 0: Exam Info ── */}
        {step === 0 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>Exam details</Text>

            <Text style={[styles.label, { color: c.textMuted }]}>Exam / Plan name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="e.g. Physics Final Exam" placeholderTextColor={c.textFaint}
              value={examName} onChangeText={setExamName}
            />

            <Text style={[styles.label, { color: c.textMuted }]}>Exam date</Text>
            <DatePicker value={examDate} onChange={setExamDate} colors={c} />

            <Text style={[styles.label, { color: c.textMuted }]}>Daily study hours</Text>
            <View style={styles.hoursRow}>
              {[1,2,3,4,5,6].map(h => (
                <TouchableOpacity key={h} style={[styles.hourBtn,
                  { backgroundColor: dailyHours === h ? c.accent : c.inputBg,
                    borderColor: dailyHours === h ? c.accent : c.border }]}
                  onPress={() => setDailyHours(h)}>
                  <Text style={[styles.hourTxt, { color: dailyHours === h ? '#fff' : c.textMuted }]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Step 1: Select Topics / Chapters ── */}
        {step === 1 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>What will you study?</Text>
            <Text style={[styles.stepDesc, { color: c.textMuted }]}>
              Select the topics or chapters to include in this plan
            </Text>

            {state.subjects.length === 0 && (
              <View style={[styles.noSubCard, { backgroundColor: c.bgCard }]}>
                <Text style={[styles.noSubTxt, { color: c.textMuted }]}>
                  No subjects yet. Go to Subjects and add some first.
                </Text>
              </View>
            )}

            {state.subjects.map(subject => {
              const isChapterOnly = subject.topicBased;
              const hasContent = subject.chapters.length > 0 &&
                (isChapterOnly || subject.chapters.some(ch => ch.topics.length > 0));

              return (
                <View key={subject.id} style={[styles.subjectBlock, { backgroundColor: c.bgCard }]}>
                  <View style={styles.subjectBlockHeader}>
                    <View style={[styles.subIconSm, { backgroundColor: subject.color + '22' }]}>
                      <Ionicons name={subject.icon as any} size={18} color={subject.color} />
                    </View>
                    <Text style={[styles.subjectBlockName, { color: c.text }]}>{subject.name}</Text>
                    <Text style={[styles.subjectType, { color: subject.color }]}>
                      {isChapterOnly ? 'Chapter-based' : 'Topic-based'}
                    </Text>
                  </View>

                  {!hasContent ? (
                    <Text style={[styles.noTopics, { color: c.textFaint }]}>
                      No {isChapterOnly ? 'chapters' : 'topics'} yet — add some in Subjects
                    </Text>
                  ) : isChapterOnly ? (
                    subject.chapters.map(ch => {
                      const sel = !!selectedItems.find(x => x.topicId === ch.id);
                      return (
                        <TouchableOpacity key={ch.id} style={[styles.topicItem,
                          { backgroundColor: sel ? c.accentSoft : 'transparent', borderColor: sel ? c.accent : c.border }]}
                          onPress={() => toggleItem(subject.id, ch.id, ch.id, ch.name, 45)}>
                          <View style={[styles.checkBox,
                            { borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.accent : 'transparent' }]}>
                            {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                          </View>
                          <Text style={[styles.topicItemName, { color: sel ? c.accent : c.text }]}>{ch.name}</Text>
                          <Text style={[styles.topicMins, { color: c.textFaint }]}>~45m</Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    subject.chapters.map(ch => (
                      <View key={ch.id}>
                        {ch.topics.length > 0 && (
                          <Text style={[styles.chLabel, { color: c.textFaint }]}>{ch.name}</Text>
                        )}
                        {ch.topics.map(t => {
                          const sel = !!selectedItems.find(x => x.topicId === t.id);
                          return (
                            <TouchableOpacity key={t.id} style={[styles.topicItem,
                              { backgroundColor: sel ? c.accentSoft : 'transparent', borderColor: sel ? c.accent : c.border }]}
                              onPress={() => toggleItem(subject.id, ch.id, t.id, t.name, t.estimatedMinutes)}>
                              <View style={[styles.checkBox,
                                { borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.accent : 'transparent' }]}>
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
              );
            })}

            <Text style={[styles.selCount, { color: c.textMuted }]}>
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </Text>
          </Animated.View>
        )}

        {/* ── Step 2: Schedule ── */}
        {step === 2 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>Build your schedule</Text>

            {Object.keys(schedule).length === 0 ? (
              <View style={styles.genBox}>
                <Ionicons name="calendar" size={52} color={c.accent} style={{ marginBottom: 16 }} />
                <Text style={[styles.genDesc, { color: c.textMuted }]}>
                  We'll spread your {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} across the days before your exam.
                </Text>
                <TouchableOpacity style={[styles.genBtn, { backgroundColor: c.accent }]}
                  onPress={generateSchedule} disabled={generating}>
                  {generating
                    ? <ActivityIndicator color="#fff" />
                    : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.genBtnTxt}>Generate Schedule</Text></>}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={[styles.successBanner, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="checkmark-circle" size={20} color={c.accent} />
                  <Text style={[styles.successTxt, { color: c.accent }]}>
                    Schedule ready! Adjust times if needed.
                  </Text>
                </View>

                {selectedItems.map(tp => {
                  const slot = schedule[tp.topicId];
                  const subject = state.subjects.find(s => s.id === tp.subjectId);
                  return (
                    <View key={tp.topicId} style={[styles.scheduleCard, { backgroundColor: c.bgCard }]}>
                      <Text style={[styles.scheduleName, { color: c.text }]} numberOfLines={1}>{tp.name}</Text>
                      <Text style={[styles.scheduleSub, { color: c.textMuted }]}>{subject?.name}</Text>
                      <Text style={[styles.scheduleDate, { color: c.accent }]}>{slot?.date}</Text>
                      <View style={styles.timeRow}>
                        <TimePicker value={slot?.startTime || '09:00'} onChange={v =>
                          setSchedule(s => ({ ...s, [tp.topicId]: { ...s[tp.topicId], startTime: v } }))} />
                        <Text style={{ color: c.textMuted, marginHorizontal: 8 }}>→</Text>
                        <TimePicker value={slot?.endTime || '10:00'} onChange={v =>
                          setSchedule(s => ({ ...s, [tp.topicId]: { ...s[tp.topicId], endTime: v } }))} />
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity style={[styles.regenBtn, { borderColor: c.accent }]} onPress={generateSchedule}>
                  <Ionicons name="refresh" size={16} color={c.accent} />
                  <Text style={[styles.regenTxt, { color: c.accent }]}>Regenerate</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}

        {/* ── Step 3: Block ── */}
        {step === 3 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>App Blocking (optional)</Text>
            <Text style={[styles.stepDesc, { color: c.textMuted }]}>
              Block distracting apps during your scheduled study times.
            </Text>

            {/* Master toggle */}
            <View style={[styles.blockCard, { backgroundColor: c.bgCard }]}>
              <View style={styles.blockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.blockTitle, { color: c.text }]}>Block apps during study time</Text>
                  <Text style={[styles.blockDesc, { color: c.textMuted }]}>
                    Selected apps will be blocked during your scheduled sessions
                  </Text>
                </View>
                <Switch value={blockApps} onValueChange={v => {
                  setBlockApps(v);
                  if (!v) { setHardBlock(false); setDeviceAdmin(false); }
                }} trackColor={{ true: c.accent }} />
              </View>
            </View>

            {blockApps && (
              <>
                {/* Hard block */}
                <View style={[styles.blockCard, { backgroundColor: c.bgCard }]}>
                  <View style={styles.blockRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.blockTitle, { color: c.text }]}><Ionicons name="lock-closed" size={15} color={c.destructive} /> Hard Block</Text>
                      <Text style={[styles.blockDesc, { color: c.textMuted }]}>
                        Cannot unblock from inside the app — only uninstalling Focus On removes the block
                      </Text>
                    </View>
                    <Switch value={hardBlock} onValueChange={setHardBlock} trackColor={{ true: c.destructive }} />
                  </View>
                </View>

                {/* Device admin */}
                <View style={[styles.blockCard, { backgroundColor: c.bgCard }]}>
                  <View style={styles.blockRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.blockTitle, { color: c.text }]}><Ionicons name="shield-checkmark" size={15} color="#DC2626" /> Device Admin</Text>
                      <Text style={[styles.blockDesc, { color: c.textMuted }]}>
                        Cannot unblock AND cannot uninstall Focus On. Requires Device Admin permission. Strongest block.
                      </Text>
                    </View>
                    <Switch value={deviceAdmin} onValueChange={async (v) => {
                      if (v) {
                        try {
                          await AppBlocking.requestDeviceAdmin();
                          Alert.alert(
                            'Grant Permission',
                            'Please grant Device Admin permission in the screen that opened. Then come back and enable this again.',
                            [{ text: 'OK' }]
                          );
                          return; // don't set true yet — user must grant then re-enable
                        } catch {
                          Alert.alert('Error', 'Could not request Device Admin.');
                          return;
                        }
                      }
                      setDeviceAdmin(v);
                      if (v) setHardBlock(true);
                    }} trackColor={{ true: '#DC2626' }} />
                  </View>
                </View>

                {/* App picker button */}
                <TouchableOpacity
                  style={[styles.appPickBtn, { backgroundColor: c.accentSoft, borderColor: c.accent }]}
                  onPress={loadApps}
                  disabled={loadingApps}>
                  {loadingApps
                    ? <ActivityIndicator color={c.accent} size="small" />
                    : <Ionicons name="apps" size={18} color={c.accent} />}
                  <Text style={[styles.appPickTxt, { color: c.accent }]}>
                    {blockedApps.length > 0 ? `${blockedApps.length} app${blockedApps.length > 1 ? 's' : ''} selected` : 'Select apps to block'}
                  </Text>
                </TouchableOpacity>

                {blockedApps.length === 0 && (
                  <Text style={[styles.appPickHint, { color: c.textFaint }]}>
                    You must select at least one app for blocking to work.
                  </Text>
                )}
              </>
            )}

            <View style={[styles.finalCard, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="information-circle" size={18} color={c.accent} />
              <Text style={[styles.finalTxt, { color: c.accent }]}>
                After saving, you'll receive notifications at your scheduled study times.
                {blockApps ? ' Apps will be blocked automatically during those times.' : ''}
              </Text>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={[styles.bottomNav, { backgroundColor: c.bgCard, borderTopColor: c.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: canNext() ? c.accent : c.border }]}
          onPress={async () => {
            if (step === 1 && Object.keys(schedule).length === 0) generateSchedule();
            if (step < STEPS.length - 1) {
              setStep(s => s + 1);
            } else {
              await savePlan();
            }
          }}
          disabled={!canNext()}>
          <Text style={[styles.nextTxt, { color: canNext() ? '#fff' : c.textFaint }]}>
            {step === STEPS.length - 1 ? 'Save Plan' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Picker Modal */}
      <Modal visible={showAppPicker} transparent animationType="slide" onRequestClose={() => setShowAppPicker(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Select Apps to Block</Text>

            <TextInput
              style={[styles.searchInput, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="Search apps..." placeholderTextColor={c.textFaint}
              value={appSearch} onChangeText={setAppSearch}
            />

            <FlatList
              data={filteredApps}
              keyExtractor={i => i.packageName}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => {
                const sel = blockedApps.includes(item.packageName);
                return (
                  <TouchableOpacity
                    style={[styles.appItem, { borderColor: c.border }]}
                    onPress={() => setBlockedApps(a =>
                      sel ? a.filter(x => x !== item.packageName) : [...a, item.packageName]
                    )}>
                    <View style={[styles.appCheckBox, {
                      borderColor: sel ? c.accent : c.border,
                      backgroundColor: sel ? c.accent : 'transparent',
                    }]}>
                      {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appName, { color: c.text }]}>{item.name}</Text>
                      <Text style={[styles.appPkg, { color: c.textFaint }]} numberOfLines={1}>
                        {item.packageName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: c.accent }]}
              onPress={() => setShowAppPicker(false)}>
              <Text style={styles.doneTxt}>
                Done ({blockedApps.length} selected)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerCard: { borderRadius: RADIUS.xl, padding: 16, alignItems: 'center', overflow: 'hidden' },
  daysLeftBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  stepBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 9, fontWeight: '700', fontFamily: 'Inter_700Bold', marginTop: 4, textTransform: 'uppercase' },
  stepLine: { flex: 1, height: 2, marginBottom: 14 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  stepTitle: { fontSize: 22, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', marginBottom: 6, letterSpacing: -0.5 },
  stepDesc: { fontSize: 14, marginBottom: 16, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, marginBottom: 4 },
  hoursRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  hourBtn: { width: 56, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  hourTxt: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  subjectBlock: { borderRadius: RADIUS.xl, padding: 14, marginBottom: 12 },
  subjectBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  subIconSm: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  subjectBlockName: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold', flex: 1 },
  subjectType: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  noTopics: { fontSize: 13, paddingVertical: 8 },
  noSubCard: { borderRadius: RADIUS.xl, padding: 20, alignItems: 'center' },
  noSubTxt: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  chLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 4 },
  topicItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, marginBottom: 6, borderWidth: 1.5 },
  checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  topicItemName: { flex: 1, fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  topicMins: { fontSize: 12 },
  selCount: { textAlign: 'center', fontSize: 13, marginVertical: 8 },
  genBox: { alignItems: 'center', paddingVertical: 40 },
  genDesc: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  genBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  successTxt: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', flex: 1 },
  scheduleCard: { borderRadius: RADIUS.xl, padding: 14, marginBottom: 10 },
  scheduleName: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 2 },
  scheduleSub: { fontSize: 12, marginBottom: 6 },
  scheduleDate: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  regenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderRadius: 14, paddingVertical: 12, marginTop: 8 },
  regenTxt: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  blockCard: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  blockRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  blockTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 4 },
  blockDesc: { fontSize: 13, lineHeight: 20 },
  appPickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderRadius: 14, paddingVertical: 14, marginBottom: 6 },
  appPickTxt: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  appPickHint: { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  finalCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, marginTop: 4 },
  finalTxt: { fontSize: 13, lineHeight: 20, flex: 1 },
  bottomNav: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1 },
  nextBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nextTxt: { fontSize: 17, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  // App picker modal
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '88%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', marginBottom: 16 },
  searchInput: { height: 46, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1.5, marginBottom: 12 },
  appItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1 },
  appCheckBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  appPkg: { fontSize: 11, marginTop: 1 },
  doneBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  doneTxt: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
});
