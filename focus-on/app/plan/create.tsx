import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Platform, FlatList, Modal, Pressable,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT, useLanguage } from '@/contexts/LanguageContext';
import { RADIUS, FONTS } from '@/constants/theme';
import { isSubjectTopicBased, type StudyPlan } from '@/types/study';
import AppBlocking from '@/modules/AppBlocking';
import { setupAllNotifications } from '@/services/notifications';
import { generateSmartSchedule, type ScheduleItem } from '@/utils/smartSchedule';

// STEPS, DAY_NAMES, MONTHS now come from t (locale)



// Weight labels — user-friendly
const WEIGHT_COLORS: Record<number, string> = {
  1: '#10B981', 2: '#6C63FF', 3: '#F59E0B', 4: '#EF4444',
};

// Daily capacity labels


function daysInMonth(m: number, y: number) { return new Date(y, m + 1, 0).getDate(); }

// ── Wheel column ──────────────────────────────────────────────────────────────
function WheelCol({ items, selectedIndex, onChange, width = 80, colors: c }: {
  items: string[]; selectedIndex: number; onChange: (i: number) => void;
  width?: number; colors: any;
}) {
  const ITEM_H = 44;
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);

  const scrollTo = useCallback((i: number, animated = true) => {
    scrollRef.current?.scrollTo({ y: i * ITEM_H, animated });
  }, []);

  useEffect(() => {
    if (!isScrolling.current) setTimeout(() => scrollTo(selectedIndex, false), 30);
  }, [selectedIndex]);

  const goUp = () => { const n = Math.max(0, selectedIndex - 1); scrollTo(n); onChange(n); };
  const goDown = () => { const n = Math.min(items.length - 1, selectedIndex + 1); scrollTo(n); onChange(n); };

  return (
    <View style={{ width, alignItems: 'center' }}>
      <TouchableOpacity onPress={goUp} style={{ height: 28, width: '100%', alignItems: 'center', justifyContent: 'center', opacity: selectedIndex === 0 ? 0.2 : 1 }}>
        <Ionicons name="chevron-up" size={16} color={c.accent} />
      </TouchableOpacity>
      <View style={{ width, height: ITEM_H * 3, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: ITEM_H, height: ITEM_H, left: 0, right: 0, backgroundColor: c.accent + '18', borderRadius: 10, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: c.accent + '40', pointerEvents: 'none' } as any} />
        <ScrollView
          ref={scrollRef} showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H} decelerationRate="fast"
          nestedScrollEnabled contentContainerStyle={{ paddingVertical: ITEM_H }}
          onScrollBeginDrag={() => { isScrolling.current = true; }}
          onMomentumScrollEnd={e => {
            isScrolling.current = false;
            const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
            const clamped = Math.max(0, Math.min(i, items.length - 1));
            scrollTo(clamped); onChange(clamped);
          }}
          onLayout={() => setTimeout(() => scrollTo(selectedIndex, false), 50)}>
          {items.map((item, i) => {
            const active = i === selectedIndex;
            return (
              <TouchableOpacity key={i} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => { scrollTo(i); onChange(i); }}>
                <Text style={{ fontSize: active ? 18 : 14, fontFamily: active ? FONTS.bold : FONTS.regular, color: active ? c.accent : c.textMuted, opacity: Math.abs(i - selectedIndex) > 1 ? 0.3 : 1 }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <TouchableOpacity onPress={goDown} style={{ height: 28, width: '100%', alignItems: 'center', justifyContent: 'center', opacity: selectedIndex === items.length - 1 ? 0.2 : 1 }}>
        <Ionicons name="chevron-down" size={16} color={c.accent} />
      </TouchableOpacity>
    </View>
  );
}

// ── Date Picker (wheel spinner) ────────────────────────────────────────────────
function DatePicker({ value, onChange, colors: c, months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], daysFromTodayLabel }: {
  value: string; onChange: (v: string) => void; colors: any; months?: string[]; daysFromTodayLabel?: (n: number) => string;
}) {
  const todayD = new Date();
  const parsed = value ? new Date(value) : todayD;
  const [day, setDay] = useState(parsed.getDate() - 1);
  const [mon, setMon] = useState(parsed.getMonth());
  const [yr,  setYr]  = useState(parsed.getFullYear() - todayD.getFullYear());

  const MONTHS_ARR = months;
  const YEARS = Array.from({ length: 5 }, (_, i) => String(todayD.getFullYear() + i));
  const days  = Array.from({ length: daysInMonth(mon, todayD.getFullYear() + yr) }, (_, i) => String(i + 1).padStart(2, '0'));

  const emit = (d: number, m: number, y: number) => {
    const year = todayD.getFullYear() + y;
    const safeD = Math.min(d + 1, daysInMonth(m, year));
    onChange(`${year}-${String(m + 1).padStart(2,'0')}-${String(safeD).padStart(2,'0')}`);
  };

  const daysLeft = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <WheelCol items={days}      selectedIndex={day} onChange={i => { setDay(i);  emit(i, mon, yr); }} width={64}  colors={c} />
        <WheelCol items={MONTHS_ARR}  selectedIndex={mon} onChange={i => { setMon(i);  emit(day, i, yr); }} width={80}  colors={c} />
        <WheelCol items={YEARS}  selectedIndex={yr}  onChange={i => { setYr(i);   emit(day, mon, i); }} width={80} colors={c} />
      </View>
      {daysLeft > 0 && (
        <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: c.textMuted, textAlign: 'center', marginTop: 8 }}>
          {daysFromTodayLabel ? daysFromTodayLabel(daysLeft) : `${daysLeft} days from today`}
        </Text>
      )}
    </View>
  );
}

