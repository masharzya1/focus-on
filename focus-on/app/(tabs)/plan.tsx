import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Modal, TextInput, Pressable, Platform, Alert, Switch } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import type { StudyPlan, PlannedTask } from '@/types/study';

export default function PlanScreen() {
  const { state, addStudyPlan, deleteStudyPlan } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

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
          onLongPress={() => Alert.alert('Delete?', `"${item.examName}" delete করবে?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteStudyPlan(item.id) },
          ])}
          activeOpacity={0.85}>

          <View style={styles.planTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: c.text }]}>{item.examName}</Text>
              <Text style={[styles.planDays, { color: daysLeft <= 7 ? c.destructive : c.textMuted }]}>
                {daysLeft > 0 ? `${daysLeft} দিন বাকি` : 'আজই Exam!'}
              </Text>
            </View>
            <View style={[styles.progCircle, { borderColor: c.accent }]}>
              <Text style={[styles.progPct, { color: c.accent }]}>{prog}%</Text>
            </View>
          </View>

          {/* Today highlight */}
          {todayTasks.length > 0 && (
            <View style={[styles.todayBadge, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="today-outline" size={14} color={c.accent} />
              <Text style={[styles.todayTxt, { color: c.accent }]}>
                আজ: {doneToday}/{todayTasks.length} tasks
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
          onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>নতুন Plan</Text>
        </TouchableOpacity>
      </View>

      {state.studyPlans.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📅</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>কোনো Plan নেই</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>AI দিয়ে study plan বানাও!</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: c.accent }]}
            onPress={() => setShowCreate(true)}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Plan বানাও</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={state.studyPlans} keyExtractor={i => i.id}
          renderItem={renderPlan} contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create plan — navigate to multi-step */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowCreate(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>নতুন Plan</Text>
            <Text style={[styles.sheetDesc, { color: c.textMuted }]}>
              Subjects নেই? আগে Subject screen এ subject বানাও।
            </Text>
            {state.subjects.length === 0 ? (
              <TouchableOpacity style={[styles.goBtn, { backgroundColor: c.accent }]}
                onPress={() => { setShowCreate(false); router.push('/subjects'); }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Subjects এ যাও</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.goBtn, { backgroundColor: c.accent }]}
                onPress={() => { setShowCreate(false); router.push('/plan/create'); }}>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>শুরু করো</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  planCard: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12 },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  planName: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  planDays: { fontSize: 13, fontWeight: '600' },
  progCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  progPct: { fontSize: 14, fontWeight: '800' },
  todayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  todayTxt: { fontSize: 12, fontWeight: '700' },
  planProgBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  planProgFill: { height: '100%', borderRadius: 3 },
  planMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaTxt: { fontSize: 12 },
  blockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  blockTxt: { fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySub: { fontSize: 14, marginTop: 8, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  sheetDesc: { fontSize: 14, marginBottom: 24, lineHeight: 22 },
  goBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 54, borderRadius: 16 },
});
