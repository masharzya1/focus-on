import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Pressable, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';
import { RADIUS, FONTS } from '@/constants/theme';
import { SUBJECT_COLORS, SUBJECT_ICONS, isSubjectTopicBased, type Subject } from '@/types/study';

function DeleteModal({ visible, name, onCancel, onConfirm, t }: {
  visible: boolean; name: string; onCancel: () => void; onConfirm: () => void; t: any;
}) {
  const { colors: c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={dm.overlay} onPress={onCancel}>
        <Pressable style={[dm.card, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
          <View style={[dm.icon, { backgroundColor: '#FFE8EE' }]}>
            <Ionicons name="trash-outline" size={26} color="#FF5F6D" />
          </View>
          <Text style={[dm.title, { color: c.text }]}>{t.subjectsDeleteTitle}</Text>
          <Text style={[dm.sub, { color: c.textMuted }]}>{t.subjectsDeleteMsg(name)}</Text>
          <View style={dm.btnRow}>
            <TouchableOpacity style={[dm.btn, { backgroundColor: c.bgSecondary }]} onPress={onCancel}>
              <Text style={[dm.btnTxt, { color: c.textMuted }]}>{t.subjectsCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[dm.btn, { backgroundColor: '#FF5F6D' }]} onPress={onConfirm}>
              <Text style={[dm.btnTxt, { color: '#fff' }]}>{t.subjectsDelete}</Text>
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

function SubjectCard({ item, index, onPress, onLongPress, onEdit, progress, t }: {
  item: Subject; index: number; progress: number;
  onPress: () => void; onLongPress: () => void; onEdit: () => void; t: any;
}) {
  const { colors: c } = useTheme();
  const topicBased  = isSubjectTopicBased(item);
  const totalTopics = item.chapters.flatMap(ch => ch.topics).length;
  const doneTopics  = item.chapters.flatMap(ch => ch.topics).filter(tp => tp.completed).length;
  const doneChapters = item.chapters.filter(ch => ch.completed).length;
  const subInfo = topicBased
    ? `${item.chapters.length} chapters · ${doneTopics}/${totalTopics} topics`
    : `${doneChapters}/${item.chapters.length} chapters done`;

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).springify()}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: c.bgCard }]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.82}
      >
        {/* Colored left strip */}
        <View style={[styles.cardStrip, { backgroundColor: item.color }]} />

        <View style={[styles.iconCircle, { backgroundColor: item.color + '18' }]}>
          <Ionicons name={item.icon as any} size={26} color={item.color} />
        </View>

        <View style={styles.cardBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Text style={[styles.cardName, { color: c.text }]}>{item.name}</Text>
            {topicBased && (
              <View style={[styles.typeBadge, { backgroundColor: item.color + '18' }]}>
                <Text style={[styles.typeBadgeTxt, { color: item.color }]}>Topics</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardSub, { color: c.textMuted }]}>{subInfo}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <View style={[styles.progBg, { backgroundColor: c.border, flex: 1 }]}>
              <View style={[styles.progFill, { backgroundColor: item.color, width: `${progress}%` }]} />
            </View>
            <Text style={[styles.progPct, { color: item.color }]}>{progress}%</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: c.bgSecondary }]}
          onPress={onEdit}>
          <Ionicons name="pencil" size={13} color={c.accent} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ColorIconPicker({ color, icon, onColor, onIcon }: {
  color: string; icon: string;
  onColor: (c: string) => void; onIcon: (i: string) => void;
}) {
  const { colors: c } = useTheme();
  return (
    <>
      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Color</Text>
      <View style={styles.colorRow}>
        {SUBJECT_COLORS.map(cl => (
          <TouchableOpacity key={cl}
            style={[styles.colorDot, { backgroundColor: cl },
              color === cl && { borderWidth: 3, borderColor: '#fff', shadowColor: cl, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 }]}
            onPress={() => onColor(cl)} />
        ))}
      </View>
      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Icon</Text>
      <View style={styles.iconRow}>
        {SUBJECT_ICONS.map(ic => (
          <TouchableOpacity key={ic}
            style={[styles.iconBtn, {
              backgroundColor: icon === ic ? color + '22' : c.bgSecondary,
              borderColor: icon === ic ? color : 'transparent',
              borderWidth: 2,
            }]}
            onPress={() => onIcon(ic)}>
            <Ionicons name={ic as any} size={20} color={icon === ic ? color : c.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

export default function SubjectsScreen() {
  const { state, addSubject, updateSubject, deleteSubject, getSubjectProgress } = useStudy();
  const { colors: c } = useTheme();
  const t = useT();
  const router = useRouter();

  const [showCreate, setShowCreate]       = useState(false);
  const [name, setName]                   = useState('');
  const [color, setColor]                 = useState(SUBJECT_COLORS[0]);
  const [icon, setIcon]                   = useState(SUBJECT_ICONS[0]);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName]           = useState('');
  const [editColor, setEditColor]         = useState(SUBJECT_COLORS[0]);
  const [editIcon, setEditIcon]           = useState(SUBJECT_ICONS[0]);
  const [deleteTarget, setDeleteTarget]   = useState<Subject | null>(null);

  const create = () => {
    if (!name.trim()) return;
    addSubject({ id: Date.now().toString(), name: name.trim(), color, icon, chapters: [], createdAt: new Date().toISOString() });
    setShowCreate(false); setName(''); setColor(SUBJECT_COLORS[0]); setIcon(SUBJECT_ICONS[0]);
  };

  const openEdit = (s: Subject) => {
    setEditingSubject(s); setEditName(s.name); setEditColor(s.color); setEditIcon(s.icon);
  };

  const saveEdit = () => {
    if (!editingSubject || !editName.trim()) return;
    updateSubject({ ...editingSubject, name: editName.trim(), color: editColor, icon: editIcon });
    setEditingSubject(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.bg }]}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>{t.subjectsTitle}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            {state.subjects.length} subject{state.subjects.length !== 1 ? 's' : ''} · Long press to delete
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.accent }]}
          onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>{t.subjectsNewBtn}</Text>
        </TouchableOpacity>
      </View>

      {state.subjects.length === 0 ? (
        <View style={styles.empty}>
          <Image
            source={require('@/assets/images/illus-cat-books.webp')}
            style={styles.emptyImg}
            resizeMode="contain"
          />
          <Text style={[styles.emptyTitle, { color: c.text }]}>No subjects yet</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>Add your first subject to start tracking progress</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: c.accent }]} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.emptyBtnTxt}>Add Subject</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={state.subjects}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <SubjectCard
              item={item} index={index}
              progress={getSubjectProgress(item.id)}
              onPress={() => router.push(`/subject/${item.id}`)}
              onLongPress={() => setDeleteTarget(item)}
              onEdit={() => openEdit(item)}
              t={t}
            />
          )}
        />
      )}

      <DeleteModal
        visible={!!deleteTarget}
        name={deleteTarget?.name ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { deleteSubject(deleteTarget!.id); setDeleteTarget(null); }}
        t={t}
      />

      {/* Create Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setShowCreate(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <View style={[styles.sheetPreview, { backgroundColor: color + '18' }]}>
                <Ionicons name={icon as any} size={32} color={color} />
                <Text style={[styles.sheetPreviewName, { color }]}>{name || 'Subject name'}</Text>
              </View>
              <Text style={[styles.sheetTitle, { color: c.text }]}>{t.subjectsCreateTitle}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="Subject name..." placeholderTextColor={c.textFaint}
                value={name} onChangeText={setName} autoFocus
              />
              <ColorIconPicker color={color} icon={icon} onColor={setColor} onIcon={setIcon} />
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: c.accent, opacity: name.trim() ? 1 : 0.5 }]}
                onPress={create} disabled={!name.trim()}>
                <Text style={styles.createTxt}>{t.subjectsCreateBtn}</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editingSubject} transparent animationType="slide" onRequestClose={() => setEditingSubject(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setEditingSubject(null)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              <View style={[styles.sheetPreview, { backgroundColor: editColor + '18' }]}>
                <Ionicons name={editIcon as any} size={32} color={editColor} />
                <Text style={[styles.sheetPreviewName, { color: editColor }]}>{editName || 'Subject name'}</Text>
              </View>
              <Text style={[styles.sheetTitle, { color: c.text }]}>{t.subjectsEditTitle}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="Subject name..." placeholderTextColor={c.textFaint}
                value={editName} onChangeText={setEditName} autoFocus
              />
              <ColorIconPicker color={editColor} icon={editIcon} onColor={setEditColor} onIcon={setEditIcon} />
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: c.accent, opacity: editName.trim() ? 1 : 0.5 }]}
                onPress={saveEdit} disabled={!editName.trim()}>
                <Text style={styles.createTxt}>{t.subjectsSaveBtn}</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 64 : 50, paddingBottom: 18,
  },
  title:    { fontSize: 28, fontFamily: FONTS.bold, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.lg },
  addTxt: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 130 },

  card: {
    borderRadius: RADIUS.xl, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  cardStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  iconCircle: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: FONTS.bold },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  typeBadgeTxt: { fontSize: 9, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardSub: { fontSize: 12, fontFamily: FONTS.regular },
  progBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  progPct: { fontSize: 13, fontFamily: FONTS.bold, width: 36, textAlign: 'right' },
  editBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyImg: { width: 180, height: 160, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold },
  emptySub: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 13, borderRadius: RADIUS.lg, marginTop: 8 },
  emptyBtnTxt: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },

  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, marginBottom: 20 },
  sheetPreviewName: { fontSize: 18, fontFamily: FONTS.bold, flex: 1 },
  sheetTitle: { fontSize: 16, fontFamily: FONTS.semibold, marginBottom: 12, color: '#6E6A90' },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, fontFamily: FONTS.regular, borderWidth: 1.5, marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  iconRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  createBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  createTxt: { color: '#fff', fontSize: 17, fontFamily: FONTS.bold },
});
