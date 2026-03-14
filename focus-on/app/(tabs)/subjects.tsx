import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Pressable, Platform, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import { SUBJECT_COLORS, SUBJECT_ICONS, type Subject } from '@/types/study';

export default function SubjectsScreen() {
  const { state, addSubject, deleteSubject, getSubjectProgress } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(SUBJECT_ICONS[0]);
  const [topicBased, setTopicBased] = useState(false); // false = Chapter+Topic, true = Chapter only

  const create = () => {
    if (!name.trim()) return;
    const s: Subject = {
      id: Date.now().toString(), name: name.trim(), color, icon,
      topicBased, chapters: [], createdAt: new Date().toISOString(),
    };
    addSubject(s);
    setShowCreate(false);
    setName(''); setColor(SUBJECT_COLORS[0]); setIcon(SUBJECT_ICONS[0]); setTopicBased(false);
  };

  const renderItem = ({ item, index }: { item: Subject; index: number }) => {
    const prog = getSubjectProgress(item.id);
    const totalTopics = item.chapters.flatMap(c => c.topics).length;
    const doneTopics = item.chapters.flatMap(c => c.topics).filter(t => t.completed).length;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: c.bgCard }]}
          onPress={() => router.push(`/subject/${item.id}`)}
          onLongPress={() => Alert.alert('Delete Subject?', `"${item.name}" will be permanently deleted.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteSubject(item.id) },
          ])}
          activeOpacity={0.85}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: c.text }]}>{item.name}</Text>
              <Text style={[styles.cardSub, { color: c.textMuted }]}>
                {item.chapters.length} chapter{item.chapters.length !== 1 ? 's' : ''}
                {totalTopics > 0 ? ` · ${doneTopics}/${totalTopics} topics` : ''}
              </Text>
              <View style={[styles.progBg, { backgroundColor: c.border }]}>
                <View style={[styles.progFill, { backgroundColor: item.color, width: `${prog}%` }]} />
              </View>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.progPct, { color: item.color }]}>{prog}%</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Subjects</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.accent }]}
          onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>New</Text>
        </TouchableOpacity>
      </View>

      {state.subjects.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📚</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No subjects yet</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>Add your first subject to get started</Text>
        </View>
      ) : (
        <FlatList
          data={state.subjects} keyExtractor={i => i.id}
          renderItem={renderItem} contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowCreate(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>New Subject</Text>

            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="Subject name..." placeholderTextColor={c.textFaint}
              value={name} onChangeText={setName} autoFocus
            />

            {/* Structure type */}
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Structure</Text>
            <View style={styles.typeRow}>
              {[
                { val: false, label: 'Chapter + Topic', desc: 'Topics inside chapters' },
                { val: true, label: 'Chapter only', desc: 'No topics inside' },
              ].map(opt => (
                <TouchableOpacity key={String(opt.val)}
                  style={[styles.typeBtn, { borderColor: topicBased === opt.val ? c.accent : c.border,
                    backgroundColor: topicBased === opt.val ? c.accentSoft : c.bgSecondary }]}
                  onPress={() => setTopicBased(opt.val)}>
                  <Text style={[styles.typeLbl, { color: topicBased === opt.val ? c.accent : c.textMuted }]}>{opt.label}</Text>
                  <Text style={[styles.typeDesc, { color: c.textFaint }]}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Color</Text>
            <View style={styles.colorRow}>
              {SUBJECT_COLORS.map(cl => (
                <TouchableOpacity key={cl} style={[styles.colorDot, { backgroundColor: cl },
                  color === cl && styles.colorSelected]} onPress={() => setColor(cl)} />
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Icon</Text>
            <View style={styles.iconRow}>
              {SUBJECT_ICONS.map(ic => (
                <TouchableOpacity key={ic} style={[styles.iconBtn,
                  { backgroundColor: icon === ic ? color + '30' : c.bgSecondary,
                    borderColor: icon === ic ? color : 'transparent' }]}
                  onPress={() => setIcon(ic)}>
                  <Ionicons name={ic as any} size={22} color={icon === ic ? color : c.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.createBtn, { backgroundColor: c.accent, opacity: name.trim() ? 1 : 0.5 }]}
              onPress={create} disabled={!name.trim()}>
              <Text style={styles.createTxt}>Create</Text>
            </TouchableOpacity>
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
  title: { fontSize: 28, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addTxt: { color: '#fff', fontWeight: '700', fontFamily: 'Inter_700Bold', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconCircle: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 2 },
  cardSub: { fontSize: 12, marginBottom: 8 },
  progBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  cardRight: { alignItems: 'center', gap: 4 },
  progPct: { fontSize: 14, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', marginBottom: 20 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2 },
  typeLbl: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 2 },
  typeDesc: { fontSize: 11 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  iconRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  createBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  createTxt: { color: '#fff', fontSize: 17, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
});
