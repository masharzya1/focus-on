import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';

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

export default function HomeScreen() {
  const { state, getTodayMinutes } = useStudy();
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
          {/* Streak */}
          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: '#FFF3E0' }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="flame" size={17} color="#E65100" />
            <Text style={[styles.streakNum, { color: '#E65100' }]}>{state.streak}</Text>
          </TouchableOpacity>
          {/* Avatar */}
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: c.accentSoft }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={20} color={c.accent} />
          </TouchableOpacity>
        </View>
      </Animated.View>

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

      {/* Start button */}
      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <StartButton onPress={() => router.push('/(tabs)/timer')} color={c.accent} darkColor={c.accentDark} />
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
            return (
              <View key={task.id}
                style={[styles.taskRow, i < todayTasks.length - 1 && { borderBottomWidth: 1, borderColor: c.border }]}>
                <View style={[styles.taskDot, { backgroundColor: task.completed ? c.success : c.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskName, { color: task.completed ? c.textMuted : c.text },
                    task.completed && styles.done]} numberOfLines={1}>
                    {topic?.name || 'Topic'}
                  </Text>
                  <Text style={[styles.taskSub, { color: c.textFaint }]}>
                    {subject?.name}{task.startTime ? ` · ${task.startTime}` : ''}
                  </Text>
                </View>
                {task.completed
                  ? <Ionicons name="checkmark-circle" size={18} color={c.success} />
                  : <Text style={[styles.taskMins, { color: c.textFaint }]}>{task.estimatedMinutes}m</Text>
                }
              </View>
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
  appName: { fontSize: 30, fontFamily: FONTS.black, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  streakNum: { fontSize: 16, fontFamily: FONTS.black },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  goalCard: { borderRadius: RADIUS.xl, padding: 18 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalLabelRow: { flexDirection: 'row', alignItems: 'center' },
  goalLabel: { fontSize: 14, fontFamily: FONTS.semibold },
  goalTime: { fontSize: 14, fontFamily: FONTS.black },
  progBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 5 },
  goalDoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  goalDone: { fontSize: 13, fontFamily: FONTS.semibold },
  startOuter: { borderRadius: 20, paddingBottom: 5, shadowOffset: { width: 0, height: 5 }, shadowRadius: 14, elevation: 8 },
  startInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 16 },
  startTxt: { color: '#fff', fontSize: 20, fontFamily: FONTS.black, letterSpacing: 0.2 },
  tasksCard: { borderRadius: RADIUS.xl, padding: 18 },
  tasksTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tasksTitle: { fontSize: 16, fontFamily: FONTS.bold },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  taskDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  taskName: { fontSize: 14, fontFamily: FONTS.semibold },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskSub: { fontSize: 11, marginTop: 2, fontFamily: FONTS.regular },
  taskMins: { fontSize: 12, fontFamily: FONTS.semibold },
  emptyPlan: { borderRadius: RADIUS.xl, padding: 28, alignItems: 'center', gap: 12 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTxt: { fontSize: 14, fontFamily: FONTS.medium },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  planBtnTxt: { fontSize: 14, fontFamily: FONTS.bold },
});
