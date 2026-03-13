import React, { useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay,
  FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function xpForLevel(l: number) { return l * 100; }
function getLevelProgress(xp: number) {
  let remaining = xp, lvl = 1;
  while (remaining >= xpForLevel(lvl)) { remaining -= xpForLevel(lvl); lvl++; }
  return { lvl, earned: remaining, total: xpForLevel(lvl) };
}

// ─── Duo-style 3D button ──────────────────────────────────────────────────────
function DuoButton({
  label, icon, onPress, color, darkColor, textColor = '#fff', secondary = false,
}: {
  label: string; icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void; color: string; darkColor: string;
  textColor?: string; secondary?: boolean;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  function onPressIn() {
    scale.value = withTiming(0.97, { duration: 80 });
    translateY.value = withTiming(4, { duration: 80 });
  }
  function onPressOut() {
    scale.value = withSpring(1, { damping: 12 });
    translateY.value = withSpring(0, { damping: 12 });
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <View style={[styles.btnOuter, { backgroundColor: darkColor }]}>
        <Animated.View style={[styles.btnInner, { backgroundColor: color }, animStyle]}>
          {icon && <Ionicons name={icon} size={18} color={textColor} />}
          <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Animated progress bar ────────────────────────────────────────────────────
function AnimatedBar({ progress, color, height = 8 }: { progress: number; color: string; height?: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(300, withTiming(progress, { duration: 800 }));
  }, [progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  return (
    <View style={[styles.barBg, { height }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: color, height, borderRadius: height / 2 }, barStyle]} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { state, getTodayMinutes, getStreak } = useStudy();
  const { colors } = useTheme();

  const todayMin = getTodayMinutes();
  const streak = getStreak();
  const goal = state.settings.dailyGoalMinutes;
  const progress = Math.min(100, Math.round((todayMin / goal) * 100));
  const { lvl, earned, total } = getLevelProgress(state.xp);

  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);
  const allTopics = state.subjects.flatMap(s => s.chapters.flatMap(c => c.topics));
  const completedTopics = allTopics.filter(t => t.completed).length;

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = state.studyPlans.flatMap(p =>
    p.tasks.filter(t => t.date === today).map(t => ({ ...t, examName: p.examName }))
  );

  const nextExam = useMemo(() => {
    const upcoming = state.studyPlans
      .filter(p => new Date(p.examDate) >= new Date())
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    if (!upcoming.length) return null;
    const days = Math.ceil((new Date(upcoming[0].examDate).getTime() - Date.now()) / 86400000);
    return { name: upcoming[0].examName, days };
  }, [state.studyPlans]);

  const weekData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const mins = state.sessions.filter(s => s.completed && s.startTime.startsWith(key)).reduce((a, s) => a + s.durationMinutes, 0);
    return { day: ['S','M','T','W','T','F','S'][d.getDay()], mins, isToday: i === 6 };
  }), [state.sessions]);
  const maxMins = Math.max(...weekData.map(d => d.mins), 1);

  const c = colors;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={[styles.header]}>
        <View>
          <Text style={[styles.greeting, { color: c.textMuted }]}>{getGreeting()} 👋</Text>
          <Text style={[styles.appName, { color: c.text }]}>Focus On</Text>
        </View>
        <TouchableOpacity
          style={[styles.streakBadge, { backgroundColor: c.bgCard, borderColor: c.border }]}
          onPress={() => router.push('/(tabs)/analytics')}
        >
          <Ionicons name="flame" size={20} color={c.streakColor} />
          <Text style={[styles.streakNum, { color: c.text }]}>{streak}</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.body}>

        {/* ── XP Row ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={[styles.xpRow, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={[styles.xpIconBox, { backgroundColor: c.xpColor + '20' }]}>
            <Ionicons name="star" size={16} color={c.xpColor} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.xpMeta}>
              <Text style={[styles.xpLabel, { color: c.text }]}>Level {lvl}</Text>
              <Text style={[styles.xpSub, { color: c.textMuted }]}>{earned} / {total} XP</Text>
            </View>
            <AnimatedBar progress={(earned / total) * 100} color={c.xpColor} height={6} />
          </View>
        </Animated.View>

        {/* ── Daily Progress Card ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: c.text }]}>Daily Goal</Text>
              <Text style={[styles.cardSub, { color: c.textMuted }]}>
                {todayMin}m of {goal}m studied
              </Text>
            </View>
            <View style={[styles.progressBadge, {
              backgroundColor: progress >= 100 ? c.success + '20' : c.accentSoft,
            }]}>
              <Text style={[styles.progressPct, {
                color: progress >= 100 ? c.success : c.accent,
              }]}>{progress}%</Text>
            </View>
          </View>
          <AnimatedBar progress={progress} color={progress >= 100 ? c.success : c.accent} height={10} />

          <View style={styles.actionRow}>
            <DuoButton
              label="Start Focus"
              icon="play"
              onPress={() => router.push('/(tabs)/timer')}
              color={c.accent}
              darkColor={c.accentDark}
            />
            {nextExam && (
              <TouchableOpacity
                style={[styles.examBtn, { backgroundColor: c.accentSoft, borderColor: c.border }]}
                onPress={() => router.push('/(tabs)/calendar')}
              >
                <Ionicons name="calendar" size={14} color={c.accent} />
                <Text style={[styles.examBtnText, { color: c.accent }]}>{nextExam.days}d left</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Stats Row ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.statsRow}>
          {[
            { label: 'Today', value: `${todayMin}m`, icon: 'time-outline' as const, color: c.accent },
            { label: 'Streak', value: `${streak}d`, icon: 'flame' as const, color: c.streakColor },
            { label: 'Topics', value: `${completedTopics}/${allTopics.length}`, icon: 'checkmark-circle' as const, color: c.success },
            { label: 'Level', value: `${lvl}`, icon: 'star' as const, color: c.xpColor },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <View style={[styles.statIconBox, { backgroundColor: stat.color + '18' }]}>
                <Ionicons name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: c.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Quote Card ── */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={[styles.quoteCard, { backgroundColor: c.accentSoft, borderColor: c.border }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={c.accent} style={{ marginBottom: 6 }} />
          <Text style={[styles.quoteText, { color: c.text }]}>{quote.text}</Text>
          <Text style={[styles.quoteAuthor, { color: c.accent }]}>— {quote.author}</Text>
        </Animated.View>

        {/* ── Today's Tasks ── */}
        {todayTasks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Today's Tasks</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/plan')}>
                <Text style={[styles.sectionLink, { color: c.accent }]}>View plan →</Text>
              </TouchableOpacity>
            </View>
            {todayTasks.slice(0, 5).map(task => {
              let topicName = '';
              for (const sub of state.subjects) for (const ch of sub.chapters) {
                const tp = ch.topics.find(t => t.id === task.topicId);
                if (tp) { topicName = tp.name; break; }
              }
              const sub = state.subjects.find(s => s.id === task.subjectId);
              return (
                <View key={task.id} style={[styles.taskRow, { borderBottomColor: c.border }]}>
                  <View style={[styles.taskDot, { backgroundColor: sub?.color || c.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskName, { color: c.text }]} numberOfLines={1}>{topicName || 'Topic'}</Text>
                    <Text style={[styles.taskSub, { color: c.textMuted }]}>{task.examName} · {task.estimatedMinutes}m</Text>
                  </View>
                  {task.completed && (
                    <View style={[styles.doneCheck, { backgroundColor: c.success }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* ── This Week Chart ── */}
        <Animated.View entering={FadeInDown.delay(360).duration(400)} style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>This Week</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')}>
              <Text style={[styles.sectionLink, { color: c.accent }]}>Details →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartRow}>
            {weekData.map((d, i) => (
              <View key={i} style={styles.chartCol}>
                <View style={styles.barWrap}>
                  <View style={[styles.chartBar, {
                    height: Math.max(4, (d.mins / maxMins) * 64),
                    backgroundColor: d.isToday ? c.accent : d.mins > 0 ? c.accentSoft : c.border,
                    borderRadius: 6,
                  }]} />
                </View>
                <Text style={[styles.barDay, { color: d.isToday ? c.accent : c.textMuted }, d.isToday && { fontWeight: '700' }]}>{d.day}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Recent Sessions ── */}
        {state.sessions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(420).duration(400)} style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Sessions</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')}>
                <Text style={[styles.sectionLink, { color: c.accent }]}>View all →</Text>
              </TouchableOpacity>
            </View>
            {[...state.sessions].reverse().slice(0, 4).map(session => {
              const sub = state.subjects.find(s => s.id === session.subjectId);
              const mins = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000);
              const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : `${Math.floor(mins/1440)}d ago`;
              return (
                <View key={session.id} style={[styles.sessionRow, { borderBottomColor: c.border }]}>
                  <View style={[styles.sessionIcon, { backgroundColor: (sub?.color || c.accent) + '20' }]}>
                    <Ionicons name="book-outline" size={14} color={sub?.color || c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionName, { color: c.text }]}>{sub?.name || 'Session'}</Text>
                    <Text style={[styles.sessionSub, { color: c.textMuted }]}>{session.durationMinutes}m · {session.type}</Text>
                  </View>
                  <Text style={[styles.sessionTime, { color: c.textFaint }]}>{timeAgo}</Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        <View style={{ height: 28 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  greeting:  { fontSize: 13, fontWeight: '500' },
  appName:   { fontSize: 28, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  streakNum: { fontSize: 16, fontWeight: '800' },
  body: { paddingHorizontal: 16 },

  xpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: RADIUS.lg, borderWidth: 1,
    marginBottom: 12,
  },
  xpIconBox: { width: 34, height: 34, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  xpMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { fontSize: 13, fontWeight: '700' },
  xpSub: { fontSize: 11 },

  card: {
    borderRadius: RADIUS.xl, padding: 18, marginBottom: 12,
    borderWidth: 1,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 2 },
  progressBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  progressPct: { fontSize: 14, fontWeight: '800' },

  barBg: { backgroundColor: '#E4E2FF', borderRadius: 4, overflow: 'hidden', width: '100%' },
  barFill: { borderRadius: 4 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  btnOuter: { borderRadius: RADIUS.lg, paddingBottom: 4 },
  btnInner: {
    borderRadius: RADIUS.lg, paddingVertical: 12, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  btnText: { fontSize: 15, fontWeight: '800' },
  examBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADIUS.lg, borderWidth: 1,
  },
  examBtnText: { fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, borderRadius: RADIUS.xl, padding: 12,
    alignItems: 'center', borderWidth: 1, gap: 4,
  },
  statIconBox: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600' },

  quoteCard: { borderRadius: RADIUS.xl, padding: 18, marginBottom: 12, borderWidth: 1 },
  quoteText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  quoteAuthor: { fontSize: 12, fontWeight: '600', marginTop: 8 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionLink: { fontSize: 12, fontWeight: '600' },

  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  taskDot: { width: 10, height: 10, borderRadius: 5 },
  taskName: { fontSize: 13, fontWeight: '600' },
  taskSub: { fontSize: 11, marginTop: 1 },
  doneCheck: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
  chartCol: { flex: 1, alignItems: 'center' },
  barWrap: { height: 64, justifyContent: 'flex-end', alignItems: 'center', width: '80%' },
  chartBar: { width: '100%' },
  barDay: { fontSize: 10, marginTop: 5 },

  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  sessionIcon: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sessionName: { fontSize: 13, fontWeight: '600' },
  sessionSub: { fontSize: 11, marginTop: 1 },
  sessionTime: { fontSize: 11 },
});
