import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useStudy } from "@/contexts/StudyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { RADIUS, FONTS, SOFT_COLORS } from "@/constants/theme";
import type { ActiveTask, PlannedTask } from "@/types/study";
import {
  scheduleTaskNotifications,
  cancelAllNotifications,
  setupAndroidChannel,
  scheduleAllTaskNotifications,
} from "@/services/notifications";
import { useT } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

function getGreetingInfo() {
  const h = new Date().getHours();
  if (h < 12)
    return {
      key: "greetMorning" as const,
      icon: "sunny" as const,
      color: "#FF8C42",
      label: "Morning",
    };
  if (h < 17)
    return {
      key: "greetAfternoon" as const,
      icon: "partly-sunny" as const,
      color: "#FFCB47",
      label: "Afternoon",
    };
  return {
    key: "greetEvening" as const,
    icon: "moon" as const,
    color: "#9B90FF",
    label: "Evening",
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function to12h(h: number, m: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${ampm}`;
}

const PASTEL_CYCLE = [
  SOFT_COLORS.lavender,
  SOFT_COLORS.mint,
  SOFT_COLORS.peach,
  SOFT_COLORS.rose,
  SOFT_COLORS.sky,
  SOFT_COLORS.amber,
];
function pastelFor(i: number) {
  return PASTEL_CYCLE[i % PASTEL_CYCLE.length];
}

// ── Start Focus Button ─────────────────────────────────────────────────────────
function StartButton({
  onPress,
  color,
  label,
}: {
  onPress: () => void;
  color: string;
  label?: string;
}) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(pressed.value ? 0.97 : 1, { duration: 80 }) },
    ],
    shadowOpacity: withTiming(pressed.value ? 0.18 : 0.38, { duration: 80 }),
  }));
  return (
    <Animated.View
      style={[
        S.startOuter,
        { backgroundColor: color, shadowColor: color },
        anim,
      ]}
    >
      <TouchableOpacity
        style={S.startInner}
        onPress={onPress}
        activeOpacity={1}
        onPressIn={() => {
          pressed.value = 1;
        }}
        onPressOut={() => {
          pressed.value = 0;
        }}
      >
        <View style={S.startIconCircle}>
          <Ionicons name="play" size={18} color={color} />
        </View>
        <Text style={S.startTxt}>{label ?? "Start Focus"}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Active Task Banner ─────────────────────────────────────────────────────────
function ActiveTaskBanner({
  task,
  onPress,
  t,
}: {
  task: ActiveTask;
  onPress: () => void;
  t: any;
}) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        style={[
          S.activeBanner,
          {
            backgroundColor: task.subjectColor + "10",
            borderColor: task.subjectColor + "30",
          },
        ]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <View
          style={[S.bannerAccent, { backgroundColor: task.subjectColor }]}
        />
        <View
          style={[S.bannerIcon, { backgroundColor: task.subjectColor + "18" }]}
        >
          <Ionicons
            name={task.subjectIcon as any}
            size={20}
            color={task.subjectColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginBottom: 3,
            }}
          >
            <View style={[S.liveDot, { backgroundColor: task.subjectColor }]} />
            <Text style={[S.bannerLive, { color: task.subjectColor }]}>
              {task.startTime ? t.homeStudyTime : t.homeUpNext}
            </Text>
            {!!task.startTime && !!task.endTime && (
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: FONTS.regular,
                  color: task.subjectColor + "AA",
                }}
              >
                {task.startTime} – {task.endTime}
              </Text>
            )}
          </View>
          <Text style={[S.bannerTopic, { color: "#111318" }]} numberOfLines={1}>
            {task.topicName}
          </Text>
          <Text style={[S.bannerSubject, { color: task.subjectColor }]}>
            {task.subjectName}
          </Text>
        </View>
        <View style={[S.bannerBtn, { backgroundColor: task.subjectColor }]}>
          <Ionicons name="play" size={14} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Morning Routine Modal ─────────────────────────────────────────────────────
function TimeStepper({
  h, m, onMinus, onPlus, onToggleAmPm, color, bgColor,
}: {
  h: number; m: number;
  onMinus: () => void; onPlus: () => void;
  onToggleAmPm: () => void;
  color: string; bgColor: string;
}) {
  const isAM = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const timeStr = `${h12}:${String(m).padStart(2, "0")}`;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <TouchableOpacity
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: bgColor, alignItems: "center", justifyContent: "center" }}
        onPress={onMinus}
      >
        <Ionicons name="remove" size={13} color={color} />
      </TouchableOpacity>
      <View style={{ backgroundColor: color + "18", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, minWidth: 48, alignItems: "center" }}>
        <Text style={{ fontSize: 13, fontFamily: FONTS.bold, color }}>{timeStr}</Text>
      </View>
      <TouchableOpacity
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
        style={{ backgroundColor: color + "22", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5, minWidth: 34, alignItems: "center" }}
        onPress={onToggleAmPm}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 11, fontFamily: FONTS.bold, color }}>{isAM ? "AM" : "PM"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: bgColor, alignItems: "center", justifyContent: "center" }}
        onPress={onPlus}
      >
        <Ionicons name="add" size={13} color={color} />
      </TouchableOpacity>
    </View>
  );
}

function MorningRoutineModal({
  visible,
  tasks,
  subjects,
  onSave,
  onClose,
  colors: c,
  t,
}: {
  visible: boolean;
  tasks: PlannedTask[];
  subjects: ReturnType<typeof useStudy>["state"]["subjects"];
  onSave: (
    updated: { id: string; startTime: string; endTime: string; estimatedMinutes: number }[],
  ) => void;
  onClose: () => void;
  colors: any;
  t: any;
}) {
  const [times, setTimes] = useState<
    Record<string, { sh: number; sm: number; eh: number; em: number }>
  >({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    let curH = 8, curM = 0;
    const init: Record<string, { sh: number; sm: number; eh: number; em: number }> = {};
    for (const task of tasks) {
      if (task.startTime && task.endTime) {
        const [sh, sm] = task.startTime.split(":").map(Number);
        const [eh, em] = task.endTime.split(":").map(Number);
        init[task.id] = { sh, sm, eh, em };
        curH = eh; curM = em;
      } else {
        const endMins = curH * 60 + curM + 60;
        const eh = Math.floor(endMins / 60) % 24;
        const em = endMins % 60;
        init[task.id] = { sh: curH % 24, sm: curM, eh, em };
        curH = Math.floor(endMins / 60); curM = em;
      }
    }
    setTimes(init);
  }, [visible]); // Only depends on visible — NOT tasks (prevents reset on re-render)

  const adjust = (taskId: string, field: "start" | "end", dMin: number) => {
    setTimes((prev) => {
      const cur = prev[taskId] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
      const next = { ...prev };
      if (field === "start") {
        let startTotal = cur.sh * 60 + cur.sm + dMin;
        startTotal = ((startTotal % 1440) + 1440) % 1440; // wrap around 24h
        const duration = Math.max(15, (cur.eh * 60 + cur.em) - (cur.sh * 60 + cur.sm));
        const endTotal = (startTotal + duration) % 1440;
        next[taskId] = {
          sh: Math.floor(startTotal / 60),
          sm: startTotal % 60,
          eh: Math.floor(endTotal / 60),
          em: endTotal % 60,
        };
      } else {
        let endTotal = cur.eh * 60 + cur.em + dMin;
        const minEnd = cur.sh * 60 + cur.sm + 15;
        if (endTotal < minEnd) endTotal = minEnd;
        endTotal = endTotal % 1440; // allow crossing midnight
        next[taskId] = { ...cur, eh: Math.floor(endTotal / 60), em: endTotal % 60 };
      }
      return next;
    });
  };

  const toggleAmPm = (taskId: string, field: "start" | "end") => {
    setTimes((prev) => {
      const cur = prev[taskId] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
      const next = { ...prev };
      if (field === "start") {
        const flipped = cur.sh < 12 ? cur.sh + 12 : cur.sh - 12;
        next[taskId] = { ...cur, sh: flipped };
      } else {
        const flipped = cur.eh < 12 ? cur.eh + 12 : cur.eh - 12;
        next[taskId] = { ...cur, eh: flipped };
      }
      return next;
    });
  };

  const getDisplayName = (task: PlannedTask) => {
    const subject = subjects.find((s) => s.id === task.subjectId);
    if (!subject) return "Task";
    const chapter = subject.chapters.find((ch) => ch.id === task.chapterId);
    if (!chapter || chapter.topics.length === 0) return chapter?.name ?? "Chapter";
    const topic = chapter.topics.find((tp) => tp.id === task.topicId);
    return topic?.name ?? chapter.name;
  };

  const handleSave = () => {
    const updated = tasks.map((task) => {
      const tm = times[task.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
      const startTotal = tm.sh * 60 + tm.sm;
      const endTotal = tm.eh * 60 + tm.em;
      const durationMins = endTotal >= startTotal
        ? endTotal - startTotal
        : 1440 - startTotal + endTotal; // crossed midnight
      return {
        id: task.id,
        startTime: `${pad(tm.sh)}:${pad(tm.sm)}`,
        endTime: `${pad(tm.eh)}:${pad(tm.em)}`,
        estimatedMinutes: Math.max(15, durationMins),
      };
    });
    onSave(updated);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={S.modalBg} onPress={onClose}>
          <Pressable
            style={[S.sheet, { backgroundColor: c.bgCard }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[S.handle, { backgroundColor: c.border }]} />
            <View style={S.sheetHeaderRow}>
              <View style={[S.routineIconCircle, { backgroundColor: "#FFF0E6" }]}>
                <Ionicons name="sunny" size={22} color="#FF8C42" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.sheetTitle, { color: c.text }]}>
                  {t.homeRoutineModalTitle}
                </Text>
                <Text style={[S.sheetSub, { color: c.textMuted }]}>
                  {t.homeRoutineModalSub}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", paddingHorizontal: 4, marginBottom: 8 }}>
              <Text style={[S.colLabel, { color: c.textFaint }]}>
                {t.homeRoutineColTopic}
              </Text>
              <Text style={[S.colLabel, { color: c.textFaint, textAlign: "right" }]}>
                Start → End
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {tasks.map((task, i) => {
                const tm = times[task.id] ?? { sh: 8, sm: 0, eh: 9, em: 0 };
                const subject = subjects.find((s) => s.id === task.subjectId);
                const displayName = getDisplayName(task);
                const color = subject?.color ?? c.accent;
                const durationMins = (() => {
                  const s = tm.sh * 60 + tm.sm;
                  const e = tm.eh * 60 + tm.em;
                  return e >= s ? e - s : 1440 - s + e;
                })();
                return (
                  <View
                    key={task.id}
                    style={[
                      S.routineTaskRow,
                      { borderTopColor: c.border, borderTopWidth: i > 0 ? 1 : 0 },
                    ]}
                  >
                    <View style={{ marginBottom: 8 }}>
                      <Text style={[S.routineTaskName, { color: c.text }]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {subject && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                            <Text style={[S.routineTaskSub, { color: c.textFaint }]}>{subject.name}</Text>
                          </View>
                        )}
                        <Text style={{ fontSize: 11, fontFamily: FONTS.regular, color: c.textFaint }}>
                          · {durationMins}min
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <TimeStepper
                        h={tm.sh} m={tm.sm}
                        onMinus={() => adjust(task.id, "start", -15)}
                        onPlus={() => adjust(task.id, "start", 15)}
                        onToggleAmPm={() => toggleAmPm(task.id, "start")}
                        color={color}
                        bgColor={c.bgSecondary}
                      />
                      <Text style={{ color: c.textFaint, fontSize: 12 }}>→</Text>
                      <TimeStepper
                        h={tm.eh} m={tm.em}
                        onMinus={() => adjust(task.id, "end", -15)}
                        onPlus={() => adjust(task.id, "end", 15)}
                        onToggleAmPm={() => toggleAmPm(task.id, "end")}
                        color={color}
                        bgColor={c.bgSecondary}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[S.saveBtn, { backgroundColor: c.accent, marginTop: 16 }]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={[S.saveTxt, { color: "#fff" }]}>{t.homeRoutineSetBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text style={{ color: c.textMuted, fontFamily: FONTS.regular, fontSize: 14 }}>
                {t.homeRoutineNoSchedule}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const {
    state,
    getTodayMinutes,
    getActiveNowTask,
    rescheduleMissedTasks,
    updateStudyPlan,
    addBlockRoutine,
    updateBlockRoutine,
    deleteBlockRoutine,
  } = useStudy();
  const t = useT();
  const { colors: c } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const greetInfo = getGreetingInfo();
  const firstName = user?.displayName
    ? user.displayName.split(" ")[0]
    : "Champion";
  const todayMin = getTodayMinutes();
  const goalMin = state.settings.dailyGoalMinutes;
  const progress = Math.min(todayMin / goalMin, 1);
  const today = new Date().toISOString().split("T")[0];

  const todayTasks = state.studyPlans
    .flatMap((p) => p.tasks.filter((tk) => tk.date === today))
    .slice(0, 6);

  const examDayPlans = state.studyPlans.filter(
    (p) =>
      Math.ceil((new Date(p.examDate).getTime() - Date.now()) / 86400000) <= 0,
  );
  const examSoonPlans = state.studyPlans.filter(
    (p) =>
      Math.ceil((new Date(p.examDate).getTime() - Date.now()) / 86400000) === 1,
  );
  const missedCount = state.studyPlans
    .flatMap((p) => p.tasks)
    .filter((tk) => !tk.completed && tk.date < today).length;

  const unscheduledTasks = state.studyPlans.flatMap((p) =>
    p.tasks.filter((tk) => tk.date === today && !tk.completed && !tk.startTime),
  );
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const needsRoutine = unscheduledTasks.length > 0;
  const [showRoutine, setShowRoutine] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const refresh = () => setActiveTask(getActiveNowTask());
      refresh();
      const interval = setInterval(refresh, 30_000);
      return () => clearInterval(interval);
    }, [getActiveNowTask]),
  );

  useEffect(() => {
    setupAndroidChannel().catch(() => {});
    const timer = setTimeout(() => rescheduleMissedTasks(), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (needsRoutine) {
      const timer = setTimeout(() => setShowRoutine(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [needsRoutine]);

  const handleSaveRoutine = async (
    updates: { id: string; startTime: string; endTime: string; estimatedMinutes: number }[],
  ) => {
    for (const plan of state.studyPlans) {
      const hasUpdates = plan.tasks.some((tk) =>
        updates.find((u) => u.id === tk.id),
      );
      if (!hasUpdates) continue;
      const updatedTasks = plan.tasks.map((task) => {
        const u = updates.find((x) => x.id === task.id);
        if (!u) return task;
        return { ...task, startTime: u.startTime, endTime: u.endTime, estimatedMinutes: u.estimatedMinutes };
      });
      updateStudyPlan({ ...plan, tasks: updatedTasks });
    }
    try {
      const taskNotifs = updates.map((u) => {
        const task = state.studyPlans
          .flatMap((p) => p.tasks)
          .find((tk) => tk.id === u.id);
        const subject = task
          ? state.subjects.find((s) => s.id === task.subjectId)
          : null;
        const chapter = subject?.chapters.find(
          (ch) => ch.id === task?.chapterId,
        );
        const topic = chapter?.topics.find((tp) => tp.id === task?.topicId);
        const name = topic?.name ?? chapter?.name ?? "Study task";
        return {
          id: u.id,
          date: today,
          startTime: u.startTime,
          endTime: u.endTime,
          topicName: name,
          subjectName: subject?.name ?? "",
          estimatedMinutes: u.estimatedMinutes ?? task?.estimatedMinutes ?? 40,
        };
      });
      await scheduleAllTaskNotifications(taskNotifs);
    } catch {}
    const todayDay = new Date().getDay();
    for (const plan of state.studyPlans) {
      if (!plan.blockApps || plan.blockedApps.length === 0) continue;
      state.blockRoutines
        .filter((r) => r.fromPlanId === plan.id)
        .forEach((r) => deleteBlockRoutine(r.id));
      for (const update of updates) {
        const task = plan.tasks.find((tk) => tk.id === update.id);
        if (!task || !update.startTime || !update.endTime) continue;
        const subject = state.subjects.find((s) => s.id === task.subjectId);
        const chapter = subject?.chapters.find(
          (ch) => ch.id === task.chapterId,
        );
        const topic = chapter?.topics.find((tp) => tp.id === task.topicId);
        const taskName = topic?.name ?? chapter?.name ?? "Task";
        addBlockRoutine({
          id: `plan_${plan.id}_task_${task.id}`,
          name: `📚 ${taskName}`,
          startTime: update.startTime,
          endTime: update.endTime,
          days: [todayDay],
          blockedApps: plan.blockedApps,
          blockShorts: false,
          enabled: true,
          hardBlock: plan.hardBlock ?? false,
          deviceAdmin: plan.deviceAdmin ?? false,
          fromPlanId: plan.id,
        });
      }
    }
    setShowRoutine(false);
  };

  const goToTimer = (task?: ActiveTask) => {
    if (task) {
      router.push({
        pathname: "/(tabs)/timer",
        params: {
          taskId: task.taskId,
          topicId: task.topicId,
          chapterId: task.chapterId,
          subjectId: task.subjectId,
          topicName: task.topicName,
          subjectName: task.subjectName,
          subjectColor: task.subjectColor,
          estimatedMinutes: String(task.estimatedMinutes ?? 25),
        },
      });
    } else {
      router.push("/(tabs)/timer");
    }
  };

  const completedToday = todayTasks.filter((tk) => tk.completed).length;
  const accentColor = activeTask ? activeTask.subjectColor : c.accent;
  const isNewUser = state.subjects.length === 0;
  const hasSubjectsNoPlan = state.subjects.length > 0 && state.studyPlans.length === 0;

  return (
    <ScrollView
      style={[S.root, { backgroundColor: c.bg }]}
      contentContainerStyle={S.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.delay(0).springify()}
        style={S.header}
      >
        <View style={{ flex: 1 }}>
          <View style={S.greetRow}>
            <Ionicons name={greetInfo.icon} size={13} color={greetInfo.color} />
            <Text style={[S.greetTxt, { color: c.textMuted }]}>
              {" "}
              Good {greetInfo.label}
            </Text>
          </View>
          <Text style={[S.titleName, { color: c.text }]}>{firstName}</Text>
        </View>
        <View style={S.headerRight}>
          <TouchableOpacity
            style={[
              S.streakPill,
              { backgroundColor: c.bgCard, borderColor: c.border },
            ]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Ionicons name="flame" size={14} color={c.streakColor} />
            <Text style={[S.streakNum, { color: c.text }]}>{state.streak}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              S.xpPill,
              { backgroundColor: c.bgCard, borderColor: c.border },
            ]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={[S.xpNum, { color: c.text }]}>{state.xp} XP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              S.avatarBtn,
              { backgroundColor: c.bgCard, borderColor: c.border },
            ]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Ionicons name="person" size={16} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ══════════════════════════════════════════════════════════════
          NEW USER EXPERIENCE  (no subjects added yet)
      ══════════════════════════════════════════════════════════════ */}
      {isNewUser && (
        <>
          {/* Welcome hero — warm, no zeros */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <View style={[S.heroCard, { backgroundColor: c.accent, alignItems: 'center', paddingVertical: 28 }]}>
              <Image
                source={require('@/assets/images/illus-cat-books.webp')}
                style={{ width: 100, height: 90, marginBottom: 14 }}
                resizeMode="contain"
              />
              <Text style={[S.heroTitle, { textAlign: 'center', fontSize: 22, marginBottom: 6 }]}>
                Welcome, {firstName}!
              </Text>
              <Text style={[S.heroSub, { textAlign: 'center', opacity: 0.9 }]}>
                Your smart study companion — from planning to focus.
              </Text>
            </View>
          </Animated.View>

          {/* App intro — what Focus On does */}
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <View style={[S.introCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Text style={[S.introHeading, { color: c.text }]}>Focus On কী করে?</Text>
              {([
                {
                  icon: 'calendar-outline' as const,
                  color: '#7B83E0',
                  bg: '#7B83E018',
                  title: 'স্মার্ট স্টাডি প্ল্যান',
                  sub: 'পরীক্ষার তারিখ দিলে অটো-শিডিউল তৈরি করে দেয়',
                },
                {
                  icon: 'timer-outline' as const,
                  color: '#F97316',
                  bg: '#F9731618',
                  title: 'পোমোডোরো ফোকাস টাইমার',
                  sub: 'মনোযোগ দিয়ে পড়ো, XP ও স্ট্রিক আর্ন করো',
                },
                {
                  icon: 'bar-chart-outline' as const,
                  color: '#22C55E',
                  bg: '#22C55E18',
                  title: 'প্রোগ্রেস ট্র্যাকিং',
                  sub: 'কতটুকু পড়লে, কতটা বাকি — সব দেখা যায়',
                },
                {
                  icon: 'shield-outline' as const,
                  color: '#EC4899',
                  bg: '#EC489918',
                  title: 'অ্যাপ ব্লকার (Android)',
                  sub: 'পড়ার সময় বিরক্তিকর অ্যাপ ব্লক করে রাখে',
                },
              ] as const).map((feat, i) => (
                <View
                  key={feat.title}
                  style={[
                    S.introRow,
                    { borderTopColor: c.border, borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0 },
                  ]}
                >
                  <View style={[S.introIcon, { backgroundColor: feat.bg }]}>
                    <Ionicons name={feat.icon} size={18} color={feat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.introTitle, { color: c.text }]}>{feat.title}</Text>
                    <Text style={[S.introSub, { color: c.textMuted }]}>{feat.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* 3-step onboarding */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={[S.onboardCard, { backgroundColor: c.bgCard, marginTop: 0 }]}>
              <Text style={[S.onboardTitle, { color: c.text }]}>3 quick steps</Text>
              <Text style={[S.onboardSub, { color: c.textMuted, marginBottom: 4 }]}>
                Follow these to start your first focus session
              </Text>
              {([
                {
                  num: '1', color: '#7B83E0',
                  title: 'Add your subjects',
                  sub: 'Math, Physics, History — whatever you study',
                  action: () => router.push('/(tabs)/subjects'),
                },
                {
                  num: '2', color: '#F97316',
                  title: 'Create a study plan',
                  sub: 'Set your exam date and get a smart schedule',
                  action: () => router.push('/(tabs)/plan'),
                },
                {
                  num: '3', color: '#22C55E',
                  title: 'Start the focus timer',
                  sub: 'Study in focused sessions and earn XP',
                  action: () => router.push('/(tabs)/timer'),
                },
              ] as const).map((step, i) => (
                <TouchableOpacity
                  key={step.num}
                  style={[S.stepRow, { borderTopColor: c.border, borderTopWidth: i > 0 ? 1 : 0 }]}
                  onPress={step.action}
                  activeOpacity={0.8}
                >
                  <View style={[S.stepNum, { backgroundColor: step.color + '18', borderColor: step.color + '30' }]}>
                    <Text style={[S.stepNumTxt, { color: step.color }]}>{step.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.stepTitle, { color: c.text }]}>{step.title}</Text>
                    <Text style={[S.stepSub, { color: c.textMuted }]}>{step.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={step.color} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          HAS SUBJECTS BUT NO PLAN  (step 2 of onboarding)
      ══════════════════════════════════════════════════════════════ */}
      {hasSubjectsNoPlan && (
        <>
          {/* Encouraging hero */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <View style={[S.heroCard, { backgroundColor: '#F97316' }]}>
              <View style={{ flex: 1 }}>
                <Text style={S.heroLabel}>ALMOST READY</Text>
                <Text style={S.heroTitle}>Create your study plan</Text>
                <Text style={[S.heroSub, { marginTop: 4 }]}>
                  Set your exam date and get a personalised schedule
                </Text>
                <TouchableOpacity
                  style={S.heroBtn}
                  onPress={() => router.push('/plan/create')}
                  activeOpacity={0.85}
                >
                  <Text style={[S.heroBtnTxt, { color: '#F97316' }]}>Create Plan</Text>
                  <Ionicons name="arrow-forward" size={13} color="#F97316" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Step progress card */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={[S.onboardCard, { backgroundColor: c.bgCard }]}>
              {/* Step 1 — done */}
              <View style={[S.onboardCheckRow, { borderBottomColor: c.border, borderBottomWidth: 1, paddingBottom: 14, marginBottom: 2 }]}>
                <View style={[S.checkDone, { backgroundColor: '#22C55E18', borderColor: '#22C55E30' }]}>
                  <Ionicons name="checkmark" size={13} color="#22C55E" />
                </View>
                <Text style={[S.stepTitle, { color: c.textMuted, flex: 1, textDecorationLine: 'line-through' }]}>
                  Subjects added
                </Text>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              </View>

              {/* Step 2 — active */}
              <TouchableOpacity
                style={[S.stepRow, { borderTopWidth: 0 }]}
                onPress={() => router.push('/plan/create')}
                activeOpacity={0.8}
              >
                <View style={[S.stepNum, { backgroundColor: '#F9731618', borderColor: '#F9731630' }]}>
                  <Text style={[S.stepNumTxt, { color: '#F97316' }]}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.stepTitle, { color: c.text }]}>Create a study plan</Text>
                  <Text style={[S.stepSub, { color: c.textMuted }]}>Set an exam date and get a smart schedule</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#F97316" />
              </TouchableOpacity>

              {/* Step 3 — dimmed */}
              <View style={[S.stepRow, { borderTopColor: c.border, borderTopWidth: 1, opacity: 0.45 }]}>
                <View style={[S.stepNum, { backgroundColor: '#22C55E18', borderColor: '#22C55E30' }]}>
                  <Text style={[S.stepNumTxt, { color: '#22C55E' }]}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.stepTitle, { color: c.text }]}>Start the focus timer</Text>
                  <Text style={[S.stepSub, { color: c.textMuted }]}>Study and earn XP</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#22C55E" />
              </View>
            </View>
          </Animated.View>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          RETURNING USER WITH PLANS
      ══════════════════════════════════════════════════════════════ */}
      {!isNewUser && !hasSubjectsNoPlan && (
        <>
          {/* ── Hero Card ── */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <View style={[S.heroCard, { backgroundColor: c.accent }]}>
              <View style={{ flex: 1 }}>
                <Text style={S.heroLabel}>TODAY'S GOAL</Text>
                <Text style={S.heroTitle}>
                  {todayTasks.length > 0
                    ? `${completedToday}/${todayTasks.length} tasks`
                    : "Plan your day"}
                </Text>
                <View style={S.heroProgBg}>
                  <View
                    style={[
                      S.heroProgFill,
                      {
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor:
                          progress >= 1 ? "#fff" : "rgba(255,255,255,0.9)",
                      },
                    ]}
                  />
                </View>
                <Text style={S.heroSub}>
                  {Math.round(progress * 100)}% · {todayMin}m studied today
                </Text>
                <TouchableOpacity
                  style={S.heroBtn}
                  onPress={() => router.push("/(tabs)/plan")}
                  activeOpacity={0.85}
                >
                  <Text style={[S.heroBtnTxt, { color: c.accent }]}>
                    {todayTasks.length > 0 ? "View plan" : "Create plan"}
                  </Text>
                  <Ionicons name="arrow-forward" size={13} color={c.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* ── Alert banners ── */}
          {examDayPlans.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(60 + i * 20).springify()}>
              <TouchableOpacity
                style={[S.alertCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
                onPress={() => router.push({ pathname: "/plan/[id]", params: { id: p.id } })}
              >
                <View style={[S.alertIcon, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="flag" size={18} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.alertTitle, { color: c.text }]}>Exam day — {p.examName}!</Text>
                  <Text style={[S.alertSub, { color: c.textMuted }]}>Focus on what you know. You've got this!</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
              </TouchableOpacity>
            </Animated.View>
          ))}
          {examSoonPlans.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(60 + i * 20).springify()}>
              <TouchableOpacity
                style={[S.alertCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
                onPress={() => router.push({ pathname: "/plan/[id]", params: { id: p.id } })}
              >
                <View style={[S.alertIcon, { backgroundColor: c.bgSecondary }]}>
                  <Ionicons name="warning" size={18} color={c.destructive} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.alertTitle, { color: c.text }]}>Exam tomorrow — {p.examName}!</Text>
                  <Text style={[S.alertSub, { color: c.textMuted }]}>Last day to revise. Make it count.</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
              </TouchableOpacity>
            </Animated.View>
          ))}
          {missedCount > 0 && examDayPlans.length === 0 && (
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <TouchableOpacity
                style={[S.alertCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
                onPress={() => router.push("/(tabs)/plan")}
              >
                <View style={[S.alertIcon, { backgroundColor: c.bgSecondary }]}>
                  <Ionicons name="alert-circle" size={18} color={c.destructive} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.alertTitle, { color: c.text }]}>
                    {missedCount} missed task{missedCount > 1 ? "s" : ""}
                  </Text>
                  <Text style={[S.alertSub, { color: c.textMuted }]}>Tap to reschedule from your plan</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
              </TouchableOpacity>
            </Animated.View>
          )}
          {needsRoutine && (
            <Animated.View entering={FadeInDown.delay(70).springify()}>
              <TouchableOpacity
                style={[S.alertCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
                onPress={() => setShowRoutine(true)}
              >
                <View style={[S.alertIcon, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="time" size={18} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.alertTitle, { color: c.text }]}>{t.homeRoutineBannerTitle}</Text>
                  <Text style={[S.alertSub, { color: c.textMuted }]}>{t.homeRoutineBannerSub(unscheduledTasks.length)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Active Task ── */}
          {activeTask && (
            <Animated.View entering={FadeInDown.delay(80).springify()}>
              <ActiveTaskBanner task={activeTask} onPress={() => goToTimer(activeTask)} t={t} />
            </Animated.View>
          )}

          {/* ── Start Focus ── */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <StartButton
              onPress={() => goToTimer(activeTask ?? undefined)}
              color={accentColor}
              label={activeTask ? `Study ${activeTask.topicName}` : t.homeStartFocus}
            />
          </Animated.View>

          {/* ── Quick Stats Row ── */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={S.statsRow}>
            <View style={[S.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Ionicons name="time-outline" size={18} color={c.accent} />
              <Text style={[S.statNum, { color: c.text }]}>{todayMin}m</Text>
              <Text style={[S.statLabel, { color: c.textMuted }]}>Studied</Text>
            </View>
            <View style={[S.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={c.accent} />
              <Text style={[S.statNum, { color: c.text }]}>{completedToday}</Text>
              <Text style={[S.statLabel, { color: c.textMuted }]}>Done</Text>
            </View>
            <View style={[S.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Ionicons name="flame-outline" size={18} color={c.streakColor} />
              <Text style={[S.statNum, { color: c.text }]}>{state.streak}d</Text>
              <Text style={[S.statLabel, { color: c.textMuted }]}>Streak</Text>
            </View>
          </Animated.View>

          {/* ── Today's Tasks ── */}
          {todayTasks.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(140).springify()}>
              <View style={S.sectionHeader}>
                <Text style={[S.sectionTitle, { color: c.text }]}>{t.homeTodayPlan}</Text>
                {needsRoutine && (
                  <TouchableOpacity
                    style={[S.seeAllBtn, { backgroundColor: c.accentSoft }]}
                    onPress={() => setShowRoutine(true)}
                  >
                    <Ionicons name="time-outline" size={11} color={c.accent} />
                    <Text style={[S.seeAllTxt, { color: c.accent }]}>{t.homeSetTimes}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {todayTasks.map((task, i) => {
                const subject = state.subjects.find((s) => s.id === task.subjectId);
                const chapter = subject?.chapters.find((ch) => ch.id === task.chapterId);
                const topic = chapter?.topics.find((tp) => tp.id === task.topicId);
                const displayName = topic?.name ?? chapter?.name ?? "Task";
                const isActive = activeTask?.taskId === task.id;
                const subjectColor = subject?.color ?? c.accent;
                return (
                  <Animated.View key={task.id} entering={FadeInDown.delay(150 + i * 35).springify()}>
                    <TouchableOpacity
                      style={[
                        S.taskCard,
                        { backgroundColor: c.bgCard, borderColor: c.border },
                        task.completed && { opacity: 0.55 },
                      ]}
                      onPress={() => {
                        if (!task.completed && subject) {
                          router.push({
                            pathname: "/(tabs)/timer",
                            params: {
                              taskId: task.id,
                              topicId: task.topicId,
                              chapterId: task.chapterId,
                              subjectId: task.subjectId,
                              topicName: displayName,
                              subjectName: subject.name,
                              subjectColor: subject.color,
                              estimatedMinutes: String(task.estimatedMinutes ?? 40),
                            },
                          });
                        }
                      }}
                      activeOpacity={0.82}
                    >
                      <View style={[S.taskStrip, { backgroundColor: subjectColor }]} />
                      <View
                        style={[
                          S.taskCheck,
                          task.completed
                            ? { backgroundColor: c.success, borderColor: c.success }
                            : { backgroundColor: "transparent", borderColor: c.border },
                        ]}
                      >
                        {task.completed && <Ionicons name="checkmark" size={11} color="#fff" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            S.taskName,
                            { color: task.completed ? c.textMuted : c.text },
                            task.completed && { textDecorationLine: "line-through" },
                          ]}
                          numberOfLines={1}
                        >
                          {displayName}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <View style={[S.subjectChip, { backgroundColor: c.bgSecondary }]}>
                            <View style={[S.subjectDot, { backgroundColor: subjectColor }]} />
                            <Text style={[S.subjectName, { color: c.textMuted }]} numberOfLines={1}>
                              {subject?.name}
                            </Text>
                          </View>
                          {task.startTime && (
                            <Text style={[S.taskTime, { color: c.textFaint }]}>{task.startTime}</Text>
                          )}
                        </View>
                      </View>
                      {isActive && !task.completed && (
                        <View style={[S.playBtn, { backgroundColor: c.accentSoft }]}>
                          <Ionicons name="play" size={11} color={c.accent} />
                        </View>
                      )}
                      {task.completed && <Ionicons name="checkmark-circle" size={18} color={c.success} />}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}

              <TouchableOpacity
                style={[S.viewAllBtn, { borderColor: c.border, backgroundColor: c.bgCard }]}
                onPress={() => router.push("/(tabs)/plan")}
              >
                <Text style={[S.viewAllTxt, { color: c.accent }]}>See all tasks</Text>
                <Ionicons name="arrow-forward" size={13} color={c.accent} />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            /* Nothing scheduled today — rest card */
            <Animated.View
              entering={FadeInDown.delay(140).springify()}
              style={[S.emptyCard, { backgroundColor: c.bgCard }]}
            >
              <Image
                source={require('@/assets/images/illus-cat-books.webp')}
                style={S.emptyIllustrationImg}
                resizeMode="contain"
              />
              <Text style={[S.emptyTitle, { color: c.text }]}>{t.homeNoPlan}</Text>
              <Text style={[S.emptySub, { color: c.textMuted }]}>
                No tasks scheduled for today. Rest up or review!
              </Text>
              <TouchableOpacity
                style={[S.emptyBtn, { backgroundColor: c.accent }]}
                onPress={() => router.push('/(tabs)/plan')}
              >
                <Text style={S.emptyBtnTxt}>View Plan</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />

      <MorningRoutineModal
        visible={showRoutine}
        tasks={unscheduledTasks}
        subjects={state.subjects}
        onSave={handleSaveRoutine}
        onClose={() => setShowRoutine(false)}
        colors={c}
        t={t}
      />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 64 : 50,
    paddingBottom: 110,
    gap: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  greetRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  greetTxt: { fontSize: 12, fontFamily: FONTS.regular },
  titleName: { fontSize: 26, fontFamily: FONTS.bold, letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  streakNum: { fontSize: 13, fontFamily: FONTS.bold },
  xpPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  xpNum: { fontSize: 12, fontFamily: FONTS.bold },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  // Hero
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: 22,
    minHeight: 140,
    overflow: "hidden",
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: "#fff",
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  heroProgBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  heroProgFill: { height: "100%", borderRadius: 2 },
  heroSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  heroBtnTxt: { fontSize: 13, fontFamily: FONTS.bold },

  // Alerts
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  alertTitle: { fontSize: 13, fontFamily: FONTS.semibold, marginBottom: 1 },
  alertSub: { fontSize: 12, fontFamily: FONTS.regular },

  // Active banner
  activeBanner: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingRight: 12,
    overflow: "hidden",
  },
  bannerAccent: {
    width: 3,
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  bannerLive: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bannerTopic: { fontSize: 14, fontFamily: FONTS.semibold, marginBottom: 1 },
  bannerSubject: { fontSize: 11, fontFamily: FONTS.regular },
  bannerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Start button
  startOuter: {
    borderRadius: RADIUS.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  startInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 58,
    borderRadius: RADIUS.lg,
  },
  startIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  startTxt: { color: "#fff", fontSize: 16, fontFamily: FONTS.bold },

  // Stats row
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    gap: 3,
    borderWidth: 1,
  },
  statNum: { fontSize: 17, fontFamily: FONTS.bold },
  statLabel: { fontSize: 10, fontFamily: FONTS.medium },

  // Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  seeAllTxt: { fontSize: 11, fontFamily: FONTS.semibold },

  // Task cards
  taskCard: {
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskStrip: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  taskName: { fontSize: 14, fontFamily: FONTS.medium },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectDot: { width: 5, height: 5, borderRadius: 3 },
  subjectName: { fontSize: 11, fontFamily: FONTS.regular },
  taskTime: { fontSize: 11, fontFamily: FONTS.regular },
  playBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  viewAllTxt: { fontSize: 13, fontFamily: FONTS.medium },

  // Intro Section (ADD THIS)
introCard: {
  borderRadius: RADIUS.xl,
  padding: 18,
  borderWidth: 1,
  gap: 0,
  overflow: "hidden",
},

introHeading: {
  fontSize: 16,
  fontFamily: FONTS.bold,
  marginBottom: 10,
},

introRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingVertical: 12,
},

introIcon: {
  width: 36,
  height: 36,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
},

introTitle: {
  fontSize: 13,
  fontFamily: FONTS.semibold,
  marginBottom: 2,
},

introSub: {
  fontSize: 12,
  fontFamily: FONTS.regular,
  lineHeight: 17,
},

  // Empty
  emptyCard: {
    borderRadius: RADIUS.xl,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyIllustrationImg: { width: 130, height: 120, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontFamily: FONTS.bold, textAlign: "center" },
  emptySub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
  },
  emptyBtnTxt: { fontSize: 14, fontFamily: FONTS.bold, color: "#fff" },

  // Onboarding
  onboardCard: { borderRadius: RADIUS.xl, padding: 20, gap: 0, overflow: "hidden" },
  onboardTitle: { fontSize: 17, fontFamily: FONTS.bold, textAlign: "center", marginBottom: 4 },
  onboardSub: { fontSize: 13, fontFamily: FONTS.regular, textAlign: "center", lineHeight: 19, marginBottom: 12 },
  onboardCheckRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  checkDone: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  stepRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14,
  },
  stepNum: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  stepNumTxt: { fontSize: 13, fontFamily: FONTS.bold },
  stepTitle: { fontSize: 13, fontFamily: FONTS.semibold, marginBottom: 2 },
  stepSub: { fontSize: 12, fontFamily: FONTS.regular, lineHeight: 17 },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    maxHeight: "88%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  routineIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 18, fontFamily: FONTS.bold },
  sheetSub: { fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  colLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONTS.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  routineTaskRow: { paddingVertical: 14 },
  routineTaskName: { fontSize: 13, fontFamily: FONTS.semibold },
  routineTaskSub: { fontSize: 11, fontFamily: FONTS.regular },
  timeStepper: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  timeDisplay: { paddingHorizontal: 8, paddingVertical: 4 },
  timeText: { fontSize: 12, fontFamily: FONTS.bold },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveTxt: { fontSize: 15, fontFamily: FONTS.bold },
});
