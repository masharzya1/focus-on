import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';
import { RADIUS, FONTS } from '@/constants/theme';
import type { StudyPlan } from '@/types/study';
import AdBanner from '@/components/AdBanner';

const CARD_ACCENTS = ['#7B83E0', '#F97316', '#22C55E', '#F43F5E', '#0EA5E9', '#EAB308', '#8B5CF6'];
function accentFor(i: number) { return CARD_ACCENTS[i % CARD_ACCENTS.length]; }

function DaysLeftBadge({ daysLeft, c }: { daysLeft: number; c: any }) {
  if (daysLeft <= 0) {
    return (
      <View style={[badge.pill, { backgroundColor: '#FEF2F2' }]}>
        <Ionicons name="flag" size={10} color="#EF4444" />
        <Text style={[badge.txt, { color: '#EF4444' }]}>Exam day!</Text>
      </View>
    );
  }
  if (daysLeft === 1) {
    return (
      <View style={[badge.pill, { backgroundColor: '#FEF2F2' }]}>
        <Ionicons name="warning" size={10} color="#EF4444" />
        <Text style={[badge.txt, { color: '#EF4444' }]}>1 day left</Text>
      </View>
    );
  }
  if (daysLeft <= 7) {
    return (
      <View style={[badge.pill, { backgroundColor: '#FFF7ED' }]}>
        <Ionicons name="time-outline" size={10} color="#F97316" />
        <Text style={[badge.txt, { color: '#F97316' }]}>{daysLeft} days left</Text>
      </View>
    );
  }
  return (
    <View style={[badge.pill, { backgroundColor: c.bgSecondary }]}>
      <Ionicons name="calendar-outline" size={10} color={c.textMuted} />
      <Text style={[badge.txt, { color: c.textMuted }]}>{daysLeft} days left</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
  },
  txt: { fontSize: 11, fontFamily: FONTS.semibold },
});

function ProgressRing({ pct, color, size = 44 }: { pct: number; color: string; size?: number }) {
  const radius = (size - 6) / 2;
  const circum = 2 * Math.PI * radius;
  const dash = (pct / 100) * circum;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 3, borderColor: color + '22',
        alignItems: 'center', justifyContent: 'center',
        position: 'absolute',
      }} />
      <View style={{
        width: size - 10, height: size - 10, borderRadius: (size - 10) / 2,
        backgroundColor: color + '12',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 11, fontFamily: FONTS.bold, color }}>{pct}%</Text>
      </View>
    </View>
  );
}

export default function PlanScreen() {
  const { state, deleteStudyPlan } = useStudy();
  const { colors: c } = useTheme();
  const t = useT();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  const renderPlan = ({ item, index }: { item: StudyPlan; index: number }) => {
    const totalTasks = item.tasks.length;
    const doneTasks = item.tasks.filter(t => t.completed).length;
    const todayTasks = item.tasks.filter(t => t.date === today);
    const doneToday = todayTasks.filter(t => t.completed).length;
    const daysLeft = Math.ceil((new Date(item.examDate).getTime() - Date.now()) / 86400000);
    const prog = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const accent = accentFor(index);

    return (
      <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: c.bgCard }]}
          onPress={() => router.push(`/plan/${item.id}`)}
          onLongPress={() => Alert.alert(t.plansDeleteTitle, t.plansDeleteMsg(item.examName), [
            { text: t.plansCancel, style: 'cancel' },
            { text: t.plansDelete, style: 'destructive', onPress: () => deleteStudyPlan(item.id) },
          ])}
          activeOpacity={0.85}
        >
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accent }]} />

          <View style={styles.cardInner}>
            {/* Top row */}
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, { color: c.text }]} numberOfLines={1}>
                  {item.examName}
                </Text>
                <DaysLeftBadge daysLeft={daysLeft} c={c} />
              </View>
              <ProgressRing pct={prog} color={prog >= 100 ? '#22C55E' : accent} />
            </View>

            {/* Progress bar */}
            <View style={[styles.progBg, { backgroundColor: accent + '20' }]}>
              <View style={[styles.progFill, {
                backgroundColor: prog >= 100 ? '#22C55E' : accent,
                width: `${prog}%`,
              }]} />
            </View>

            {/* Bottom row */}
            <View style={styles.bottomRow}>
              <View style={styles.metaChip}>
                <Ionicons name="layers-outline" size={11} color={c.textFaint} />
                <Text style={[styles.metaTxt, { color: c.textFaint }]}>{t.plansTopics(totalTasks)}</Text>
              </View>
              {todayTasks.length > 0 && (
                <View style={[styles.todayChip, { backgroundColor: accent + '18' }]}>
                  <Ionicons name="today-outline" size={11} color={accent} />
                  <Text style={[styles.todayTxt, { color: accent }]}>
                    {t.plansTodayTasks(doneToday, todayTasks.length)}
                  </Text>
                </View>
              )}
              {item.blockApps && (
                <View style={[styles.metaChip, { backgroundColor: '#FEF2F2', paddingHorizontal: 6, borderRadius: 8 }]}>
                  <Ionicons name="shield" size={11} color="#EF4444" />
                  <Text style={[styles.metaTxt, { color: '#EF4444' }]}> {t.plansBlockActive}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={14} color={c.textFaint} style={{ marginLeft: 'auto' }} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>{t.plansTitle}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            {state.studyPlans.length > 0
              ? `${state.studyPlans.length} active plan${state.studyPlans.length > 1 ? 's' : ''}`
              : 'Plan your studies'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.accent }]}
          onPress={() => router.push('/plan/create')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addTxt}>New</Text>
        </TouchableOpacity>
      </View>

      {state.studyPlans.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: c.accentSoft }]}>
            <Ionicons name="clipboard-outline" size={36} color={c.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No plans yet</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>
            Pick topics, set an exam date, and get a full study schedule.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: c.accent }]}
            onPress={() => router.push('/plan/create')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={15} color="#fff" />
            <Text style={styles.emptyBtnTxt}>Create your first plan</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          data={state.studyPlans}
          keyExtractor={i => i.id}
          renderItem={renderPlan}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<AdBanner placement="plan_list" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 48,
    paddingBottom: 14,
  },
  title: { fontSize: 26, fontFamily: FONTS.bold, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
  },
  addTxt: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 },

  card: {
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: { width: 4 },
  cardInner: { flex: 1, padding: 14 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  planName: { fontSize: 15, fontFamily: FONTS.bold, marginBottom: 5, letterSpacing: -0.2 },

  progBg: { height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progFill: { height: '100%', borderRadius: 3 },

  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt: { fontSize: 11, fontFamily: FONTS.regular },
  todayChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  todayTxt: { fontSize: 11, fontFamily: FONTS.semibold },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 10,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold },
  emptySub: { fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 6,
  },
  emptyBtnTxt: { color: '#fff', fontSize: 14, fontFamily: FONTS.bold },
});