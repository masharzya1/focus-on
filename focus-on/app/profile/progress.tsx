import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FONTS, RADIUS } from '@/constants/theme';

const { width: SW } = Dimensions.get('window');
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getLevelProgress(xp: number) {
  let remaining = xp, lvl = 1;
  while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
  return { lvl, earned: remaining, total: lvl * 100 };
}

function getWeekDates(offsetWeeks = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

export default function ProgressScreen() {
  const { state } = useStudy();
  const { colors: c } = useTheme();
  const t = useT();
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);

  const { lvl, earned, total } = getLevelProgress(state.xp);
  const xpPct = Math.round((earned / total) * 100);

  const weekDates = getWeekDates(weekOffset);
  const today = new Date().toISOString().split('T')[0];

  // Minutes studied per day this week
  const dailyMinutes = weekDates.map(d => {
    const dateStr = d.toISOString().split('T')[0];
    return state.sessions
      .filter(s => s.completed && s.startTime.startsWith(dateStr))
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  });

  const maxMin = Math.max(...dailyMinutes, 1);
  const weekTotal = dailyMinutes.reduce((a, b) => a + b, 0);
  const weekLabel = `${MONTH_NAMES[weekDates[0].getMonth()]} ${weekDates[0].getDate()} – ${MONTH_NAMES[weekDates[6].getMonth()]} ${weekDates[6].getDate()}`;

  // Subject progress
  const subjectProgress = state.subjects.map(sub => {
    const chapters = sub.chapters;
    const chOnly = chapters.filter(ch => ch.topics.length === 0);
    const topicBased = chapters.filter(ch => ch.topics.length > 0);
    const doneCh = chOnly.filter(ch => ch.completed).length;
    const totalCh = chOnly.length;
    const doneTopic = topicBased.flatMap(ch => ch.topics).filter(t => t.completed).length;
    const totalTopic = topicBased.flatMap(ch => ch.topics).length;
    const done = doneCh + doneTopic;
    const totalItems = totalCh + totalTopic;
    const pct = totalItems > 0 ? Math.round((done / totalItems) * 100) : 0;
    return { ...sub, pct, done, totalItems };
  }).filter(s => s.totalItems > 0).sort((a, b) => b.pct - a.pct);

  // Completed sessions count
  const completedSessions = state.sessions.filter(s => s.completed);
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: c.text }]}>Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

        {/* ── Summary stats ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()}
          style={[st.card, { backgroundColor: c.bgCard }]}>
          <Text style={[st.cardTitle, { color: c.textMuted }]}>OVERALL</Text>
          <View style={st.summaryRow}>
            {[
              { icon: 'flame',           color: '#FF9500', val: String(state.streak),              lbl: 'Day Streak'  },
              { icon: 'time-outline',    color: c.accent,  val: `${totalH}h ${totalM}m`,            lbl: 'Total Time'  },
              { icon: 'checkmark-done',  color: '#10B981', val: String(state.totalTopicsCompleted), lbl: 'Topics Done' },
              { icon: 'star',            color: '#FFD700', val: String(state.xp),                  lbl: 'Total XP'    },
            ].map((item, i, arr) => (
              <React.Fragment key={item.lbl}>
                <View style={st.summaryItem}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                  <Text style={[st.summaryVal, { color: c.text }]}>{item.val}</Text>
                  <Text style={[st.summaryLbl, { color: c.textMuted }]}>{item.lbl}</Text>
                </View>
                {i < arr.length - 1 && <View style={[st.summaryDiv, { backgroundColor: c.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* ── Level / XP ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}
          style={[st.card, { backgroundColor: c.bgCard }]}>
          <View style={st.levelRow}>
            <View>
              <Text style={[st.cardTitle, { color: c.textMuted }]}>LEVEL PROGRESS</Text>
              <Text style={[st.levelNum, { color: c.accent }]}>Level {lvl}</Text>
            </View>
            <View style={[st.xpBadge, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="star" size={14} color={c.accent} />
              <Text style={[st.xpBadgeTxt, { color: c.accent }]}>{state.xp} XP</Text>
            </View>
          </View>
          <View style={[st.xpBg, { backgroundColor: c.border }]}>
            <View style={[st.xpFill, { width: `${xpPct}%`, backgroundColor: c.accent }]} />
          </View>
          <Text style={[st.xpSub, { color: c.textFaint }]}>{earned} / {total} XP to Level {lvl + 1}</Text>
        </Animated.View>

        {/* ── Weekly chart ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}
          style={[st.card, { backgroundColor: c.bgCard }]}>
          <View style={st.weekHeader}>
            <TouchableOpacity onPress={() => setWeekOffset(o => o - 1)} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={c.accent} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[st.cardTitle, { color: c.textMuted }]}>DAILY STUDY TIME</Text>
              <Text style={[st.weekLabel, { color: c.textMuted }]}>{weekLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setWeekOffset(o => Math.min(0, o + 1))}
              hitSlop={8}
              style={{ opacity: weekOffset >= 0 ? 0.3 : 1 }}>
              <Ionicons name="chevron-forward" size={20} color={c.accent} />
            </TouchableOpacity>
          </View>

          <Text style={[st.weekTotal, { color: c.accent }]}>
            {Math.floor(weekTotal / 60)}h {weekTotal % 60}m this week
          </Text>

          {/* Bar chart */}
          <View style={st.chartRow}>
            {weekDates.map((d, i) => {
              const dateStr = d.toISOString().split('T')[0];
              const isToday = dateStr === today;
              const mins = dailyMinutes[i];
              const barH = Math.max(4, (mins / maxMin) * 120);
              return (
                <View key={i} style={st.barCol}>
                  <View style={[st.barBg, { backgroundColor: c.border }]}>
                    <View style={[st.barFill, {
                      height: barH,
                      backgroundColor: isToday ? c.accent : mins > 0 ? c.accent + '60' : c.border,
                    }]} />
                  </View>
                  <Text style={[st.barLabel, {
                    color: isToday ? c.accent : c.textFaint,
                    fontFamily: isToday ? FONTS.bold : FONTS.regular,
                  }]}>{DAY_LABELS[d.getDay()]}</Text>
                  {isToday && <View style={[st.todayDot, { backgroundColor: c.accent }]} />}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Subject breakdown ── */}
        {subjectProgress.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).springify()}
            style={[st.card, { backgroundColor: c.bgCard }]}>
            <Text style={[st.cardTitle, { color: c.textMuted }]}>SUBJECT PROGRESS</Text>
            {subjectProgress.map((sub, i) => (
              <View key={sub.id}
                style={[st.subRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                <View style={[st.subIcon, { backgroundColor: sub.color + '20' }]}>
                  <Ionicons name={sub.icon as any} size={16} color={sub.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={st.subTop}>
                    <Text style={[st.subName, { color: c.text }]} numberOfLines={1}>{sub.name}</Text>
                    <Text style={[st.subPct, {
                      color: sub.pct === 100 ? '#10B981' : sub.color,
                    }]}>{sub.pct}%</Text>
                  </View>
                  <View style={[st.progBg, { backgroundColor: c.border }]}>
                    <View style={[st.progFill, {
                      width: `${sub.pct}%`,
                      backgroundColor: sub.pct === 100 ? '#10B981' : sub.color,
                    }]} />
                  </View>
                  <Text style={[st.subSub, { color: c.textFaint }]}>
                    {sub.done}/{sub.totalItems} completed
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {subjectProgress.length === 0 && (
          <View style={[st.empty, { backgroundColor: c.bgCard }]}>
            <Ionicons name="bar-chart-outline" size={40} color={c.textFaint} />
            <Text style={[st.emptyTxt, { color: c.textMuted }]}>No study data yet</Text>
            <Text style={[st.emptySub, { color: c.textFaint }]}>Complete some topics to see your progress</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  content: { padding: 16, gap: 12 },
  card: { borderRadius: 16, padding: 16, gap: 12 },
  cardTitle: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryVal: { fontSize: 16, fontFamily: FONTS.bold },
  summaryLbl: { fontSize: 10, fontFamily: FONTS.regular, textAlign: 'center' },
  summaryDiv: { width: 1, height: 40, marginHorizontal: 4 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  levelNum: { fontSize: 24, fontFamily: FONTS.bold },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  xpBadgeTxt: { fontSize: 13, fontFamily: FONTS.bold },
  xpBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 5 },
  xpSub: { fontSize: 12, fontFamily: FONTS.regular },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekLabel: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  weekTotal: { fontSize: 15, fontFamily: FONTS.bold },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 4 },
  barCol: { alignItems: 'center', gap: 4, flex: 1 },
  barBg: { width: 28, height: 120, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 12 },
  todayDot: { width: 5, height: 5, borderRadius: 3 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  subIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  subName: { fontSize: 14, fontFamily: FONTS.semibold, flex: 1 },
  subPct: { fontSize: 14, fontFamily: FONTS.bold },
  progBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 3 },
  progFill: { height: '100%', borderRadius: 3 },
  subSub: { fontSize: 11, fontFamily: FONTS.regular },
  empty: { borderRadius: 16, padding: 32, alignItems: 'center', gap: 8 },
  emptyTxt: { fontSize: 16, fontFamily: FONTS.bold },
  emptySub: { fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },
});