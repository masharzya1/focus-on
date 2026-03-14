import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import type { StudySession } from '@/types/study';

const TIMER_KEY = 'focuson_timer_v3';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmt(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

function CircularProgress({ progress, timeStr, mode, isRunning, accent, bg, text, muted }:
  { progress: number; timeStr: string; mode: string; isRunning: boolean; accent: string; bg: string; text: string; muted: string }) {
  const SIZE = 240, STROKE = 12, R = (SIZE - STROKE * 2) / 2;
  const pulsate = useSharedValue(1);

  useEffect(() => {
    if (isRunning) {
      pulsate.value = withTiming(1.03, { duration: 1000 });
      setTimeout(() => { pulsate.value = withTiming(1, { duration: 1000 }); }, 1000);
    }
  }, [isRunning, timeStr]);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulsate.value }] }));

  return (
    <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, anim]}>
      {/* BG ring */}
      <View style={{ position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE, borderColor: muted + '30' }} />
      {/* Progress ring using rotation trick */}
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
      {/* Center */}
      <Text style={{ fontSize: 52, fontWeight: '800', color: text, letterSpacing: -2 }}>{timeStr}</Text>
      <Text style={{ fontSize: 13, color: muted, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 }}>
        {mode === 'focus' ? 'Focus' : 'Break'}
      </Text>
    </Animated.View>
  );
}

export default function TimerScreen() {
  const { state, addSession, gainXp } = useStudy();
  const { colors: c } = useTheme();

  const focus = state.settings.pomodoroFocus * 60;
  const brk = state.settings.pomodoroBreak * 60;

  const [mode, setMode] = useState<'focus'|'break'>('focus');
  const [secs, setSecs] = useState(focus);
  const [running, setRunning] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [customFocus, setCustomFocus] = useState(state.settings.pomodoroFocus);
  const [customBreak, setCustomBreak] = useState(state.settings.pomodoroBreak);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number | null>(null);

  const total = mode === 'focus' ? customFocus * 60 : customBreak * 60;
  const progress = 1 - secs / total;

  const tick = useCallback(() => {
    setSecs(s => {
      if (s <= 1) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        handleComplete();
        return 0;
      }
      return s - 1;
    });
  }, [mode, customFocus, customBreak]);

  const handleComplete = useCallback(() => {
    if (mode === 'focus' && startedAt.current) {
      const dur = Math.round((Date.now() - startedAt.current) / 60000);
      const session: StudySession = {
        id: Date.now().toString(), startTime: new Date(startedAt.current).toISOString(),
        durationMinutes: dur, type: 'focus', completed: true,
      };
      addSession(session);
      gainXp(dur);
    }
    startedAt.current = null;
  }, [mode]);

  const toggle = () => {
    if (running) {
      clearInterval(intervalRef.current!);
      setRunning(false);
    } else {
      if (!startedAt.current) startedAt.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
      setRunning(true);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    startedAt.current = null;
    setSecs(mode === 'focus' ? customFocus * 60 : customBreak * 60);
  };

  const switchMode = (m: 'focus'|'break') => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    startedAt.current = null;
    setMode(m);
    setSecs(m === 'focus' ? customFocus * 60 : customBreak * 60);
  };

  useEffect(() => { return () => { clearInterval(intervalRef.current!); }; }, []);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={[styles.header]}>
        <Text style={[styles.title, { color: c.text }]}>Timer</Text>
        <TouchableOpacity onPress={() => setShowPicker(true)}
          style={[styles.settingsBtn, { backgroundColor: c.bgCard }]}>
          <Ionicons name="options-outline" size={20} color={c.textMuted} />
        </TouchableOpacity>
      </Animated.View>

      {/* Mode toggle */}
      <Animated.View entering={FadeInDown.delay(80).springify()}
        style={[styles.modeRow, { backgroundColor: c.bgCard }]}>
        {(['focus','break'] as const).map(m => (
          <TouchableOpacity key={m} style={[styles.modeBtn,
            mode === m && { backgroundColor: c.accent }]}
            onPress={() => switchMode(m)}>
            <Text style={[styles.modeTxt, { color: mode === m ? '#fff' : c.textMuted }]}>
              {m === 'focus' ? '🎯 Focus' : '☕ Break'}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Circle */}
      <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.circleWrap}>
        <CircularProgress progress={progress} timeStr={fmt(secs)}
          mode={mode} isRunning={running}
          accent={mode === 'focus' ? c.accent : c.success}
          bg={c.bg} text={c.text} muted={c.textMuted} />
      </Animated.View>

      {/* Controls */}
      <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.controls}>
        <TouchableOpacity onPress={reset} style={[styles.iconBtn, { backgroundColor: c.bgCard }]}>
          <Ionicons name="refresh" size={24} color={c.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle}
          style={[styles.playBtn, { backgroundColor: mode === 'focus' ? c.accent : c.success,
            borderBottomColor: mode === 'focus' ? c.accentDark : c.successDark }]}>
          <Ionicons name={running ? 'pause' : 'play'} size={34} color="#fff" />
        </TouchableOpacity>
        <View style={[styles.iconBtn, { backgroundColor: c.bgCard }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: c.textMuted }}>
            {mode === 'focus' ? `${customFocus}m` : `${customBreak}m`}
          </Text>
        </View>
      </Animated.View>

      {/* Duration picker modal */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowPicker(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Duration সেট করো</Text>

            {[
              { label: '🎯 Focus', val: customFocus, set: setCustomFocus, min: 5, max: 120 },
              { label: '☕ Break', val: customBreak, set: setCustomBreak, min: 1, max: 30 },
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
              <Text style={styles.applyTxt}>Apply করো</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeRow: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4, marginTop: 16 },
  modeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  modeTxt: { fontSize: 14, fontWeight: '700' },
  circleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 64 },
  iconBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 80, height: 76, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, shadowOpacity: 0.3, elevation: 8 },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 24 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerLabel: { fontSize: 16, fontWeight: '600' },
  pickerCtrl: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  adjBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pickerVal: { fontSize: 18, fontWeight: '800', minWidth: 50, textAlign: 'center' },
  applyBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  applyTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
