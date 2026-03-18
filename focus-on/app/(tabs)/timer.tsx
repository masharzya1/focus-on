import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Pressable,
  Platform, ScrollView, Image,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';
import { isChapterOnly, isSubjectTopicBased, type StudySession, type Subject, type Chapter, type Topic } from '@/types/study';
import { scheduleTimerDoneNotification, cancelNotification } from '@/services/notifications';
import { useT } from '@/contexts/LanguageContext';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmt(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

// ── Circular Progress ─────────────────────────────────────────────────────────
function CircularProgress({ progress, timeStr, mode, isRunning, accent, bg, text, muted, modeLabel }: {
  progress: number; timeStr: string; mode: string; isRunning: boolean;
  accent: string; bg: string; text: string; muted: string; modeLabel?: string;
}) {
  const SIZE = 260, STROKE = 16;
  const pulsate = useSharedValue(1);

  useEffect(() => {
    if (isRunning) {
      // Gentle continuous pulse while running — loops via recursive setTimeout
      let alive = true;
      const pulse = () => {
        if (!alive) return;
        pulsate.value = withTiming(1.018, { duration: 900 });
        setTimeout(() => {
          if (!alive) return;
          pulsate.value = withTiming(1, { duration: 900 });
          setTimeout(() => pulse(), 900);
        }, 900);
      };
      pulse();
      return () => {
        alive = false;
        // Reset scale cleanly so remount doesn't show a stuck scale value
        pulsate.value = withTiming(1, { duration: 150 });
      };
    } else {
      pulsate.value = withTiming(1, { duration: 150 });
    }
  }, [isRunning]);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulsate.value }] }));

  return (
    <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, anim]}>
      <View style={{
        position: 'absolute', width: SIZE - 4, height: SIZE - 4, borderRadius: (SIZE - 4) / 2,
        shadowColor: accent, shadowOpacity: isRunning ? 0.25 : 0.1,
        shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, elevation: 12, backgroundColor: bg,
      }} />
      <View style={{ position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: STROKE, borderColor: accent + '18' }} />
      <View style={{ position: 'absolute', width: SIZE, height: SIZE }}>
        {[0, 1].map(half => (
          <View key={half} style={{
            position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            overflow: 'hidden', transform: [{ rotate: half === 0 ? '0deg' : '180deg' }],
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
        {modeLabel ?? (mode === 'focus' ? 'FOCUS' : 'BREAK')}
      </Text>
    </Animated.View>
  );
}

// ── 3D Play Button ────────────────────────────────────────────────────────────
function PlayButton({ running, onPress, accent, accentDark }: {
  running: boolean; onPress: () => void; accent: string; accentDark: string;
}) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: withTiming(pressed.value ? 4 : 0, { duration: 60 }) }] }));
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: accentDark, position: 'absolute', top: 6, shadowColor: accentDark, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16 }} />
      <Animated.View style={anim}>
        <TouchableOpacity style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: accent, alignItems: 'center', justifyContent: 'center', shadowColor: accent, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 10 }}
          onPress={onPress} activeOpacity={1}
          onPressIn={() => { pressed.value = 1; }} onPressOut={() => { pressed.value = 0; }}>
          <Ionicons name={running ? 'pause' : 'play'} size={34} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── 3D Icon Button ────────────────────────────────────────────────────────────
function IconButton({ icon, onPress, bg, color }: { icon: string; onPress: () => void; bg: string; color: string }) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: withTiming(pressed.value ? 3 : 0, { duration: 60 }) }] }));
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: bg + 'CC', position: 'absolute', top: 4 }} />
      <Animated.View style={anim}>
        <TouchableOpacity style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 4 }}
          onPress={onPress} activeOpacity={1}
          onPressIn={() => { pressed.value = 1; }} onPressOut={() => { pressed.value = 0; }}>
          <Ionicons name={icon as any} size={22} color={color} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Time Badge Button ─────────────────────────────────────────────────────────
function TimeBadgeButton({ label, onPress, accent, tapLabel = 'tap to edit' }: { label: string; onPress: () => void; accent: string; tapLabel?: string }) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: withTiming(pressed.value ? 2 : 0, { duration: 60 }) }] }));
  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={anim}>
        <TouchableOpacity style={{ paddingHorizontal: 15, paddingVertical: 15, borderRadius: 100, backgroundColor: accent + '18', borderWidth: 1.5, borderColor: accent + '40', alignItems: 'center', justifyContent: 'center', shadowColor: accent, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3 }}
          onPress={onPress} activeOpacity={1}
          onPressIn={() => { pressed.value = 1; }} onPressOut={() => { pressed.value = 0; }}>
          <Text style={{ fontSize: 15, fontFamily: FONTS.bold, color: accent }}>{label}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Subject Picker Modal ──────────────────────────────────────────────────────
