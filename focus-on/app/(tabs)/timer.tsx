import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';
import type { StudySession } from '@/types/study';
import {
  scheduleTimerDoneNotification, cancelNotification,
} from '@/services/notifications';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmt(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

// ── Circular Progress ─────────────────────────────────────────────────────────
function CircularProgress({ progress, timeStr, mode, isRunning, accent, bg, text, muted }: {
  progress: number; timeStr: string; mode: string; isRunning: boolean;
  accent: string; bg: string; text: string; muted: string;
}) {
  const SIZE = 260, STROKE = 16;
  const pulsate = useSharedValue(1);

  useEffect(() => {
    if (isRunning) {
      pulsate.value = withTiming(1.018, { duration: 900 });
      const t = setTimeout(() => { pulsate.value = withTiming(1, { duration: 900 }); }, 900);
      return () => clearTimeout(t);
    }
  }, [isRunning, timeStr]);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulsate.value }] }));

  return (
    <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, anim]}>
      <View style={{
        position: 'absolute', width: SIZE - 4, height: SIZE - 4,
        borderRadius: (SIZE - 4) / 2,
        shadowColor: accent, shadowOpacity: isRunning ? 0.25 : 0.1,
        shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, elevation: 12,
        backgroundColor: bg,
      }} />
      <View style={{
        position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE, borderColor: accent + '18',
      }} />
      <View style={{ position: 'absolute', width: SIZE, height: SIZE }}>
        {[0, 1].map(half => (
          <View key={half} style={{
            position: 'absolute', width: SIZE, height: SIZE,
            borderRadius: SIZE / 2, overflow: 'hidden',
            transform: [{ rotate: half === 0 ? '0deg' : '180deg' }],
          }}>
            <View style={{
              position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
              borderWidth: STROKE, borderColor: accent,
              transform: [{ rotate: `${Math.min(progress * 360, half === 0 ? 180 : (progress - 0.5) * 360)}deg` }],
              opacity: half === 0 ? 1 : progress > 0.5 ? 1 : 0,
            }} />
          </View>
        ))}
      </View>
      <Text style={{ fontSize: 58, fontFamily: FONTS.bold, color: text, letterSpacing: -2 }}>{timeStr}</Text>
      <Text style={{ fontSize: 11, color: muted, fontFamily: FONTS.semibold, marginTop: 6, textTransform: 'uppercase', letterSpacing: 3 }}>
        {mode === 'focus' ? 'Focus' : 'Break'}
      </Text>
    </Animated.View>
  );
}

// ── 3D Play Button ────────────────────────────────────────────────────────────
function PlayButton({ running, onPress, accent, accentDark }: {
  running: boolean; onPress: () => void; accent: string; accentDark: string;
}) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(pressed.value ? 4 : 0, { duration: 60 }) }],
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: accentDark, position: 'absolute', top: 6,
        shadowColor: accentDark, shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 6 }, shadowRadius: 16,
      }} />
      <Animated.View style={anim}>
        <TouchableOpacity
          style={{
            width: 84, height: 84, borderRadius: 42,
            backgroundColor: accent,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: accent, shadowOpacity: 0.35,
            shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 10,
          }}
          onPress={onPress} activeOpacity={1}
          onPressIn={() => { pressed.value = 1; }}
          onPressOut={() => { pressed.value = 0; }}
        >
          <Ionicons name={running ? 'pause' : 'play'} size={34} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── 3D Icon Button ────────────────────────────────────────────────────────────
function IconButton({ icon, onPress, bg, color }: {
  icon: string; onPress: () => void; bg: string; color: string;
}) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(pressed.value ? 3 : 0, { duration: 60 }) }],
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: bg + 'CC', position: 'absolute', top: 4 }} />
      <Animated.View style={anim}>
        <TouchableOpacity
          style={{
            width: 54, height: 54, borderRadius: 27,
            backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 4,
          }}
          onPress={onPress} activeOpacity={1}
          onPressIn={() => { pressed.value = 1; }}
          onPressOut={() => { pressed.value = 0; }}
        >
          <Ionicons name={icon as any} size={22} color={color} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Time Badge Button ─────────────────────────────────────────────────────────
