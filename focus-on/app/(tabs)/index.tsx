import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';
import type { ActiveTask } from '@/types/study';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: 'sunny' as const, color: '#FF9500' };
  if (h < 17) return { text: 'Good afternoon', icon: 'partly-sunny' as const, color: '#FFB347' };
  return { text: 'Good evening', icon: 'moon' as const, color: '#8C85FF' };
}

function StartButton({ onPress, color, darkColor }: { onPress: () => void; color: string; darkColor: string }) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.97 : 1, { duration: 80 }) }],
    shadowOpacity: withTiming(pressed.value ? 0.15 : 0.32, { duration: 80 }),
  }));
  return (
    <Animated.View style={[styles.startOuter, { backgroundColor: darkColor, shadowColor: color }, anim]}>
      <TouchableOpacity
        style={[styles.startInner, { backgroundColor: color }]}
        onPress={onPress} activeOpacity={1}
        onPressIn={() => { pressed.value = 1; }}
        onPressOut={() => { pressed.value = 0; }}
      >
        <Ionicons name="timer" size={26} color="#fff" />
        <Text style={styles.startTxt}>Start Focus</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Active Task Banner ────────────────────────────────────────────────────────
function ActiveTaskBanner({ task, onPress }: { task: ActiveTask; onPress: () => void }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1, true
    );
  }, []);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        style={[styles.activeBanner, { backgroundColor: task.subjectColor + '15', borderColor: task.subjectColor + '40' }]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        {/* Left accent bar */}
        <View style={[styles.bannerAccent, { backgroundColor: task.subjectColor }]} />

        <View style={[styles.bannerIcon, { backgroundColor: task.subjectColor + '20' }]}>
          <Ionicons name={task.subjectIcon as any} size={22} color={task.subjectColor} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.bannerTopRow}>
            <View style={[styles.liveDot, { backgroundColor: task.subjectColor }]} />
            <Text style={[styles.bannerLive, { color: task.subjectColor }]}>Study Time!</Text>
            <Text style={[styles.bannerTime, { color: task.subjectColor + 'AA' }]}>
              {task.startTime} – {task.endTime}
            </Text>
          </View>
          <Text style={[styles.bannerTopic, { color: '#1E1B4B' }]} numberOfLines={1}>
            {task.topicName}
          </Text>
          <Text style={[styles.bannerSubject, { color: task.subjectColor }]}>
            {task.subjectName} · {task.estimatedMinutes}m
          </Text>
        </View>

        <View style={[styles.bannerBtn, { backgroundColor: task.subjectColor }]}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { state, getTodayMinutes, getActiveNowTask } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();
  const greeting = getGreeting();

  const todayMin = getTodayMinutes();
  const goalMin = state.settings.dailyGoalMinutes;
  const progress = Math.min(todayMin / goalMin, 1);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = state.studyPlans
    .flatMap(p => p.tasks.filter(t => t.date === today))
    .slice(0, 5);

  // Active task — refreshes every 30s
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  useEffect(() => {
    const refresh = () => setActiveTask(getActiveNowTask());
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [getActiveNowTask]);

  const goToTimer = (task?: ActiveTask) => {
    if (task) {
      router.push({
        pathname: '/(tabs)/timer',
        params: {
          taskId: task.taskId,
          topicId: task.topicId,
          chapterId: task.chapterId,
          subjectId: task.subjectId,
          topicName: task.topicName,
          subjectName: task.subjectName,
          subjectColor: task.subjectColor,
          estimatedMinutes: String(task.estimatedMinutes),
        },
      });
    } else {
      router.push('/(tabs)/timer');
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
        <View>
          <View style={styles.greetingRow}>
            <Ionicons name={greeting.icon} size={16} color={greeting.color} />
            <Text style={[styles.greeting, { color: c.textMuted }]}> {greeting.text}</Text>
          </View>
          <Text style={[styles.appName, { color: c.text }]}>Focus On</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: '#FFF3E0' }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="flame" size={17} color="#E65100" />
            <Text style={[styles.streakNum, { color: '#E65100' }]}>{state.streak}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: c.accentSoft }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={20} color={c.accent} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Active Task Banner — shown when there's a task happening right now */}
      {activeTask && (
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <ActiveTaskBanner task={activeTask} onPress={() => goToTimer(activeTask)} />
        </Animated.View>
      )}

      {/* Daily goal */}
      <Animated.View entering={FadeInDown.delay(80).springify()}
        style={[styles.goalCard, { backgroundColor: c.bgCard }]}>
        <View style={styles.goalTop}>
          <View style={styles.goalLabelRow}>
            <Ionicons name="trophy" size={15} color={c.accent} />
            <Text style={[styles.goalLabel, { color: c.textMuted }]}> Today's Goal</Text>
          </View>
          <Text style={[styles.goalTime, { color: c.accent }]}>{todayMin}m / {goalMin}m</Text>
        </View>
        <View style={[styles.progBg, { backgroundColor: c.border }]}>
          <View style={[styles.progFill, {
            backgroundColor: progress >= 1 ? c.success : c.accent,
            width: `${Math.round(progress * 100)}%`,
          }]} />
        </View>
        {progress >= 1 && (
          <View style={styles.goalDoneRow}>
            <Ionicons name="checkmark-circle" size={15} color={c.success} />
            <Text style={[styles.goalDone, { color: c.success }]}> Goal complete!</Text>
          </View>
        )}
      </Animated.View>

      {/* Start button — if no active task show generic, else show task-specific */}
      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <StartButton
          onPress={() => goToTimer(activeTask ?? undefined)}
          color={activeTask ? activeTask.subjectColor : c.accent}
          darkColor={activeTask ? activeTask.subjectColor + 'CC' : c.accentDark}
        />
      </Animated.View>

      {/* Today's tasks */}
      {todayTasks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(240).springify()}
          style={[styles.tasksCard, { backgroundColor: c.bgCard }]}>
          <View style={styles.tasksTitleRow}>
            <Ionicons name="calendar" size={15} color={c.accent} />
            <Text style={[styles.tasksTitle, { color: c.text }]}> Today's Plan</Text>
          </View>
          {todayTasks.map((task, i) => {
            const subject = state.subjects.find(s => s.id === task.subjectId);
            const topic = subject?.chapters.flatMap(ch => ch.topics).find(t => t.id === task.topicId);
            const chapter = subject?.chapters.find(ch => ch.id === task.chapterId);
            const displayName = topic?.name ?? chapter?.name ?? 'Topic';
            const isActive = activeTask?.taskId === task.id;

            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskRow,
                  i < todayTasks.length - 1 && { borderBottomWidth: 1, borderColor: c.border },
                  isActive && { backgroundColor: c.accentSoft, borderRadius: 10, paddingHorizontal: 8 },
                ]}
                onPress={() => {
                  if (!task.completed && subject) {
                    router.push({
                      pathname: '/(tabs)/timer',
                      params: {
                        taskId: task.id,
                        topicId: task.topicId,
                        chapterId: task.chapterId,
                        subjectId: task.subjectId,
                        topicName: displayName,
                        subjectName: subject.name,
                        subjectColor: subject.color,
                        estimatedMinutes: String(task.estimatedMinutes),
                      },
                    });
                  }
                }}
                activeOpacity={task.completed ? 1 : 0.75}
              >
                <View style={[styles.taskDot, {
                  backgroundColor: task.completed ? c.success : isActive ? c.accent : c.border,
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskName, { color: task.completed ? c.textMuted : c.text },
                    task.completed && styles.done]} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={[styles.taskSub, { color: c.textFaint }]}>
                    {subject?.name}{task.startTime ? ` · ${task.startTime}` : ''}
                    {isActive ? ' · Now' : ''}
                  </Text>
                </View>
                {task.completed
                  ? <Ionicons name="checkmark-circle" size={18} color={c.success} />
                  : isActive
                    ? <Ionicons name="play-circle" size={20} color={c.accent} />
                    : <Text style={[styles.taskMins, { color: c.textFaint }]}>{task.estimatedMinutes}m</Text>
                }
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}

      {/* Empty plan state */}
      {todayTasks.length === 0 && (
        <Animated.View entering={FadeInDown.delay(240).springify()}
          style={[styles.emptyPlan, { backgroundColor: c.bgCard }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: c.accentSoft }]}>
            <Ionicons name="calendar-outline" size={34} color={c.accent} />
          </View>
          <Text style={[styles.emptyTxt, { color: c.textMuted }]}>No plan for today</Text>
          <TouchableOpacity style={[styles.planBtn, { backgroundColor: c.accentSoft }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <Text style={[styles.planBtnTxt, { color: c.accent }]}>Create a plan</Text>
            <Ionicons name="arrow-forward" size={14} color={c.accent} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 64 : 52, paddingBottom: 32, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 4 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  greeting: { fontSize: 14, fontFamily: FONTS.medium },
  appName: { fontSize: 30, fontFamily: FONTS.bold, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  streakNum: { fontSize: 16, fontFamily: FONTS.bold },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  // Active task banner
  activeBanner: {
    borderRadius: RADIUS.xl, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingRight: 14, overflow: 'hidden',
  },
  bannerAccent: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  bannerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  bannerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  bannerLive: { fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerTime: { fontSize: 11, fontFamily: FONTS.regular },
  bannerTopic: { fontSize: 15, fontFamily: FONTS.bold, marginBottom: 1 },
  bannerSubject: { fontSize: 12, fontFamily: FONTS.medium },
  bannerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  // Goal card
  goalCard: { borderRadius: RADIUS.xl, padding: 18 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalLabelRow: { flexDirection: 'row', alignItems: 'center' },
  goalLabel: { fontSize: 14, fontFamily: FONTS.semibold },
  goalTime: { fontSize: 14, fontFamily: FONTS.bold },
  progBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 5 },
  goalDoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  goalDone: { fontSize: 13, fontFamily: FONTS.semibold },
  // Start button
  startOuter: { borderRadius: 20, paddingBottom: 5, shadowOffset: { width: 0, height: 5 }, shadowRadius: 14, elevation: 8 },
  startInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 16 },
  startTxt: { color: '#fff', fontSize: 20, fontFamily: FONTS.bold, letterSpacing: 0.2 },
  // Tasks card
  tasksCard: { borderRadius: RADIUS.xl, padding: 18 },
  tasksTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tasksTitle: { fontSize: 16, fontFamily: FONTS.bold },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  taskDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  taskName: { fontSize: 14, fontFamily: FONTS.semibold },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskSub: { fontSize: 11, marginTop: 2, fontFamily: FONTS.regular },
  taskMins: { fontSize: 12, fontFamily: FONTS.semibold },
  // Empty state
  emptyPlan: { borderRadius: RADIUS.xl, padding: 28, alignItems: 'center', gap: 12 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTxt: { fontSize: 14, fontFamily: FONTS.medium },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  planBtnTxt: { fontSize: 14, fontFamily: FONTS.bold },
});
