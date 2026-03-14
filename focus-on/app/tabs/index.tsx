import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: 'sunny' as const, color: '#F59E0B' };
  if (h < 17) return { text: 'Good afternoon', icon: 'partly-sunny' as const, color: '#F97316' };
  return { text: 'Good evening', icon: 'moon' as const, color: '#6C63FF' };
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
        <Text style={[styles.startTxt, { fontFamily: 'Inter_800ExtraBold' }]}>Start Focus</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { state, getTodayMinutes } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const todayMin = getTodayMinutes();
  const goalMin = state.settings.dailyGoalMinutes;
  const progress = Math.min(todayMin / goalMin, 1);
  const greeting = getGreeting();

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
            <Text style={[styles.greeting, { color: c.textMuted, fontFamily: 'Inter_500Medium' }]}>
              {greeting.text}
            </Text>
          </View>
          <Text style={[styles.appName, { color: c.text, fontFamily: 'Inter_800ExtraBold' }]}>
            Focus On
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: '#FFF3E0' }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="flame" size={18} color="#E65100" />
            <Text style={[styles.streakNum, { color: '#E65100', fontFamily: 'Inter_800ExtraBold' }]}>
              {state.streak}
            </Text>
          </TouchableOpacity>
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
          <Text style={[styles.goalLabel, { color: c.textMuted, fontFamily: 'Inter_600SemiBold' }]}>
            Today's Goal
          </Text>
          <Text style={[styles.goalTime, { color: c.accent, fontFamily: 'Inter_800ExtraBold' }]}>
            {todayMin}m / {goalMin}m
          </Text>
        </View>
        <View style={[styles.progBg, { backgroundColor: c.border }]}>
          <Animated.View style={[styles.progFill, {
            backgroundColor: progress >= 1 ? c.success : c.accent,
            width: `${Math.round(progress * 100)}%`,
          }]} />
        </View>
        {progress >= 1 && (
          <View style={styles.goalDoneRow}>
            <Ionicons name="checkmark-circle" size={16} color={c.success} />
            <Text style={[styles.goalDone, { color: c.success, fontFamily: 'Inter_600SemiBold' }]}>
              Goal complete!
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Start button */}
      <Animated.View entering={FadeInDown.delay(160).springify()} style={{ marginBottom: 4 }}>
        <StartButton onPress={() => router.push('/(tabs)/timer')} color={c.accent} darkColor={c.accentDark} />
      </Animated.View>

      {/* Today tasks */}
      {todayTasks.length > 0 && (
        <Animated.View entering={FadeInDown.delay(240).springify()}
          style={[styles.tasksCard, { backgroundColor: c.bgCard }]}>
          <Text style={[styles.tasksTitle, { color: c.text, fontFamily: 'Inter_700Bold' }]}>
            Today's Plan
          </Text>
          {todayTasks.map((task, i) => {
            const subject = state.subjects.find(s => s.id === task.subjectId);
            const topic = subject?.chapters.flatMap(ch => ch.topics).find(t => t.id === task.topicId);
            return (
              <View key={task.id}
                style={[styles.taskRow, i < todayTasks.length - 1 && { borderBottomWidth: 1, borderColor: c.border }]}>
                <View style={[styles.taskDot, { backgroundColor: task.completed ? c.success : c.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskName, { color: task.completed ? c.textMuted : c.text, fontFamily: 'Inter_600SemiBold' },
                    task.completed && styles.done]} numberOfLines={1}>
                    {topic?.name || 'Topic'}
                  </Text>
                  <Text style={[styles.taskSub, { color: c.textFaint, fontFamily: 'Inter_400Regular' }]}>
                    {subject?.name}{task.startTime ? ` · ${task.startTime}` : ''}
                  </Text>
                </View>
                {task.completed
                  ? <Ionicons name="checkmark-circle" size={18} color={c.success} />
                  : <Text style={[styles.taskMins, { color: c.textFaint, fontFamily: 'Inter_600SemiBold' }]}>
                      {task.estimatedMinutes}m
                    </Text>
                }
              </View>
            );
          })}
        </Animated.View>
      )}

      {/* Empty state */}
      {todayTasks.length === 0 && (
        <Animated.View entering={FadeInDown.delay(240).springify()}
          style={[styles.emptyPlan, { backgroundColor: c.bgCard }]}>
          <Ionicons name="calendar-outline" size={48} color={c.textFaint} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTxt, { color: c.textMuted, fontFamily: 'Inter_500Medium' }]}>
            No plan for today
          </Text>
          <TouchableOpacity style={[styles.planBtn, { backgroundColor: c.accentSoft }]}
            onPress={() => router.push('/(tabs)/plan')}>
            <Text style={[styles.planBtnTxt, { color: c.accent, fontFamily: 'Inter_700Bold' }]}>
              Create a plan →
            </Text>
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
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 14 },
  appName: { fontSize: 30, letterSpacing: -1 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  streakNum: { fontSize: 16 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  goalCard: { borderRadius: RADIUS.xl, padding: 18 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalLabel: { fontSize: 14 },
  goalTime: { fontSize: 14 },
  progBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 5 },
  goalDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  goalDone: { fontSize: 13 },
  startOuter: { borderRadius: 20, paddingBottom: 5, shadowOffset: { width: 0, height: 5 }, shadowRadius: 14, elevation: 8 },
  startInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 16 },
  startTxt: { color: '#fff', fontSize: 20, letterSpacing: 0.2 },
  tasksCard: { borderRadius: RADIUS.xl, padding: 18 },
  tasksTitle: { fontSize: 16, marginBottom: 14 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  taskDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  taskName: { fontSize: 14 },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskSub: { fontSize: 11, marginTop: 2 },
  taskMins: { fontSize: 12 },
  emptyPlan: { borderRadius: RADIUS.xl, padding: 28, alignItems: 'center' },
  emptyTxt: { fontSize: 14, marginBottom: 14 },
  planBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  planBtnTxt: { fontSize: 14 },
});
