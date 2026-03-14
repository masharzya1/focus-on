import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Pressable, Alert, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import type { Chapter, Topic } from '@/types/study';

const DIFFICULTIES = [
  { id: 1, label: 'Very Easy', color: '#10B981', minutes: 15 },
  { id: 2, label: 'Easy',      color: '#6C63FF', minutes: 25 },
  { id: 3, label: 'Medium',   color: '#F59E0B', minutes: 35 },
  { id: 4, label: 'Hard',     color: '#EF4444', minutes: 50 },
  { id: 5, label: 'Very Hard',color: '#DC2626', minutes: 60 },
];

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateSubject, toggleTopicComplete, gainXp, getSubjectProgress } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const subject = state.subjects.find(s => s.id === id);
  if (!subject) return null;

  const progress = getSubjectProgress(subject.id);
  const totalTopics = subject.chapters.flatMap(ch => ch.topics).length;
  const doneTopics = subject.chapters.flatMap(ch => ch.topics).filter(t => t.completed).length;

  const [showAddChapter, setShowAddChapter] = useState(false);
  const [chapterName, setChapterName] = useState('');

  const [addingTopicForChapter, setAddingTopicForChapter] = useState<string|null>(null);
  const [topicName, setTopicName] = useState('');
  const [difficulty, setDifficulty] = useState(3);

  const addChapter = () => {
    if (!chapterName.trim()) return;
    const ch: Chapter = {
      id: Date.now().toString(), subjectId: subject.id,
      name: chapterName.trim(), topics: [], priority: 'medium',
    };
    updateSubject({ ...subject, chapters: [...subject.chapters, ch] });
    setChapterName(''); setShowAddChapter(false);
  };

  const deleteChapter = (chId: string) => {
    Alert.alert('Delete Chapter?', 'This chapter and all its topics will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        updateSubject({ ...subject, chapters: subject.chapters.filter(c => c.id !== chId) });
      }},
    ]);
  };

  const addTopic = () => {
    if (!topicName.trim() || !addingTopicForChapter) return;
    const diff = DIFFICULTIES.find(d => d.id === difficulty)!;
    const topic: Topic = {
      id: Date.now().toString(), chapterId: addingTopicForChapter, subjectId: subject.id,
      name: topicName.trim(), difficulty, estimatedMinutes: diff.minutes,
      completed: false, notes: '', revisionDates: [],
    };
    updateSubject({
      ...subject, chapters: subject.chapters.map(ch =>
        ch.id === addingTopicForChapter ? { ...ch, topics: [...ch.topics, topic] } : ch
      ),
    });
    setTopicName(''); setDifficulty(3); setAddingTopicForChapter(null);
  };

  const handleToggle = (chapterId: string, topicId: string) => {
    const wasCompleted = toggleTopicComplete(subject.id, chapterId, topicId);
    if (wasCompleted) gainXp(10);
  };

  const deleteTopic = (chId: string, tId: string) => {
    updateSubject({
      ...subject, chapters: subject.chapters.map(ch =>
        ch.id === chId ? { ...ch, topics: ch.topics.filter(t => t.id !== tId) } : ch
      ),
    });
  };

  // Subject is "chapter-only" (topicBased = true means no topics, just chapters)
  const isChapterOnly = subject.topicBased;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.bgCard }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <View style={[styles.iconCircle, { backgroundColor: subject.color + '22' }]}>
            <Ionicons name={subject.icon as any} size={22} color={subject.color} />
          </View>
          <View>
            <Text style={[styles.subjectName, { color: c.text }]}>{subject.name}</Text>
            <Text style={[styles.subjectSub, { color: c.textMuted }]}>
              {isChapterOnly
                ? `${subject.chapters.length} chapters`
                : `${doneTopics}/${totalTopics} topics · ${progress}%`}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.addChBtn, { backgroundColor: subject.color }]}
          onPress={() => setShowAddChapter(true)}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {!isChapterOnly && (
        <View style={[styles.progBg, { backgroundColor: c.border }]}>
          <View style={[styles.progFill, { backgroundColor: subject.color, width: `${progress}%` }]} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {subject.chapters.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-open" size={48} color={c.textFaint} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTxt, { color: c.textMuted }]}>
              Tap + to add your first chapter
            </Text>
          </View>
        ) : (
          subject.chapters.map((chapter, ci) => (
            <Animated.View key={chapter.id} entering={FadeInDown.delay(ci * 60).springify()}>
              <View style={[styles.chapterCard, { backgroundColor: c.bgCard }]}>
                <View style={styles.chapterHeader}>
                  <View style={styles.chapterLeft}>
                    <View style={[styles.chDot, { backgroundColor: subject.color }]} />
                    <Text style={[styles.chapterName, { color: c.text }]}>{chapter.name}</Text>
                    {!isChapterOnly && (
                      <Text style={[styles.chapterCount, { color: c.textFaint }]}>
                        {chapter.topics.filter(t => t.completed).length}/{chapter.topics.length}
                      </Text>
                    )}
                  </View>
                  <View style={styles.chapterActions}>
                    {!isChapterOnly && (
                      <TouchableOpacity style={[styles.chAddBtn, { backgroundColor: c.accentSoft }]}
                        onPress={() => setAddingTopicForChapter(chapter.id)}>
                        <Ionicons name="add" size={16} color={c.accent} />
                        <Text style={[styles.chAddTxt, { color: c.accent }]}>Topic</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => deleteChapter(chapter.id)} style={styles.delBtn}>
                      <Ionicons name="trash-outline" size={16} color={c.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Topics (only shown for topic-based subjects) */}
                {!isChapterOnly && (
                  chapter.topics.length === 0 ? (
                    <TouchableOpacity style={[styles.emptyTopics, { borderColor: c.border }]}
                      onPress={() => setAddingTopicForChapter(chapter.id)}>
                      <Ionicons name="add-circle-outline" size={18} color={c.textFaint} />
                      <Text style={[styles.emptyTopicsTxt, { color: c.textFaint }]}>Add a topic</Text>
                    </TouchableOpacity>
                  ) : (
                    chapter.topics.map((topic, ti) => {
                      const diff = DIFFICULTIES.find(d => d.id === topic.difficulty);
                      return (
                        <Animated.View key={topic.id} entering={FadeInRight.delay(ti * 40).springify()}>
                          <View style={[styles.topicRow, { borderTopColor: c.border }]}>
                            <TouchableOpacity style={[styles.checkbox,
                              { borderColor: topic.completed ? subject.color : c.border,
                                backgroundColor: topic.completed ? subject.color : 'transparent' }]}
                              onPress={() => handleToggle(chapter.id, topic.id)}>
                              {topic.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.topicName, { color: topic.completed ? c.textMuted : c.text },
                                topic.completed && styles.topicDone]}>
                                {topic.name}
                              </Text>
                              {diff && (
                                <View style={styles.diffRow}>
                                  <View style={[styles.diffBadge, { backgroundColor: diff.color + '20' }]}>
                                    <Text style={[styles.diffTxt, { color: diff.color }]}>{diff.label}</Text>
                                  </View>
                                  <Text style={[styles.minTxt, { color: c.textFaint }]}>~{topic.estimatedMinutes}m</Text>
                                </View>
                              )}
                            </View>
                            <TouchableOpacity onPress={() => deleteTopic(chapter.id, topic.id)} style={styles.delBtn}>
                              <Ionicons name="close" size={16} color={c.textFaint} />
                            </TouchableOpacity>
                          </View>
                        </Animated.View>
                      );
                    })
                  )
                )}
              </View>
            </Animated.View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Chapter Modal */}
      <Modal visible={showAddChapter} transparent animationType="slide" onRequestClose={() => setShowAddChapter(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowAddChapter(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>New Chapter</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="Chapter name..." placeholderTextColor={c.textFaint}
              value={chapterName} onChangeText={setChapterName} autoFocus
            />
            <TouchableOpacity style={[styles.createBtn, { backgroundColor: subject.color, opacity: chapterName.trim() ? 1 : 0.5 }]}
              onPress={addChapter} disabled={!chapterName.trim()}>
              <Text style={styles.createTxt}>Add Chapter</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Topic Modal */}
      <Modal visible={!!addingTopicForChapter} transparent animationType="slide" onRequestClose={() => setAddingTopicForChapter(null)}>
        <Pressable style={styles.modalBg} onPress={() => setAddingTopicForChapter(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>New Topic</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="Topic name..." placeholderTextColor={c.textFaint}
              value={topicName} onChangeText={setTopicName} autoFocus
            />
            <Text style={[styles.sLabel, { color: c.textMuted }]}>Difficulty</Text>
            <View style={styles.diffPicker}>
              {DIFFICULTIES.map(d => (
                <TouchableOpacity key={d.id} style={[styles.diffOption,
                  { borderColor: difficulty === d.id ? d.color : c.border,
                    backgroundColor: difficulty === d.id ? d.color + '20' : c.bgSecondary }]}
                  onPress={() => setDifficulty(d.id)}>
                  <Text style={[styles.diffOptTxt, { color: difficulty === d.id ? d.color : c.textMuted }]}>{d.label}</Text>
                  <Text style={[styles.diffOptMin, { color: c.textFaint }]}>{d.minutes}m</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.createBtn, { backgroundColor: subject.color, opacity: topicName.trim() ? 1 : 0.5 }]}
              onPress={addTopic} disabled={!topicName.trim()}>
              <Text style={styles.createTxt}>Add Topic</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14 },
  backBtn: { padding: 4 },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontSize: 18, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
  subjectSub: { fontSize: 12, marginTop: 1 },
  addChBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  progBg: { height: 3 },
  progFill: { height: '100%' },
  content: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTxt: { fontSize: 15, textAlign: 'center' },
  chapterCard: { borderRadius: RADIUS.xl, marginBottom: 12, overflow: 'hidden' },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  chapterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  chDot: { width: 10, height: 10, borderRadius: 5 },
  chapterName: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold', flex: 1 },
  chapterCount: { fontSize: 12 },
  chapterActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chAddTxt: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  delBtn: { padding: 4 },
  emptyTopics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    margin: 12, marginTop: 0, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12 },
  emptyTopicsTxt: { fontSize: 13 },
  topicRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  topicName: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  topicDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffTxt: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  minTxt: { fontSize: 11 },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', marginBottom: 20 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, marginBottom: 20 },
  sLabel: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  diffPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  diffOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 2, alignItems: 'center' },
  diffOptTxt: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  diffOptMin: { fontSize: 10, marginTop: 2 },
  createBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  createTxt: { color: '#fff', fontSize: 17, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
});
