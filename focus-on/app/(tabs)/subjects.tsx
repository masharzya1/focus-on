<<<<<<< HEAD
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
  const [topicBased, setTopicBased] = useState(false); // false = Chapter+Topic, true = শুধু Chapter

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
          onLongPress={() => Alert.alert('Delete?', `"${item.name}" delete করবে?`, [
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
          <Text style={styles.addTxt}>নতুন</Text>
        </TouchableOpacity>
      </View>

      {state.subjects.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📚</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>কোনো Subject নেই</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>প্রথম subject বানাও!</Text>
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
            <Text style={[styles.sheetTitle, { color: c.text }]}>নতুন Subject</Text>

            {/* Name */}
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="Subject এর নাম..." placeholderTextColor={c.textFaint}
              value={name} onChangeText={setName} autoFocus
            />

            {/* Structure type */}
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Structure</Text>
            <View style={styles.typeRow}>
              {[
                { val: false, label: '📖 Chapter + Topic', desc: 'Chapter এর ভেতরে topic' },
                { val: true, label: '📋 শুধু Chapter', desc: 'Topic ছাড়া' },
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

            {/* Color */}
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Color</Text>
            <View style={styles.colorRow}>
              {SUBJECT_COLORS.map(cl => (
                <TouchableOpacity key={cl} style={[styles.colorDot, { backgroundColor: cl },
                  color === cl && styles.colorSelected]} onPress={() => setColor(cl)} />
              ))}
            </View>

            {/* Icon */}
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
              <Text style={styles.createTxt}>তৈরি করো</Text>
            </TouchableOpacity>
=======
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Pressable, Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import { SUBJECT_COLORS, type Subject, type Chapter, type Topic } from '@/types/study';

const SUBJECT_ICONS = [
  { name: 'calculator', icon: 'calculator-outline' as const },
  { name: 'flask',      icon: 'flask-outline' as const },
  { name: 'globe',      icon: 'globe-outline' as const },
  { name: 'laptop',     icon: 'laptop-outline' as const },
  { name: 'book',       icon: 'book-outline' as const },
  { name: 'musical-notes', icon: 'musical-notes-outline' as const },
  { name: 'color-palette', icon: 'color-palette-outline' as const },
  { name: 'leaf',       icon: 'leaf-outline' as const },
  { name: 'pulse',      icon: 'pulse-outline' as const },
  { name: 'planet',     icon: 'planet-outline' as const },
];

const ICON_NAMES = SUBJECT_ICONS.map(x => x.name);

export default function SubjectsScreen() {
  const { state, addSubject, updateSubject, deleteSubject, toggleTopicComplete, gainXp, getSubjectProgress } = useStudy();
  const { colors: c } = useTheme();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(SUBJECT_COLORS[0]);
  const [newIcon, setNewIcon] = useState('book');
  const [expandedSubject, setExpandedSubject] = useState<string|null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string|null>(null);
  const [addingChapter, setAddingChapter] = useState<string|null>(null);
  const [chapterName, setChapterName] = useState('');
  const [addingTopic, setAddingTopic] = useState<string|null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicDifficulty, setTopicDifficulty] = useState(3);

  const levels = [
    { id: 1, label: 'Very Easy', minutes: 15 },
    { id: 2, label: 'Easy',      minutes: 25 },
    { id: 3, label: 'Medium',    minutes: 35 },
    { id: 4, label: 'Hard',      minutes: 50 },
    { id: 5, label: 'Very Hard', minutes: 60 },
  ];

  const createSubject = () => {
    if (!newName.trim()) return;
    const subject: Subject = {
      id: Date.now().toString(), name: newName.trim(),
      color: newColor, icon: newIcon, chapters: [],
      createdAt: new Date().toISOString(),
    };
    addSubject(subject);
    setNewName(''); setShowCreate(false);
  };

  const createChapter = (subjectId: string) => {
    if (!chapterName.trim()) return;
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const chapter: Chapter = {
      id: Date.now().toString(), subjectId,
      name: chapterName.trim(), topics: [], priority: 'medium',
    };
    updateSubject({ ...subject, chapters: [...subject.chapters, chapter] });
    setChapterName(''); setAddingChapter(null);
  };

  const createTopic = (subjectId: string, chapterId: string) => {
    if (!topicName.trim()) return;
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const level = levels.find(l => l.id === topicDifficulty);
    const topic: Topic = {
      id: Date.now().toString(), chapterId, subjectId,
      name: topicName.trim(), difficulty: topicDifficulty,
      estimatedMinutes: level?.minutes || 30, completed: false,
      notes: '', revisionDates: [],
    };
    updateSubject({ ...subject, chapters: subject.chapters.map(ch =>
      ch.id === chapterId ? { ...ch, topics: [...ch.topics, topic] } : ch
    )});
    setTopicName(''); setAddingTopic(null);
  };

  const handleTopicToggle = useCallback((subjectId: string, chapterId: string, topicId: string) => {
    const wasCompleted = toggleTopicComplete(subjectId, chapterId, topicId);
    if (wasCompleted) gainXp(topicDifficulty * 25);
  }, [toggleTopicComplete, gainXp, topicDifficulty]);

  const getIconComponent = (iconName: string) => {
    const found = SUBJECT_ICONS.find(x => x.name === iconName);
    return found ? found.icon : 'book-outline';
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={ss.header}>
          <View>
            <Text style={[ss.title, { color: c.text }]}>Subjects</Text>
            <Text style={[ss.subtitle, { color: c.textMuted }]}>
              {state.subjects.length} subject{state.subjects.length !== 1 ? 's' : ''} · {state.subjects.flatMap(s => s.chapters.flatMap(ch => ch.topics)).length} topics
            </Text>
          </View>
          <TouchableOpacity style={[ss.addBtn, { backgroundColor: c.accent, borderBottomWidth: 3, borderBottomColor: c.accentDark }]} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={ss.addBtnText}>New</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={ss.body}>
          {state.subjects.length === 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[ss.emptyCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <View style={[ss.emptyIcon, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="book-outline" size={32} color={c.accent} />
              </View>
              <Text style={[ss.emptyText, { color: c.text }]}>No subjects yet</Text>
              <Text style={[ss.emptySub, { color: c.textMuted }]}>Tap "New" to add your first subject</Text>
            </Animated.View>
          )}

          {state.subjects.map((subject, idx) => {
            const progress = getSubjectProgress(subject.id);
            const expanded = expandedSubject === subject.id;
            const allTopics = subject.chapters.flatMap(ch => ch.topics);
            const doneTopics = allTopics.filter(t => t.completed).length;
            const iconName = getIconComponent(subject.icon);

            return (
              <Animated.View key={subject.id} entering={FadeInDown.delay(idx * 60).duration(400)}>
                <View style={[ss.subjectCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
                  {/* Subject header */}
                  <TouchableOpacity
                    style={ss.subjectRow}
                    onPress={() => setExpandedSubject(expanded ? null : subject.id)}
                    onLongPress={() => Alert.alert('Delete Subject', `Delete "${subject.name}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteSubject(subject.id) },
                    ])}
                  >
                    <View style={[ss.subjectIconBox, { backgroundColor: subject.color + '20' }]}>
                      <Ionicons name={iconName} size={22} color={subject.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ss.subjectName, { color: c.text }]}>{subject.name}</Text>
                      <Text style={[ss.subjectMeta, { color: c.textMuted }]}>
                        {doneTopics}/{allTopics.length} topics · {progress}%
                      </Text>
                      <View style={[ss.progressBar, { backgroundColor: c.border, marginTop: 6 }]}>
                        <View style={[ss.progressFill, { width: `${progress}%`, backgroundColor: subject.color }]} />
                      </View>
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textFaint} />
                  </TouchableOpacity>

                  {/* Chapters */}
                  {expanded && (
                    <View style={[ss.chaptersWrap, { borderTopColor: c.border }]}>
                      {subject.chapters.map(chapter => {
                        const chExpanded = expandedChapter === chapter.id;
                        const doneCh = chapter.topics.filter(t => t.completed).length;
                        return (
                          <View key={chapter.id}>
                            <TouchableOpacity
                              style={[ss.chapterRow, { borderBottomColor: c.border }]}
                              onPress={() => setExpandedChapter(chExpanded ? null : chapter.id)}
                            >
                              <Ionicons name={chExpanded ? 'folder-open-outline' : 'folder-outline'} size={16} color={c.textMuted} />
                              <Text style={[ss.chapterName, { color: c.text }]}>{chapter.name}</Text>
                              <Text style={[ss.chapterCount, { color: c.textMuted }]}>{doneCh}/{chapter.topics.length}</Text>
                              <Ionicons name={chExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={c.textFaint} />
                            </TouchableOpacity>

                            {chExpanded && (
                              <View style={[ss.topicsWrap, { borderLeftColor: subject.color + '40' }]}>
                                {chapter.topics.map(topic => (
                                  <TouchableOpacity
                                    key={topic.id}
                                    style={ss.topicRow}
                                    onPress={() => handleTopicToggle(subject.id, chapter.id, topic.id)}
                                  >
                                    <View style={[ss.checkbox, {
                                      borderColor: topic.completed ? subject.color : c.border,
                                      backgroundColor: topic.completed ? subject.color : 'transparent',
                                    }]}>
                                      {topic.completed && <Ionicons name="checkmark" size={11} color="#fff" />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={[ss.topicName, { color: c.text }, topic.completed && { color: c.textMuted, textDecorationLine: 'line-through' }]}>
                                        {topic.name}
                                      </Text>
                                      <Text style={[ss.topicSub, { color: c.textFaint }]}>{topic.estimatedMinutes}m</Text>
                                    </View>
                                  </TouchableOpacity>
                                ))}

                                {addingTopic === chapter.id ? (
                                  <View style={ss.addForm}>
                                    <TextInput
                                      style={[ss.miniInput, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                                      placeholder="Topic name..."
                                      placeholderTextColor={c.textFaint}
                                      value={topicName}
                                      onChangeText={setTopicName}
                                      autoFocus
                                    />
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                      {levels.map(l => (
                                        <TouchableOpacity
                                          key={l.id}
                                          onPress={() => setTopicDifficulty(l.id)}
                                          style={[ss.diffChip, { backgroundColor: topicDifficulty === l.id ? c.accent : c.bgSecondary }]}
                                        >
                                          <Text style={[ss.diffChipText, { color: topicDifficulty === l.id ? '#fff' : c.textMuted }]}>{l.label}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </ScrollView>
                                    <View style={ss.miniActions}>
                                      <TouchableOpacity onPress={() => createTopic(subject.id, chapter.id)} style={[ss.miniSave, { backgroundColor: c.accent, borderBottomWidth: 2, borderBottomColor: c.accentDark }]}>
                                        <Text style={ss.miniSaveText}>Add</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => setAddingTopic(null)}>
                                        <Text style={{ color: c.textMuted, fontWeight: '500' }}>Cancel</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                ) : (
                                  <TouchableOpacity onPress={() => setAddingTopic(chapter.id)} style={ss.addTopicBtn}>
                                    <Ionicons name="add-circle-outline" size={16} color={c.textMuted} />
                                    <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '500' }}>Add topic</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}

                      {addingChapter === subject.id ? (
                        <View style={[ss.addForm, { borderTopWidth: 1, borderTopColor: c.border }]}>
                          <TextInput
                            style={[ss.miniInput, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                            placeholder="Chapter name..."
                            placeholderTextColor={c.textFaint}
                            value={chapterName}
                            onChangeText={setChapterName}
                            autoFocus
                          />
                          <View style={ss.miniActions}>
                            <TouchableOpacity onPress={() => createChapter(subject.id)} style={[ss.miniSave, { backgroundColor: c.accent, borderBottomWidth: 2, borderBottomColor: c.accentDark }]}>
                              <Text style={ss.miniSaveText}>Add</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setAddingChapter(null)}>
                              <Text style={{ color: c.textMuted, fontWeight: '500' }}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => setAddingChapter(subject.id)}
                          style={[ss.addChapterBtn, { borderTopColor: c.border }]}
                        >
                          <Ionicons name="folder-open-outline" size={16} color={c.accent} />
                          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Add chapter</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Subject Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <Pressable style={ss.overlay} onPress={() => setShowCreate(false)}>
          <Pressable style={[ss.modalBox, { backgroundColor: c.bgCard, borderColor: c.border }]} onPress={() => {}}>
            <View style={ss.modalHandle} />
            <Text style={[ss.modalTitle, { color: c.text }]}>New Subject</Text>
            <TextInput
              style={[ss.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="Subject name (e.g. Physics)"
              placeholderTextColor={c.textFaint}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Text style={[ss.fieldLabel, { color: c.textMuted }]}>ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {SUBJECT_ICONS.map(si => (
                <TouchableOpacity
                  key={si.name}
                  onPress={() => setNewIcon(si.name)}
                  style={[ss.iconChip, {
                    backgroundColor: newIcon === si.name ? c.accent : c.bgSecondary,
                    borderWidth: newIcon === si.name ? 0 : 1,
                    borderColor: c.border,
                  }]}
                >
                  <Ionicons name={si.icon} size={22} color={newIcon === si.name ? '#fff' : c.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[ss.fieldLabel, { color: c.textMuted }]}>COLOR</Text>
            <View style={ss.colorRow}>
              {SUBJECT_COLORS.map(col => (
                <TouchableOpacity
                  key={col}
                  onPress={() => setNewColor(col)}
                  style={[ss.colorDot, { backgroundColor: col }, newColor === col && { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] }]}
                />
              ))}
            </View>
            <View style={ss.modalActions}>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={[ss.cancelBtn, { borderColor: c.border }]}>
                <Text style={{ color: c.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createSubject} style={[ss.saveBtn, { backgroundColor: c.accent, borderBottomWidth: 4, borderBottomColor: c.accentDark }]}>
                <Text style={ss.saveBtnText}>Create Subject</Text>
              </TouchableOpacity>
            </View>
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconCircle: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 12, marginBottom: 8 },
  progBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  cardRight: { alignItems: 'center', gap: 4 },
  progPct: { fontSize: 14, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySub: { fontSize: 14, marginTop: 8 },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2 },
  typeLbl: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  typeDesc: { fontSize: 11 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  iconRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  createBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  createTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
=======
const ss = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.lg },
  addBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  body: { padding: 16 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: RADIUS.xxl, borderWidth: 1, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 17, fontWeight: '700' },
  emptySub:  { fontSize: 13, textAlign: 'center' },
  subjectCard: { borderRadius: RADIUS.xl, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  subjectRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  subjectIconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontSize: 16, fontWeight: '700' },
  subjectMeta: { fontSize: 11, marginTop: 3 },
  progressBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  chaptersWrap: { borderTopWidth: 1, paddingHorizontal: 16, paddingBottom: 10 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, borderBottomWidth: 1 },
  chapterName: { flex: 1, fontSize: 13, fontWeight: '600' },
  chapterCount: { fontSize: 11 },
  topicsWrap: { marginLeft: 14, borderLeftWidth: 2, paddingLeft: 14, marginBottom: 4 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  topicName: { fontSize: 13, fontWeight: '500' },
  topicSub: { fontSize: 10, marginTop: 1 },
  addForm: { paddingTop: 10, paddingBottom: 8 },
  addTopicBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addChapterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingVertical: 12 },
  miniInput: { borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  miniActions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  miniSave: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: RADIUS.md },
  miniSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  diffChip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: RADIUS.full, marginRight: 8 },
  diffChipText: { fontSize: 12, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: '#00000070', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 24, borderWidth: 1, borderBottomWidth: 0 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#00000020', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 18 },
  input: { borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 18 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  iconChip: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 22 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  saveBtn: { flex: 1, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
});
