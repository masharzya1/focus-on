import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  AppState, AppStateStatus, Alert, Platform, Modal, Pressable,
  FlatList, TextInput,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import AppBlocking from '@/modules/AppBlocking';
import type { StudySession } from '@/types/study';

const TIMER_KEY = 'focuson_timer_state';

interface TimerState {
  isRunning: boolean; startedAt: number;
  mode: 'focus'|'break'; focusMinutes: number; breakMinutes: number;
  topicId?: string; subjectId?: string;
  blockedApps: string[]; blockShorts: boolean;
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function formatTime(secs: number) { return `${pad(Math.floor(secs/60))}:${pad(secs%60)}`; }

// ─── Circular progress (pure RN, no SVG needed) ───────────────────────────────
function CircularTimer({
  progress, timeStr, mode, isRunning, accent, muted, bg, text,
}: {
  progress: number; timeStr: string; mode: string;
  isRunning: boolean; accent: string; muted: string; bg: string; text: string;
}) {
  const SIZE = 220, STROKE = 10, R = (SIZE - STROKE * 2) / 2;
  const C = 2 * Math.PI * R;

  // We'll simulate progress using a View with border + clip
  // Simple visual: outer ring with progress indicator via rotation
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: SIZE, height: SIZE,
        borderRadius: SIZE/2, borderWidth: STROKE,
        borderColor: muted + '40',
      }} />
      {/* Progress arc (left half) */}
      {progress > 0 && (
        <View style={{
          position: 'absolute', width: SIZE, height: SIZE,
          borderRadius: SIZE/2,
          borderWidth: STROKE,
          borderColor: accent,
          borderRightColor: progress < 25 ? 'transparent' : accent,
          borderBottomColor: progress < 50 ? 'transparent' : accent,
          borderLeftColor: progress < 75 ? 'transparent' : accent,
          transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
        }} />
      )}
      {/* Inner circle */}
      <View style={{
        width: SIZE - STROKE * 2 - 12,
        height: SIZE - STROKE * 2 - 12,
        borderRadius: SIZE / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          {mode}
        </Text>
        <Text style={{ fontSize: 52, fontWeight: '800', color: text, letterSpacing: -2 }}>{timeStr}</Text>
        {isRunning && (
          <Text style={{ fontSize: 12, color: muted, marginTop: 4, fontWeight: '500' }}>stay focused</Text>
        )}
      </View>
    </View>
  );
}

