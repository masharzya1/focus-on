import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Platform, FlatList,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import AppBlocking from '@/modules/AppBlocking';
import type { AppBlockRoutine } from '@/types/study';

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getCurrentTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

export default function AppBlockScreen() {
  const { state, addBlockRoutine, updateBlockRoutine, deleteBlockRoutine } = useStudy();
  const { colors: c } = useTheme();

  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [installedApps, setInstalledApps] = useState<{name:string;packageName:string}[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [formName, setFormName] = useState('');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('22:00');
  const [formDays, setFormDays] = useState<number[]>([]);
  const [formApps, setFormApps] = useState<string[]>([]);
  const [formShorts, setFormShorts] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);

  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'android') AppBlocking.isAccessibilityEnabled().then(setAccessibilityEnabled);
    AppBlocking.getInstalledApps().then(apps => setInstalledApps(apps.sort((a,b) => a.name.localeCompare(b.name))));
  }, []));

  useFocusEffect(useCallback(() => { applyActiveRoutines(); }, [state.blockRoutines]));

  function applyActiveRoutines() {
    if (Platform.OS !== 'android') return;
    const now = getCurrentTime(), today = new Date().getDay();
    const active = state.blockRoutines.filter(r => r.enabled && (r.days.length === 0 || r.days.includes(today)) && now >= r.startTime && now <= r.endTime);
    if (active.length > 0) {
      AppBlocking.startBlocking([...new Set(active.flatMap(r => r.blockedApps))], active.some(r => r.blockShorts));
    } else AppBlocking.stopBlocking();
  }

  function resetForm() {
    setFormName(''); setFormStart('09:00'); setFormEnd('22:00');
    setFormDays([]); setFormApps([]); setFormShorts(false); setEditingId(null);
  }

  function openEdit(routine: AppBlockRoutine) {
    setFormName(routine.name); setFormStart(routine.startTime); setFormEnd(routine.endTime);
    setFormDays(routine.days); setFormApps(routine.blockedApps); setFormShorts(routine.blockShorts);
    setEditingId(routine.id); setShowCreate(true);
  }

  function saveRoutine() {
    if (!formName.trim() || formApps.length === 0) {
      Alert.alert('Missing info', 'Please enter a name and select at least one app.'); return;
    }
    const routine: AppBlockRoutine = {
      id: editingId || Date.now().toString(),
      name: formName.trim(), startTime: formStart, endTime: formEnd,
      days: formDays, blockedApps: formApps, blockShorts: formShorts, enabled: true,
    };
    if (editingId) updateBlockRoutine(routine); else addBlockRoutine(routine);
    resetForm(); setShowCreate(false); setTimeout(applyActiveRoutines, 300);
  }

  function toggleRoutine(id: string) {
    const r = state.blockRoutines.find(x => x.id === id);
    if (!r) return;
    updateBlockRoutine({ ...r, enabled: !r.enabled });
    setTimeout(applyActiveRoutines, 300);
  }

  const now = getCurrentTime(), todayIdx = new Date().getDay();
  const getAppName = (pkg: string) => installedApps.find(a => a.packageName === pkg)?.name || pkg.split('.').pop() || pkg;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={ab.header}>
          <Text style={[ab.title, { color: c.text }]}>App Block</Text>
          <Text style={[ab.subtitle, { color: c.textMuted }]}>Stay focused, stay in control</Text>
        </Animated.View>

        {/* Permission warning */}
        {Platform.OS === 'android' && !accessibilityEnabled && (
          <TouchableOpacity style={[ab.warnCard, { backgroundColor: '#FFF3E0', borderColor: '#FF9500' + '44' }]} onPress={() => AppBlocking.openAccessibilitySettings()}>
            <View style={[ab.warnIcon, { backgroundColor: '#FF9500' + '20' }]}>
              <Ionicons name="warning-outline" size={22} color="#FF9500" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ab.warnTitle, { color: '#FF9500' }]}>Permission Required</Text>
              <Text style={[ab.warnSub, { color: c.textMuted }]}>Tap to enable Focus On in Accessibility Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FF9500" />
          </TouchableOpacity>
        )}

        {/* Active now banner */}
        {(() => {
          const activeNow = state.blockRoutines.filter(r => r.enabled && now >= r.startTime && now <= r.endTime && (r.days.length === 0 || r.days.includes(todayIdx)));
          if (!activeNow.length) return null;
          return (
            <View style={[ab.activeBanner, { backgroundColor: c.success + '15', borderColor: c.success + '40' }]}>
              <View style={[ab.activeDot, { backgroundColor: c.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={[ab.activeBannerTitle, { color: c.success }]}>Blocking Active</Text>
                <Text style={[ab.activeBannerSub, { color: c.textMuted }]}>{activeNow.map(r => r.name).join(', ')}</Text>
              </View>
              <Ionicons name="shield-checkmark" size={22} color={c.success} />
            </View>
          );
        })()}

        <View style={{ padding: 16 }}>
          <TouchableOpacity style={[ab.createBtn, { backgroundColor: c.accent, borderBottomWidth: 4, borderBottomColor: c.accentDark }]} onPress={() => { resetForm(); setShowCreate(true); }}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={ab.createBtnText}>New Block Routine</Text>
          </TouchableOpacity>

          {state.blockRoutines.length === 0 && (
            <View style={[ab.emptyCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <View style={[ab.emptyIcon, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="shield-outline" size={32} color={c.accent} />
              </View>
              <Text style={[ab.emptyText, { color: c.text }]}>No block routines</Text>
              <Text style={[ab.emptySub, { color: c.textMuted }]}>Create routines to block apps during study time</Text>
            </View>
          )}

          {state.blockRoutines.map((routine, idx) => {
            const isActive = routine.enabled && now >= routine.startTime && now <= routine.endTime &&
              (routine.days.length === 0 || routine.days.includes(todayIdx));
            return (
              <Animated.View key={routine.id} entering={FadeInDown.delay(idx*60).duration(400)}>
                <View style={[ab.routineCard, { backgroundColor: c.bgCard, borderColor: isActive ? c.success + '60' : c.border }]}>
                  {isActive && (
                    <View style={[ab.activePill, { backgroundColor: c.success + '18' }]}>
                      <View style={[ab.activeDot, { backgroundColor: c.success, width: 8, height: 8 }]} />
                      <Text style={[ab.activePillText, { color: c.success }]}>ACTIVE NOW</Text>
                    </View>
                  )}
                  <View style={ab.routineRow}>
                    <View style={[ab.routineIconBox, { backgroundColor: isActive ? c.success + '18' : c.accentSoft }]}>
                      <Ionicons name="shield-outline" size={20} color={isActive ? c.success : c.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ab.routineName, { color: c.text }]}>{routine.name}</Text>
                      <Text style={[ab.routineTime, { color: c.textMuted }]}>
                        {routine.startTime} – {routine.endTime}
                        {routine.days.length > 0 ? ` · ${routine.days.map(d => DAY_NAMES[d]).join(', ')}` : ' · Every day'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleRoutine(routine.id)} style={[ab.toggle, { backgroundColor: routine.enabled ? c.accent : c.bgSecondary }]}>
                      <View style={[ab.toggleThumb, { marginLeft: routine.enabled ? 22 : 2 }]} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {routine.blockedApps.slice(0, 6).map(pkg => (
                      <View key={pkg} style={[ab.chip, { backgroundColor: c.destructive + '15', borderColor: c.destructive + '30', borderWidth: 1 }]}>
                        <Text style={[ab.chipText, { color: c.destructive }]}>{getAppName(pkg)}</Text>
                      </View>
                    ))}
                    {routine.blockedApps.length > 6 && (
                      <View style={[ab.chip, { backgroundColor: c.bgSecondary }]}>
                        <Text style={[ab.chipText, { color: c.textMuted }]}>+{routine.blockedApps.length - 6}</Text>
                      </View>
                    )}
                    {routine.blockShorts && (
                      <View style={[ab.chip, { backgroundColor: '#8B5CF6' + '18', borderColor: '#8B5CF6' + '30', borderWidth: 1 }]}>
                        <Ionicons name="videocam-off-outline" size={11} color="#8B5CF6" />
                        <Text style={[ab.chipText, { color: '#8B5CF6' }]}>Shorts/Reels</Text>
                      </View>
                    )}
                  </ScrollView>

                  <View style={[ab.routineActions, { borderTopColor: c.border }]}>
                    <TouchableOpacity onPress={() => openEdit(routine)} style={[ab.actionBtn, { backgroundColor: c.accentSoft }]}>
                      <Ionicons name="pencil-outline" size={14} color={c.accent} />
                      <Text style={[ab.actionBtnText, { color: c.accent }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Delete', `Delete "${routine.name}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteBlockRoutine(routine.id) },
                      ])}
                      style={[ab.actionBtn, { backgroundColor: c.destructive + '12' }]}
                    >
                      <Ionicons name="trash-outline" size={14} color={c.destructive} />
                      <Text style={[ab.actionBtnText, { color: c.destructive }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { resetForm(); setShowCreate(false); }}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[ab.modalHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => { resetForm(); setShowCreate(false); }}>
              <Text style={{ color: c.textMuted, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[ab.modalTitle, { color: c.text }]}>{editingId ? 'Edit Routine' : 'New Block Routine'}</Text>
            <TouchableOpacity onPress={saveRoutine}>
              <Text style={{ color: c.accent, fontWeight: '800', fontSize: 16 }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={[ab.fieldLabel, { color: c.textMuted }]}>ROUTINE NAME</Text>
            <TextInput style={[ab.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]} placeholder="e.g. Evening Study Block" placeholderTextColor={c.textFaint} value={formName} onChangeText={setFormName} />

            <Text style={[ab.fieldLabel, { color: c.textMuted }]}>TIME RANGE</Text>
            <View style={ab.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={[ab.timeLabel, { color: c.textFaint }]}>Start</Text>
                <TextInput style={[ab.timeInput, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]} value={formStart} onChangeText={setFormStart} placeholder="09:00" placeholderTextColor={c.textFaint} keyboardType="numbers-and-punctuation" maxLength={5} />
              </View>
              <Ionicons name="arrow-forward" size={18} color={c.textFaint} style={{ marginTop: 24 }} />
              <View style={{ flex: 1 }}>
                <Text style={[ab.timeLabel, { color: c.textFaint }]}>End</Text>
                <TextInput style={[ab.timeInput, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]} value={formEnd} onChangeText={setFormEnd} placeholder="22:00" placeholderTextColor={c.textFaint} keyboardType="numbers-and-punctuation" maxLength={5} />
              </View>
            </View>

            <Text style={[ab.fieldLabel, { color: c.textMuted }]}>DAYS (empty = every day)</Text>
            <View style={ab.daysRow}>
              {DAY_NAMES.map((day, i) => (
                <TouchableOpacity key={i} onPress={() => setFormDays(p => p.includes(i) ? p.filter(d => d !== i) : [...p, i])}
                  style={[ab.dayChip, { backgroundColor: formDays.includes(i) ? c.accent : c.bgSecondary, borderBottomWidth: formDays.includes(i) ? 2 : 0, borderBottomColor: c.accentDark }]}>
                  <Text style={[ab.dayChipText, { color: formDays.includes(i) ? '#fff' : c.textMuted }]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[ab.fieldLabel, { color: c.textMuted }]}>BLOCKED APPS</Text>
            <TouchableOpacity style={[ab.pickBtn, { backgroundColor: c.bgSecondary, borderColor: c.border }]} onPress={() => setShowAppPicker(true)}>
              <Ionicons name="apps-outline" size={18} color={c.textMuted} />
              <Text style={[ab.pickBtnText, { color: formApps.length ? c.text : c.textMuted }]}>{formApps.length ? `${formApps.length} app${formApps.length>1?'s':''} selected` : 'Tap to select apps...'}</Text>
              <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
            </TouchableOpacity>

            {formApps.length > 0 && (
              <View style={ab.selectedApps}>
                {formApps.map(pkg => (
                  <TouchableOpacity key={pkg} onPress={() => setFormApps(p => p.filter(x => x !== pkg))} style={[ab.chip, { backgroundColor: c.destructive + '15', borderColor: c.destructive + '30', borderWidth: 1 }]}>
                    <Text style={[ab.chipText, { color: c.destructive }]}>{getAppName(pkg)} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={ab.toggleRow} onPress={() => setFormShorts(v => !v)}>
              <View style={{ flex: 1 }}>
                <Text style={[ab.toggleLabel, { color: c.text }]}>Block Reels / Shorts / TikTok</Text>
                <Text style={[ab.toggleSub, { color: c.textMuted }]}>Block short video content in all apps</Text>
              </View>
              <View style={[ab.toggle, { backgroundColor: formShorts ? c.accent : c.bgSecondary }]}>
                <View style={[ab.toggleThumb, { marginLeft: formShorts ? 22 : 2 }]} />
              </View>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* App Picker Modal */}
      <Modal visible={showAppPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAppPicker(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[ab.modalHeader, { borderBottomColor: c.border }]}>
            <View />
            <Text style={[ab.modalTitle, { color: c.text }]}>Select Apps</Text>
            <TouchableOpacity onPress={() => setShowAppPicker(false)}>
              <Text style={{ color: c.accent, fontWeight: '800' }}>Done ({formApps.length})</Text>
            </TouchableOpacity>
          </View>
          <View style={[ab.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
            <Ionicons name="search-outline" size={16} color={c.textMuted} />
            <TextInput style={{ color: c.text, flex: 1, marginLeft: 8 }} placeholder="Search apps..." placeholderTextColor={c.textFaint} value={appSearch} onChangeText={setAppSearch} />
          </View>
          <FlatList
            data={installedApps.filter(a => a.name.toLowerCase().includes(appSearch.toLowerCase()))}
            keyExtractor={item => item.packageName}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const sel = formApps.includes(item.packageName);
              return (
                <TouchableOpacity style={[ab.appItem, { backgroundColor: sel ? c.accentSoft : c.bgCard, borderColor: sel ? c.accent + '44' : c.border }]}
                  onPress={() => setFormApps(p => sel ? p.filter(x => x !== item.packageName) : [...p, item.packageName])}>
                  <View style={[ab.appIcon, { backgroundColor: sel ? c.accent + '22' : c.bgSecondary }]}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: sel ? c.accent : c.textMuted }}>{item.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ab.appName, { color: c.text }]}>{item.name}</Text>
                    <Text style={[ab.appPkg, { color: c.textFaint }]} numberOfLines={1}>{item.packageName}</Text>
                  </View>
                  <View style={[ab.checkBox, { borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.accent : 'transparent' }]}>
                    {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const ab = StyleSheet.create({
  header:   { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  warnCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: RADIUS.xl, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  warnIcon: { width: 42, height: 42, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  warnTitle: { fontSize: 14, fontWeight: '700' },
  warnSub:   { fontSize: 12, marginTop: 2 },
  activeBanner: { marginHorizontal: 16, marginBottom: 8, borderRadius: RADIUS.xl, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeDot:  { width: 10, height: 10, borderRadius: 5 },
  activeBannerTitle: { fontSize: 14, fontWeight: '700' },
  activeBannerSub: { fontSize: 12, marginTop: 2 },
  createBtn: { borderRadius: RADIUS.xl, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: RADIUS.xxl, borderWidth: 1, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 17, fontWeight: '700' },
  emptySub:  { fontSize: 13, textAlign: 'center' },
  routineCard: { borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, marginBottom: 12 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, marginBottom: 12 },
  activePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routineIconBox: { width: 42, height: 42, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  routineName: { fontSize: 15, fontWeight: '700' },
  routineTime: { fontSize: 12, marginTop: 2 },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, marginRight: 8 },
  chipText: { fontSize: 12, fontWeight: '600' },
  routineActions: { flexDirection: 'row', gap: 10, paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: RADIUS.lg },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  input: { borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeLabel: { fontSize: 11, marginBottom: 6 },
  timeInput: { borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  daysRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dayChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.lg },
  dayChipText: { fontSize: 12, fontWeight: '700' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, borderRadius: RADIUS.lg, borderWidth: 1 },
  pickBtnText: { flex: 1, fontSize: 14 },
  selectedApps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 2 },
  searchBar: { marginHorizontal: 12, marginVertical: 8, flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  appItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, marginBottom: 6, borderWidth: 1 },
  appIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 14, fontWeight: '600' },
  appPkg: { fontSize: 11, marginTop: 1 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
