import React, { useState, useCallback } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform, FlatList, TextInput, Switch } from 'react-native';
=======
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, Platform, FlatList, TextInput, AppState,
} from 'react-native';
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
<<<<<<< HEAD
import { RADIUS } from '@/constants/theme';
import AppBlocking from '@/modules/AppBlocking';
=======
import { useAuth } from '@/contexts/AuthContext';
import { RADIUS } from '@/constants/theme';
import AppBlocking from '@/modules/AppBlocking';
import PaywallModal from '@/components/PaywallModal';
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
import type { AppBlockRoutine } from '@/types/study';

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getCurrentTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

<<<<<<< HEAD
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
=======
function to24(h: number, m: number, p: 'AM'|'PM') {
  let hr = h % 12;
  if (p === 'PM') hr += 12;
  return `${String(hr).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function from24(t: string) {
  const [hh, mm] = t.split(':').map(Number);
  const p: 'AM'|'PM' = hh < 12 ? 'AM' : 'PM';
  let h = hh % 12; if (h === 0) h = 12;
  return { h, m: mm || 0, p };
}

// ── Simple time picker: tap + / - ────────────────────────────────────────────
function TimePicker({ value, onChange, label, colors }: {
  value: string; onChange: (v: string) => void; label: string; colors: any;
}) {
  const init = from24(value);
  const [h, setH] = useState(init.h);
  const [m, setM] = useState(init.m);
  const [p, setP] = useState<'AM'|'PM'>(init.p);

  const fire = (nh: number, nm: number, np: 'AM'|'PM') => onChange(to24(nh, nm, np));

  const adjH = (d: number) => {
    const nh = ((h - 1 + d + 12) % 12) + 1;
    setH(nh); fire(nh, m, p);
  };
  const adjM = (d: number) => {
    const nm = ((Math.floor(m / 5) + d + 12) % 12) * 5;
    setM(nm); fire(h, nm, p);
  };
  const toggleP = () => {
    const np: 'AM'|'PM' = p === 'AM' ? 'PM' : 'AM';
    setP(np); fire(h, m, np);
  };

  const Col = ({ val, onUp, onDown }: { val: string; onUp: ()=>void; onDown: ()=>void }) => (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <TouchableOpacity onPress={onUp} hitSlop={{ top:8,bottom:8,left:8,right:8 }}
        style={[s.adjBtn, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name="chevron-up" size={14} color={colors.accent} />
      </TouchableOpacity>
      <Text style={[s.timeNum, { color: colors.text }]}>{val}</Text>
      <TouchableOpacity onPress={onDown} hitSlop={{ top:8,bottom:8,left:8,right:8 }}
        style={[s.adjBtn, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name="chevron-down" size={14} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: colors.textFaint, marginBottom: 8 }}>{label}</Text>
      <View style={[s.pickerBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <Col val={String(h)} onUp={() => adjH(1)} onDown={() => adjH(-1)} />
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textMuted }}>:</Text>
          <Col val={String(m).padStart(2,'0')} onUp={() => adjM(1)} onDown={() => adjM(-1)} />
          <TouchableOpacity onPress={toggleP} style={[s.ampmBtn, { backgroundColor: colors.accent }]}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{p}</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 15, textAlign: 'center', marginTop: 8 }}>
          {h}:{String(m).padStart(2,'0')} {p}
        </Text>
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
      </View>
    </View>
  );
}

export default function AppBlockScreen() {
  const { state, addBlockRoutine, updateBlockRoutine, deleteBlockRoutine } = useStudy();
  const { colors: c } = useTheme();
<<<<<<< HEAD

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
=======
  const { isPro } = useAuth();

  // Free tier limits
  const FREE_MAX_ROUTINES = 1;
  const FREE_MAX_APPS = 3;

  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [installedApps, setInstalledApps] = useState<{name:string;packageName:string}[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [formName, setFormName] = useState('');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('22:00');
  const [formDays, setFormDays] = useState<number[]>([]);
  const [formApps, setFormApps] = useState<string[]>([]);
  const [formShorts, setFormShorts] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);

  useFocusEffect(useCallback(() => {
    const checkAccess = () => {
      if (Platform.OS === 'android')
        AppBlocking.isAccessibilityEnabled().then(setAccessibilityEnabled);
    };
    checkAccess();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') checkAccess();
    });
    return () => sub.remove();
  }, []));

  useFocusEffect(useCallback(() => {
    AppBlocking.getInstalledApps().then(a =>
      setInstalledApps(a.sort((x,y) => x.name.localeCompare(y.name)))
    );
  }, []));

  useFocusEffect(useCallback(() => {
    // Bug 1 fix: immediately push routines to native + apply on focus
    AppBlocking.saveRoutines(state.blockRoutines);
    applyActiveRoutines();
  }, [state.blockRoutines]));

  function applyActiveRoutines() {
    if (Platform.OS !== 'android') return;
    const now = getCurrentTime(), today = new Date().getDay();
    const active = state.blockRoutines.filter(r =>
      r.enabled && (r.days.length === 0 || r.days.includes(today)) &&
      now >= r.startTime && now <= r.endTime
    );
    if (active.length > 0)
      AppBlocking.startBlocking([...new Set(active.flatMap(r => r.blockedApps))], active.some(r => r.blockShorts));
    else AppBlocking.stopBlocking();
  }

  function resetForm() {
    setFormName(''); setFormStart('09:00'); setFormEnd('22:00');
    setFormDays([]); setFormApps([]); setFormShorts(false); setEditingId(null);
  }

  function openEdit(r: AppBlockRoutine) {
    setFormName(r.name); setFormStart(r.startTime); setFormEnd(r.endTime);
    setFormDays(r.days); setFormApps(r.blockedApps); setFormShorts(r.blockShorts);
    setEditingId(r.id); setShowCreate(true);
  }

  function saveRoutine() {
    if (!formName.trim() || formApps.length === 0) {
      Alert.alert('Missing info', 'Enter a name and pick at least one app.'); return;
    }
    // Free tier: max 1 routine
    if (!isPro && !editingId && state.blockRoutines.length >= FREE_MAX_ROUTINES) {
      setShowPaywall(true); return;
    }
    // Free tier: max 3 apps per routine
    if (!isPro && formApps.length > FREE_MAX_APPS) {
      Alert.alert(
        'Free limit reached',
        `Free plan allows up to ${FREE_MAX_APPS} apps per routine. Upgrade to Pro for unlimited.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => setShowPaywall(true) },
        ]
      ); return;
    }
    const r: AppBlockRoutine = {
      id: editingId || Date.now().toString(),
      name: formName.trim(), startTime: formStart, endTime: formEnd,
      days: formDays, blockedApps: formApps, blockShorts: formShorts, enabled: true,
    };
    if (editingId) updateBlockRoutine(r); else addBlockRoutine(r);
    resetForm(); setShowCreate(false); setTimeout(applyActiveRoutines, 300);
  }

  function toggleRoutine(id: string) {
    const r = state.blockRoutines.find(x => x.id === id);
    if (!r) return;
    updateBlockRoutine({ ...r, enabled: !r.enabled });
    setTimeout(applyActiveRoutines, 300);
  }

  const now = getCurrentTime(), todayIdx = new Date().getDay();
  const getName = (pkg: string) => installedApps.find(a => a.packageName === pkg)?.name || pkg.split('.').pop() || pkg;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={[s.title, { color: c.text }]}>App Block</Text>
          <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>Stay focused, stay in control</Text>
        </Animated.View>

        {Platform.OS === 'android' && !accessibilityEnabled && (
          <TouchableOpacity style={[s.warnCard, { backgroundColor: '#FFF3E020', borderColor: '#FF950044' }]}
            onPress={() => AppBlocking.openAccessibilitySettings()}>
            <Ionicons name="warning-outline" size={20} color="#FF9500" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF9500' }}>Permission Required</Text>
              <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                Tap → enable "Focus On" in Accessibility Settings, then come back
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#FF9500" />
          </TouchableOpacity>
        )}

        {(() => {
          const active = state.blockRoutines.filter(r =>
            r.enabled && now >= r.startTime && now <= r.endTime &&
            (r.days.length === 0 || r.days.includes(todayIdx))
          );
          if (!active.length) return null;
          return (
            <View style={[s.warnCard, { backgroundColor: c.success + '15', borderColor: c.success + '40' }]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.success }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: c.success }}>Blocking Active</Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{active.map(r => r.name).join(', ')}</Text>
              </View>
              <Ionicons name="shield-checkmark" size={20} color={c.success} />
            </View>
          );
        })()}

        <View style={{ padding: 16 }}>
          <TouchableOpacity style={[s.createBtn, { backgroundColor: c.accent, borderBottomColor: c.accentDark }]}
            onPress={() => {
              if (!isPro && state.blockRoutines.length >= FREE_MAX_ROUTINES) {
                setShowPaywall(true);
              } else {
                resetForm(); setShowCreate(true);
              }
            }}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>New Block Routine</Text>
          </TouchableOpacity>

          {state.blockRoutines.length === 0 && (
            <View style={[s.emptyCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Ionicons name="shield-outline" size={36} color={c.accent} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>No block routines</Text>
              <Text style={{ fontSize: 13, color: c.textMuted, textAlign: 'center' }}>Create routines to block distracting apps</Text>
            </View>
          )}

          {state.blockRoutines.map((r, idx) => {
            const isActive = r.enabled && now >= r.startTime && now <= r.endTime &&
              (r.days.length === 0 || r.days.includes(todayIdx));
            return (
              <Animated.View key={r.id} entering={FadeInDown.delay(idx*60).duration(400)}>
                <View style={[s.card, { backgroundColor: c.bgCard, borderColor: isActive ? c.success + '60' : c.border }]}>
                  {isActive && (
                    <View style={[s.activePill, { backgroundColor: c.success + '18' }]}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.success }} />
                      <Text style={{ fontSize: 9, fontWeight: '800', color: c.success, letterSpacing: 0.5 }}>ACTIVE NOW</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[s.iconBox, { backgroundColor: isActive ? c.success + '18' : c.accentSoft }]}>
                      <Ionicons name="shield-outline" size={20} color={isActive ? c.success : c.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>{r.name}</Text>
                      <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                        {r.startTime} – {r.endTime}
                        {r.days.length > 0 ? ` · ${r.days.map(d => DAY_NAMES[d]).join(', ')}` : ' · Every day'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleRoutine(r.id)}
                      style={[s.toggle, { backgroundColor: r.enabled ? c.accent : c.bgSecondary }]}>
                      <View style={[s.thumb, { marginLeft: r.enabled ? 22 : 2 }]} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {r.blockedApps.slice(0,6).map(pkg => (
                      <View key={pkg} style={[s.chip, { backgroundColor: c.destructive + '15', borderColor: c.destructive + '30' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: c.destructive }}>{getName(pkg)}</Text>
                      </View>
                    ))}
                    {r.blockedApps.length > 6 && (
                      <View style={[s.chip, { backgroundColor: c.bgSecondary, borderColor: c.border }]}>
                        <Text style={{ fontSize: 12, color: c.textMuted }}>+{r.blockedApps.length - 6}</Text>
                      </View>
                    )}
                    {r.blockShorts && (
                      <View style={[s.chip, { backgroundColor: '#8B5CF618', borderColor: '#8B5CF630' }]}>
                        <Ionicons name="videocam-off-outline" size={11} color="#8B5CF6" />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#8B5CF6', marginLeft: 4 }}>Shorts/Reels</Text>
                      </View>
                    )}
                  </ScrollView>

                  <View style={[s.actions, { borderTopColor: c.border }]}>
                    <TouchableOpacity onPress={() => openEdit(r)} style={[s.actionBtn, { backgroundColor: c.accentSoft }]}>
                      <Ionicons name="pencil-outline" size={13} color={c.accent} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: c.accent }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Delete', `Delete "${r.name}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteBlockRoutine(r.id) },
                      ])}
                      style={[s.actionBtn, { backgroundColor: c.destructive + '12' }]}>
                      <Ionicons name="trash-outline" size={13} color={c.destructive} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: c.destructive }}>Delete</Text>
                    </TouchableOpacity>
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
                  </View>
                </View>
              </Animated.View>
            );
