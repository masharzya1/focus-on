import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, Pressable, Platform, KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';
import type { Chapter, Topic, ChapterTodo } from '@/types/study';

const DIFFICULTIES = [
  { id: 1, label: 'Very Easy', color: '#10B981', minutes: 15 },
  { id: 2, label: 'Easy',      color: '#6C63FF', minutes: 25 },
  { id: 3, label: 'Medium',   color: '#F59E0B', minutes: 35 },
  { id: 4, label: 'Hard',     color: '#EF4444', minutes: 50 },
  { id: 5, label: 'Very Hard',color: '#DC2626', minutes: 60 },
];

// ── Custom Delete Confirmation Modal ─────────────────────────────────────────
function DeleteModal({
  visible, title, subtitle, onCancel, onConfirm,
}: {
  visible: boolean; title: string; subtitle: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  const { colors: c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={dm.overlay} onPress={onCancel}>
        <Pressable style={[dm.card, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
          <View style={[dm.iconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
          </View>
          <Text style={[dm.title, { color: c.text }]}>{title}</Text>
          <Text style={[dm.sub, { color: c.textMuted }]}>{subtitle}</Text>
          <View style={dm.btnRow}>
            <TouchableOpacity style={[dm.btn, { backgroundColor: c.bgSecondary }]} onPress={onCancel}>
              <Text style={[dm.btnTxt, { color: c.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[dm.btn, { backgroundColor: '#EF4444' }]} onPress={onConfirm}>
              <Text style={[dm.btnTxt, { color: '#fff' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000077', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', gap: 10 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontFamily: FONTS.bold, textAlign: 'center' },
  sub: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  btn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 15, fontFamily: FONTS.bold },
});

// ── Minutes Stepper ────────────────────────────────────────────────────────────
function MinutesStepper({
  value, onChange, color,
}: { value: number; onChange: (v: number) => void; color: string }) {
  const { colors: c } = useTheme();
  const presets = [15, 25, 30, 45, 60, 90, 120];
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <TouchableOpacity
          style={[ms.adjBtn, { backgroundColor: c.bgSecondary }]}
          onPress={() => onChange(Math.max(5, value - 5))}>
          <Ionicons name="remove" size={20} color={color} />
        </TouchableOpacity>
        <View style={[ms.valBox, { backgroundColor: color + '18', borderColor: color + '40' }]}>
          <Text style={[ms.val, { color }]}>{value}</Text>
          <Text style={[ms.unit, { color: color + 'AA' }]}>min</Text>
        </View>
        <TouchableOpacity
          style={[ms.adjBtn, { backgroundColor: c.bgSecondary }]}
          onPress={() => onChange(value + 5)}>
          <Ionicons name="add" size={20} color={color} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {presets.map(p => (
          <TouchableOpacity key={p}
            style={[ms.preset, { backgroundColor: value === p ? color : c.bgSecondary, borderColor: value === p ? color : c.border }]}
            onPress={() => onChange(p)}>
            <Text style={[ms.presetTxt, { color: value === p ? '#fff' : c.textMuted }]}>{p}m</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const ms = StyleSheet.create({
  adjBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  valBox: { flexDirection: 'row', alignItems: 'baseline', gap: 3, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  val: { fontSize: 28, fontFamily: FONTS.bold },
  unit: { fontSize: 13, fontFamily: FONTS.medium },
  preset: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  presetTxt: { fontSize: 12, fontFamily: FONTS.semibold },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateSubject, toggleTopicComplete, gainXp, getSubjectProgress } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const subject = state.subjects.find(s => s.id === id);
  if (!subject) return null;

  const isChapterOnly = subject.topicBased;
  const progress = getSubjectProgress(subject.id);
  const totalTopics = subject.chapters.flatMap(ch => ch.topics).length;
  const doneTopics = subject.chapters.flatMap(ch => ch.topics).filter(t => t.completed).length;

  // ── Add Chapter ──────────────────────────────────────────────────────────
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [chapterName, setChapterName] = useState('');
  const [chapterMins, setChapterMins] = useState(45);

  // ── Edit Chapter ─────────────────────────────────────────────────────────
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editChapterName, setEditChapterName] = useState('');
  const [editChapterMins, setEditChapterMins] = useState(45);

  // ── Delete Confirm ────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'chapter' | 'topic' | 'todo';
    chapterId?: string; topicId?: string; todoId?: string; label: string;
  } | null>(null);

  // ── Add Topic ─────────────────────────────────────────────────────────────
  const [addingTopicForChapter, setAddingTopicForChapter] = useState<string | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicMins, setTopicMins] = useState(35);
  const [difficulty, setDifficulty] = useState(3);

  // ── Edit Topic ────────────────────────────────────────────────────────────
  const [editingTopic, setEditingTopic] = useState<{ topic: Topic; chapterId: string } | null>(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicMins, setEditTopicMins] = useState(35);
  const [editTopicDiff, setEditTopicDiff] = useState(3);

  // ── Add Todo ──────────────────────────────────────────────────────────────
  const [addingTodoForChapter, setAddingTodoForChapter] = useState<string | null>(null);
  const [todoText, setTodoText] = useState('');

  // ── Actions ───────────────────────────────────────────────────────────────
  const addChapter = () => {
    if (!chapterName.trim()) return;
    const ch: Chapter = {
      id: Date.now().toString(), subjectId: subject.id,
      name: chapterName.trim(), topics: [], priority: 'medium',
      estimatedMinutes: isChapterOnly ? chapterMins : undefined,
      todos: isChapterOnly ? [] : undefined,
    };
    updateSubject({ ...subject, chapters: [...subject.chapters, ch] });
    setChapterName(''); setChapterMins(45); setShowAddChapter(false);
  };

  const openEditChapter = (ch: Chapter) => {
    setEditingChapter(ch);
    setEditChapterName(ch.name);
    setEditChapterMins(ch.estimatedMinutes ?? 45);
  };

  const saveEditChapter = () => {
    if (!editingChapter || !editChapterName.trim()) return;
    updateSubject({
      ...subject, chapters: subject.chapters.map(ch =>
        ch.id === editingChapter.id
          ? { ...ch, name: editChapterName.trim(), estimatedMinutes: isChapterOnly ? editChapterMins : ch.estimatedMinutes }
          : ch
      ),
    });
    setEditingChapter(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'chapter') {
      updateSubject({ ...subject, chapters: subject.chapters.filter(c => c.id !== deleteTarget.chapterId) });
    } else if (deleteTarget.type === 'topic') {
      updateSubject({
        ...subject, chapters: subject.chapters.map(ch =>
          ch.id === deleteTarget.chapterId
            ? { ...ch, topics: ch.topics.filter(t => t.id !== deleteTarget.topicId) }
            : ch
        ),
      });
    } else if (deleteTarget.type === 'todo') {
      updateSubject({
        ...subject, chapters: subject.chapters.map(ch =>
          ch.id === deleteTarget.chapterId
            ? { ...ch, todos: (ch.todos ?? []).filter(t => t.id !== deleteTarget.todoId) }
            : ch
        ),
      });
    }
    setDeleteTarget(null);
  };

  const addTopic = () => {
    if (!topicName.trim() || !addingTopicForChapter) return;
    const diff = DIFFICULTIES.find(d => d.id === difficulty)!;
    const topic: Topic = {
      id: Date.now().toString(), chapterId: addingTopicForChapter, subjectId: subject.id,
      name: topicName.trim(), difficulty, estimatedMinutes: topicMins,
      completed: false, notes: '', revisionDates: [],
    };
    updateSubject({
      ...subject, chapters: subject.chapters.map(ch =>
        ch.id === addingTopicForChapter ? { ...ch, topics: [...ch.topics, topic] } : ch
      ),
    });
    setTopicName(''); setTopicMins(35); setDifficulty(3); setAddingTopicForChapter(null);
  };

  const openEditTopic = (topic: Topic, chapterId: string) => {
    setEditingTopic({ topic, chapterId });
    setEditTopicName(topic.name);
    setEditTopicMins(topic.estimatedMinutes);
    setEditTopicDiff(topic.difficulty);
  };

  const saveEditTopic = () => {
    if (!editingTopic || !editTopicName.trim()) return;
    updateSubject({
      ...subject, chapters: subject.chapters.map(ch =>
        ch.id === editingTopic.chapterId
          ? {
              ...ch, topics: ch.topics.map(t =>
                t.id === editingTopic.topic.id
                  ? { ...t, name: editTopicName.trim(), estimatedMinutes: editTopicMins, difficulty: editTopicDiff }
                  : t
              ),
            }
          : ch
      ),
    });
    setEditingTopic(null);
  };

  const addTodo = (chapterId: string) => {
    if (!todoText.trim()) return;
    const todo: ChapterTodo = { id: Date.now().toString(), text: todoText.trim(), completed: false };
    updateSubject({
      ...subject, chapters: subject.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, todos: [...(ch.todos ?? []), todo] } : ch
      ),
    });
    setTodoText(''); setAddingTodoForChapter(null);
  };

  const toggleTodo = (chapterId: string, todoId: string) => {
    updateSubject({
      ...subject, chapters: subject.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, todos: (ch.todos ?? []).map(t => t.id === todoId ? { ...t, completed: !t.completed } : t) }
          : ch
      ),
    });
  };

  const handleToggle = (chapterId: string, topicId: string) => {
    const wasCompleted = toggleTopicComplete(subject.id, chapterId, topicId);
    if (wasCompleted) gainXp(10);
  };

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

      {/* Hint */}
      <View style={[styles.hintBar, { backgroundColor: c.bgSecondary }]}>
        <Ionicons name="hand-left-outline" size={13} color={c.textFaint} />
        <Text style={[styles.hintTxt, { color: c.textFaint }]}>Tap & hold to delete · Tap pencil to edit</Text>
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
            <Text style={[styles.emptyTxt, { color: c.textMuted }]}>Tap + to add your first chapter</Text>
          </View>
        ) : (
          subject.chapters.map((chapter, ci) => (
            <Animated.View key={chapter.id} entering={FadeInDown.delay(ci * 60).springify()}>
              <TouchableOpacity
                activeOpacity={0.95}
                onLongPress={() => setDeleteTarget({ type: 'chapter', chapterId: chapter.id, label: chapter.name })}
                style={[styles.chapterCard, { backgroundColor: c.bgCard }]}
              >
                {/* Chapter header */}
                <View style={styles.chapterHeader}>
                  <View style={styles.chapterLeft}>
                    <View style={[styles.chDot, { backgroundColor: subject.color }]} />
                    <Text style={[styles.chapterName, { color: c.text }]}>{chapter.name}</Text>
                    {isChapterOnly && chapter.estimatedMinutes ? (
                      <View style={[styles.minsBadge, { backgroundColor: subject.color + '18' }]}>
                        <Ionicons name="time-outline" size={11} color={subject.color} />
                        <Text style={[styles.minsBadgeTxt, { color: subject.color }]}>{chapter.estimatedMinutes}m</Text>
                      </View>
                    ) : !isChapterOnly ? (
                      <Text style={[styles.chapterCount, { color: c.textFaint }]}>
                        {chapter.topics.filter(t => t.completed).length}/{chapter.topics.length}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.chapterActions}>
                    {/* Edit */}
                    <TouchableOpacity style={[styles.editBtn, { backgroundColor: c.accentSoft }]}
                      onPress={() => openEditChapter(chapter)}>
                      <Ionicons name="pencil-outline" size={14} color={c.accent} />
                    </TouchableOpacity>
                    {/* Add Topic / Add Todo */}
                    {isChapterOnly ? (
                      <TouchableOpacity style={[styles.chAddBtn, { backgroundColor: c.accentSoft }]}
                        onPress={() => { setAddingTodoForChapter(chapter.id); setTodoText(''); }}>
                        <Ionicons name="add" size={16} color={c.accent} />
                        <Text style={[styles.chAddTxt, { color: c.accent }]}>Todo</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[styles.chAddBtn, { backgroundColor: c.accentSoft }]}
                        onPress={() => { setAddingTopicForChapter(chapter.id); setTopicName(''); setTopicMins(35); setDifficulty(3); }}>
                        <Ionicons name="add" size={16} color={c.accent} />
                        <Text style={[styles.chAddTxt, { color: c.accent }]}>Topic</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Chapter-only: Todos */}
                {isChapterOnly && (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                    {(chapter.todos ?? []).length === 0 ? (
                      <TouchableOpacity style={[styles.emptyTopics, { borderColor: c.border }]}
                        onPress={() => { setAddingTodoForChapter(chapter.id); setTodoText(''); }}>
                        <Ionicons name="checkbox-outline" size={16} color={c.textFaint} />
                        <Text style={[styles.emptyTopicsTxt, { color: c.textFaint }]}>Add a todo task</Text>
                      </TouchableOpacity>
                    ) : (
                      (chapter.todos ?? []).map((todo, ti) => (
                        <Animated.View key={todo.id} entering={FadeInRight.delay(ti * 30).springify()}>
                          <TouchableOpacity
                            style={[styles.todoRow, { borderTopColor: c.border }]}
                            onPress={() => toggleTodo(chapter.id, todo.id)}
                            onLongPress={() => setDeleteTarget({ type: 'todo', chapterId: chapter.id, todoId: todo.id, label: todo.text })}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.checkbox,
                              { borderColor: todo.completed ? subject.color : c.border,
                                backgroundColor: todo.completed ? subject.color : 'transparent' }]}>
                              {todo.completed && <Ionicons name="checkmark" size={13} color="#fff" />}
                            </View>
                            <Text style={[styles.todoText, { color: todo.completed ? c.textMuted : c.text },
                              todo.completed && styles.done]}>{todo.text}</Text>
                          </TouchableOpacity>
                        </Animated.View>
                      ))
                    )}
                  </View>
                )}

                {/* Topic-based: Topics */}
                {!isChapterOnly && (
                  chapter.topics.length === 0 ? (
                    <TouchableOpacity style={[styles.emptyTopics, { borderColor: c.border, marginHorizontal: 14, marginBottom: 12 }]}
                      onPress={() => { setAddingTopicForChapter(chapter.id); }}>
                      <Ionicons name="add-circle-outline" size={18} color={c.textFaint} />
                      <Text style={[styles.emptyTopicsTxt, { color: c.textFaint }]}>Add a topic</Text>
                    </TouchableOpacity>
                  ) : (
                    chapter.topics.map((topic, ti) => {
                      const diff = DIFFICULTIES.find(d => d.id === topic.difficulty);
                      return (
                        <Animated.View key={topic.id} entering={FadeInRight.delay(ti * 40).springify()}>
                          <TouchableOpacity
                            style={[styles.topicRow, { borderTopColor: c.border }]}
                            onLongPress={() => setDeleteTarget({ type: 'topic', chapterId: chapter.id, topicId: topic.id, label: topic.name })}
                            activeOpacity={0.85}
                          >
                            <TouchableOpacity style={[styles.checkbox,
                              { borderColor: topic.completed ? subject.color : c.border,
                                backgroundColor: topic.completed ? subject.color : 'transparent' }]}
                              onPress={() => handleToggle(chapter.id, topic.id)}>
                              {topic.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.topicName, { color: topic.completed ? c.textMuted : c.text },
                                topic.completed && styles.done]}>{topic.name}</Text>
                              <View style={styles.diffRow}>
                                {diff && (
                                  <View style={[styles.diffBadge, { backgroundColor: diff.color + '20' }]}>
                                    <Text style={[styles.diffTxt, { color: diff.color }]}>{diff.label}</Text>
                                  </View>
                                )}
                                <View style={[styles.minsBadge, { backgroundColor: c.bgSecondary }]}>
                                  <Ionicons name="time-outline" size={11} color={c.textFaint} />
                                  <Text style={[styles.minsBadgeTxt, { color: c.textFaint }]}>{topic.estimatedMinutes}m</Text>
                                </View>
                              </View>
                            </View>
                            {/* Edit topic */}
                            <TouchableOpacity style={[styles.editBtn, { backgroundColor: c.accentSoft }]}
                              onPress={() => openEditTopic(topic, chapter.id)}>
                              <Ionicons name="pencil-outline" size={13} color={c.accent} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })
                  )
                )}
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Delete Confirmation ── */}
      <DeleteModal
        visible={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'todo' ? 'Todo' : deleteTarget?.type === 'topic' ? 'Topic' : 'Chapter'}?`}
        subtitle={`"${deleteTarget?.label}" will be permanently removed.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {/* ── Add Chapter Modal ── */}
      <Modal visible={showAddChapter} transparent animationType="slide" onRequestClose={() => setShowAddChapter(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setShowAddChapter(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>New Chapter</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="Chapter name..." placeholderTextColor={c.textFaint}
                value={chapterName} onChangeText={setChapterName} autoFocus
              />
              {isChapterOnly && (
                <>
                  <Text style={[styles.sLabel, { color: c.textMuted }]}>Estimated Reading Time</Text>
                  <MinutesStepper value={chapterMins} onChange={setChapterMins} color={subject.color} />
                </>
              )}
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: subject.color, opacity: chapterName.trim() ? 1 : 0.5, marginTop: 20 }]}
                onPress={addChapter} disabled={!chapterName.trim()}>
                <Text style={styles.createTxt}>Add Chapter</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Chapter Modal ── */}
      <Modal visible={!!editingChapter} transparent animationType="slide" onRequestClose={() => setEditingChapter(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setEditingChapter(null)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>Edit Chapter</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="Chapter name..." placeholderTextColor={c.textFaint}
                value={editChapterName} onChangeText={setEditChapterName} autoFocus
              />
              {isChapterOnly && (
                <>
                  <Text style={[styles.sLabel, { color: c.textMuted }]}>Estimated Reading Time</Text>
                  <MinutesStepper value={editChapterMins} onChange={setEditChapterMins} color={subject.color} />
                </>
              )}
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: subject.color, opacity: editChapterName.trim() ? 1 : 0.5, marginTop: 20 }]}
                onPress={saveEditChapter} disabled={!editChapterName.trim()}>
                <Text style={styles.createTxt}>Save Changes</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Topic Modal ── */}
      <Modal visible={!!addingTopicForChapter} transparent animationType="slide" onRequestClose={() => setAddingTopicForChapter(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setAddingTopicForChapter(null)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>New Topic</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="Topic name..." placeholderTextColor={c.textFaint}
                value={topicName} onChangeText={setTopicName} autoFocus
              />
              <Text style={[styles.sLabel, { color: c.textMuted }]}>Estimated Study Time</Text>
              <MinutesStepper value={topicMins} onChange={setTopicMins} color={subject.color} />
              <Text style={[styles.sLabel, { color: c.textMuted, marginTop: 16 }]}>Difficulty</Text>
              <View style={styles.diffPicker}>
                {DIFFICULTIES.map(d => (
                  <TouchableOpacity key={d.id} style={[styles.diffOption,
                    { borderColor: difficulty === d.id ? d.color : c.border,
                      backgroundColor: difficulty === d.id ? d.color + '20' : c.bgSecondary }]}
                    onPress={() => setDifficulty(d.id)}>
                    <Text style={[styles.diffOptTxt, { color: difficulty === d.id ? d.color : c.textMuted }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: subject.color, opacity: topicName.trim() ? 1 : 0.5, marginTop: 16 }]}
                onPress={addTopic} disabled={!topicName.trim()}>
                <Text style={styles.createTxt}>Add Topic</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Topic Modal ── */}
      <Modal visible={!!editingTopic} transparent animationType="slide" onRequestClose={() => setEditingTopic(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setEditingTopic(null)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>Edit Topic</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="Topic name..." placeholderTextColor={c.textFaint}
                value={editTopicName} onChangeText={setEditTopicName} autoFocus
              />
              <Text style={[styles.sLabel, { color: c.textMuted }]}>Estimated Study Time</Text>
              <MinutesStepper value={editTopicMins} onChange={setEditTopicMins} color={subject.color} />
              <Text style={[styles.sLabel, { color: c.textMuted, marginTop: 16 }]}>Difficulty</Text>
              <View style={styles.diffPicker}>
                {DIFFICULTIES.map(d => (
                  <TouchableOpacity key={d.id} style={[styles.diffOption,
                    { borderColor: editTopicDiff === d.id ? d.color : c.border,
                      backgroundColor: editTopicDiff === d.id ? d.color + '20' : c.bgSecondary }]}
                    onPress={() => setEditTopicDiff(d.id)}>
                    <Text style={[styles.diffOptTxt, { color: editTopicDiff === d.id ? d.color : c.textMuted }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: subject.color, opacity: editTopicName.trim() ? 1 : 0.5, marginTop: 16 }]}
                onPress={saveEditTopic} disabled={!editTopicName.trim()}>
                <Text style={styles.createTxt}>Save Changes</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Todo Modal ── */}
      <Modal visible={!!addingTodoForChapter} transparent animationType="slide" onRequestClose={() => setAddingTodoForChapter(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setAddingTodoForChapter(null)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>New Todo</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="e.g. Read pages 1-30..." placeholderTextColor={c.textFaint}
                value={todoText} onChangeText={setTodoText} autoFocus
              />
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: subject.color, opacity: todoText.trim() ? 1 : 0.5 }]}
                onPress={() => addingTodoForChapter && addTodo(addingTodoForChapter)}
                disabled={!todoText.trim()}>
                <Text style={styles.createTxt}>Add Todo</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14,
  },
  backBtn: { padding: 4 },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontSize: 18, fontFamily: FONTS.bold },
  subjectSub: { fontSize: 12, marginTop: 1, fontFamily: FONTS.regular },
  addChBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hintBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  hintTxt: { fontSize: 11, fontFamily: FONTS.regular },
  progBg: { height: 3 },
  progFill: { height: '100%' },
  content: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTxt: { fontSize: 15, textAlign: 'center', fontFamily: FONTS.regular },
  chapterCard: { borderRadius: RADIUS.xl, marginBottom: 12, overflow: 'hidden' },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  chapterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  chDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  chapterName: { fontSize: 15, fontFamily: FONTS.bold, flex: 1 },
  chapterCount: { fontSize: 12, fontFamily: FONTS.regular },
  minsBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  minsBadgeTxt: { fontSize: 11, fontFamily: FONTS.semibold },
  chapterActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chAddTxt: { fontSize: 12, fontFamily: FONTS.bold },
  emptyTopics: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginBottom: 4, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12,
  },
  emptyTopicsTxt: { fontSize: 13, fontFamily: FONTS.regular },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  todoText: { flex: 1, fontSize: 14, fontFamily: FONTS.medium },
  topicRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  topicName: { fontSize: 14, fontFamily: FONTS.semibold, marginBottom: 4 },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffTxt: { fontSize: 11, fontFamily: FONTS.bold },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontFamily: FONTS.bold, marginBottom: 20 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, marginBottom: 16, fontFamily: FONTS.regular },
  sLabel: { fontSize: 12, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  diffPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 2, alignItems: 'center' },
  diffOptTxt: { fontSize: 12, fontFamily: FONTS.bold },
  createBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  createTxt: { color: '#fff', fontSize: 17, fontFamily: FONTS.bold },
});