function SubjectPicker({ visible, subjects, onSelect, onClose, colors: c }: {
  visible: boolean;
  subjects: Subject[];
  onSelect: (s: Subject, ch: Chapter, t?: Topic) => void;
  onClose: () => void;
  colors: any;
}) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const reset = () => { setSelectedSubject(null); setSelectedChapter(null); };

  const handleClose = () => { reset(); onClose(); };

  const handleSelectChapter = (ch: Chapter) => {
    if (!selectedSubject) return;
    if (isChapterOnly(ch)) {
      // Chapter-only: select directly
      onSelect(selectedSubject, ch, undefined);
      reset();
    } else {
      setSelectedChapter(ch);
    }
  };

  const handleSelectTopic = (t: Topic) => {
    if (!selectedSubject || !selectedChapter) return;
    onSelect(selectedSubject, selectedChapter, t);
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }} onPress={handleClose}>
        <Pressable style={[{ borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, maxHeight: '80%' }, { backgroundColor: c.bgCard }]}
          onPress={e => e.stopPropagation()}>

          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 16 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {selectedSubject && (
              <TouchableOpacity onPress={() => { setSelectedSubject(null); setSelectedChapter(null); }} style={{ padding: 4 }}>
                <Ionicons name="arrow-back" size={20} color={c.textMuted} />
              </TouchableOpacity>
            )}
            {selectedChapter && (
              <TouchableOpacity onPress={() => setSelectedChapter(null)} style={{ padding: 4 }}>
                <Ionicons name="arrow-back" size={20} color={c.textMuted} />
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: c.text, flex: 1 }}>
              {selectedChapter
                ? selectedChapter.name
                : selectedSubject
                  ? selectedSubject.name
                  : 'What are you studying?'}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Subject list */}
            {!selectedSubject && subjects.map(subject => (
              <TouchableOpacity key={subject.id}
                style={[{
                  flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
                  borderRadius: 14, marginBottom: 8,
                  backgroundColor: c.bgSecondary,
                }]}
                onPress={() => setSelectedSubject(subject)}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: subject.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={subject.icon as any} size={20} color={subject.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: FONTS.bold, color: c.text }}>{subject.name}</Text>
                  <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: c.textFaint, marginTop: 2 }}>
                    {subject.chapters.length} chapter{subject.chapters.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
              </TouchableOpacity>
            ))}

            {/* Chapter list */}
            {selectedSubject && !selectedChapter && selectedSubject.chapters.map(ch => (
              <TouchableOpacity key={ch.id}
                style={[{
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                  borderRadius: 14, marginBottom: 8,
                  backgroundColor: ch.completed ? c.bgSecondary : c.bgSecondary,
                  opacity: ch.completed ? 0.5 : 1,
                }]}
                onPress={() => !ch.completed && handleSelectChapter(ch)}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedSubject.color, marginLeft: 4 }} />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: FONTS.semibold, color: c.text }}>{ch.name}</Text>
                {isChapterOnly(ch)
                  ? <Text style={{ fontSize: 11, fontFamily: FONTS.regular, color: c.textFaint }}>Chapter</Text>
                  : <>
                      <Text style={{ fontSize: 11, fontFamily: FONTS.regular, color: c.textFaint }}>
                        {ch.topics.filter(t => t.completed).length}/{ch.topics.length} topics
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={c.textFaint} />
                    </>
                }
              </TouchableOpacity>
            ))}

            {/* Topic list */}
            {selectedChapter && selectedChapter.topics.map(t => (
              <TouchableOpacity key={t.id}
                style={[{
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                  borderRadius: 14, marginBottom: 8, backgroundColor: c.bgSecondary,
                  opacity: t.completed ? 0.5 : 1,
                }]}
                onPress={() => !t.completed && handleSelectTopic(t)}>
                <View style={[{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, {
                  borderColor: t.completed ? c.success : c.border,
                  backgroundColor: t.completed ? c.success : 'transparent',
                }]}>
                  {t.completed && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text style={[{ flex: 1, fontSize: 14, fontFamily: FONTS.semibold, color: c.text },
                  t.completed && { textDecorationLine: 'line-through', opacity: 0.5 }]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}

            {subjects.length === 0 && (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Ionicons name="book-outline" size={40} color={c.textFaint} style={{ marginBottom: 12 }} />
                <Text style={{ color: c.textMuted, fontFamily: FONTS.regular, textAlign: 'center' }}>
                  No subjects yet. Go to the Subjects tab to add some.
                </Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TimerScreen() {
  const { state, addSession, gainXp, completeTaskAndTopic, getActiveNowTask } = useStudy();
  const t = useT();
  const { colors: c } = useTheme();
  const router = useRouter();

  const params = useLocalSearchParams<{
    taskId?: string; topicId?: string; chapterId?: string; subjectId?: string;
    topicName?: string; subjectName?: string; subjectColor?: string; estimatedMinutes?: string;
  }>();

  const activeNow = getActiveNowTask();

  // Task context — from params OR active task
  const taskId       = params.taskId      ?? activeNow?.taskId;
  const topicId      = params.topicId     ?? activeNow?.topicId;
  const chapterId    = params.chapterId   ?? activeNow?.chapterId;
  const subjectId    = params.subjectId   ?? activeNow?.subjectId;
  const topicName    = params.topicName   ?? activeNow?.topicName;
  const subjectName  = params.subjectName ?? activeNow?.subjectName;
  const subjectColor = params.subjectColor ?? activeNow?.subjectColor;
  const estimatedMinutes = params.estimatedMinutes
    ? parseInt(params.estimatedMinutes)
    : (activeNow?.estimatedMinutes ?? state.settings.pomodoroFocus);

  // Manual selection (when no plan task)
  const [manualSubject, setManualSubject]     = useState<Subject | null>(null);
  const [manualChapter, setManualChapter]     = useState<Chapter | null>(null);
  const [manualTopic, setManualTopic]         = useState<Topic | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  // Effective context (plan task OR manual selection)
  const effectiveTopicName   = topicName ?? manualTopic?.name ?? manualChapter?.name;
  const effectiveSubjectName = subjectName ?? manualSubject?.name;
  const effectiveColor       = subjectColor ?? manualSubject?.color;
  const hasContext           = !!(effectiveTopicName);

  const [mode, setMode]               = useState<'focus' | 'break'>('focus');
  const [customFocus, setCustomFocus] = useState(estimatedMinutes || state.settings.pomodoroFocus);
  const [customBreak, setCustomBreak] = useState(state.settings.pomodoroBreak);
  const [secs, setSecs]               = useState(customFocus * 60);
  const [running, setRunning]         = useState(false);
  const [showPicker, setShowPicker]   = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt   = useRef<number | null>(null);
  const notifIdRef  = useRef<string | null>(null);

  const total   = mode === 'focus' ? customFocus * 60 : customBreak * 60;
  const progress = 1 - secs / total;
  const accent    = effectiveColor ?? (mode === 'focus' ? c.accent : c.success);
  const accentDark = mode === 'focus' ? c.accentDark : (c.successDark ?? '#059669');

  const handleComplete = useCallback(() => {
    if (mode === 'focus' && startedAt.current) {
      const dur = Math.round((Date.now() - startedAt.current) / 60000);
      const session: StudySession = {
        id: Date.now().toString(),
        startTime: new Date(startedAt.current).toISOString(),
        durationMinutes: Math.max(1, dur),
        topicId: topicId ?? manualTopic?.id ?? manualChapter?.id,
        subjectId: subjectId ?? manualSubject?.id,
        type: 'focus', completed: true,
      };
      addSession(session);
      gainXp(Math.max(1, dur));

      // Auto-complete plan task if exists
      if (taskId && subjectId && chapterId && topicId) {
        completeTaskAndTopic(taskId, subjectId, chapterId, topicId);
        setShowComplete(true);
      }
      // Mark manual selection complete
      else if (manualSubject && manualChapter) {
        if (manualTopic) {
          completeTaskAndTopic('', manualSubject.id, manualChapter.id, manualTopic.id);
        } else {
          completeTaskAndTopic('', manualSubject.id, manualChapter.id, manualChapter.id);
        }
        setShowComplete(true);
      }
    }
    startedAt.current = null;
    if (notifIdRef.current) { cancelNotification(notifIdRef.current).catch(() => {}); notifIdRef.current = null; }
  }, [mode, addSession, gainXp, completeTaskAndTopic, taskId, topicId, chapterId, subjectId, manualSubject, manualChapter, manualTopic]);

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
      if (notifIdRef.current) { await cancelNotification(notifIdRef.current).catch(() => {}); notifIdRef.current = null; }
    } else {
      if (!startedAt.current) startedAt.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
      setRunning(true);
      try { notifIdRef.current = await scheduleTimerDoneNotification(mode, secs); } catch {}
    }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false); startedAt.current = null;
    setSecs(mode === 'focus' ? customFocus * 60 : customBreak * 60);
    if (notifIdRef.current) { cancelNotification(notifIdRef.current).catch(() => {}); notifIdRef.current = null; }
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

      {/* Task context bar */}
      {hasContext ? (
        <Animated.View entering={FadeInDown.springify()}
          style={[styles.taskBar, { backgroundColor: (effectiveColor ?? c.accent) + '15', borderBottomColor: (effectiveColor ?? c.accent) + '30' }]}>
          <View style={[styles.taskBarDot, { backgroundColor: effectiveColor ?? c.accent }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.taskBarTopic, { color: effectiveColor ?? c.accent }]} numberOfLines={1}>
              {effectiveTopicName}
            </Text>
            {effectiveSubjectName && (
              <Text style={[styles.taskBarSubject, { color: c.textMuted }]}>{effectiveSubjectName}</Text>
            )}
          </View>
          {/* Change subject button (only for manual) */}
          {!taskId && !activeNow && (
            <TouchableOpacity
              style={[styles.changeSubjectBtn, { backgroundColor: c.bgSecondary }]}
              onPress={() => setShowSubjectPicker(true)}>
              <Ionicons name="swap-horizontal" size={14} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        /* No context — show subject picker prompt */
        <Animated.View entering={FadeInDown.springify()}
          style={[styles.taskBar, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
          <Ionicons name="book-outline" size={18} color={c.textFaint} />
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowSubjectPicker(true)}>
            <Text style={[styles.noContextTxt, { color: c.textFaint }]}>
              Tap to select what you're studying
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectSubjectBtn, { backgroundColor: c.accentSoft }]}
            onPress={() => setShowSubjectPicker(true)}>
            <Text style={[styles.selectSubjectTxt, { color: c.accent }]}>{t.timerSelect}</Text>
          </TouchableOpacity>
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
              shadowOpacity: 0.35, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 5,
            }]}
            onPress={() => switchMode(m)}>
            <Text style={[styles.modeTxt, { color: mode === m ? '#fff' : c.textMuted }]}>
              {m === 'focus' ? t.timerFocus : t.timerBreak}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Circle */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.circleWrap}>
        <CircularProgress
          progress={progress} timeStr={fmt(secs)} mode={mode} isRunning={running}
          accent={mode === 'focus' ? accent : c.success}
          bg={c.bg} text={c.text} muted={c.textMuted}
          modeLabel={mode === 'focus' ? t.timerFocus : t.timerBreak}
        />
      </Animated.View>

      {/* Controls */}
      <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.controls}>
        <IconButton icon="refresh" onPress={reset} bg={c.bgCard} color={c.textMuted} />
        <PlayButton running={running} onPress={toggle} accent={mode === 'focus' ? accent : c.success} accentDark={accentDark} />
        <View style={{ alignItems: 'center', gap: 5 }}>
          <TimeBadgeButton
            label={mode === 'focus' ? `${customFocus}m` : `${customBreak}m`}
            onPress={() => setShowPicker(true)}
            accent={mode === 'focus' ? accent : c.success}
            tapLabel={t.timerTapToEdit}
          />
          <Text style={{ fontSize: 10, fontFamily: FONTS.semibold, color: c.textFaint, letterSpacing: 0.3 }}>
            TAP TO EDIT
          </Text>
        </View>
      </Animated.View>

      {/* Today's session stats */}
      {(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySessions = state.sessions.filter(
          s => s.type === 'focus' && s.completed && s.startTime?.startsWith(todayStr)
        );
        const sessionCount = todaySessions.length;
        const totalMins = todaySessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
        if (sessionCount === 0 && !running) return null;
        return (
          <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.todayStrip}>
            <View style={[styles.todayPill, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Ionicons name="checkmark-circle-outline" size={13} color={c.accent} />
              <Text style={[styles.todayPillTxt, { color: c.textMuted }]}>
                <Text style={{ color: c.text, fontFamily: FONTS.bold }}>{sessionCount}</Text>
                {' '}session{sessionCount !== 1 ? 's' : ''} today
              </Text>
            </View>
            <View style={[styles.todayPill, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Ionicons name="time-outline" size={13} color={c.accent} />
              <Text style={[styles.todayPillTxt, { color: c.textMuted }]}>
                <Text style={{ color: c.text, fontFamily: FONTS.bold }}>{totalMins}m</Text>
                {' '}studied
              </Text>
            </View>
            {sessionCount >= 4 && (
              <View style={[styles.todayPill, { backgroundColor: '#FFF7ED', borderColor: '#F97316' + '30' }]}>
                <Ionicons name="flame" size={13} color="#F97316" />
                <Text style={[styles.todayPillTxt, { color: '#F97316' }]}>On fire!</Text>
              </View>
            )}
          </Animated.View>
        );
      })()}

      <View style={{ height: Platform.OS === 'ios' ? 90 : 80 }} />

      {/* Subject Picker */}
      <SubjectPicker
        visible={showSubjectPicker}
        subjects={state.subjects}
        colors={c}
        onClose={() => setShowSubjectPicker(false)}
        onSelect={(subject, chapter, topic) => {
          setManualSubject(subject);
          setManualChapter(chapter);
          setManualTopic(topic ?? null);
          setShowSubjectPicker(false);
        }}
      />

      {/* Duration picker */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowPicker(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>{t.timerSetDuration}</Text>
            {[
              { label: t.timerFocusLabel, icon: 'timer-outline', val: customFocus, set: setCustomFocus, min: 5, max: 120, color: accent },
              { label: t.timerBreakLabel, icon: 'cafe-outline', val: customBreak, set: setCustomBreak, min: 1, max: 30, color: c.success },
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
              <Text style={styles.applyTxt}>{t.timerApply}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Session complete modal */}
      <Modal visible={showComplete} transparent animationType="fade" onRequestClose={() => setShowComplete(false)}>
        <View style={styles.completeBg}>
          <Animated.View entering={FadeInUp.springify()}
            style={[styles.completeCard, { backgroundColor: c.bgCard }]}>
            <Image
              source={require('@/assets/images/illus-clock.webp')}
              style={{ width: 110, height: 110 }}
              resizeMode="contain"
            />
            <Text style={[styles.completeTitle, { color: c.text }]}>{t.timerComplete}</Text>
            {effectiveTopicName && (
              <View style={[styles.completeBadge, { backgroundColor: (effectiveColor ?? c.accent) + '18' }]}>
                <Ionicons name="checkmark-circle" size={16} color={effectiveColor ?? c.accent} />
                <Text style={[styles.completeTopic, { color: effectiveColor ?? c.accent }]}>
                  {effectiveTopicName} marked as done ✓
                </Text>
              </View>
            )}
            <Text style={[styles.completeXp, { color: c.textMuted }]}>
              +{customFocus} XP earned
            </Text>
            <TouchableOpacity style={[styles.completeDoneBtn, { backgroundColor: accent }]}
              onPress={() => { setShowComplete(false); switchMode('break'); }}>
              <Text style={styles.completeDoneTxt}>{t.timerTakeBreak}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowComplete(false)}>
              <Text style={[styles.completeSkip, { color: c.textMuted }]}>{t.timerDismiss}</Text>
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
  changeSubjectBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noContextTxt: { fontSize: 14, fontFamily: FONTS.regular },
  selectSubjectBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  selectSubjectTxt: { fontSize: 13, fontFamily: FONTS.bold },
  modeRow: {
    flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4, marginTop: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3,
  },
  modeBtn: { paddingHorizontal: 28, paddingVertical: 11, borderRadius: 12 },
  modeTxt: { fontSize: 15, fontFamily: FONTS.bold },
  circleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 16 },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: FONTS.bold, marginBottom: 16 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pickerLabel: { fontSize: 15, fontFamily: FONTS.semibold },
  pickerCtrl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  adjBtn: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pickerVal: { fontSize: 20, fontFamily: FONTS.bold, minWidth: 46, textAlign: 'center' },
  applyBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  applyTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  completeBg: { flex: 1, backgroundColor: '#00000077', alignItems: 'center', justifyContent: 'center', padding: 32 },
  completeCard: { borderRadius: 28, padding: 32, alignItems: 'center', width: '100%', gap: 12 },
  completeTitle: { fontSize: 24, fontFamily: FONTS.bold },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  completeTopic: { fontSize: 14, fontFamily: FONTS.semibold },
  completeXp: { fontSize: 14, fontFamily: FONTS.medium },
  completeDoneBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: 4 },
  completeDoneTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  completeSkip: { fontSize: 13, fontFamily: FONTS.regular, marginTop: 4 },
  todayStrip: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap', paddingHorizontal: 20 },
  todayPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
  todayPillTxt: { fontSize: 12, fontFamily: FONTS.medium },
});