<<<<<<< HEAD
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
=======
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => { resetForm(); setShowCreate(false); }}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[s.modalHdr, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => { resetForm(); setShowCreate(false); }}>
              <Text style={{ color: c.textMuted, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>{editingId ? 'Edit Routine' : 'New Block Routine'}</Text>
            <TouchableOpacity onPress={saveRoutine}>
              <Text style={{ color: c.accent, fontWeight: '800', fontSize: 16 }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={[s.label, { color: c.textMuted }]}>ROUTINE NAME</Text>
            <TextInput style={[s.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              placeholder="e.g. Evening Study Block" placeholderTextColor={c.textFaint}
              value={formName} onChangeText={setFormName} />

            <Text style={[s.label, { color: c.textMuted }]}>TIME RANGE</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TimePicker value={formStart} onChange={setFormStart} label="Start" colors={c} />
              <TimePicker value={formEnd} onChange={setFormEnd} label="End" colors={c} />
            </View>

            <Text style={[s.label, { color: c.textMuted }]}>DAYS (empty = every day)</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {DAY_NAMES.map((day, i) => (
                <TouchableOpacity key={i}
                  onPress={() => setFormDays(p => p.includes(i) ? p.filter(d=>d!==i) : [...p,i])}
                  style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.lg,
                    backgroundColor: formDays.includes(i) ? c.accent : c.bgSecondary,
                    borderBottomWidth: formDays.includes(i) ? 2 : 0, borderBottomColor: c.accentDark }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: formDays.includes(i) ? '#fff' : c.textMuted }}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.label, { color: c.textMuted }]}>BLOCKED APPS</Text>
            <TouchableOpacity style={[s.input, { backgroundColor: c.bgSecondary, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
              onPress={() => setShowAppPicker(true)}>
              <Ionicons name="apps-outline" size={18} color={c.textMuted} />
              <Text style={{ flex: 1, fontSize: 14, color: formApps.length ? c.text : c.textMuted }}>
                {formApps.length ? `${formApps.length} app${formApps.length>1?'s':''} selected` : 'Tap to select apps...'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
            </TouchableOpacity>

            {formApps.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {formApps.map(pkg => (
                  <TouchableOpacity key={pkg} onPress={() => setFormApps(p=>p.filter(x=>x!==pkg))}
                    style={[s.chip, { backgroundColor: c.destructive+'15', borderColor: c.destructive+'30' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: c.destructive }}>{getName(pkg)} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22 }}
              onPress={() => setFormShorts(v=>!v)}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>Block Reels / Shorts / TikTok</Text>
                <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Block short video content in all apps</Text>
              </View>
              <View style={[s.toggle, { backgroundColor: formShorts ? c.accent : c.bgSecondary }]}>
                <View style={[s.thumb, { marginLeft: formShorts ? 22 : 2 }]} />
              </View>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
        </View>
      </Modal>

      {/* App Picker */}
<<<<<<< HEAD
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
=======
      <Modal visible={showAppPicker} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => setShowAppPicker(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[s.modalHdr, { borderBottomColor: c.border }]}>
            <View />
            <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Select Apps</Text>
            <TouchableOpacity onPress={() => setShowAppPicker(false)}>
              <Text style={{ color: c.accent, fontWeight: '800' }}>Done ({formApps.length})</Text>
            </TouchableOpacity>
          </View>
          {!isPro && formApps.length >= FREE_MAX_APPS && (
            <TouchableOpacity
              style={{ margin: 12, padding: 12, borderRadius: RADIUS.lg, backgroundColor: c.accentSoft, flexDirection: 'row', alignItems: 'center', gap: 10 }}
              onPress={() => { setShowAppPicker(false); setShowPaywall(true); }}
            >
              <Ionicons name="lock-closed" size={16} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600', flex: 1 }}>
                Free plan: {FREE_MAX_APPS} apps max. Upgrade for unlimited.
              </Text>
              <Ionicons name="chevron-forward" size={14} color={c.accent} />
            </TouchableOpacity>
          )}
          <View style={[s.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
            <Ionicons name="search-outline" size={16} color={c.textMuted} />
            <TextInput style={{ color: c.text, flex: 1, marginLeft: 8, fontSize: 14 }}
              placeholder="Search apps..." placeholderTextColor={c.textFaint}
              value={appSearch} onChangeText={setAppSearch} />
          </View>
          <FlatList
            data={installedApps.filter(a => a.name.toLowerCase().includes(appSearch.toLowerCase()))}
            keyExtractor={item => item.packageName}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const sel = formApps.includes(item.packageName);
              const locked = !isPro && !sel && formApps.length >= FREE_MAX_APPS;
              return (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
                    borderRadius: RADIUS.lg, marginBottom: 6, borderWidth: 1,
                    backgroundColor: sel ? c.accentSoft : c.bgCard,
                    borderColor: sel ? c.accent+'44' : c.border,
                    opacity: locked ? 0.4 : 1 }}
                  onPress={() => {
                    if (locked) { setShowAppPicker(false); setShowPaywall(true); return; }
                    setFormApps(p => sel ? p.filter(x=>x!==item.packageName) : [...p,item.packageName]);
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: sel ? c.accent+'22' : c.bgSecondary }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: sel ? c.accent : c.textMuted }}>{item.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: c.textFaint, marginTop: 1 }} numberOfLines={1}>{item.packageName}</Text>
                  </View>
                  <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                    borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.accent : 'transparent' }}>
                    {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
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
=======
const s = StyleSheet.create({
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  warnCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: RADIUS.xl, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  createBtn:{ borderRadius: RADIUS.xl, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, borderBottomWidth: 4 },
  emptyCard:{ alignItems: 'center', padding: 40, borderRadius: RADIUS.xxl, borderWidth: 1, gap: 12 },
  card:     { borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, marginBottom: 12 },
  activePill:{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, marginBottom: 10 },
  iconBox:  { width: 42, height: 42, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  toggle:   { width: 46, height: 26, borderRadius: 13, justifyContent: 'center' },
  thumb:    { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  chip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, marginRight: 8, borderWidth: 1 },
  actions:  { flexDirection: 'row', gap: 10, paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  actionBtn:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: RADIUS.lg },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  label:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  input:    { borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  searchBar:{ marginHorizontal: 12, marginVertical: 8, flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  // TimePicker
  pickerBox:{ borderRadius: RADIUS.lg, borderWidth: 1, padding: 14 },
  adjBtn:   { width: 30, height: 26, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  timeNum:  { fontSize: 26, fontWeight: '800', minWidth: 34, textAlign: 'center' },
  ampmBtn:  { paddingHorizontal: 10, paddingVertical: 16, borderRadius: RADIUS.md, marginLeft: 4, alignItems: 'center', justifyContent: 'center' },
});
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
