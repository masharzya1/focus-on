import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, Platform, FlatList, TextInput, AppState,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { RADIUS } from '@/constants/theme';
import AppBlocking from '@/modules/AppBlocking';
import PaywallModal from '@/components/PaywallModal';
import type { AppBlockRoutine } from '@/types/study';

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getCurrentTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

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
      </View>
    </View>
  );
}

export default function AppBlockScreen() {
  const { state, addBlockRoutine, updateBlockRoutine, deleteBlockRoutine } = useStudy();
  const { colors: c } = useTheme();
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
                  </View>
                </View>
              </Animated.View>
            );
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
        </View>
      </Modal>

      {/* App Picker */}
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
    </View>
  );
}

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