// ─── Duo 3D button ────────────────────────────────────────────────────────────
function DuoButton({ label, icon, onPress, color, darkColor }: {
  label: string; icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void; color: string; darkColor: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={[ts.btnOuter, { backgroundColor: darkColor }]}>
        <View style={[ts.btnInner, { backgroundColor: color }]}>
          {icon && <Ionicons name={icon} size={20} color="#fff" />}
          <Text style={ts.btnText}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TimerScreen() {
  const { state, addSession, getTodayPlanTasks } = useStudy();
  const { colors: c } = useTheme();

  const [timeLeft, setTimeLeft] = useState(state.settings.pomodoroFocus * 60);
  const [mode, setMode] = useState<'focus'|'break'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [focusMin, setFocusMin] = useState(state.settings.pomodoroFocus);
  const [breakMin, setBreakMin] = useState(state.settings.pomodoroBreak);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{topicId:string;subjectId:string}|null>(null);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [blockShorts, setBlockShorts] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [installedApps, setInstalledApps] = useState<{name:string;packageName:string}[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const appStateRef = useRef<AppStateStatus>('active');

  useEffect(() => {
    restoreTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (next === 'active' && appStateRef.current !== 'active') {
        await restoreTimer();
        if (Platform.OS === 'android') {
          const en = await AppBlocking.isAccessibilityEnabled();
          setAccessibilityEnabled(en);
        }
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'android') AppBlocking.isAccessibilityEnabled().then(setAccessibilityEnabled);
  }, []));

  async function restoreTimer() {
    try {
      const raw = await AsyncStorage.getItem(TIMER_KEY);
      if (!raw) return;
      const saved: TimerState = JSON.parse(raw);
      if (!saved.isRunning) return;
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      const totalSecs = (saved.mode === 'focus' ? saved.focusMinutes : saved.breakMinutes) * 60;
      const remaining = totalSecs - elapsed;
      if (remaining > 0) {
        setMode(saved.mode); setFocusMin(saved.focusMinutes); setBreakMin(saved.breakMinutes);
        setBlockedApps(saved.blockedApps); setBlockShorts(saved.blockShorts);
        setTimeLeft(remaining); setIsRunning(true); startInterval(remaining);
      } else {
        await AsyncStorage.removeItem(TIMER_KEY);
        const durationMin = Math.round(elapsed / 60);
        if (saved.mode === 'focus' && durationMin > 0) { saveSession(saved.topicId, saved.subjectId, durationMin); setSessionsCompleted(p=>p+1); }
        setTimeLeft(saved.mode === 'focus' ? saved.breakMinutes * 60 : saved.focusMinutes * 60);
      }
    } catch {}
  }

  async function saveTimerState(running: boolean, remaining: number, currentMode: 'focus'|'break') {
    if (!running) { await AsyncStorage.removeItem(TIMER_KEY); return; }
    const st: TimerState = {
      isRunning: true,
      startedAt: Date.now() - ((currentMode === 'focus' ? focusMin : breakMin) * 60 - remaining) * 1000,
      mode: currentMode, focusMinutes: focusMin, breakMinutes: breakMin,
      blockedApps, blockShorts,
      topicId: selectedTopic?.topicId, subjectId: selectedTopic?.subjectId,
    };
    await AsyncStorage.setItem(TIMER_KEY, JSON.stringify(st));
  }

  function startInterval(initialSecs: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let secs = initialSecs;
    intervalRef.current = setInterval(() => {
      secs -= 1; setTimeLeft(secs);
      if (secs <= 0) { clearInterval(intervalRef.current!); intervalRef.current = null; handleTimerEnd(); }
    }, 1000);
  }

  function handleTimerEnd() {
    setIsRunning(false); AsyncStorage.removeItem(TIMER_KEY);
    if (mode === 'focus') {
      saveSession(selectedTopic?.topicId, selectedTopic?.subjectId, focusMin);
      setSessionsCompleted(p=>p+1); setMode('break'); setTimeLeft(breakMin*60); AppBlocking.stopBlocking();
    } else { setMode('focus'); setTimeLeft(focusMin*60); }
  }

  function saveSession(topicId:string|undefined, subjectId:string|undefined, durationMin:number) {
    const session: StudySession = {
      id: Date.now().toString(), topicId, subjectId,
      startTime: new Date(Date.now()-durationMin*60000).toISOString(),
      endTime: new Date().toISOString(), durationMinutes: durationMin,
      type: 'focus', completed: true,
    };
    addSession(session);
  }

  async function startTimer() {
    if (Platform.OS === 'android' && blockedApps.length > 0 && !accessibilityEnabled) {
      Alert.alert('Permission Required', 'Enable Accessibility for Focus On to block apps.',
        [{ text: 'Skip', onPress: doStart }, { text: 'Open Settings', onPress: () => AppBlocking.openAccessibilitySettings() }]
      );
      return;
    }
    doStart();
  }

  async function doStart() {
    if (Platform.OS === 'android' && blockedApps.length > 0) AppBlocking.startBlocking(blockedApps, blockShorts);
    const totalSecs = (mode === 'focus' ? focusMin : breakMin) * 60;
    setTimeLeft(totalSecs); setIsRunning(true); startInterval(totalSecs);
    await saveTimerState(true, totalSecs, mode);
  }

  async function pauseTimer() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsRunning(false); AppBlocking.stopBlocking(); await AsyncStorage.removeItem(TIMER_KEY);
  }

  async function resetTimer() { await pauseTimer(); setTimeLeft((mode === 'focus' ? focusMin : breakMin)*60); }

  const total = (mode === 'focus' ? focusMin : breakMin) * 60;
  const progressPercent = Math.round(((total - timeLeft) / total) * 100);
  const todayTasks = getTodayPlanTasks();
  const accentColor = mode === 'focus' ? c.accent : c.success;
  const accentDark = mode === 'focus' ? c.accentDark : c.successDark;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={ts.header}>
        <View>
          <Text style={[ts.title, { color: c.text }]}>Focus Timer</Text>
          <View style={ts.sessionRow}>
            <Ionicons name="checkmark-circle" size={14} color={c.success} />
            <Text style={[ts.subtitle, { color: c.textMuted }]}>{sessionsCompleted} sessions today</Text>
          </View>
        </View>
      </Animated.View>

      {/* Accessibility Warning */}
      {Platform.OS === 'android' && !accessibilityEnabled && blockedApps.length > 0 && (
        <TouchableOpacity
          style={[ts.warnCard, { backgroundColor: '#FFF3E0', borderColor: '#FF9500' + '44' }]}
          onPress={() => AppBlocking.openAccessibilitySettings()}
        >
          <Ionicons name="warning-outline" size={22} color="#FF9500" />
          <View style={{ flex: 1 }}>
            <Text style={[ts.warnTitle, { color: '#FF9500' }]}>Enable App Blocking</Text>
            <Text style={[ts.warnSub, { color: c.textMuted }]}>Tap to grant Accessibility permission</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FF9500" />
        </TouchableOpacity>
      )}

      {/* Mode Tabs */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={[ts.modeTabs, { backgroundColor: c.bgSecondary }]}>
        {(['focus', 'break'] as const).map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => { if (!isRunning) { setMode(m); setTimeLeft((m==='focus'?focusMin:breakMin)*60); } }}
            style={[ts.modeTab, mode === m && {
              backgroundColor: m === 'focus' ? c.accent : c.success,
              shadowColor: m === 'focus' ? c.accent : c.success,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }]}
          >
            <Ionicons
              name={m === 'focus' ? 'rocket' : 'cafe'}
              size={16} color={mode === m ? '#fff' : c.textMuted}
            />
            <Text style={[ts.modeTabText, { color: mode === m ? '#fff' : c.textMuted }]}>
              {m === 'focus' ? 'Focus' : 'Break'}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Timer Circle */}
      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={ts.timerSection}>
        <CircularTimer
          progress={progressPercent}
          timeStr={formatTime(timeLeft)}
          mode={mode}
          isRunning={isRunning}
          accent={accentColor}
          muted={c.textMuted}
          bg={c.bg}
          text={c.text}
        />
      </Animated.View>

      {/* Controls */}
      <View style={ts.controls}>
        {isRunning ? (
          <>
            <TouchableOpacity style={[ts.pauseBtn, { borderColor: c.border, backgroundColor: c.bgCard }]} onPress={pauseTimer}>
              <Ionicons name="pause" size={20} color={c.text} />
              <Text style={[ts.pauseText, { color: c.text }]}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ts.resetBtn, { borderColor: c.destructive, backgroundColor: c.destructive + '10' }]} onPress={resetTimer}>
              <Ionicons name="refresh" size={18} color={c.destructive} />
            </TouchableOpacity>
          </>
        ) : (
          <DuoButton
            label={`Start ${mode === 'focus' ? 'Focus' : 'Break'}`}
            icon={mode === 'focus' ? 'rocket' : 'cafe'}
            onPress={startTimer}
            color={accentColor}
            darkColor={accentDark}
          />
        )}
      </View>

      {/* Duration Pickers */}
      {!isRunning && (
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[ts.durationCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          {[
            { label: 'Focus', val: focusMin, set: setFocusMin, min: 5, max: 120, step: 5, isActive: mode === 'focus' },
            { label: 'Break', val: breakMin, set: setBreakMin, min: 1, max: 30, step: 1, isActive: mode === 'break' },
          ].map((item, i) => (
            <View key={i} style={[ts.durationItem, i === 0 && { borderRightWidth: 1, borderRightColor: c.border }]}>
              <Text style={[ts.durationLabel, { color: item.isActive ? c.accent : c.textMuted }]}>{item.label}</Text>
              <View style={ts.durationControl}>
                <TouchableOpacity
                  style={[ts.adjBtn, { backgroundColor: c.accentSoft }]}
                  onPress={() => { const v = Math.max(item.min, item.val - item.step); item.set(v); if (item.isActive) setTimeLeft(v*60); }}
                >
                  <Ionicons name="remove" size={20} color={c.accent} />
                </TouchableOpacity>
                <Text style={[ts.durationVal, { color: c.text }]}>{item.val}m</Text>
                <TouchableOpacity
                  style={[ts.adjBtn, { backgroundColor: c.accentSoft }]}
                  onPress={() => { const v = Math.min(item.max, item.val + item.step); item.set(v); if (item.isActive) setTimeLeft(v*60); }}
                >
                  <Ionicons name="add" size={20} color={c.accent} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Today's Plan */}
      {todayTasks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(260).duration(400)} style={[ts.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={ts.sectionHeader}>
            <Ionicons name="list" size={16} color={c.accent} />
            <Text style={[ts.sectionTitle, { color: c.text }]}>Today's Plan</Text>
          </View>
          {todayTasks.slice(0, 4).map(task => {
            let topicName = '';
            for (const sub of state.subjects) for (const ch of sub.chapters) {
              const t = ch.topics.find(t => t.id === task.topicId);
              if (t) { topicName = t.name; break; }
            }
            const sub = state.subjects.find(s => s.id === task.subjectId);
            const isSel = selectedTopic?.topicId === task.topicId;
            return (
              <TouchableOpacity
                key={task.taskId}
                style={[ts.taskRow, { borderBottomColor: c.border }, isSel && { backgroundColor: c.accentSoft }]}
                onPress={() => setSelectedTopic(isSel ? null : { topicId: task.topicId, subjectId: task.subjectId })}
              >
                <View style={[ts.taskDot, { backgroundColor: sub?.color || c.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[ts.taskName, { color: c.text }]} numberOfLines={1}>{topicName}</Text>
                  <Text style={[ts.taskSub, { color: c.textMuted }]}>{task.estimatedMinutes}m · {task.type}</Text>
                </View>
                {isSel && <Ionicons name="checkmark-circle" size={18} color={c.accent} />}
                {task.completed && <Ionicons name="checkmark-circle" size={18} color={c.success} />}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}

      {/* App Blocking */}
      <Animated.View entering={FadeInDown.delay(320).duration(400)} style={[ts.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
        <View style={ts.sectionHeader}>
          <Ionicons name="shield" size={16} color={c.accent} />
          <Text style={[ts.sectionTitle, { color: c.text }]}>App Blocking</Text>
        </View>

        <TouchableOpacity
          style={[ts.blockBtn, { backgroundColor: c.bgSecondary, borderColor: c.border }]}
          onPress={() => { AppBlocking.getInstalledApps().then(a=>setInstalledApps(a.sort((x,y)=>x.name.localeCompare(y.name)))); setShowAppPicker(true); }}
        >
          <Ionicons name="apps-outline" size={18} color={c.textMuted} />
          <Text style={[ts.blockBtnText, { color: blockedApps.length ? c.text : c.textMuted }]}>
            {blockedApps.length ? `${blockedApps.length} app${blockedApps.length>1?'s':''} selected` : 'Select apps to block...'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[ts.toggleRow, { borderTopColor: c.border }]}
          onPress={() => setBlockShorts(v => !v)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[ts.toggleLabel, { color: c.text }]}>Block Reels / Shorts</Text>
            <Text style={[ts.toggleSub, { color: c.textMuted }]}>Block short-video content in any app</Text>
          </View>
          <View style={[ts.toggle, { backgroundColor: blockShorts ? c.accent : c.bgSecondary }]}>
            <View style={[ts.toggleThumb, { marginLeft: blockShorts ? 22 : 2 }]} />
          </View>
        </TouchableOpacity>

        {blockedApps.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {blockedApps.map(pkg => {
              const app = installedApps.find(a => a.packageName === pkg);
              return (
                <TouchableOpacity key={pkg} style={[ts.chip, { backgroundColor: c.destructive + '15', borderColor: c.destructive + '40', borderWidth: 1 }]}
                  onPress={() => setBlockedApps(b => b.filter(p => p !== pkg))}>
                  <Text style={[ts.chipText, { color: c.destructive }]}>{app?.name || pkg.split('.').pop()} ✕</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      <View style={{ height: 100 }} />

      {/* App Picker Modal */}
      <Modal visible={showAppPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAppPicker(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[ts.modalHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => setShowAppPicker(false)}>
              <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
            <Text style={[ts.modalTitle, { color: c.text }]}>Select Apps</Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{blockedApps.length} selected</Text>
          </View>
          <View style={[ts.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
            <Ionicons name="search-outline" size={16} color={c.textMuted} />
            <TextInput
              style={{ color: c.text, flex: 1, fontSize: 14, marginLeft: 8 }}
              placeholder="Search apps..."
              placeholderTextColor={c.textFaint}
              value={appSearch}
              onChangeText={setAppSearch}
            />
          </View>
          <FlatList
            data={installedApps.filter(a => a.name.toLowerCase().includes(appSearch.toLowerCase()))}
            keyExtractor={item => item.packageName}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const sel = blockedApps.includes(item.packageName);
              return (
                <TouchableOpacity
                  style={[ts.appItem, { backgroundColor: sel ? c.accentSoft : c.bgCard, borderColor: sel ? c.accent + '44' : c.border }]}
                  onPress={() => setBlockedApps(b => sel ? b.filter(p => p !== item.packageName) : [...b, item.packageName])}
                >
                  <View style={[ts.appIcon, { backgroundColor: sel ? c.accent + '22' : c.bgSecondary }]}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: sel ? c.accent : c.textMuted }}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ts.appName, { color: c.text }]}>{item.name}</Text>
                    <Text style={[ts.appPkg, { color: c.textFaint }]}>{item.packageName}</Text>
                  </View>
                  <View style={[ts.checkBox, { borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.accent : 'transparent' }]}>
                    {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 40 }}>
                {Platform.OS !== 'android' ? 'Only available on Android' : 'No apps found'}
              </Text>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const ts = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title:   { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  subtitle: { fontSize: 13 },
  warnCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: RADIUS.lg, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  warnTitle: { fontSize: 14, fontWeight: '700' },
  warnSub:   { fontSize: 12, marginTop: 2 },
  modeTabs: { flexDirection: 'row', marginHorizontal: 16, borderRadius: RADIUS.xl, padding: 5, marginBottom: 12, gap: 5 },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7 },
  modeTabText: { fontSize: 14, fontWeight: '700' },
  timerSection: { alignItems: 'center', paddingVertical: 24 },
  controls: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  btnOuter: { borderRadius: RADIUS.xl, paddingBottom: 5, flex: 1 },
  btnInner: { flex: 1, borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  btnText:  { color: '#fff', fontSize: 17, fontWeight: '800' },
  pauseBtn: { flex: 1, borderRadius: RADIUS.xl, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1.5 },
  pauseText: { fontSize: 16, fontWeight: '700' },
  resetBtn:  { borderRadius: RADIUS.xl, paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5 },
  durationCard: { flexDirection: 'row', marginHorizontal: 16, borderRadius: RADIUS.xl, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  durationItem: { flex: 1, padding: 18, alignItems: 'center' },
  durationLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  durationControl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  adjBtn: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  durationVal: { fontSize: 20, fontWeight: '800', minWidth: 56, textAlign: 'center' },
  section: { marginHorizontal: 16, borderRadius: RADIUS.xl, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, paddingHorizontal: 4, borderRadius: RADIUS.sm },
  taskDot: { width: 10, height: 10, borderRadius: 5 },
  taskName: { fontSize: 13, fontWeight: '600' },
  taskSub:  { fontSize: 11, marginTop: 1 },
  blockBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: RADIUS.lg, borderWidth: 1 },
  blockBtnText: { flex: 1, fontSize: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, marginTop: 14, borderTopWidth: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleSub: { fontSize: 11, marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', marginLeft: 12 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, marginRight: 8 },
  chipText: { fontSize: 12, fontWeight: '600' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  searchBar: { marginHorizontal: 12, marginVertical: 8, flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  appItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, marginBottom: 6, borderWidth: 1 },
  appIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 14, fontWeight: '600' },
  appPkg:  { fontSize: 11, marginTop: 1 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