// ── Weight picker for each item ───────────────────────────────────────────────
function WeightPicker({ value, onChange, colors: c, weightLabels }: {
  value: number; onChange: (v: number) => void; colors: any;
  weightLabels?: Record<number, { label: string; desc: string; color?: string }>;
}) {
  const WEIGHT_COLORS_MAP: Record<number, string> = { 1: '#10B981', 2: '#6C63FF', 3: '#F59E0B', 4: '#EF4444' };
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4].map(w => {
        const info = weightLabels?.[w] ?? { label: String(w), desc: '' };
        const wColor = WEIGHT_COLORS_MAP[w];
        const active = value === w;
        return (
          <TouchableOpacity key={w}
            style={{
              paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1.5,
              backgroundColor: active ? wColor + '20' : 'transparent',
              borderColor: active ? wColor : c.border,
            }}
            onPress={() => onChange(w)}>
            <Text style={{ fontSize: 11, fontFamily: FONTS.bold, color: active ? info.color : c.textFaint }}>
              {info.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CreatePlanScreen() {
  const { state, addStudyPlan, getAcceptanceRate } = useStudy();
  const { colors: c } = useTheme();
  const { fonts: FONTS } = useLanguage();
  const router = useRouter();

  const [step, setStep] = useState(0);

  // Step 0
  const [examName, setExamName]     = useState('');
  const [examDate, setExamDate]     = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [studyDays, setStudyDays]   = useState<number[]>([1,2,3,4,5]);
  const [revisionDays, setRevisionDays] = useState(3);
  const [dailyCapacity, setDailyCapacity] = useState(5);

  // Step 1 — items with weights
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({}); // topicId → weight

  // Step 2
  const [blockApps, setBlockApps]     = useState(false);
  const [hardBlock, setHardBlock]     = useState(false);
  const [deviceAdmin, setDeviceAdmin] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [appSearch, setAppSearch]     = useState('');
  const [installedApps, setInstalledApps] = useState<{name:string;packageName:string;icon:string}[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [saving, setSaving] = useState(false);

  // Build schedule items from selections
  const scheduleItems: ScheduleItem[] = useMemo(() => {
    return Object.entries(selectedItems).map(([topicId, weight]) => {
      for (const subject of state.subjects) {
        const topicBased = isSubjectTopicBased(subject);
        if (topicBased) {
          for (const ch of subject.chapters) {
            const topic = ch.topics.find(t => t.id === topicId);
            if (topic) return {
              subjectId: subject.id, chapterId: ch.id, topicId,
              name: topic.name, subjectName: subject.name,
              weight, isChapterOnly: false,
            };
          }
        } else {
          const ch = subject.chapters.find(c => c.id === topicId);
          if (ch) return {
            subjectId: subject.id, chapterId: ch.id, topicId: ch.id,
            name: ch.name, subjectName: subject.name,
            weight, isChapterOnly: true,
          };
        }
      }
      return null;
    }).filter(Boolean) as ScheduleItem[];
  }, [selectedItems, state.subjects]);

  // Preview stats
  const preview = useMemo(() => {
    if (scheduleItems.length === 0) return null;
    return generateSmartSchedule(
      { items: scheduleItems, examDate, dailyCapacity, studyDays, revisionDays },
    ).stats;
  }, [scheduleItems, examDate, dailyCapacity, studyDays, revisionDays]);

  const diffToWeight = (difficulty: number): number => {
    if (difficulty <= 1) return 1;
    if (difficulty <= 3) return 2;
    if (difficulty === 4) return 3;
    return 4;
  };

  const getItemWeight = (topicId: string): number => {
    for (const subject of state.subjects) {
      for (const ch of subject.chapters) {
        const t = ch.topics.find(x => x.id === topicId);
        if (t) return diffToWeight(t.difficulty ?? 3);
        if (ch.id === topicId) return 2; // chapter-only default medium
      }
    }
    return 2;
  };

  const toggleItem = (topicId: string) => {
    setSelectedItems(prev => {
      if (prev[topicId] !== undefined) {
        const next = { ...prev };
        delete next[topicId];
        return next;
      }
      return { ...prev, [topicId]: getItemWeight(topicId) };
    });
  };



  const loadAppsAndOpen = async () => {
    if (installedApps.length === 0) {
      setLoadingApps(true);
      try { setInstalledApps(await AppBlocking.getInstalledApps()); } catch {}
      setLoadingApps(false);
    }
    setShowAppPicker(true);
  };

  const canNext = () => {
    if (step === 0) return examName.trim().length > 0 && examDate > new Date().toISOString().split('T')[0];
    if (step === 1) return scheduleItems.length > 0;
    return true;
  };

  const save = async () => {
    setSaving(true);
    const { tasks } = generateSmartSchedule(
      { items: scheduleItems, examDate, dailyCapacity, studyDays, revisionDays },
      (state as any).acceptanceRecords ?? [],
    );

    const plan: StudyPlan = {
      id: Date.now().toString(),
      examName: examName.trim(), examDate,
      subjects: [...new Set(scheduleItems.map(i => i.subjectId))],
      dailyCount: dailyCapacity,
      studyDays, revisionDays,
      createdAt: new Date().toISOString(),
      tasks: tasks as any,
      blockApps, hardBlock, deviceAdmin,
      blockedApps: blockApps ? blockedApps : [],
    };

    addStudyPlan(plan);
    try {
      await setupAllNotifications(
        [...state.studyPlans, plan].map(p => ({ examName: p.examName, examDate: p.examDate }))
      );
    } catch {}
    setSaving(false);
    router.replace('/(tabs)/plan');
  };

  // ── Step bar ──────────────────────────────────────────────────────────────
  const StepBar = () => (
    <View style={styles.stepBar}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={{ alignItems: 'center' }}>
            <View style={[styles.stepDot, { backgroundColor: i <= step ? c.accent : c.border }]}>
              {i < step
                ? <Ionicons name="checkmark" size={12} color="#fff" />
                : <Text style={{ color: i === step ? '#fff' : c.textFaint, fontSize: 11, fontFamily: FONTS.bold }}>{i+1}</Text>}
            </View>
            <Text style={{ fontSize: 9, fontFamily: FONTS.bold, textTransform: 'uppercase', marginTop: 4, color: i === step ? c.accent : c.textFaint }}>{s}</Text>
          </View>
          {i < t.planCreateSteps.length - 1 && <View style={{ flex: 1, height: 2, backgroundColor: i < step ? c.accent : c.border, marginBottom: 14 }} />}
        </React.Fragment>
      ))}
    </View>
  );

  const filteredApps = installedApps.filter(a =>
    !appSearch || a.name.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>New Study Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <StepBar />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Step 0: Setup ── */}
        {step === 0 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>Set up your plan</Text>

            <Text style={[styles.label, { color: c.textMuted }]}>Exam name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="e.g. Physics Final" placeholderTextColor={c.textFaint}
              value={examName} onChangeText={setExamName}
            />

            <Text style={[styles.label, { color: c.textMuted }]}>Exam date</Text>
            <View style={[styles.card, { backgroundColor: c.bgCard }]}>
              <DatePicker value={examDate} onChange={setExamDate} colors={c} months={t.planCreateMonths} daysFromTodayLabel={t.planCreateDaysFromToday} />
            </View>

            <Text style={[styles.label, { color: c.textMuted }]}>How much can you study per day?</Text>
            <View style={styles.capacityRow}>
              {Object.entries(CAPACITY_LABELS).map(([val, info]) => {
                const v = Number(val);
                const active = dailyCapacity === v;
                return (
                  <TouchableOpacity key={v}
                    style={[styles.capacityBtn, {
                      backgroundColor: active ? c.accent : c.inputBg,
                      borderColor: active ? c.accent : c.border,
                    }]}
                    onPress={() => setDailyCapacity(v)}>
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: active ? '#fff' : c.text }}>{info.label}</Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: active ? '#ffffffAA' : c.textFaint }}>{info.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: c.textMuted }]}>Study days</Text>
            <View style={styles.dayRow}>
              {DAY_NAMES.map((d, i) => (
                <TouchableOpacity key={i}
                  style={[styles.dayBtn, {
                    backgroundColor: studyDays.includes(i) ? c.accent : c.inputBg,
                    borderColor: studyDays.includes(i) ? c.accent : c.border,
                  }]}
                  onPress={() => setStudyDays(ds => ds.includes(i) ? ds.filter(x => x !== i) : [...ds, i])}>
                  <Text style={{ fontSize: 12, fontFamily: FONTS.bold, color: studyDays.includes(i) ? '#fff' : c.textMuted }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {studyDays.length === 0 && (
              <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: c.textFaint, marginTop: 4 }}>Every day</Text>
            )}

            <Text style={[styles.label, { color: c.textMuted }]}>Revision days before exam</Text>
            <View style={styles.dayRow}>
              {[0,1,2,3,5,7].map(n => (
                <TouchableOpacity key={n}
                  style={[styles.dayBtn, {
                    backgroundColor: revisionDays === n ? c.accent : c.inputBg,
                    borderColor: revisionDays === n ? c.accent : c.border,
                  }]}
                  onPress={() => setRevisionDays(n)}>
                  <Text style={{ fontSize: 12, fontFamily: FONTS.bold, color: revisionDays === n ? '#fff' : c.textMuted }}>{n === 0 ? 'None' : `${n}d`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Step 1: Topics with weights ── */}
        {step === 1 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>What will you study?</Text>
            <Text style={{ fontSize: 14, fontFamily: FONTS.regular, color: c.textMuted, marginBottom: 16, lineHeight: 20 }}>
              Select chapters or topics. Set how heavy each one feels — the plan will schedule harder things first.
            </Text>

            {/* Preview banner */}
            {preview && (
              <Animated.View entering={FadeInDown.springify()}
                style={[styles.previewBanner, {
                  backgroundColor: preview.willFinish ? c.accentSoft : '#FEF3C7',
                  borderColor: preview.willFinish ? c.accent + '40' : '#FCD34D',
                }]}>
                <Ionicons
                  name={preview.willFinish ? 'checkmark-circle' : 'warning'}
                  size={16}
                  color={preview.willFinish ? c.accent : '#D97706'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: FONTS.bold, color: preview.willFinish ? c.accent : '#92400E' }}>
                    {preview.willFinish ? 'Looks good!' : 'Tight schedule'}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: preview.willFinish ? c.accent : '#92400E' }}>
                    {scheduleItems.length} items · {preview.daysNeeded} days needed · {preview.daysAvailable} available
                    {preview.reviewCount > 0 ? ` · ${preview.reviewCount} auto-reviews` : ''}
                  </Text>
                </View>
              </Animated.View>
            )}

            {state.subjects.length === 0 && (
              <View style={[styles.card, { backgroundColor: c.bgCard, padding: 24, alignItems: 'center' }]}>
                <Text style={{ color: c.textMuted, fontFamily: FONTS.regular, textAlign: 'center' }}>
                  No subjects yet. Go to the Subjects tab and add some first.
                </Text>
              </View>
            )}

            {state.subjects.map(subject => {
              const topicBased = isSubjectTopicBased(subject);
              const color = subject.color;

              return (
                <View key={subject.id} style={[styles.subjectBlock, { backgroundColor: c.bgCard }]}>
                  {/* Subject header */}
                  <View style={styles.subjectHeader}>
                    <View style={[styles.subIcon, { backgroundColor: color + '22' }]}>
                      <Ionicons name={subject.icon as any} size={18} color={color} />
                    </View>
                    <Text style={[styles.subjectName, { color: c.text }]}>{subject.name}</Text>
                    <Text style={[styles.subjectType, { color: color }]}>
                      {topicBased ? 'Topics' : 'Chapters'}
                    </Text>
                  </View>

                  {subject.chapters.length === 0 && (
                    <Text style={{ color: c.textFaint, fontFamily: FONTS.regular, fontSize: 13, paddingBottom: 8 }}>No content yet</Text>
                  )}

                  {/* Chapter-only subject */}
                  {!topicBased && subject.chapters.map(ch => {
                    const sel = selectedItems[ch.id] !== undefined;
                    return (
                      <View key={ch.id}>
                        <TouchableOpacity
                          style={[styles.selectItem, {
                            backgroundColor: sel ? color + '10' : 'transparent',
                            borderColor: sel ? color : c.border,
                          }]}
                          onPress={() => toggleItem(ch.id)}>
                          <View style={[styles.selCheck, {
                            borderColor: sel ? color : c.border,
                            backgroundColor: sel ? color : 'transparent',
                          }]}>
                            {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                          </View>
                          <Text style={[styles.selectItemName, { color: sel ? color : c.text }]}>{ch.name}</Text>
                        </TouchableOpacity>
                        {sel && (
                          <View style={{ paddingLeft: 34, paddingBottom: 6 }}>
                            <WeightPicker value={selectedItems[ch.id]} onChange={w => setSelectedItems(p => ({ ...p, [ch.id]: w }))} colors={c} />
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {/* Topic-based subject */}
                  {topicBased && subject.chapters.map(ch => (
                    <View key={ch.id}>
                      {ch.topics.length > 0 && (
                        <Text style={[styles.chLabel, { color: c.textFaint }]}>{ch.name}</Text>
                      )}
                      {ch.topics.map(t => {
                        const sel = selectedItems[t.id] !== undefined;
                        return (
                          <View key={t.id}>
                            <TouchableOpacity
                              style={[styles.selectItem, {
                                backgroundColor: sel ? color + '10' : 'transparent',
                                borderColor: sel ? color : c.border,
                              }]}
                              onPress={() => toggleItem(t.id)}>
                              <View style={[styles.selCheck, {
                                borderColor: sel ? color : c.border,
                                backgroundColor: sel ? color : 'transparent',
                              }]}>
                                {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                              </View>
                              <Text style={[styles.selectItemName, { color: sel ? color : c.text }]}>{t.name}</Text>
                            </TouchableOpacity>
                            {sel && (
                              <View style={{ paddingLeft: 34, paddingBottom: 6 }}>
                                <WeightPicker value={selectedItems[t.id]} onChange={w => setSelectedItems(p => ({ ...p, [t.id]: w }))} colors={c} />
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              );
            })}

            <Text style={{ textAlign: 'center', fontSize: 13, fontFamily: FONTS.medium, color: c.textMuted, marginTop: 8 }}>
              {scheduleItems.length} item{scheduleItems.length !== 1 ? 's' : ''} selected
            </Text>
          </Animated.View>
        )}

        {/* ── Step 2: Blocking ── */}
        {step === 2 && (
          <Animated.View entering={FadeInRight.springify()}>
            <Text style={[styles.stepTitle, { color: c.text }]}>App Blocking</Text>
            <Text style={{ fontSize: 14, fontFamily: FONTS.regular, color: c.textMuted, marginBottom: 16 }}>
              Optional — block distracting apps when you study.
            </Text>

            <View style={[styles.optRow, { backgroundColor: c.bgCard }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optLabel, { color: c.text }]}>Block apps during study</Text>
                <Text style={[styles.optSub, { color: c.textMuted }]}>Activates when your daily routine starts</Text>
              </View>
              <Switch value={blockApps}
                onValueChange={v => { setBlockApps(v); if (!v) setHardBlock(false); }}
                trackColor={{ true: c.accent }} />
            </View>

            {blockApps && (
              <>
                <View style={[styles.optRow, { backgroundColor: c.bgCard }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optLabel, { color: c.text }]}>Hard Block</Text>
                    <Text style={[styles.optSub, { color: c.textMuted }]}>Cannot dismiss — forces you to stay focused</Text>
                  </View>
                  <Switch value={hardBlock} onValueChange={setHardBlock} trackColor={{ true: c.destructive }} />
                </View>

                <TouchableOpacity
                  style={[styles.appPickBtn, { backgroundColor: c.accentSoft, borderColor: c.accent }]}
                  onPress={loadAppsAndOpen}>
                  {loadingApps
                    ? <ActivityIndicator size="small" color={c.accent} />
                    : <Ionicons name="apps" size={18} color={c.accent} />}
                  <Text style={{ fontFamily: FONTS.bold, color: c.accent, fontSize: 15 }}>
                    {blockedApps.length > 0
                      ? `${blockedApps.length} app${blockedApps.length > 1 ? 's' : ''} selected`
                      : 'Select apps to block'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Final summary */}
            {preview && (
              <View style={[styles.summaryCard, { backgroundColor: c.bgCard }]}>
                <Text style={{ fontFamily: FONTS.bold, color: c.text, fontSize: 15, marginBottom: 12 }}>Plan Summary</Text>

                {[
                  { icon: 'layers-outline', label: 'Items', value: `${scheduleItems.length}` },
                  { icon: 'speedometer-outline', label: 'Daily capacity', value: t.planCreateCapacityLabels[dailyCapacity]?.label ?? `${dailyCapacity}` },
                  { icon: 'calendar-outline', label: 'Study days', value: studyDays.length > 0 ? studyDays.map(d => t.planCreateDayNames[d]).join(', ') : 'Every day' },
                  { icon: 'time-outline', label: 'Days needed', value: `~${preview.daysNeeded} days` },
                  { icon: 'refresh-outline', label: 'Auto-reviews', value: preview.reviewCount > 0 ? `${preview.reviewCount} sessions` : 'None' },
                  { icon: 'flag-outline', label: 'Exam', value: examDate },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderTopWidth: i > 0 ? 1 : 0, borderColor: c.border }}>
                    <Ionicons name={row.icon as any} size={16} color={c.textMuted} />
                    <Text style={{ flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: c.textMuted }}>{row.label}</Text>
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: c.text }}>{row.value}</Text>
                  </View>
                ))}

                {!preview.willFinish && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, backgroundColor: '#FEF3C7', borderRadius: 10 }}>
                    <Ionicons name="warning" size={16} color="#D97706" />
                    <Text style={{ flex: 1, fontFamily: FONTS.regular, fontSize: 12, color: '#92400E' }}>
                      Schedule is tight. Try increasing daily capacity or reducing revision days.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={[styles.bottomNav, { backgroundColor: c.bgCard, borderTopColor: c.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: canNext() ? c.accent : c.border }]}
          onPress={() => step < t.planCreateSteps.length - 1 ? setStep(s => s + 1) : save()}
          disabled={!canNext() || saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.nextTxt, { color: canNext() ? '#fff' : c.textFaint }]}>
                {step === t.planCreateSteps.length - 1 ? 'Create Plan 🚀' : 'Next →'}
              </Text>}
        </TouchableOpacity>
      </View>

      {/* App Picker Modal */}
      <Modal visible={showAppPicker} transparent animationType="slide" onRequestClose={() => setShowAppPicker(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setShowAppPicker(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.sheetTitle, { color: c.text }]}>Select Apps</Text>
                <TouchableOpacity onPress={() => setShowAppPicker(false)}>
                  <Text style={{ color: c.accent, fontFamily: FONTS.bold, fontSize: 15 }}>Done ({blockedApps.length})</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                <Ionicons name="search-outline" size={16} color={c.textMuted} />
                <TextInput style={{ color: c.text, flex: 1, marginLeft: 8, fontFamily: FONTS.regular }}
                  placeholder="Search..." placeholderTextColor={c.textFaint}
                  value={appSearch} onChangeText={setAppSearch} />
              </View>
              <FlatList
                data={filteredApps} keyExtractor={i => i.packageName}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => {
                  const sel = blockedApps.includes(item.packageName);
                  return (
                    <TouchableOpacity
                      style={[styles.appItem, { backgroundColor: sel ? c.accentSoft : 'transparent', borderColor: c.border }]}
                      onPress={() => setBlockedApps(a => sel ? a.filter(x => x !== item.packageName) : [...a, item.packageName])}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONTS.semibold, fontSize: 14, color: c.text }}>{item.name}</Text>
                        <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: c.textFaint }} numberOfLines={1}>{item.packageName}</Text>
                      </View>
                      <View style={[{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, {
                        borderColor: sel ? c.accent : c.border,
                        backgroundColor: sel ? c.accent : 'transparent',
                      }]}>
                        {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  stepBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  stepTitle: { fontSize: 22, fontFamily: FONTS.bold, marginBottom: 6, letterSpacing: -0.5 },
  label: { fontSize: 12, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 18 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, marginBottom: 4, fontFamily: FONTS.regular },
  card: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 4 },
  capacityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  capacityBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 2, minWidth: 110 },
  dayRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  dayBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1.5 },
  previewBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1 },
  subjectBlock: { borderRadius: RADIUS.xl, padding: 14, marginBottom: 12 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  subIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontSize: 15, fontFamily: FONTS.bold, flex: 1 },
  subjectType: { fontSize: 11, fontFamily: FONTS.bold },
  chLabel: { fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 4 },
  selectItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, marginBottom: 4, borderWidth: 1.5 },
  selCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  selectItemName: { flex: 1, fontSize: 14, fontFamily: FONTS.semibold },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: RADIUS.xl, marginBottom: 10 },
  optLabel: { fontSize: 15, fontFamily: FONTS.bold, marginBottom: 2 },
  optSub: { fontSize: 12, fontFamily: FONTS.regular },
  appPickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  summaryCard: { borderRadius: RADIUS.xl, padding: 18, marginTop: 8 },
  bottomNav: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1 },
  nextBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nextTxt: { fontSize: 17, fontFamily: FONTS.bold },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontFamily: FONTS.bold },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  appItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 8, borderBottomWidth: 1, borderRadius: 8 },
});