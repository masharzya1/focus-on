import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import type { StudySession } from '@/types/study';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmt(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

function CircularProgress({ progress, timeStr, mode, isRunning, accent, text, muted }:
  { progress: number; timeStr: string; mode: string; isRunning: boolean; accent: string; text: string; muted: string }) {
  const SIZE = 252, STROKE = 14;
  const pulsate = useSharedValue(1);

  useEffect(() => {
    if (isRunning) {
      pulsate.value = withTiming(1.025, { duration: 900 });
      const t = setTimeout(() => { pulsate.value = withTiming(1, { duration: 900 }); }, 900);
      return () => clearTimeout(t);
    }
  }, [isRunning, timeStr]);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulsate.value }] }));

  return (
    <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, anim]}>
      {/* BG ring */}
      <View style={{ position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE, borderColor: muted + '28' }} />
      {/* Progress ring */}
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
      {/* Center text */}
      <Text style={{ fontSize: 56, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', color: text, letterSpacing: -2 }}>{timeStr}</Text>
      <Text style={{ fontSize: 12, color: muted, fontWeight: '700', fontFamily: 'Inter_700Bold', marginTop: 4, textTransform: 'uppercase', letterSpacing: 2.5 }}>
        {mode === 'focus' ? 'Focus' : 'Break'}
      </Text>
    </Animated.View>
  );
}

export default function TimerScreen() {
  const { state, addSession, gainXp } = useStudy();
  const { colors: c } = useTheme();

  const [mode, setMode] = useState<'focus'|'break'>('focus');
  const [customFocus, setCustomFocus] = useState(state.settings.pomodoroFocus);
  const [customBreak, setCustomBreak] = useState(state.settings.pomodoroBreak);
  const [secs, setSecs] = useState(customFocus * 60);
  const [running, setRunning] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number | null>(null);

  const total = mode === 'focus' ? customFocus * 60 : customBreak * 60;
  const progress = 1 - secs / total;
  const accent = mode === 'focus' ? c.accent : c.success;

  const handleComplete = useCallback(() => {
    if (mode === 'focus' && startedAt.current) {
      const dur = Math.round((Date.now() - startedAt.current) / 60000);
      const session: StudySession = {
        id: Date.now().toString(),
        startTime: new Date(startedAt.current).toISOString(),
        durationMinutes: Math.max(1, dur), type: 'focus', completed: true,
      };
      addSession(session);
      gainXp(Math.max(1, dur));
    }
    startedAt.current = null;
  }, [mode, addSession, gainXp]);

  const tick = useCallback(() => {
    setSecs(s => {
      if (s <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        handleComplete();
        return 0;
      }
      return s - 1;
    });
  }, [handleComplete]);

  const toggle = () => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      if (!startedAt.current) startedAt.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
      setRunning(true);
    }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    startedAt.current = null;
    setSecs(mode === 'focus' ? customFocus * 60 : customBreak * 60);
  };

  const switchMode = (m: 'focus'|'break') => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    startedAt.current = null;
    setMode(m);
    setSecs(m === 'focus' ? customFocus * 60 : customBreak * 60);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <TouchableOpacity onPress={() => setShowPicker(true)}
          style={[styles.settingsBtn, { backgroundColor: c.bgCard }]}>
            Config Times
          <Ionicons name="options-outline" size={20} color={c.textMuted} />
        </TouchableOpacity>
      </Animated.View>

      {/* Mode toggle */}
      <Animated.View entering={FadeInDown.delay(60).springify()}
        style={[styles.modeRow, { backgroundColor: c.bgCard }]}>
        {(['focus', 'break'] as const).map(m => (
          <TouchableOpacity key={m} style={[styles.modeBtn,
            mode === m && { backgroundColor: m === 'focus' ? c.accent : c.success }]}
            onPress={() => switchMode(m)}>
            <Text style={[styles.modeTxt, { color: mode === m ? '#fff' : c.textMuted }]}>
              {m === 'focus' ? 'Focus' : 'Break'}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Circle */}
      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.circleWrap}>
        <CircularProgress
          progress={progress} timeStr={fmt(secs)}
          mode={mode} isRunning={running}
          accent={accent} text={c.text} muted={c.textMuted}
        />
      </Animated.View>

      {/* Controls */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.controls}>
        <TouchableOpacity onPress={reset} style={[styles.iconBtn, { backgroundColor: c.bgCard }]}>
          <Ionicons name="refresh" size={22} color={c.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggle}
          style={[styles.playBtn, {
            backgroundColor: accent,
            borderBottomColor: mode === 'focus' ? c.accentDark : (c.successDark ?? '#059669'),
          }]}>
          <Ionicons name={running ? 'pause' : 'play'} size={36} color="#fff" />
        </TouchableOpacity>

        <View style={[styles.iconBtn, { backgroundColor: c.bgCard }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold', color: c.textMuted }}>
            {mode === 'focus' ? `${customFocus}m` : `${customBreak}m`}
          </Text>
        </View>
      </Animated.View>

      {/* Duration picker bottom sheet */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowPicker(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Set Duration</Text>

            {[
              { label: 'Focus', val: customFocus, set: setCustomFocus, min: 5, max: 120 },
              { label: 'Break', val: customBreak, set: setCustomBreak, min: 1, max: 30 },
            ].map(item => (
              <View key={item.label} style={styles.pickerRow}>
                <Text style={[styles.pickerLabel, { color: c.textMuted }]}>{item.label}</Text>
                <View style={styles.pickerCtrl}>
                  <TouchableOpacity style={[styles.adjBtn, { backgroundColor: c.bgSecondary }]}
                    onPress={() => item.set(v => Math.max(item.min, v - 5))}>
                    <Ionicons name="remove" size={18} color={c.accent} />
                  </TouchableOpacity>
                  <Text style={[styles.pickerVal, { color: c.text }]}>{item.val}m</Text>
                  <TouchableOpacity style={[styles.adjBtn, { backgroundColor: c.bgSecondary }]}
                    onPress={() => item.set(v => Math.min(item.max, v + 5))}>
                    <Ionicons name="add" size={18} color={c.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: c.accent }]}
              onPress={() => { reset(); setShowPicker(false); }}>
              <Text style={styles.applyTxt}>Apply</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeRow: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4, marginTop: 16 },
  modeBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  modeTxt: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  circleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 60 },
  iconBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 82, height: 78, borderRadius: 41, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    shadowOpacity: 0.3, elevation: 8,
  },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', marginBottom: 24 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerLabel: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  pickerCtrl: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  adjBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pickerVal: { fontSize: 18, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', minWidth: 50, textAlign: 'center' },
  applyBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  applyTxt: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
});
