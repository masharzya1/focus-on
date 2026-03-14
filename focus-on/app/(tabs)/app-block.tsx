import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, Platform, FlatList, TextInput, Switch, Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS } from '@/constants/theme';
import AppBlocking from '@/modules/AppBlocking';
import type { AppBlockRoutine } from '@/types/study';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Tab = 'apps' | 'websites';

function getCurrentTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

// ── App Icon component ────────────────────────────────────────────────────────
function AppIcon({ icon, name, size = 40 }: { icon: string; name: string; size?: number }) {
  const { colors: c } = useTheme();
  if (icon) {
    return (
      <Image
        source={{ uri: `data:image/png;base64,${icon}` }}
        style={{ width: size, height: size, borderRadius: size * 0.25 }}
        resizeMode="contain"
      />
    );
  }
  // Fallback letter avatar
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.25,
      backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: c.accent }}>
        {name[0]?.toUpperCase() || '?'}
      </Text>
    </View>
  );
}

// ── TimePicker ────────────────────────────────────────────────────────────────
function TimePicker({ value, onChange, label, colors: c }: {
  value: string; onChange: (v: string) => void; label: string; colors: any;
}) {
  const [h, setH] = useState(() => parseInt(value.split(':')[0]) || 9);
  const [m, setM] = useState(() => parseInt(value.split(':')[1]) || 0);
  const emit = (nh: number, nm: number) =>
    onChange(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: c.textFaint, marginBottom: 6 }}>{label}</Text>
      <View style={{ backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Hours */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <TouchableOpacity onPress={() => { const nv = (h + 1) % 24; setH(nv); emit(nv, m); }}>
              <Ionicons name="chevron-up" size={14} color={c.accent} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '800', fontFamily: FONTS.extrabold, color: c.text, minWidth: 28, textAlign: 'center' }}>
              {String(h).padStart(2, '0')}
            </Text>
            <TouchableOpacity onPress={() => { const nv = (h + 23) % 24; setH(nv); emit(nv, m); }}>
              <Ionicons name="chevron-down" size={14} color={c.accent} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: c.textMuted }}>:</Text>
          {/* Minutes step 5 */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <TouchableOpacity onPress={() => { const nv = (Math.floor(m / 5) + 1) % 12 * 5; setM(nv); emit(h, nv); }}>
              <Ionicons name="chevron-up" size={14} color={c.accent} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '800', fontFamily: FONTS.extrabold, color: c.text, minWidth: 28, textAlign: 'center' }}>
              {String(m).padStart(2, '0')}
            </Text>
            <TouchableOpacity onPress={() => { const nv = (Math.floor(m / 5) + 11) % 12 * 5; setM(nv); emit(h, nv); }}>
              <Ionicons name="chevron-down" size={14} color={c.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AppBlockScreen() {
  const { state, addBlockRoutine, updateBlockRoutine, deleteBlockRoutine } = useStudy();
  const { colors: c } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('apps');
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [installedApps, setInstalledApps] = useState<{ name: string; packageName: string; icon: string }[]>([]);
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([]);

  // App routine modal
  const [showCreate, setShowCreate] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Website modal
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [websiteInput, setWebsiteInput] = useState('');

  // Form state
  const [rName, setRName] = useState('');
  const [rStart, setRStart] = useState('09:00');
  const [rEnd, setREnd] = useState('11:00');
  const [rDays, setRDays] = useState<number[]>([]);
  const [rApps, setRApps] = useState<string[]>([]);
  const [rShorts, setRShorts] = useState(false);
  const [rHard, setRHard] = useState(false);
  const [rAdmin, setRAdmin] = useState(false);

  useFocusEffect(useCallback(() => {
    AppBlocking.isAccessibilityEnabled().then(setAccessEnabled).catch(() => setAccessEnabled(false));
    AppBlocking.getBlockedWebsites().then(setBlockedWebsites).catch(() => {});
  }, []));

  const loadApps = async () => {
    try {
      if (installedApps.length === 0) {
        const apps = await AppBlocking.getInstalledApps();
        setInstalledApps(apps);
      }
      setShowAppPicker(true);
    } catch {
      Alert.alert('Error', 'Could not load installed apps.');
    }
  };

  const resetForm = () => {
    setRName(''); setRStart('09:00'); setREnd('11:00');
    setRDays([]); setRApps([]); setRShorts(false);
    setRHard(false); setRAdmin(false); setEditingId(null);
  };

  const openEdit = (r: AppBlockRoutine) => {
    setEditingId(r.id);
    setRName(r.name); setRStart(r.startTime); setREnd(r.endTime);
    setRDays(r.days); setRApps(r.blockedApps); setRShorts(r.blockShorts);
    setRHard(r.hardBlock ?? false); setRAdmin(r.deviceAdmin ?? false);
    setShowCreate(true);
  };

  const saveRoutine = () => {
    if (!rName.trim() || rApps.length === 0) {
      Alert.alert('Missing info', 'Please add a name and select at least one app.');
      return;
    }
    const routine: AppBlockRoutine = {
      id: editingId || Date.now().toString(),
      name: rName.trim(), startTime: rStart, endTime: rEnd,
      days: rDays, blockedApps: rApps, blockShorts: rShorts,
      enabled: true, hardBlock: rHard, deviceAdmin: rAdmin,
    };
    if (editingId) updateBlockRoutine(routine);
    else addBlockRoutine(routine);
    setShowCreate(false);
    resetForm();
  };

  const addWebsite = () => {
    const domain = AppBlocking.normalizeDomain(websiteInput.trim());
    if (!domain) return;
    if (blockedWebsites.includes(domain)) {
      Alert.alert('Already blocked', `${domain} is already in the list.`);
      return;
    }
    const updated = [...blockedWebsites, domain];
    setBlockedWebsites(updated);
    AppBlocking.saveBlockedWebsites(updated);
    setWebsiteInput('');
    setShowAddWebsite(false);
  };

  const removeWebsite = (domain: string) => {
    const updated = blockedWebsites.filter(w => w !== domain);
    setBlockedWebsites(updated);
    AppBlocking.saveBlockedWebsites(updated);
  };

  const isActive = (r: AppBlockRoutine) => {
    const now = getCurrentTime();
    const today = new Date().getDay();
    return r.enabled && now >= r.startTime && now <= r.endTime &&
      (r.days.length === 0 || r.days.includes(today));
  };

  const getApp = (pkg: string) => installedApps.find(a => a.packageName === pkg);

  const filteredApps = installedApps.filter(a =>
    !appSearch ||
    a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.packageName.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>App Block</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>Stay focused, stay in control</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.accent }]}
          onPress={() => {
            if (activeTab === 'websites') { setShowAddWebsite(true); return; }
            if (!accessEnabled) {
              Alert.alert('Permission needed',
                'Enable Accessibility permission so Focus On can block apps.',
                [{ text: 'Open Settings', onPress: () => AppBlocking.openAccessibilitySettings() },
                 { text: 'Cancel', style: 'cancel' }]);
              return;
            }
            resetForm(); setShowCreate(true);
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>{activeTab === 'websites' ? 'Add Site' : 'New'}</Text>
        </TouchableOpacity>
      </View>

      {/* Accessibility warning */}
      {!accessEnabled && (
        <TouchableOpacity style={[styles.warnCard, { backgroundColor: '#FEF3C7' }]}
          onPress={() => AppBlocking.openAccessibilitySettings()}>
          <View style={[styles.warnIconBox, { backgroundColor: '#FDE68A' }]}>
            <Ionicons name="warning" size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.warnTitle, { color: '#92400E' }]}>Accessibility Permission Required</Text>
            <Text style={[styles.warnSub, { color: '#B45309' }]}>Tap to enable — needed for all blocking</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D97706" />
        </TouchableOpacity>
      )}

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: c.bgSecondary }]}>
        {(['apps', 'websites'] as Tab[]).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabBtn,
            activeTab === tab && { backgroundColor: c.bgCard, borderRadius: RADIUS.md }]}
            onPress={() => setActiveTab(tab)}>
            <Ionicons
              name={tab === 'apps' ? 'shield' : 'globe'}
              size={15}
              color={activeTab === tab ? c.accent : c.textMuted}
            />
            <Text style={[styles.tabTxt, { color: activeTab === tab ? c.accent : c.textMuted,
              fontWeight: activeTab === tab ? '700' : '500' }]}>
              {tab === 'apps' ? `App Routines${state.blockRoutines.length > 0 ? ` (${state.blockRoutines.length})` : ''}` : `Websites${blockedWebsites.length > 0 ? ` (${blockedWebsites.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── APP ROUTINES TAB ── */}
        {activeTab === 'apps' && (
          <>
            {state.blockRoutines.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconCircle, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="shield-outline" size={40} color={c.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>No block routines</Text>
                <Text style={[styles.emptySub, { color: c.textMuted }]}>Block distracting apps during study time</Text>
              </View>
            ) : (
              state.blockRoutines.map((r, i) => {
                const active = isActive(r);
                return (
                  <Animated.View key={r.id} entering={FadeInDown.delay(i * 60).springify()}>
                    <View style={[styles.routineCard, {
                      backgroundColor: c.bgCard,
                      borderLeftColor: active ? c.success : c.accent,
                    }]}>
                      {active && (
                        <View style={[styles.activePill, { backgroundColor: c.success + '18' }]}>
                          <View style={[styles.activeDot, { backgroundColor: c.success }]} />
                          <Text style={[styles.activePillTxt, { color: c.success }]}>ACTIVE NOW</Text>
                        </View>
                      )}
                      <View style={styles.routineTop}>
                        <View style={[styles.routineIconBox, { backgroundColor: active ? c.success + '18' : c.accentSoft }]}>
                          <Ionicons name="shield" size={20} color={active ? c.success : c.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.routineName, { color: c.text }]}>{r.name}</Text>
                          <Text style={[styles.routineTime, { color: c.textMuted }]}>
                            {r.startTime} – {r.endTime}
                            {r.days.length > 0 ? ` · ${r.days.map(d => DAY_NAMES[d]).join(', ')}` : ' · Every day'}
                          </Text>
                          {/* Badges */}
                          <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: c.destructive + '15' }]}>
                              <Ionicons name="apps" size={10} color={c.destructive} />
                              <Text style={[styles.badgeTxt, { color: c.destructive }]}>{r.blockedApps.length} apps</Text>
                            </View>
                            {r.blockShorts && (
                              <View style={[styles.badge, { backgroundColor: '#8B5CF6' + '18' }]}>
                                <Ionicons name="videocam-off" size={10} color="#8B5CF6" />
                                <Text style={[styles.badgeTxt, { color: '#8B5CF6' }]}>Shorts/Reels</Text>
                              </View>
                            )}
                            {r.hardBlock && (
                              <View style={[styles.badge, { backgroundColor: c.destructive + '18' }]}>
                                <Ionicons name="lock-closed" size={10} color={c.destructive} />
                                <Text style={[styles.badgeTxt, { color: c.destructive }]}>Hard</Text>
                              </View>
                            )}
                          </View>
                          {/* App icons preview */}
                          {installedApps.length > 0 && (
                            <View style={styles.iconPreviewRow}>
                              {r.blockedApps.slice(0, 5).map(pkg => {
                                const app = getApp(pkg);
                                return app ? (
                                  <AppIcon key={pkg} icon={app.icon} name={app.name} size={28} />
                                ) : null;
                              })}
                              {r.blockedApps.length > 5 && (
                                <View style={[styles.moreChip, { backgroundColor: c.bgSecondary }]}>
                                  <Text style={[styles.moreChipTxt, { color: c.textMuted }]}>+{r.blockedApps.length - 5}</Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                        <Switch
                          value={r.enabled}
                          onValueChange={v => updateBlockRoutine({ ...r, enabled: v })}
                          trackColor={{ true: c.accent }}
                          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                        />
                      </View>
                      {/* Action buttons */}
                      <View style={[styles.actionRow, { borderTopColor: c.border }]}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.accentSoft }]}
                          onPress={() => openEdit(r)}>
                          <Ionicons name="pencil-outline" size={14} color={c.accent} />
                          <Text style={[styles.actionBtnTxt, { color: c.accent }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: c.destructive + '12' }]}
                          onPress={() => Alert.alert('Delete?', `Delete "${r.name}"?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteBlockRoutine(r.id) },
                          ])}>
                          <Ionicons name="trash-outline" size={14} color={c.destructive} />
                          <Text style={[styles.actionBtnTxt, { color: c.destructive }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </>
        )}

        {/* ── WEBSITES TAB ── */}
        {activeTab === 'websites' && (
          <>
            <View style={[styles.webInfoCard, { backgroundColor: c.accentSoft, borderColor: c.accent + '30' }]}>
              <Ionicons name="information-circle" size={18} color={c.accent} />
              <Text style={[styles.webInfoTxt, { color: c.accent }]}>
                Blocks websites in Chrome, Firefox, Samsung Browser and more. Accessibility permission required.
              </Text>
            </View>

            {blockedWebsites.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconCircle, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="globe-outline" size={40} color={c.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>No websites blocked</Text>
                <Text style={[styles.emptySub, { color: c.textMuted }]}>Block distracting websites across all browsers</Text>
              </View>
            ) : (
              blockedWebsites.map((domain, i) => (
                <Animated.View key={domain} entering={FadeInDown.delay(i * 50).springify()}>
                  <View style={[styles.webCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
                    <View style={[styles.webIconBox, { backgroundColor: '#E53E3E' + '15' }]}>
                      <Ionicons name="globe" size={18} color="#E53E3E" />
                    </View>
                    <Text style={[styles.webDomain, { color: c.text }]}>{domain}</Text>
                    <TouchableOpacity onPress={() => Alert.alert('Remove?', `Unblock ${domain}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeWebsite(domain) },
                    ])}>
                      <Ionicons name="trash-outline" size={18} color={c.destructive} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Create/Edit Routine Modal ── */}
      <Modal visible={showCreate} transparent animationType="slide"
        onRequestClose={() => { setShowCreate(false); resetForm(); }}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => { setShowCreate(false); resetForm(); }}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: c.text }]}>
                {editingId ? 'Edit Routine' : 'New Block Routine'}
              </Text>
              <View style={{ width: 22 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.lbl, { color: c.textMuted }]}>Name</Text>
              <TextInput style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                placeholder="e.g. Morning Study Block" placeholderTextColor={c.textFaint}
                value={rName} onChangeText={setRName} />

              <Text style={[styles.lbl, { color: c.textMuted }]}>Time</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TimePicker value={rStart} onChange={setRStart} label="Start" colors={c} />
                <TimePicker value={rEnd} onChange={setREnd} label="End" colors={c} />
              </View>

              <Text style={[styles.lbl, { color: c.textMuted }]}>Days (empty = every day)</Text>
              <View style={styles.dayRow}>
                {DAY_NAMES.map((d, i) => (
                  <TouchableOpacity key={i} style={[styles.dayBtn, {
                    backgroundColor: rDays.includes(i) ? c.accent : c.inputBg,
                    borderColor: rDays.includes(i) ? c.accent : c.border,
                  }]} onPress={() => setRDays(ds => ds.includes(i) ? ds.filter(x => x !== i) : [...ds, i])}>
                    <Text style={[styles.dayTxt, { color: rDays.includes(i) ? '#fff' : c.textMuted }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Options */}
              {[
                { icon: 'videocam-off' as const, iconColor: '#8B5CF6', label: 'Block Shorts / Reels', sub: 'YouTube Shorts, Instagram Reels, Snapchat Spotlight', val: rShorts, set: setRShorts, color: '#8B5CF6' },
                { icon: 'lock-closed' as const, iconColor: c.destructive, label: 'Hard Block', sub: 'Cannot unblock without uninstalling', val: rHard, set: setRHard, color: c.destructive },
                { icon: 'shield-checkmark' as const, iconColor: '#DC2626', label: 'Device Admin', sub: 'Strongest — cannot uninstall either', val: rAdmin, set: (v: boolean) => { if (v) setRHard(true); setRAdmin(v); }, color: '#DC2626' },
              ].map((opt, i) => (
                <View key={i} style={[styles.optRow, { borderColor: c.border, backgroundColor: c.bg }]}>
                  <View style={[styles.optIconBox, { backgroundColor: opt.iconColor + '18' }]}>
                    <Ionicons name={opt.icon} size={16} color={opt.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optLabel, { color: c.text }]}>{opt.label}</Text>
                    <Text style={[styles.optSub, { color: c.textMuted }]}>{opt.sub}</Text>
                  </View>
                  <Switch value={opt.val} onValueChange={opt.set} trackColor={{ true: opt.color }} />
                </View>
              ))}

              <TouchableOpacity style={[styles.pickAppsBtn, { backgroundColor: c.accentSoft, borderColor: c.accent }]}
                onPress={loadApps}>
                <Ionicons name="apps" size={18} color={c.accent} />
                <Text style={[styles.pickAppsTxt, { color: c.accent }]}>
                  {rApps.length > 0 ? `${rApps.length} app${rApps.length > 1 ? 's' : ''} selected` : 'Select apps to block'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={c.accent} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.accent, opacity: rName.trim() && rApps.length > 0 ? 1 : 0.45 }]}
                onPress={saveRoutine}>
                <Ionicons name={editingId ? 'checkmark-circle' : 'shield-checkmark'} size={18} color="#fff" />
                <Text style={styles.saveTxt}>{editingId ? 'Update Routine' : 'Save Routine'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── App Picker Modal ── */}
      <Modal visible={showAppPicker} transparent animationType="slide"
        onRequestClose={() => setShowAppPicker(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <View style={styles.sheetHeader}>
              <View style={{ width: 22 }} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>Select Apps</Text>
              <TouchableOpacity onPress={() => setShowAppPicker(false)}>
                <Text style={{ color: c.accent, fontWeight: '800', fontFamily: FONTS.extrabold, fontSize: 15 }}>
                  Done ({rApps.length})
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              <Ionicons name="search-outline" size={16} color={c.textMuted} />
              <TextInput style={{ color: c.text, flex: 1, marginLeft: 8 }}
                placeholder="Search apps..." placeholderTextColor={c.textFaint}
                value={appSearch} onChangeText={setAppSearch} />
            </View>
            <FlatList
              data={filteredApps}
              keyExtractor={i => i.packageName}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const sel = rApps.includes(item.packageName);
                return (
                  <TouchableOpacity
                    style={[styles.appItem, { backgroundColor: sel ? c.accentSoft : 'transparent', borderColor: c.border }]}
                    onPress={() => setRApps(a => sel ? a.filter(x => x !== item.packageName) : [...a, item.packageName])}
                  >
                    <AppIcon icon={item.icon} name={item.name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appName, { color: c.text }]}>{item.name}</Text>
                      <Text style={[styles.appPkg, { color: c.textFaint }]} numberOfLines={1}>{item.packageName}</Text>
                    </View>
                    <View style={[styles.checkBox, { borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.accent : 'transparent' }]}>
                      {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Add Website Modal ── */}
      <Modal visible={showAddWebsite} transparent animationType="slide"
        onRequestClose={() => { setShowAddWebsite(false); setWebsiteInput(''); }}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => { setShowAddWebsite(false); setWebsiteInput(''); }}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: c.text }]}>Block a Website</Text>
              <View style={{ width: 22 }} />
            </View>

            <Text style={[styles.lbl, { color: c.textMuted }]}>Website URL or Domain</Text>
            <View style={[styles.webInputRow, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              <Ionicons name="globe-outline" size={18} color={c.textMuted} />
              <TextInput
                style={{ color: c.text, flex: 1, marginLeft: 10, fontSize: 15, fontFamily: FONTS.regular }}
                placeholder="e.g. facebook.com or https://reddit.com"
                placeholderTextColor={c.textFaint}
                value={websiteInput}
                onChangeText={setWebsiteInput}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />
            </View>
            {websiteInput.trim().length > 0 && (
              <Text style={[styles.webPreview, { color: c.textMuted }]}>
                Will block: <Text style={{ color: c.accent, fontWeight: '700' }}>
                  {AppBlocking.normalizeDomain(websiteInput.trim())}
                </Text>
              </Text>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: c.accent, marginTop: 20, opacity: websiteInput.trim() ? 1 : 0.45 }]}
              onPress={addWebsite}
            >
              <Ionicons name="globe" size={18} color="#fff" />
              <Text style={styles.saveTxt}>Block Website</Text>
            </TouchableOpacity>

            {/* Quick add common sites */}
            <Text style={[styles.lbl, { color: c.textMuted, marginTop: 20 }]}>Quick Add</Text>
            <View style={styles.quickAddRow}>
              {['youtube.com', 'instagram.com', 'facebook.com', 'twitter.com', 'reddit.com', 'tiktok.com'].map(site => (
                <TouchableOpacity key={site}
                  style={[styles.quickChip, {
                    backgroundColor: blockedWebsites.includes(site) ? c.success + '20' : c.bgSecondary,
                    borderColor: blockedWebsites.includes(site) ? c.success : c.border,
                  }]}
                  onPress={() => {
                    if (blockedWebsites.includes(site)) return;
                    const updated = [...blockedWebsites, site];
                    setBlockedWebsites(updated);
                    AppBlocking.saveBlockedWebsites(updated);
                  }}
                >
                  {blockedWebsites.includes(site)
                    ? <Ionicons name="checkmark-circle" size={12} color={c.success} />
                    : <Ionicons name="add-circle-outline" size={12} color={c.textMuted} />
                  }
                  <Text style={[styles.quickChipTxt, {
                    color: blockedWebsites.includes(site) ? c.success : c.textMuted,
                  }]}>{site}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 20 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', fontFamily: FONTS.extrabold, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.bold, fontSize: 14 },
  warnCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, padding: 14, borderRadius: 14, marginBottom: 8 },
  warnIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  warnTitle: { fontSize: 13, fontWeight: '700', fontFamily: FONTS.bold },
  warnSub: { fontSize: 11, marginTop: 2 },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, borderRadius: RADIUS.lg, padding: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  tabTxt: { fontSize: 13, fontFamily: FONTS.semibold },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700', fontFamily: FONTS.bold },
  emptySub: { fontSize: 14, textAlign: 'center' },
  webInfoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 12 },
  webInfoTxt: { fontSize: 13, flex: 1, lineHeight: 18 },
  webCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 8 },
  webIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  webDomain: { flex: 1, fontSize: 14, fontWeight: '600', fontFamily: FONTS.semibold },
  routineCard: { borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, borderLeftWidth: 4, overflow: 'hidden' },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: 10 },
  activeDot: { width: 7, height: 7, borderRadius: 4 },
  activePillTxt: { fontSize: 10, fontWeight: '800', fontFamily: FONTS.extrabold, letterSpacing: 0.5 },
  routineTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routineIconBox: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  routineName: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.bold, marginBottom: 3 },
  routineTime: { fontSize: 12, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  badgeTxt: { fontSize: 11, fontWeight: '600', fontFamily: FONTS.semibold },
  iconPreviewRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 },
  moreChip: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  moreChipTxt: { fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: RADIUS.md },
  actionBtnTxt: { fontSize: 13, fontWeight: '700', fontFamily: FONTS.bold },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '92%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', fontFamily: FONTS.extrabold },
  lbl: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { height: 50, borderRadius: 13, paddingHorizontal: 16, fontSize: 15, borderWidth: 1.5, marginBottom: 8 },
  dayRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  dayBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1.5 },
  dayTxt: { fontSize: 12, fontWeight: '700', fontFamily: FONTS.bold },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: RADIUS.md, marginTop: 8 },
  optIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optLabel: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.semibold },
  optSub: { fontSize: 11, marginTop: 2 },
  pickAppsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderRadius: 14, paddingVertical: 14, marginTop: 16, marginBottom: 12 },
  pickAppsTxt: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.bold, flex: 1, textAlign: 'center' },
  saveBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexDirection: 'row', gap: 8 },
  saveTxt: { color: '#fff', fontSize: 17, fontWeight: '800', fontFamily: FONTS.extrabold },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12 },
  appItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderRadius: 8 },
  appName: { fontSize: 14, fontWeight: '600', fontFamily: FONTS.semibold },
  appPkg: { fontSize: 11, marginTop: 1 },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  webInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 13, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  webPreview: { fontSize: 13, marginBottom: 4 },
  quickAddRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1 },
  quickChipTxt: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semibold },
});
