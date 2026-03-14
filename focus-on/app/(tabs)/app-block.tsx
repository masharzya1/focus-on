import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform, FlatList, TextInput, Switch } from 'react-native';
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

function TimePicker({ value, onChange, label, colors: c }: { value:string; onChange:(v:string)=>void; label:string; colors:any }) {
  const [h, setH] = useState(() => parseInt(value.split(':')[0]) || 9);
  const [m, setM] = useState(() => parseInt(value.split(':')[1]) || 0);
  const emit = (nh:number, nm:number) => onChange(`${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`);
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: c.textFaint, marginBottom: 6 }}>{label}</Text>
      <View style={[{ backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {[{val:h,set:setH,mod:24},{val:m,set:setM,mod:60,step:5}].map((item,i) => (
            <React.Fragment key={i}>
              {i>0 && <Text style={{ fontSize: 18, fontWeight:'800', color:c.textMuted }}>:</Text>}
              <View style={{ alignItems: 'center', gap: 4 }}>
                <TouchableOpacity onPress={() => {
                  const nv = item.step ? ((Math.floor(item.val/5)+1)%12)*5 : (item.val+1)%item.mod;
                  item.set(nv); emit(i===0?nv:h, i===0?m:nv);
                }}><Ionicons name="chevron-up" size={14} color={c.accent} /></TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight:'800', color:c.text, minWidth:28, textAlign:'center' }}>
                  {String(item.val).padStart(2,'0')}
                </Text>
                <TouchableOpacity onPress={() => {
                  const nv = item.step ? ((Math.floor(item.val/5)+11)%12)*5 : (item.val+item.mod-1)%item.mod;
                  item.set(nv); emit(i===0?nv:h, i===0?m:nv);
                }}><Ionicons name="chevron-down" size={14} color={c.accent} /></TouchableOpacity>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function AppBlockScreen() {
  const { state, addBlockRoutine, updateBlockRoutine, deleteBlockRoutine } = useStudy();
  const { colors: c } = useTheme();

  const [accessEnabled, setAccessEnabled] = useState(false);
  const [installedApps, setInstalledApps] = useState<{name:string;packageName:string}[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [search, setSearch] = useState('');

  // form
  const [rName, setRName] = useState('');
  const [rStart, setRStart] = useState('09:00');
  const [rEnd, setREnd] = useState('11:00');
  const [rDays, setRDays] = useState<number[]>([]);
  const [rApps, setRApps] = useState<string[]>([]);
  const [rShorts, setRShorts] = useState(false);
  const [rHard, setRHard] = useState(false);
  const [rAdmin, setRAdmin] = useState(false);

  useFocusEffect(useCallback(() => {
    AppBlocking.isAccessibilityEnabled().then(setAccessEnabled);
  }, []));

  const loadApps = async () => {
    if (installedApps.length === 0) {
      const apps = await AppBlocking.getInstalledApps();
      setInstalledApps(apps.filter(a =>
        !a.packageName.startsWith('com.android') &&
        !a.packageName.startsWith('com.google.android.googlequicksearchbox')
      ));
    }
    setShowAppPicker(true);
  };

  const saveRoutine = () => {
    if (!rName.trim() || rApps.length === 0) {
      Alert.alert('⚠️', 'নাম আর কমপক্ষে একটি app দরকার।'); return;
    }
    const r: AppBlockRoutine = {
      id: Date.now().toString(), name: rName.trim(),
      startTime: rStart, endTime: rEnd, days: rDays,
      blockedApps: rApps, blockShorts: rShorts, enabled: true,
      hardBlock: rHard, deviceAdmin: rAdmin,
    };
    addBlockRoutine(r);
    setShowCreate(false); resetForm();
  };

  const resetForm = () => {
    setRName(''); setRStart('09:00'); setREnd('11:00');
    setRDays([]); setRApps([]); setRShorts(false); setRHard(false); setRAdmin(false);
  };

  const isActive = (r: AppBlockRoutine) => {
    const now = getCurrentTime();
    const today = new Date().getDay();
    return r.enabled && now >= r.startTime && now <= r.endTime &&
      (r.days.length === 0 || r.days.includes(today));
  };

  const filtered = installedApps.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.packageName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>App Block</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.accent }]}
          onPress={() => { if (!accessEnabled) { Alert.alert('Permission দরকার', 'Accessibility permission দাও।', [{ text: 'Settings', onPress: () => AppBlocking.openAccessibilitySettings() }, { text: 'Cancel', style: 'cancel' }]); return; } setShowCreate(true); }}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>নতুন</Text>
        </TouchableOpacity>
      </View>

      {/* Accessibility warning */}
      {!accessEnabled && (
        <TouchableOpacity style={[styles.warnCard, { backgroundColor: '#FEF3C7' }]}
          onPress={() => AppBlocking.openAccessibilitySettings()}>
          <Ionicons name="warning" size={18} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.warnTitle, { color: '#92400E' }]}>Accessibility Permission দরকার</Text>
            <Text style={[styles.warnSub, { color: '#B45309' }]}>Tap করে enable করো</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D97706" />
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {state.blockRoutines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🛡️</Text>
            <Text style={[styles.emptyTitle, { color: c.text }]}>কোনো Block Routine নেই</Text>
            <Text style={[styles.emptySub, { color: c.textMuted }]}>Study time এ distraction block করো</Text>
          </View>
        ) : (
          state.blockRoutines.map((r, i) => {
            const active = isActive(r);
            return (
              <Animated.View key={r.id} entering={FadeInDown.delay(i*60).springify()}>
                <View style={[styles.routineCard, { backgroundColor: c.bgCard, borderLeftColor: active ? c.success : c.border }]}>
                  <View style={styles.routineTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.routineNameRow}>
                        <Text style={[styles.routineName, { color: c.text }]}>{r.name}</Text>
                        {active && <View style={[styles.activeBadge, { backgroundColor: c.success + '20' }]}>
                          <Text style={[styles.activeTxt, { color: c.success }]}>Active</Text>
                        </View>}
                      </View>
                      <Text style={[styles.routineTime, { color: c.textMuted }]}>
                        {r.startTime} – {r.endTime}
                        {r.days.length > 0 ? ` · ${r.days.map(d => DAY_NAMES[d]).join(', ')}` : ' · Every day'}
                      </Text>
                      <Text style={[styles.routineApps, { color: c.textFaint }]}>
                        {r.blockedApps.length} apps{r.blockShorts ? ' + Shorts' : ''}
                        {r.hardBlock ? ' · 🔒 Hard' : ''}{r.deviceAdmin ? ' · 🛡️ Admin' : ''}
                      </Text>
                    </View>
                    <View style={styles.routineActions}>
                      <Switch value={r.enabled}
                        onValueChange={v => updateBlockRoutine({ ...r, enabled: v })}
                        trackColor={{ true: c.accent }} style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />
                      <TouchableOpacity onPress={() => Alert.alert('Delete?', `"${r.name}" delete করবে?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteBlockRoutine(r.id) },
                      ])}><Ionicons name="trash-outline" size={18} color={c.destructive} /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Routine Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => { setShowCreate(false); resetForm(); }}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.sheetTitle, { color: c.text }]}>নতুন Block Routine</Text>

              <Text style={[styles.lbl, { color: c.textMuted }]}>নাম</Text>
              <TextInput style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="যেমন: Morning Study Block" placeholderTextColor={c.textFaint}
                value={rName} onChangeText={setRName} />

              <Text style={[styles.lbl, { color: c.textMuted }]}>সময়</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TimePicker value={rStart} onChange={setRStart} label="শুরু" colors={c} />
                <TimePicker value={rEnd} onChange={setREnd} label="শেষ" colors={c} />
              </View>

              <Text style={[styles.lbl, { color: c.textMuted }]}>দিন (খালি = প্রতিদিন)</Text>
              <View style={styles.dayRow}>
                {DAY_NAMES.map((d,i) => (
                  <TouchableOpacity key={i} style={[styles.dayBtn,
                    { backgroundColor: rDays.includes(i) ? c.accent : c.inputBg, borderColor: rDays.includes(i) ? c.accent : c.border }]}
                    onPress={() => setRDays(ds => ds.includes(i) ? ds.filter(x=>x!==i) : [...ds,i])}>
                    <Text style={[styles.dayTxt, { color: rDays.includes(i) ? '#fff' : c.textMuted }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Options */}
              {[
                { label: 'YouTube Shorts / Instagram Reels block', val: rShorts, set: setRShorts, color: c.accent },
                { label: '🔒 Hard Block (uninstall ছাড়া unblock নয়)', val: rHard, set: setRHard, color: c.destructive },
                { label: '🛡️ Device Admin (uninstall ও নয়)', val: rAdmin, set: (v:boolean)=>{ if(v) setRHard(true); setRAdmin(v); }, color: '#DC2626' },
              ].map((opt,i) => (
                <View key={i} style={[styles.optRow, { borderColor: c.border }]}>
                  <Text style={[styles.optLabel, { color: c.text, flex: 1 }]}>{opt.label}</Text>
                  <Switch value={opt.val} onValueChange={opt.set} trackColor={{ true: opt.color }} />
                </View>
              ))}

              <TouchableOpacity style={[styles.pickAppsBtn, { backgroundColor: c.accentSoft, borderColor: c.accent }]}
                onPress={loadApps}>
                <Ionicons name="apps" size={18} color={c.accent} />
                <Text style={[styles.pickAppsTxt, { color: c.accent }]}>
                  {rApps.length > 0 ? `${rApps.length}টি app selected` : 'Apps বেছে নাও'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.accent, opacity: rName.trim() && rApps.length > 0 ? 1 : 0.5 }]}
                onPress={saveRoutine}>
                <Text style={styles.saveTxt}>Save করো</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* App Picker */}
      <Modal visible={showAppPicker} transparent animationType="slide" onRequestClose={() => setShowAppPicker(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Apps বেছে নাও</Text>
            <TextInput style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="Search..." placeholderTextColor={c.textFaint}
              value={search} onChangeText={setSearch} />
            <FlatList data={filtered} keyExtractor={i=>i.packageName}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => {
                const sel = rApps.includes(item.packageName);
                return (
                  <TouchableOpacity style={[styles.appItem, { borderColor: c.border }]}
                    onPress={() => setRApps(a => sel ? a.filter(x=>x!==item.packageName) : [...a, item.packageName])}>
                    <View style={[styles.checkBox, { borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.accent : 'transparent' }]}>
                      {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appName, { color: c.text }]}>{item.name}</Text>
                      <Text style={[styles.appPkg, { color: c.textFaint }]} numberOfLines={1}>{item.packageName}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }} />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.accent }]}
              onPress={() => setShowAppPicker(false)}>
              <Text style={styles.saveTxt}>Done ({rApps.length} selected)</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  warnCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20,
    padding: 14, borderRadius: 14, marginBottom: 8 },
  warnTitle: { fontSize: 14, fontWeight: '700' },
  warnSub: { fontSize: 12, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySub: { fontSize: 14, marginTop: 8 },
  routineCard: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  routineTop: { flexDirection: 'row', alignItems: 'flex-start' },
  routineNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  routineName: { fontSize: 15, fontWeight: '700' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeTxt: { fontSize: 11, fontWeight: '700' },
  routineTime: { fontSize: 13, marginBottom: 4 },
  routineApps: { fontSize: 12 },
  routineActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  lbl: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { height: 50, borderRadius: 13, paddingHorizontal: 16, fontSize: 15, borderWidth: 1.5, marginBottom: 8 },
  dayRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  dayBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1.5 },
  dayTxt: { fontSize: 12, fontWeight: '700' },
  optRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1 },
  optLabel: { fontSize: 14, lineHeight: 20 },
  pickAppsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderRadius: 14, paddingVertical: 14, marginTop: 16, marginBottom: 12 },
  pickAppsTxt: { fontSize: 15, fontWeight: '700' },
  saveBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  appItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 14, fontWeight: '600' },
  appPkg: { fontSize: 11, marginTop: 1 },
});