function TimeBadgeButton({ label, onPress, accent }: {
  label: string; onPress: () => void; accent: string;
}) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(pressed.value ? 2 : 0, { duration: 60 }) }],
  }));
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, backgroundColor: accent + '33', position: 'absolute', top: 3 }} />
      <Animated.View style={anim}>
        <TouchableOpacity
          style={{
            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14,
            backgroundColor: accent + '18', borderWidth: 1.5, borderColor: accent + '40',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: accent, shadowOpacity: 0.12,
            shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3,
          }}
          onPress={onPress} activeOpacity={1}
          onPressIn={() => { pressed.value = 1; }}
          onPressOut={() => { pressed.value = 0; }}
        >
          <Text style={{ fontSize: 15, fontFamily: FONTS.bold, color: accent }}>{label}</Text>
          <Text style={{ fontSize: 9, fontFamily: FONTS.medium, color: accent + 'AA', textTransform: 'uppercase', letterSpacing: 0.5 }}>tap to edit</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TimerScreen() {
  const { state, addSession, gainXp, completeTaskAndTopic, getActiveNowTask } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId?: string; topicId?: string; chapterId?: string; subjectId?: string;
    topicName?: string; subjectName?: string; subjectColor?: string; estimatedMinutes?: string;
  }>();

  // If params passed (from home banner or task tap), use them
  // Otherwise, check if there's an active task right now
  const activeNow = getActiveNowTask();
  const taskId      = params.taskId      ?? activeNow?.taskId;
  const topicId     = params.topicId     ?? activeNow?.topicId;
  const chapterId   = params.chapterId   ?? activeNow?.chapterId;
  const subjectId   = params.subjectId   ?? activeNow?.subjectId;
  const topicName   = params.topicName   ?? activeNow?.topicName;
  const subjectName = params.subjectName ?? activeNow?.subjectName;
  const subjectColor = params.subjectColor ?? activeNow?.subjectColor;
  const estimatedMinutes = params.estimatedMinutes
    ? parseInt(params.estimatedMinutes)
    : (activeNow?.estimatedMinutes ?? state.settings.pomodoroFocus);

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [customFocus, setCustomFocus] = useState(estimatedMinutes || state.settings.pomodoroFocus);
  const [customBreak, setCustomBreak] = useState(state.settings.pomodoroBreak);
  const [secs, setSecs] = useState(customFocus * 60);
  const [running, setRunning] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt   = useRef<number | null>(null);
  const notifIdRef  = useRef<string | null>(null);

  const total = mode === 'focus' ? customFocus * 60 : customBreak * 60;
  const progress = 1 - secs / total;
  const accent     = subjectColor ?? (mode === 'focus' ? c.accent : c.success);
  const accentDark = mode === 'focus' ? c.accentDark : (c.successDark ?? '#059669');

  const handleComplete = useCallback(() => {
    if (mode === 'focus' && startedAt.current) {
      const dur = Math.round((Date.now() - startedAt.current) / 60000);
      const session: StudySession = {
        id: Date.now().toString(),
        startTime: new Date(startedAt.current).toISOString(),
        durationMinutes: Math.max(1, dur),
        topicId: topicId || undefined,
        subjectId: subjectId || undefined,
        type: 'focus', completed: true,
      };
      addSession(session);
      gainXp(Math.max(1, dur));

      // If this was a plan task → auto complete task + topic
      if (taskId && subjectId && chapterId && topicId) {
        completeTaskAndTopic(taskId, subjectId, chapterId, topicId);
        setShowComplete(true);
      }
    }
    startedAt.current = null;
    if (notifIdRef.current) {
      cancelNotification(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
  }, [mode, addSession, gainXp, completeTaskAndTopic, taskId, topicId, chapterId, subjectId]);

  const tick = useCallback(() => {
    setSecs(s => {
      if (s <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false); handleComplete(); return 0;
      }
      return s - 1;
    });
  }, [handleComplete]);

  const toggle = async () => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      if (notifIdRef.current) {
        await cancelNotification(notifIdRef.current).catch(() => {});
        notifIdRef.current = null;
      }
    } else {
      if (!startedAt.current) startedAt.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
      setRunning(true);
      // Schedule end notification
      try {
        const id = await scheduleTimerDoneNotification(mode, secs);
        notifIdRef.current = id;
      } catch {}
    }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false); startedAt.current = null;
    setSecs(mode === 'focus' ? customFocus * 60 : customBreak * 60);
    if (notifIdRef.current) {
      cancelNotification(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
  };

  const switchMode = (m: 'focus' | 'break') => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false); startedAt.current = null; setMode(m);
    setSecs(m === 'focus' ? customFocus * 60 : customBreak * 60);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (notifIdRef.current) cancelNotification(notifIdRef.current).catch(() => {});
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>

      {/* Task context bar — shown when studying a specific task */}
      {topicName && (
        <Animated.View entering={FadeInDown.springify()}
          style={[styles.taskBar, { backgroundColor: (subjectColor ?? c.accent) + '15', borderBottomColor: (subjectColor ?? c.accent) + '30' }]}>
          <View style={[styles.taskBarDot, { backgroundColor: subjectColor ?? c.accent }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.taskBarTopic, { color: subjectColor ?? c.accent }]} numberOfLines={1}>
              {topicName}
            </Text>
            {subjectName && (
              <Text style={[styles.taskBarSubject, { color: c.textMuted }]}>{subjectName}</Text>
            )}
          </View>
          <Text style={[styles.taskBarMins, { color: (subjectColor ?? c.accent) + 'AA' }]}>
            {estimatedMinutes}m
          </Text>
        </Animated.View>
      )}

      {/* Mode toggle */}
      <Animated.View entering={FadeInDown.delay(40).springify()}
        style={[styles.modeRow, { backgroundColor: c.bgCard }]}>
        {(['focus', 'break'] as const).map(m => (
          <TouchableOpacity key={m}
            style={[styles.modeBtn, mode === m && {
              backgroundColor: m === 'focus' ? accent : c.success,
              shadowColor: m === 'focus' ? accent : c.success,
              shadowOpacity: 0.35, shadowOffset: { width: 0, height: 3 },
              shadowRadius: 8, elevation: 5,
            }]}
            onPress={() => switchMode(m)}>
            <Text style={[styles.modeTxt, { color: mode === m ? '#fff' : c.textMuted }]}>
              {m === 'focus' ? 'Focus' : 'Break'}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Circle */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.circleWrap}>
        <CircularProgress
          progress={progress} timeStr={fmt(secs)}
          mode={mode} isRunning={running}
          accent={mode === 'focus' ? accent : c.success}
          bg={c.bg} text={c.text} muted={c.textMuted}
        />
      </Animated.View>

      {/* Controls */}
      <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.controls}>
        <IconButton icon="refresh" onPress={reset} bg={c.bgCard} color={c.textMuted} />
        <PlayButton running={running} onPress={toggle} accent={mode === 'focus' ? accent : c.success} accentDark={accentDark} />
        <TimeBadgeButton
          label={mode === 'focus' ? `${customFocus}m` : `${customBreak}m`}
          onPress={() => setShowPicker(true)}
          accent={mode === 'focus' ? accent : c.success}
        />
      </Animated.View>

      <View style={{ height: Platform.OS === 'ios' ? 40 : 24 }} />

      {/* Duration picker */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowPicker(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Set Duration</Text>
            {[
              { label: 'Focus', icon: 'timer-outline', val: customFocus, set: setCustomFocus, min: 5, max: 120, color: accent },
              { label: 'Break', icon: 'cafe-outline', val: customBreak, set: setCustomBreak, min: 1, max: 30, color: c.success },
            ].map(item => (
              <View key={item.label} style={[styles.pickerRow, { backgroundColor: c.bgSecondary }]}>
                <View style={styles.pickerLeft}>
                  <View style={[styles.pickerIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={[styles.pickerLabel, { color: c.textMuted }]}>{item.label}</Text>
                </View>
                <View style={styles.pickerCtrl}>
                  <TouchableOpacity style={[styles.adjBtn, { backgroundColor: c.bgCard }]}
                    onPress={() => item.set(v => Math.max(item.min, v - 5))}>
                    <Ionicons name="remove" size={18} color={item.color} />
                  </TouchableOpacity>
                  <Text style={[styles.pickerVal, { color: item.color }]}>{item.val}m</Text>
                  <TouchableOpacity style={[styles.adjBtn, { backgroundColor: c.bgCard }]}
                    onPress={() => item.set(v => Math.min(item.max, v + 5))}>
                    <Ionicons name="add" size={18} color={item.color} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: accent }]}
              onPress={() => { reset(); setShowPicker(false); }}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.applyTxt}>Apply</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Session complete modal */}
      <Modal visible={showComplete} transparent animationType="fade" onRequestClose={() => setShowComplete(false)}>
        <View style={styles.completeBg}>
          <Animated.View entering={FadeInUp.springify()}
            style={[styles.completeCard, { backgroundColor: c.bgCard }]}>
            <Text style={{ fontSize: 52 }}>🎉</Text>
            <Text style={[styles.completeTitle, { color: c.text }]}>Session Complete!</Text>
            {topicName && (
              <View style={[styles.completeBadge, { backgroundColor: (subjectColor ?? c.accent) + '18' }]}>
                <Ionicons name="checkmark-circle" size={16} color={subjectColor ?? c.accent} />
                <Text style={[styles.completeTopic, { color: subjectColor ?? c.accent }]}>
                  {topicName} marked as done ✓
                </Text>
              </View>
            )}
            <Text style={[styles.completeXp, { color: c.textMuted }]}>
              +{estimatedMinutes} XP earned
            </Text>
            <TouchableOpacity
              style={[styles.completeDoneBtn, { backgroundColor: accent }]}
              onPress={() => { setShowComplete(false); switchMode('break'); }}>
              <Text style={styles.completeDoneTxt}>Take a Break</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowComplete(false)}>
              <Text style={[styles.completeSkip, { color: c.textMuted }]}>Dismiss</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  taskBar: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    borderBottomWidth: 1,
  },
  taskBarDot: { width: 10, height: 10, borderRadius: 5 },
  taskBarTopic: { fontSize: 14, fontFamily: FONTS.bold },
  taskBarSubject: { fontSize: 11, fontFamily: FONTS.regular, marginTop: 1 },
  taskBarMins: { fontSize: 13, fontFamily: FONTS.semibold },
  modeRow: {
    flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4,
    marginTop: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8, elevation: 3,
  },
  modeBtn: { paddingHorizontal: 28, paddingVertical: 11, borderRadius: 12 },
  modeTxt: { fontSize: 15, fontFamily: FONTS.bold },
  circleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 16 },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: FONTS.bold, marginBottom: 16 },
  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pickerLabel: { fontSize: 15, fontFamily: FONTS.semibold },
  pickerCtrl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  adjBtn: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pickerVal: { fontSize: 20, fontFamily: FONTS.bold, minWidth: 46, textAlign: 'center' },
  applyBtn: {
    height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, marginTop: 8,
  },
  applyTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  // Complete modal
  completeBg: { flex: 1, backgroundColor: '#00000077', alignItems: 'center', justifyContent: 'center', padding: 32 },
  completeCard: { borderRadius: 28, padding: 32, alignItems: 'center', width: '100%', gap: 12 },
  completeTitle: { fontSize: 24, fontFamily: FONTS.bold },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  completeTopic: { fontSize: 14, fontFamily: FONTS.semibold },
  completeXp: { fontSize: 14, fontFamily: FONTS.medium },
  completeDoneBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: 4 },
  completeDoneTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  completeSkip: { fontSize: 13, fontFamily: FONTS.regular, marginTop: 4 },
});
