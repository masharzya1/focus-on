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
import { isChapterOnly, isSubjectTopicBased, type Chapter, type Topic } from '@/types/study';



// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ visible, title, subtitle, onCancel, onConfirm }: {
  visible: boolean; title: string; subtitle: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  const { colors: c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={dm.overlay} onPress={onCancel}>
        <Pressable style={[dm.card, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
          <View style={[dm.icon, { backgroundColor: '#FEE2E2' }]}>
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
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontFamily: FONTS.bold, textAlign: 'center' },
  sub: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  btn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 15, fontFamily: FONTS.bold },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateSubject, toggleTopicComplete, gainXp } = useStudy();
  const { colors: c } = useTheme();
  const router = useRouter();

  const subject = state.subjects.find(s => s.id === id);
  if (!subject) return null;

  const topicBased = isSubjectTopicBased(subject);
  const allTopics  = subject.chapters.flatMap(ch => ch.topics);
  const doneTopics = allTopics.filter(t => t.completed).length;
  const doneChapters = subject.chapters.filter(ch => ch.completed).length;

  // Progress
  const progress = topicBased
    ? (allTopics.length > 0 ? Math.round(doneTopics / allTopics.length * 100) : 0)
    : (subject.chapters.length > 0 ? Math.round(doneChapters / subject.chapters.length * 100) : 0);

  // ── Add Chapter ───────────────────────────────────────────────────────────
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [chapterName, setChapterName]       = useState('');

  // ── Edit Chapter ──────────────────────────────────────────────────────────
  const [editingChapter, setEditingChapter]     = useState<Chapter | null>(null);
  const [editChapterName, setEditChapterName]   = useState('');

  // ── Add Topic ─────────────────────────────────────────────────────────────
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
  const [topicName, setTopicName]           = useState('');
  // ── Edit Topic ────────────────────────────────────────────────────────────
  const [editingTopic, setEditingTopic]   = useState<{ topic: Topic; chapterId: string } | null>(null);
  const [editTopicName, setEditTopicName] = useState('');

  // ── Delete ────────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'chapter' | 'topic';
    chapterId?: string; topicId?: string; label: string;
  } | null>(null);

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleChapterComplete = (chapterId: string) => {
    const chapter = subject.chapters.find(ch => ch.id === chapterId);
    const willComplete = !chapter?.completed;
    updateSubject({
      ...subject,
      chapters: subject.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, completed: !ch.completed, completedAt: !ch.completed ? new Date().toISOString() : undefined }
          : ch
      ),
    });
    if (willComplete) gainXp(10);
  };

  const addChapter = () => {
    if (!chapterName.trim()) return;
    updateSubject({
      ...subject,
      chapters: [...subject.chapters, {
        id: Date.now().toString(), subjectId: subject.id,
        name: chapterName.trim(), topics: [],
        completed: false, priority: 'medium',
      }],
    });
    setChapterName(''); setShowAddChapter(false);
  };

  const saveEditChapter = () => {
    if (!editingChapter || !editChapterName.trim()) return;
    updateSubject({
      ...subject,
      chapters: subject.chapters.map(ch =>
        ch.id === editingChapter.id ? { ...ch, name: editChapterName.trim() } : ch
      ),
    });
    setEditingChapter(null);
  };

  const addTopic = () => {
    if (!topicName.trim() || !addingTopicFor) return;
    updateSubject({
      ...subject,
      chapters: subject.chapters.map(ch =>
        ch.id === addingTopicFor
          ? {
              ...ch,
              // Adding a topic → chapter is no longer "chapter-only" → reset completed
              completed: false,
              topics: [...ch.topics, {
                id: Date.now().toString(), chapterId: addingTopicFor, subjectId: subject.id,
                name: topicName.trim(), difficulty: 3,
                completed: false, notes: '', revisionDates: [],
              }],
            }
          : ch
      ),
    });
    setTopicName(''); setAddingTopicFor(null);
  };

  const saveEditTopic = () => {
    if (!editingTopic || !editTopicName.trim()) return;
    updateSubject({
      ...subject,
      chapters: subject.chapters.map(ch =>
        ch.id === editingTopic.chapterId
          ? {
              ...ch, topics: ch.topics.map(t =>
                t.id === editingTopic.topic.id
                  ? { ...t, name: editTopicName.trim() }
                  : t
              ),
            }
          : ch
      ),
    });
    setEditingTopic(null);
  };

  const handleToggleTopic = (chapterId: string, topicId: string) => {
    const didComplete = toggleTopicComplete(subject.id, chapterId, topicId);
    if (didComplete) gainXp(10);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'chapter') {
      updateSubject({ ...subject, chapters: subject.chapters.filter(c => c.id !== deleteTarget.chapterId) });
    } else if (deleteTarget.type === 'topic') {
      updateSubject({
        ...subject,
        chapters: subject.chapters.map(ch =>
          ch.id === deleteTarget.chapterId
            ? { ...ch, topics: ch.topics.filter(t => t.id !== deleteTarget.topicId) }
            : ch
        ),
      });
    }
    setDeleteTarget(null);
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
              {topicBased
                ? `${doneTopics}/${allTopics.length} topics · ${progress}%`
                : `${doneChapters}/${subject.chapters.length} chapters · ${progress}%`}
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
        <Ionicons name="hand-left-outline" size={12} color={c.textFaint} />
        <Text style={[styles.hintTxt, { color: c.textFaint }]}>
          Tap & hold to delete · Pencil to edit
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progBg, { backgroundColor: c.border }]}>
        <View style={[styles.progFill, { backgroundColor: subject.color, width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {subject.chapters.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-open" size={48} color={c.textFaint} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTxt, { color: c.textMuted }]}>Tap + to add your first chapter</Text>
          </View>
        ) : (
          subject.chapters.map((chapter, ci) => {
            const chOnly = isChapterOnly(chapter);
            return (
              <Animated.View key={chapter.id} entering={FadeInDown.delay(ci * 60).springify()}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onLongPress={() => setDeleteTarget({ type: 'chapter', chapterId: chapter.id, label: chapter.name })}
                  style={[styles.chapterCard, { backgroundColor: c.bgCard },
                    chOnly && chapter.completed && { opacity: 0.7 }]}
                >
                  {/* Chapter header */}
                  <View style={styles.chapterHeader}>
                    {/* Checkbox for chapter-only */}
                    {chOnly ? (
                      <TouchableOpacity
                        style={[styles.bigCheckbox, {
                          borderColor: chapter.completed ? subject.color : c.border,
                          backgroundColor: chapter.completed ? subject.color : 'transparent',
                        }]}
                        onPress={() => toggleChapterComplete(chapter.id)}>
                        {chapter.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.chDot, { backgroundColor: subject.color }]} />
                    )}

                    <Text style={[styles.chapterName, { color: c.text },
                      chOnly && chapter.completed && styles.strikethrough]}>
                      {chapter.name}
                    </Text>

                    {/* Topic count for topic-based chapters */}
                    {!chOnly && (
                      <Text style={[styles.chapterCount, { color: c.textFaint }]}>
                        {chapter.topics.filter(t => t.completed).length}/{chapter.topics.length}
                      </Text>
                    )}

                    {/* Actions */}
                    <View style={styles.chapterActions}>
                      <TouchableOpacity style={[styles.editBtn, { backgroundColor: c.accentSoft }]}
                        onPress={() => { setEditingChapter(chapter); setEditChapterName(chapter.name); }}>
                        <Ionicons name="pencil-outline" size={13} color={c.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.chAddBtn, { backgroundColor: c.accentSoft }]}
                        onPress={() => { setAddingTopicFor(chapter.id); setTopicName(''); }}>
                        <Ionicons name="add" size={15} color={c.accent} />
                        <Text style={[styles.chAddTxt, { color: c.accent }]}>Topic</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Topics inside chapter */}
                  {!chOnly && (
                    chapter.topics.length === 0 ? (
                      <TouchableOpacity
                        style={[styles.emptyInner, { borderColor: c.border, marginHorizontal: 14, marginBottom: 12 }]}
                        onPress={() => { setAddingTopicFor(chapter.id); }}>
                        <Ionicons name="add-circle-outline" size={16} color={c.textFaint} />
                        <Text style={[styles.emptyInnerTxt, { color: c.textFaint }]}>Add a topic</Text>
                      </TouchableOpacity>
                    ) : (
                      chapter.topics.map((topic, ti) => {
                          return (
                          <Animated.View key={topic.id} entering={FadeInRight.delay(ti * 40).springify()}>
                            <TouchableOpacity
                              style={[styles.topicRow, { borderTopColor: c.border }]}
                              onLongPress={() => setDeleteTarget({
                                type: 'topic', chapterId: chapter.id, topicId: topic.id, label: topic.name,
                              })}
                              activeOpacity={0.85}
                            >
                              <TouchableOpacity
                                style={[styles.checkbox, {
                                  borderColor: topic.completed ? subject.color : c.border,
                                  backgroundColor: topic.completed ? subject.color : 'transparent',
                                }]}
                                onPress={() => handleToggleTopic(chapter.id, topic.id)}>
                                {topic.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                              </TouchableOpacity>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.topicName, { color: topic.completed ? c.textMuted : c.text },
                                  topic.completed && styles.strikethrough]}>
                                  {topic.name}
                                </Text>
  
                              </View>
                              <TouchableOpacity
                                style={[styles.editBtn, { backgroundColor: c.accentSoft }]}
                                onPress={() => {
                                  setEditingTopic({ topic, chapterId: chapter.id });
                                  setEditTopicName(topic.name);
                                                }}>
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
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Delete Modal */}
      <DeleteModal
        visible={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'topic' ? 'Topic' : 'Chapter'}?`}
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
              <Text style={[styles.sheetHint, { color: c.textMuted }]}>
                Leave as-is to use the chapter itself as a to-do, or add topics inside for detailed tracking.
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="Chapter name..." placeholderTextColor={c.textFaint}
                value={chapterName} onChangeText={setChapterName} autoFocus
              />
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: subject.color, opacity: chapterName.trim() ? 1 : 0.5 }]}
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
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: subject.color, opacity: editChapterName.trim() ? 1 : 0.5 }]}
                onPress={saveEditChapter} disabled={!editChapterName.trim()}>
                <Text style={styles.createTxt}>Save Changes</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Topic Modal ── */}
      <Modal visible={!!addingTopicFor} transparent animationType="slide" onRequestClose={() => setAddingTopicFor(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setAddingTopicFor(null)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>New Topic</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="Topic name..." placeholderTextColor={c.textFaint}
                value={topicName} onChangeText={setTopicName} autoFocus
              />

              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: subject.color, opacity: topicName.trim() ? 1 : 0.5, marginTop: 16 }]}
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

              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: subject.color, opacity: editTopicName.trim() ? 1 : 0.5, marginTop: 16 }]}
                onPress={saveEditTopic} disabled={!editTopicName.trim()}>
                <Text style={styles.createTxt}>Save Changes</Text>
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
  hintBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 5 },
  hintTxt: { fontSize: 11, fontFamily: FONTS.regular },
  progBg: { height: 3 },
  progFill: { height: '100%' },
  content: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTxt: { fontSize: 15, textAlign: 'center', fontFamily: FONTS.regular },
  chapterCard: { borderRadius: RADIUS.xl, marginBottom: 12, overflow: 'hidden' },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  bigCheckbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  chapterName: { fontSize: 15, fontFamily: FONTS.bold, flex: 1 },
  chapterCount: { fontSize: 12, fontFamily: FONTS.regular },
  chapterActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  chAddTxt: { fontSize: 11, fontFamily: FONTS.bold },
  emptyInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginBottom: 4, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 10,
  },
  emptyInnerTxt: { fontSize: 13, fontFamily: FONTS.regular },
  topicRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  topicName: { fontSize: 14, fontFamily: FONTS.semibold, marginBottom: 4 },
  strikethrough: { textDecorationLine: 'line-through', opacity: 0.5 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  diffTxt: { fontSize: 11, fontFamily: FONTS.bold },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontFamily: FONTS.bold, marginBottom: 8 },
  sheetHint: { fontSize: 13, fontFamily: FONTS.regular, marginBottom: 16, lineHeight: 18 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, marginBottom: 16, fontFamily: FONTS.regular },
  sLabel: { fontSize: 12, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  diffPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 2 },
  diffOptTxt: { fontSize: 12, fontFamily: FONTS.bold },
  createBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  createTxt: { color: '#fff', fontSize: 17, fontFamily: FONTS.bold },
});