import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';
import { RADIUS, FONTS } from '@/constants/theme';
import type { StudyPlan } from '@/types/study';

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
    const isUrgent = daysLeft <= 7 && daysLeft > 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <TouchableOpacity
          style={[styles.planCard, { backgroundColor: c.bgCard }]}
          onPress={() => router.push(`/plan/${item.id}`)}
          onLongPress={() => Alert.alert(t.plansDeleteTitle, t.plansDeleteMsg(item.examName), [
            { text: t.plansCancel, style: 'cancel' },
            { text: t.plansDelete, style: 'destructive', onPress: () => deleteStudyPlan(item.id) },
          ])}
          activeOpacity={0.85}
        >
          <View style={styles.planTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: c.text }]}>{item.examName}</Text>
              <View style={styles.daysRow}>
                <Ionicons
                  name={daysLeft <= 0 ? 'flag' : isUrgent ? 'warning' : 'calendar-outline'}
                  size={13}
                  color={daysLeft <= 0 ? c.success : isUrgent ? c.destructive : c.textMuted}
                />
                <Text style={[styles.planDays, { color: daysLeft <= 0 ? c.success : isUrgent ? c.destructive : c.textMuted }]}>
                  {' '}{daysLeft > 0 ? `${daysLeft} days left` : 'Exam day!'}
                </Text>
              </View>
            </View>
            {/* Progress circle */}
            <View style={[styles.progCircle, { borderColor: prog >= 100 ? c.success : c.accent }]}>
              <Text style={[styles.progPct, { color: prog >= 100 ? c.success : c.accent }]}>{prog}%</Text>
            </View>
          </View>

          {/* Today's tasks badge */}
          {todayTasks.length > 0 && (
            <View style={[styles.todayBadge, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="today-outline" size={13} color={c.accent} />
              <Text style={[styles.todayTxt, { color: c.accent }]}>
                {t.plansTodayTasks(doneToday, todayTasks.length)}
              </Text>
            </View>
          )}

          {/* Progress bar */}
          <View style={[styles.planProgBg, { backgroundColor: c.border }]}>
            <View style={[styles.planProgFill, {
              backgroundColor: prog >= 100 ? c.success : c.accent,
              width: `${prog}%`,
            }]} />
          </View>

          {/* Meta */}
          <View style={styles.planMeta}>
            <View style={styles.metaLeft}>
              <Ionicons name="layers-outline" size={12} color={c.textFaint} />
              <Text style={[styles.metaTxt, { color: c.textFaint }]}> {t.plansTopics(totalTasks)}</Text>
            </View>
            {item.blockApps && (
              <View style={styles.blockBadge}>
                <Ionicons name="shield" size={12} color={c.destructive} />
                <Text style={[styles.blockTxt, { color: c.destructive }]}> {t.plansBlockActive}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>{t.plansTitle}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.accent }]}
          onPress={() => router.push('/plan/create')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state — icon instead of emoji */}
      {state.studyPlans.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconCircle, { backgroundColor: c.accentSoft }]}>
            <Ionicons name="clipboard-outline" size={40} color={c.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No plans yet</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>
            Pick topics, set an exam date, and get a full study schedule.
          </Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: c.accent }]}
            onPress={() => router.push('/plan/create')}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.emptyBtnTxt}>Create Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={state.studyPlans} keyExtractor={i => i.id}
          renderItem={renderPlan}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16,
  },
  title: { fontSize: 28, fontFamily: FONTS.black, letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addTxt: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  planCard: { borderRadius: RADIUS.xl, padding: 18, marginBottom: 14 },
  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  planName: { fontSize: 17, fontFamily: FONTS.black, marginBottom: 4 },
  daysRow: { flexDirection: 'row', alignItems: 'center' },
  planDays: { fontSize: 13, fontFamily: FONTS.semibold },
  progCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  progPct: { fontSize: 13, fontFamily: FONTS.black },
  todayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 10, alignSelf: 'flex-start',
  },
  todayTxt: { fontSize: 13, fontFamily: FONTS.semibold },
  planProgBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  planProgFill: { height: '100%', borderRadius: 3 },
  planMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLeft: { flexDirection: 'row', alignItems: 'center' },
  metaTxt: { fontSize: 12, fontFamily: FONTS.regular },
  blockBadge: { flexDirection: 'row', alignItems: 'center' },
  blockTxt: { fontSize: 12, fontFamily: FONTS.semibold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontFamily: FONTS.black },
  emptySub: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  emptyBtnTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.black },
});
