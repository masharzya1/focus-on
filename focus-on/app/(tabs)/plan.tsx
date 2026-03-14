import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Pressable, Platform, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import type { StudyPlan } from '@/types/study';

export default function PlanScreen() {
  const { state, addStudyPlan, deleteStudyPlan } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];

  const renderPlan = ({ item, index }: { item: StudyPlan; index: number }) => {
    const totalTasks = item.tasks.length;
    const doneTasks = item.tasks.filter(t => t.completed).length;
    const todayTasks = item.tasks.filter(t => t.date === today);
    const doneToday = todayTasks.filter(t => t.completed).length;
    const daysLeft = Math.ceil((new Date(item.examDate).getTime() - Date.now()) / 86400000);
    const prog = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <TouchableOpacity style={[styles.planCard, { backgroundColor: c.bgCard }]}
          onPress={() => router.push(`/plan/${item.id}`)}
          onLongPress={() => Alert.alert('Delete Plan?', `"${item.examName}" will be permanently deleted.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteStudyPlan(item.id) },
          ])}
          activeOpacity={0.85}>

          <View style={styles.planTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: c.text }]}>{item.examName}</Text>
              <Text style={[styles.planDays, { color: daysLeft <= 7 ? c.destructive : c.textMuted }]}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Exam day!'}
              </Text>
            </View>
            <View style={[styles.progCircle, { borderColor: c.accent }]}>
              <Text style={[styles.progPct, { color: c.accent }]}>{prog}%</Text>
            </View>
          </View>

          {todayTasks.length > 0 && (
            <View style={[styles.todayBadge, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="today-outline" size={14} color={c.accent} />
              <Text style={[styles.todayTxt, { color: c.accent }]}>
                Today: {doneToday}/{todayTasks.length} tasks
              </Text>
            </View>
          )}

          <View style={[styles.planProgBg, { backgroundColor: c.border }]}>
            <View style={[styles.planProgFill, { backgroundColor: c.accent, width: `${prog}%` }]} />
          </View>

          <View style={styles.planMeta}>
            <Text style={[styles.metaTxt, { color: c.textFaint }]}>{totalTasks} topics</Text>
            {item.blockApps && (
              <View style={styles.blockBadge}>
                <Ionicons name="shield" size={12} color={c.destructive} />
                <Text style={[styles.blockTxt, { color: c.destructive }]}>Block active</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Plans</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.accent }]}
          onPress={() => router.push('/plan/create')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>New</Text>
        </TouchableOpacity>
      </View>

      {state.studyPlans.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🗓️</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No plans yet</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>
            Create a study plan — pick topics, set an exam date, and get a full schedule.
          </Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: c.accent }]}
            onPress={() => router.push('/plan/create')}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addTxt: { color: '#fff', fontWeight: '700', fontFamily: 'Inter_700Bold', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  planCard: { borderRadius: RADIUS.xl, padding: 18, marginBottom: 14 },
  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  planName: { fontSize: 17, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', marginBottom: 3 },
  planDays: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  progCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center' },
  progPct: { fontSize: 13, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  todayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 10, alignSelf: 'flex-start' },
  todayTxt: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  planProgBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  planProgFill: { height: '100%', borderRadius: 3 },
  planMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaTxt: { fontSize: 12 },
  blockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  blockTxt: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 22, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
});
