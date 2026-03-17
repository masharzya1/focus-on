import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, Platform, FlatList, TextInput, Switch, Image, NativeModules,
  KeyboardAvoidingView, Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { InteractionManager } from 'react-native';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';
import { RADIUS, FONTS } from '@/constants/theme';
import AppBlocking from '@/modules/AppBlocking';
import type { AppBlockRoutine, AppTimeLimit } from '@/types/study';


// ── Known distraction app packages ───────────────────────────────────────────
const DISTRACTION_PACKAGES = new Set([
  // Social media
  'com.facebook.katana','com.instagram.android','com.twitter.android',
  'com.snapchat.android','com.tiktok','com.zhiliaoapp.musically',
  'com.pinterest','com.reddit.frontpage','com.tumblr',
  'com.linkedin.android','com.vk.android','com.telegram.messenger',
  'org.telegram.messenger','com.whatsapp','com.discord',
  // Video
  'com.google.android.youtube','com.netflix.mediaclient',
  'com.amazon.avod.thirdpartyclient','com.hotstar',
  'tv.twitch.android.app','com.facebook.orca',
  // Games (popular time wasters)
  'com.supercell.clashofclans','com.supercell.clashroyale',
  'com.king.candycrushsaga','com.garena.free.fire',
  'com.activision.callofduty.shooter','com.mobile.legends',
  // Browsers (optional block)
  'com.android.chrome','org.mozilla.firefox',
  'com.sec.android.app.sbrowser','com.opera.browser',
  // Shopping / other
  'com.amazon.mShop.android.shopping','com.ebay.mobile',
]);

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type Tab = 'apps' | 'websites' | 'limits' | 'reels';

function getCurrentTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

// ── App Icon ──────────────────────────────────────────────────────────────────
function AppIcon({ icon, name, size = 40 }: { icon: string; name: string; size?: number }) {
  const { colors: c } = useTheme();
  const t = useT();
  if (icon) return (
    <Image
      source={{ uri: `data:image/png;base64,${icon}` }}
      style={{ width: size, height: size, borderRadius: size * 0.25 }}
      resizeMode="contain"
    />
  );
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.25,
      backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: c.accent }}>
        {name[0]?.toUpperCase() || '?'}
      </Text>
    </View>
  );
}

// ── Scroll Wheel Column ───────────────────────────────────────────────────────
function WheelColumn({ items, selectedIndex, onChange, width = 56, colors: c }: {
  items: string[]; selectedIndex: number; onChange: (i: number) => void;
  width?: number; colors: any;
}) {
  const ITEM_H = 42;
  const VISIBLE = 5;
  const scrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);

  const scrollTo = useCallback((index: number, animated = true) => {
    scrollRef.current?.scrollTo({ y: index * ITEM_H, animated });
  }, []);

  // Sync scroll when selectedIndex changes externally (e.g. modal opens with value)
  useEffect(() => {
    if (!isScrolling.current) {
      setTimeout(() => scrollTo(selectedIndex, false), 30);
    }
  }, [selectedIndex]);

  return (
    <View style={{ width, height: ITEM_H * VISIBLE, overflow: 'hidden', position: 'relative' }}>
      {/* Selection highlight */}
      <View style={{
        position: 'absolute', top: ITEM_H * 2, height: ITEM_H, left: 0, right: 0,
        backgroundColor: c.accent + '22', borderRadius: 10,
        borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: c.accent + '55',
        zIndex: 1, pointerEvents: 'none',
      }} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onScrollBeginDrag={() => { isScrolling.current = true; }}
        onMomentumScrollEnd={e => {
          isScrolling.current = false;
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.max(0, Math.min(i, items.length - 1));
          scrollTo(clamped, true);
          onChange(clamped);
        }}
        onScrollEndDrag={e => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.max(0, Math.min(i, items.length - 1));
          scrollTo(clamped, true);
          onChange(clamped);
          setTimeout(() => { isScrolling.current = false; }, 100);
        }}
        onLayout={() => {
          setTimeout(() => scrollTo(selectedIndex, false), 50);
        }}
      >
        {items.map((item, i) => {
          const active = i === selectedIndex;
          return (
            <TouchableOpacity key={i} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { scrollTo(i, true); onChange(i); }} activeOpacity={0.7}>
              <Text style={{
                fontSize: active ? 20 : 16,
                fontWeight: active ? '800' : '400',
                color: active ? c.accent : c.textMuted,
                opacity: Math.abs(i - selectedIndex) > 2 ? 0.2 : 1,
              }}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Scroll Wheel Time Picker ──────────────────────────────────────────────────
function TimePicker({ value, onChange, label, colors: c }: {
  value: string; onChange: (v: string) => void; label: string; colors: any;
}) {
  const [h24, m] = value.split(':').map(Number);
  const isPM    = h24 >= 12;
  const h12     = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;

  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const ampm    = ['AM', 'PM'];

  const emit = (newH12: number, newM: number, newPM: boolean) => {
    let h = newH12 % 12;
    if (newPM) h += 12;
    onChange(`${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: c.textFaint, marginBottom: 8, textAlign: 'center',
        fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
      <View style={{ backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 1.5,
        borderRadius: 16, padding: 10, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <WheelColumn
            items={hours}
            selectedIndex={h12 - 1}
            onChange={i => emit(i + 1, m, isPM)}
            width={50} colors={c}
          />
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.textMuted, marginBottom: 2 }}>:</Text>
          <WheelColumn
            items={minutes}
            selectedIndex={m}
            onChange={i => emit(h12, i, isPM)}
            width={50} colors={c}
          />
          <WheelColumn
            items={ampm}
            selectedIndex={isPM ? 1 : 0}
            onChange={i => emit(h12, m, i === 1)}
            width={48} colors={c}
          />
        </View>
      </View>
    </View>
  );
}

// ── Duration picker (for time limits) ────────────────────────────────────────
function DurationPicker({ value, onChange, colors: c }: {
  value: number; onChange: (mins: number) => void; colors: any;
}) {
  const t = useT();
  const hours = Array.from({ length: 13 }, (_, i) => String(i).padStart(1, '0'));
  const mins  = ['00', '15', '30', '45'];
  const h = Math.floor(value / 60);
  const m = value % 60;
  const mIdx = Math.floor(m / 15);

  return (
    <View style={{ backgroundColor: c.inputBg, borderColor: c.border, borderWidth: 1.5,
      borderRadius: 16, padding: 10, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <WheelColumn
          items={hours}
          selectedIndex={h}
          onChange={i => onChange(i * 60 + mIdx * 15)}
          width={46} colors={c}
        />
        <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600' }}>h</Text>
        <WheelColumn
          items={mins}
          selectedIndex={mIdx}
          onChange={i => onChange(h * 60 + i * 15)}
          width={46} colors={c}
        />
        <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600' }}>{t.appBlockMin}</Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AppBlockScreen() {
  const { state, addBlockRoutine, updateBlockRoutine, deleteBlockRoutine,
          addTimeLimit, updateTimeLimit, deleteTimeLimit } = useStudy();
  const { colors: c } = useTheme();
  const t = useT();

  const [activeTab, setActiveTab] = useState<Tab>('apps');
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [usageEnabled, setUsageEnabled] = useState(false);
  const [installedApps, setInstalledApps] = useState<{ name: string; packageName: string; icon: string }[]>([]);
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([]);
  // Reels Block state — per-app always-on reels blocking
  const [reelsBlocked, setReelsBlocked] = useState<string[]>([]);

  // Routine modal
  const [showCreate, setShowCreate]     = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [appSearch, setAppSearch]       = useState('');
  const [editingId, setEditingId]       = useState<string | null>(null);

  // Website modal
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [websiteInput, setWebsiteInput]     = useState('');

  // Time limit modal
  const [showLimitModal, setShowLimitModal]   = useState(false);
  const [limitPickerFor, setLimitPickerFor]   = useState<'new' | string>('new');
  const [limitAppSearch, setLimitAppSearch]   = useState('');
  const [limitSelectedApp, setLimitSelectedApp] = useState<{ name: string; packageName: string; icon: string } | null>(null);
  const [limitMinutes, setLimitMinutes]       = useState(60);

  // Routine form
  const [rName, setRName]     = useState('');
  const [rStart, setRStart]   = useState('09:00');
  const [rEnd, setREnd]       = useState('11:00');
  const [rDays, setRDays]     = useState<number[]>([]);
  const [rApps, setRApps]     = useState<string[]>([]);
  const [rShorts, setRShorts] = useState(false);
  const [rHard, setRHard]     = useState(false);
  const [rAdmin, setRAdmin]   = useState(false);
  const [rMaxUnlocks, setRMaxUnlocks] = useState(3);
  const [rPassword, setRPassword]     = useState('');

  // Emergency unlock modal
  const [showEmergency, setShowEmergency]       = useState(false);
  const [emergencyRoutine, setEmergencyRoutine] = useState<AppBlockRoutine | null>(null);
  const [emergencyInput, setEmergencyInput]     = useState('');
  const [emergencyError, setEmergencyError]     = useState('');

  const [loadingApps, setLoadingApps] = useState(false);

  useFocusEffect(useCallback(() => {
    // Delay ALL native calls until after tab transition completes
    const task = InteractionManager.runAfterInteractions(() => {
      AppBlocking.isAccessibilityEnabled().then(setAccessEnabled).catch(() => {});
      AppBlocking.hasUsagePermission().then(setUsageEnabled).catch(() => {});
      AppBlocking.getBlockedWebsites().then(setBlockedWebsites).catch(() => {});
      AppBlocking.getReelsBlock().then(setReelsBlocked).catch(() => {});
      if (installedApps.length === 0) {
        setLoadingApps(true);
        AppBlocking.getInstalledApps()
          .then(all => {
            const sorted = [
              ...all.filter((a: any) => DISTRACTION_PACKAGES.has(a.packageName)),
              ...all.filter((a: any) => !DISTRACTION_PACKAGES.has(a.packageName)),
            ];
            setInstalledApps(sorted);
            setLoadingApps(false);
          })
          .catch(() => setLoadingApps(false));
      }
    });
    return () => task.cancel();
  }, []));

  const loadApps = (forPicker: 'routine' | 'limit' = 'routine') => {
    if (forPicker === 'limit') {
      setLimitPickerFor('new');
      setLimitSelectedApp(null);
      setLimitMinutes(60);
      setLimitAppSearch('');
      setShowLimitModal(true);
    } else {
      setShowAppPicker(true);
    }
  };

  const resetForm = () => {
    setRName(''); setRStart('09:00'); setREnd('11:00');
    setRDays([]); setRApps([]); setRShorts(false);
    setRHard(false); setRAdmin(false); setEditingId(null);
    setRMaxUnlocks(3); setRPassword('');
  };

  const openEdit = (r: AppBlockRoutine) => {
    setEditingId(r.id);
    setRName(r.name); setRStart(r.startTime ?? '09:00'); setREnd(r.endTime ?? '11:00');
    setRDays(r.days); setRApps(r.blockedApps); setRShorts(r.blockShorts);
    setRHard(r.hardBlock ?? false); setRAdmin(r.deviceAdmin ?? false);
    setRMaxUnlocks(r.maxEmergencyUnlocks ?? 3);
    setRPassword(r.emergencyPassword ?? '');
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
      maxEmergencyUnlocks: rHard ? rMaxUnlocks : undefined,
      emergencyPassword: (rHard && rPassword.trim()) ? rPassword.trim() : undefined,
      emergencyUnlockCount: editingId
        ? (state.blockRoutines.find(r => r.id === editingId)?.emergencyUnlockCount ?? 0)
        : 0,
      lastUnlockDate: editingId
        ? state.blockRoutines.find(r => r.id === editingId)?.lastUnlockDate
        : undefined,
    };
    if (editingId) updateBlockRoutine(routine);
    else addBlockRoutine(routine);
    setShowCreate(false);
    resetForm();
    // Immediately push to native. We capture 'routine' and 'editingId' in closure
    // to avoid stale state. The AccessibilityService SharedPreferences listener
    // picks this up instantly and calls syncFromRoutines().
    const capturedRoutine = routine;
    const capturedEditingId = editingId;
    const capturedCurrent = state.blockRoutines;
    setTimeout(() => {
      try {
        if (NativeModules.AppBlockingModule) {
          const allRoutines = capturedEditingId
            ? capturedCurrent.map(r => r.id === capturedRoutine.id ? capturedRoutine : r)
            : [...capturedCurrent, capturedRoutine];
          NativeModules.AppBlockingModule.saveRoutines(JSON.stringify(allRoutines));
        }
      } catch (_) {}
    }, 100);
  };

  const saveTimeLimit = () => {
    if (!limitSelectedApp) {
      Alert.alert('Select an app', 'Please select an app to set a time limit for.');
      return;
    }
    if (limitMinutes < 15) {
      Alert.alert('Too short', 'Minimum time limit is 15 minutes.');
      return;
    }
    const existing = state.timeLimits?.find(t => t.packageName === limitSelectedApp.packageName);
    if (existing && limitPickerFor === 'new') {
      const updated: AppTimeLimit = { ...existing, limitMinutes, enabled: true };
      updateTimeLimit(updated);
    } else if (limitPickerFor !== 'new') {
      const tl = state.timeLimits?.find(t => t.id === limitPickerFor);
      if (tl) updateTimeLimit({ ...tl, limitMinutes });
    } else {
      addTimeLimit({
        id: Date.now().toString(),
        packageName: limitSelectedApp.packageName,
        appName: limitSelectedApp.name,
        limitMinutes,
        enabled: true,
      });
    }
    setShowLimitModal(false);
  };

  const handleAdminToggle = async (v: boolean) => {
    if (!v) { setRAdmin(false); return; }
    setRHard(true);
    const isActive = await AppBlocking.isDeviceAdminActive();
    if (isActive) { setRAdmin(true); return; }
    // Not granted yet — open settings, then verify on return
    await AppBlocking.requestDeviceAdmin();
    // Wait 1.5s then re-check (user might have granted or cancelled)
    setTimeout(async () => {
      const granted = await AppBlocking.isDeviceAdminActive().catch(() => false);
      setRAdmin(granted);
      if (!granted) setRHard(false); // if cancelled, also turn off hard block
    }, 1500);
  };

  const addWebsite = () => {
    const domain = AppBlocking.normalizeDomain(websiteInput.trim());
    if (!domain) return;
    if (blockedWebsites.includes(domain)) {
      Alert.alert('Already blocked', `${domain} is already in the list.`); return;
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
    return r.enabled && !!r.startTime && !!r.endTime && now >= r.startTime && now <= r.endTime &&
      (r.days.length === 0 || r.days.includes(today));
  };

  const getApp = (pkg: string) => installedApps.find(a => a.packageName === pkg);
  const filteredApps = installedApps.filter(a =>
    !appSearch || a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.packageName.toLowerCase().includes(appSearch.toLowerCase())
  );
  const filteredLimitApps = installedApps.filter(a =>
    !limitAppSearch || a.name.toLowerCase().includes(limitAppSearch.toLowerCase())
  );

  const timeLimits = state.timeLimits || [];

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Tab labels
  const tabInfo: { key: Tab; icon: string; label: string }[] = [
    { key: 'apps',     icon: 'shield',    label: `Routines${state.blockRoutines.length > 0 ? ` (${state.blockRoutines.length})` : ''}` },
    { key: 'reels',    icon: 'videocam-off', label: `Reels${reelsBlocked.length > 0 ? ` (${reelsBlocked.length})` : ''}` },
    { key: 'websites', icon: 'globe',     label: `Websites${blockedWebsites.length > 0 ? ` (${blockedWebsites.length})` : ''}` },
    { key: 'limits',   icon: 'timer',     label: `Limits${timeLimits.length > 0 ? ` (${timeLimits.length})` : ''}` },
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>{t.appBlockTitle}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>{t.appBlockSubtitle}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.accent, opacity: activeTab === 'reels' ? 0 : 1 }]}
          disabled={activeTab === 'reels'}
          onPress={() => {
            if (activeTab === 'websites') { setShowAddWebsite(true); return; }
            if (activeTab === 'limits') { loadApps('limit'); return; }
            if (!accessEnabled) {
              Alert.alert('Permission needed',
                'Enable Accessibility permission so Focus On can block apps.',
                [{ text: 'Open Settings', onPress: () => AppBlocking.openAccessibilitySettings() },
                 { text: t.appBlockCancel, style: 'cancel' }]);
              return;
            }
            resetForm(); setShowCreate(true);
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>
            {activeTab === 'websites' ? 'Add Site' : activeTab === 'limits' ? 'Set Limit' : 'New'}
          </Text>
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
            <Text style={[styles.warnTitle, { color: '#92400E' }]}>{t.appBlockAccessTitle}</Text>
            <Text style={[styles.warnSub, { color: '#B45309' }]}>{t.appBlockAccessDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D97706" />
        </TouchableOpacity>
      )}

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: c.bgSecondary }]}>
        {tabInfo.map(tab => (
          <TouchableOpacity key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && { backgroundColor: c.bgCard, borderRadius: RADIUS.md }]}
            onPress={() => setActiveTab(tab.key)}>
            <Ionicons name={tab.icon as any} size={13} color={activeTab === tab.key ? c.accent : c.textMuted} />
            <Text style={[styles.tabTxt, { color: activeTab === tab.key ? c.accent : c.textMuted,
              fontWeight: activeTab === tab.key ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── APP ROUTINES ── */}
        {activeTab === 'apps' && (
          <>
            {state.blockRoutines.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconCircle, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="shield-outline" size={40} color={c.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>{t.appBlockNoRoutines}</Text>
                <Text style={[styles.emptySub, { color: c.textMuted }]}>{t.appBlockNoRoutinesDesc}</Text>
              </View>
            ) : (
              <>
                {/* System plan routines - read only */}
                {state.blockRoutines.filter(r => !!r.fromPlanId).map(r => (
                  <View key={r.id} style={[styles.routineCard, { backgroundColor: c.bgCard, borderLeftColor: c.accent }]}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={[styles.routineName, { color: c.text }]}>{r.name}</Text>
                        <View style={{ backgroundColor: c.accentSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontFamily: FONTS.bold, color: c.accent }}>{t.appBlockAuto}</Text>
                        </View>
                      </View>
                      <Text style={[styles.routineTime, { color: c.textMuted }]}>{r.startTime} – {r.endTime}</Text>
                      <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: c.textFaint }}>{r.blockedApps.length} apps · Manage from Plans</Text>
                    </View>
                    <Switch value={r.enabled}
                      onValueChange={v => updateBlockRoutine({ ...r, enabled: v })}
                      trackColor={{ false: c.border, true: c.accent + '60' }}
                      thumbColor={r.enabled ? c.accent : c.textFaint}
                    />
                  </View>
                ))}
                {/* Manual routines */}
                {state.blockRoutines.filter(r => !r.fromPlanId).map((r, i) => {
                const isSystem = !!r.fromPlanId;
                const active = isActive(r);
                return (
                  <Animated.View key={r.id} entering={FadeInDown.delay(i * 60).springify()}>
                    <View style={[styles.routineCard, {
                      backgroundColor: c.bgCard, borderLeftColor: active ? c.success : c.accent }]}>
                      {active && (
                        <View style={[styles.activePill, { backgroundColor: c.success + '18' }]}>
                          <View style={[styles.activeDot, { backgroundColor: c.success }]} />
                          <Text style={[styles.activePillTxt, { color: c.success }]}>{t.appBlockActiveNow}</Text>
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
                                <Text style={[styles.badgeTxt, { color: c.destructive }]}>{t.appBlockHard}</Text>
                              </View>
                            )}
                            {r.deviceAdmin && (
                              <View style={[styles.badge, { backgroundColor: '#DC2626' + '15' }]}>
                                <Ionicons name="shield-checkmark" size={10} color="#DC2626" />
                                <Text style={[styles.badgeTxt, { color: '#DC2626' }]}>{t.appBlockAdmin}</Text>
                              </View>
                            )}
                          </View>
                          {installedApps.length > 0 && (
                            <View style={styles.iconPreviewRow}>
                              {r.blockedApps.slice(0, 5).map(pkg => {
                                const app = getApp(pkg);
                                return app ? <AppIcon key={pkg} icon={app.icon} name={app.name} size={28} /> : null;
                              })}
                              {r.blockedApps.length > 5 && (
                                <View style={[styles.moreChip, { backgroundColor: c.bgSecondary }]}>
                                  <Text style={[styles.moreChipTxt, { color: c.textMuted }]}>+{r.blockedApps.length - 5}</Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                        <Switch value={r.enabled}
                          onValueChange={v => {
                            if (!v && r.hardBlock && r.enabled) {
                              // Hard block — need emergency override
                              const today = new Date().toISOString().split('T')[0];
                              const count = r.lastUnlockDate === today
                                ? (r.emergencyUnlockCount ?? 0) : 0;
                              const max = r.maxEmergencyUnlocks ?? 3;
                              if (count >= max) {
                                Alert.alert(
                                  '🔒 Max unlocks reached',
                                  `You have used all ${max} emergency unlocks for today. This routine cannot be disabled until tomorrow.`
                                );
                                return;
                              }
                              setEmergencyRoutine(r);
                              setEmergencyInput('');
                              setEmergencyError('');
                              setShowEmergency(true);
                            } else {
                              updateBlockRoutine({ ...r, enabled: v });
                            }
                          }}
                          trackColor={{ true: c.accent }}
                          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} />
                      </View>
                      {isSystem ? (
                        <View style={[styles.actionRow, { borderTopColor: c.border, justifyContent: 'center' }]}>
                          <View style={[styles.actionBtn, { backgroundColor: c.accentSoft, opacity: 0.8 }]}>
                            <Ionicons name="shield-checkmark-outline" size={14} color={c.accent} />
                            <Text style={[styles.actionBtnTxt, { color: c.accent }]}>{t.appBlockAutoManaged}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={[styles.actionRow, { borderTopColor: c.border }]}>
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.accentSoft }]}
                            onPress={() => openEdit(r)}>
                            <Ionicons name="pencil-outline" size={14} color={c.accent} />
                            <Text style={[styles.actionBtnTxt, { color: c.accent }]}>{t.appBlockEdit}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.destructive + '12' }]}
                            onPress={() => Alert.alert('Delete?', `Delete "${r.name}"?`, [
                              { text: t.appBlockCancel, style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => deleteBlockRoutine(r.id) },
                            ])}>
                            <Ionicons name="trash-outline" size={14} color={c.destructive} />
                            <Text style={[styles.actionBtnTxt, { color: c.destructive }]}>{t.appBlockDelete}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
              </>
            )}
          </>
        )}

        {/* ── REELS BLOCK ── */}
        {activeTab === 'reels' && (() => {
          const REELS_APPS = [
            { pkg: 'com.zhiliaoapp.musically', label: t.appBlockReelsTikTok,    emoji: '🎵', color: '#010101' },
            { pkg: 'com.instagram.android',    label: t.appBlockReelsInstagram, emoji: '📸', color: '#C13584' },
            { pkg: 'com.google.android.youtube', label: t.appBlockReelsYouTube, emoji: '▶️', color: '#FF0000' },
            { pkg: 'com.facebook.katana',      label: t.appBlockReelsFacebook,  emoji: '👍', color: '#1877F2' },
            { pkg: 'com.snapchat.android',     label: t.appBlockReelsSnapchat,  emoji: '👻', color: '#FFFC00' },
          ];
          const toggleReels = (pkg: string) => {
            if (!accessEnabled) {
              Alert.alert('Permission needed',
                'Enable Accessibility permission so Focus On can block reels.',
                [{ text: 'Open Settings', onPress: () => AppBlocking.openAccessibilitySettings() },
                 { text: t.appBlockCancel, style: 'cancel' }]);
              return;
            }
            const updated = reelsBlocked.includes(pkg)
              ? reelsBlocked.filter(p => p !== pkg)
              : [...reelsBlocked, pkg];
            setReelsBlocked(updated);
            AppBlocking.saveReelsBlock(updated);
          };
          return (
            <>
              <View style={[styles.webInfoCard, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF640' }]}>
                <Ionicons name="videocam-off" size={18} color="#8B5CF6" />
                <Text style={[styles.webInfoTxt, { color: '#8B5CF6' }]}>{t.appBlockReelsInfoNote}</Text>
              </View>
              {REELS_APPS.map((app, i) => {
                const isOn = reelsBlocked.includes(app.pkg);
                return (
                  <Animated.View key={app.pkg} entering={FadeInDown.delay(i * 60).springify()}>
                    <View style={[styles.webCard, {
                      backgroundColor: c.bgCard,
                      borderColor: isOn ? app.color + '60' : c.border,
                      borderWidth: isOn ? 1.5 : 1,
                      paddingVertical: 14,
                    }]}>
                      <View style={[styles.webIconBox, { backgroundColor: app.color + '18', width: 42, height: 42 }]}>
                        <Text style={{ fontSize: 20 }}>{app.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.webDomain, { color: c.text }]}>{app.label}</Text>
                        <Text style={{ fontSize: 11, color: isOn ? app.color : c.textFaint, fontWeight: '600' }}>
                          {isOn ? '🔴 Reels blocked' : 'Not blocked'}
                        </Text>
                      </View>
                      <Switch
                        value={isOn}
                        onValueChange={() => toggleReels(app.pkg)}
                        trackColor={{ false: c.border, true: app.color + '80' }}
                        thumbColor={isOn ? app.color : c.textFaint}
                      />
                    </View>
                  </Animated.View>
                );
              })}
            </>
          );
        })()}

        {/* ── WEBSITES ── */}
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
                <Text style={[styles.emptyTitle, { color: c.text }]}>{t.appBlockNoWebsites}</Text>
                <Text style={[styles.emptySub, { color: c.textMuted }]}>{t.appBlockNoWebsitesDesc}</Text>
              </View>
            ) : (
              blockedWebsites.map((domain, i) => (
                <Animated.View key={domain} entering={FadeInDown.delay(i * 50).springify()}>
                  <View style={[styles.webCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
                    <View style={[styles.webIconBox, { backgroundColor: '#E53E3E15' }]}>
                      <Ionicons name="globe" size={18} color="#E53E3E" />
                    </View>
                    <Text style={[styles.webDomain, { color: c.text }]}>{domain}</Text>
                    <TouchableOpacity onPress={() => Alert.alert('Remove?', `Unblock ${domain}?`, [
                      { text: t.appBlockCancel, style: 'cancel' },
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

        {/* ── TIME LIMITS ── */}
        {activeTab === 'limits' && (
          <>
            {/* Usage permission warning */}
            {!usageEnabled && (
              <TouchableOpacity style={[styles.warnCard, { backgroundColor: '#EDE9FE', marginBottom: 12 }]}
                onPress={() => AppBlocking.openUsageSettings()}>
                <View style={[styles.warnIconBox, { backgroundColor: '#DDD6FE' }]}>
                  <Ionicons name="time" size={18} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.warnTitle, { color: '#4C1D95' }]}>{t.appBlockUsageTitle}</Text>
                  <Text style={[styles.warnSub, { color: '#6D28D9' }]}>{t.appBlockUsageDesc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
              </TouchableOpacity>
            )}

            <View style={[styles.webInfoCard, { backgroundColor: c.accentSoft, borderColor: c.accent + '30' }]}>
              <Ionicons name="information-circle" size={18} color={c.accent} />
              <Text style={[styles.webInfoTxt, { color: c.accent }]}>
                Set a daily time limit per app. When the limit is reached, the app will be blocked for the rest of the day.
              </Text>
            </View>

            {timeLimits.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconCircle, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="timer-outline" size={40} color={c.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>{t.appBlockNoLimits}</Text>
                <Text style={[styles.emptySub, { color: c.textMuted }]}>{t.appBlockNoLimitsDesc}</Text>
              </View>
            ) : (
              timeLimits.map((tl, i) => (
                <Animated.View key={tl.id} entering={FadeInDown.delay(i * 50).springify()}>
                  <View style={[styles.webCard, { backgroundColor: c.bgCard, borderColor: c.border, paddingVertical: 12 }]}>
                    {installedApps.length > 0 ? (
                      <AppIcon
                        icon={installedApps.find(a => a.packageName === tl.packageName)?.icon || ''}
                        name={tl.appName} size={36} />
                    ) : (
                      <View style={[styles.webIconBox, { backgroundColor: c.accentSoft }]}>
                        <Ionicons name="timer" size={18} color={c.accent} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.webDomain, { color: c.text }]}>{tl.appName}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>
                        Daily limit: <Text style={{ color: c.accent, fontWeight: '700' }}>{formatDuration(tl.limitMinutes)}</Text>
                      </Text>
                    </View>
                    <Switch value={tl.enabled}
                      onValueChange={v => updateTimeLimit({ ...tl, enabled: v })}
                      trackColor={{ true: c.accent }}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} />
                    <TouchableOpacity onPress={() => {
                      setLimitPickerFor(tl.id);
                      setLimitMinutes(tl.limitMinutes);
                      setLimitSelectedApp({ name: tl.appName, packageName: tl.packageName, icon: '' });
                      setShowLimitModal(true);
                    }} style={{ marginLeft: 4 }}>
                      <Ionicons name="pencil-outline" size={18} color={c.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('Remove?', `Remove limit for ${tl.appName}?`, [
                      { text: t.appBlockCancel, style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => deleteTimeLimit(tl.id) },
                    ])} style={{ marginLeft: 4 }}>
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
                placeholder={t.appBlockRoutinePlaceholder} placeholderTextColor={c.textFaint}
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
                { icon: 'lock-closed' as const, iconColor: c.destructive, label: 'Hard Block', sub: 'Overlay cannot be dismissed — only ends when time is up', val: rHard, set: setRHard, color: c.destructive },
                { icon: 'shield-checkmark' as const, iconColor: '#DC2626', label: 'Device Admin', sub: 'Strongest — Focus On cannot be uninstalled during block', val: rAdmin, set: handleAdminToggle, color: '#DC2626' },
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

              {/* Emergency unlock settings — only shown when hard block is on */}
              {rHard && (
                <View style={[styles.optRow, { borderColor: c.accent + '30', backgroundColor: c.accentSoft, flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.optIconBox, { backgroundColor: c.accent + '20' }]}>
                      <Ionicons name="key-outline" size={16} color={c.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optLabel, { color: c.text }]}>Emergency Override</Text>
                      <Text style={[styles.optSub, { color: c.textMuted }]}>Allow turning off hard block max N times per day</Text>
                    </View>
                  </View>
                  {/* Max unlocks stepper */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontFamily: FONTS.medium, color: c.textMuted }}>Max unlocks per day</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => setRMaxUnlocks(Math.max(1, rMaxUnlocks - 1))}>
                        <Ionicons name="remove" size={16} color={c.accent} />
                      </TouchableOpacity>
                      <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: c.accent, minWidth: 24, textAlign: 'center' }}>{rMaxUnlocks}</Text>
                      <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => setRMaxUnlocks(Math.min(10, rMaxUnlocks + 1))}>
                        <Ionicons name="add" size={16} color={c.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Optional password */}
                  <Text style={[styles.lbl, { color: c.textMuted, marginTop: 0 }]}>Password (optional)</Text>
                  <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', height: 46 }]}>
                    <Ionicons name="key-outline" size={15} color={c.textFaint} />
                    <TextInput
                      style={{ flex: 1, marginLeft: 8, color: c.text, fontFamily: FONTS.regular, fontSize: 14 }}
                      placeholder="Set a PIN or password..."
                      placeholderTextColor={c.textFaint}
                      value={rPassword} onChangeText={setRPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
              )}



              <TouchableOpacity style={[styles.pickAppsBtn, { backgroundColor: c.accentSoft, borderColor: c.accent }]}
                onPress={() => loadApps('routine')}>
                <Ionicons name="apps" size={18} color={c.accent} />
                <Text style={[styles.pickAppsTxt, { color: c.accent }]}>
                  {rApps.length > 0 ? `${rApps.length} app${rApps.length > 1 ? 's' : ''} selected` : 'Select apps to block'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={c.accent} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.accent,
                opacity: rName.trim() && rApps.length > 0 ? 1 : 0.45 }]}
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
              <Text style={[styles.sheetTitle, { color: c.text }]}>{t.planCreateSelectApps}</Text>
              <TouchableOpacity onPress={() => setShowAppPicker(false)}>
                <Text style={{ color: c.accent, fontWeight: '800', fontSize: 15 }}>Done ({rApps.length})</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              <Ionicons name="search-outline" size={16} color={c.textMuted} />
              <TextInput style={{ color: c.text, flex: 1, marginLeft: 8 }}
                placeholder={t.appBlockSearchPlaceholder} placeholderTextColor={c.textFaint}
                value={appSearch} onChangeText={setAppSearch} />
            </View>
            {loadingApps && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: c.textMuted, fontFamily: FONTS.regular, fontSize: 13 }}>{t.appBlockLoadingApps}</Text>
              </View>
            )}
            <FlatList
              data={filteredApps} keyExtractor={i => i.packageName}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const sel = rApps.includes(item.packageName);
                return (
                  <TouchableOpacity
                    style={[styles.appItem, { backgroundColor: sel ? c.accentSoft : 'transparent', borderColor: c.border }]}
                    onPress={() => setRApps(a => sel ? a.filter(x => x !== item.packageName) : [...a, item.packageName])}>
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

      {/* ── Time Limit Modal ── */}
      <Modal visible={showLimitModal} transparent animationType="slide"
        onRequestClose={() => setShowLimitModal(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowLimitModal(false)}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: c.text }]}>{t.appBlockSetTimeLimit}</Text>
              <View style={{ width: 22 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* App selector (only for new limits) */}
              {limitPickerFor === 'new' && (
                <>
                  <Text style={[styles.lbl, { color: c.textMuted }]}>{t.appBlockSelectApp}</Text>
                  <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border, marginBottom: 10 }]}>
                    <Ionicons name="search-outline" size={16} color={c.textMuted} />
                    <TextInput style={{ color: c.text, flex: 1, marginLeft: 8 }}
                      placeholder={t.appBlockSearchPlaceholder} placeholderTextColor={c.textFaint}
                      value={limitAppSearch} onChangeText={setLimitAppSearch} />
                  </View>
                  <FlatList
                    data={filteredLimitApps.slice(0, 30)} keyExtractor={i => i.packageName}
                    style={{ maxHeight: 200 }} scrollEnabled
                    renderItem={({ item }) => {
                      const sel = limitSelectedApp?.packageName === item.packageName;
                      return (
                        <TouchableOpacity
                          style={[styles.appItem, { backgroundColor: sel ? c.accentSoft : 'transparent', borderColor: c.border }]}
                          onPress={() => setLimitSelectedApp(item)}>
                          <AppIcon icon={item.icon} name={item.name} size={36} />
                          <Text style={[styles.appName, { color: c.text, flex: 1 }]}>{item.name}</Text>
                          {sel && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </>
              )}

              {/* Selected app info when editing */}
              {limitPickerFor !== 'new' && limitSelectedApp && (
                <View style={[styles.appItem, { backgroundColor: c.accentSoft, borderRadius: 12, marginBottom: 8, borderColor: c.accent }]}>
                  <Ionicons name="timer" size={32} color={c.accent} />
                  <Text style={[styles.appName, { color: c.text }]}>{limitSelectedApp.name}</Text>
                </View>
              )}

              <Text style={[styles.lbl, { color: c.textMuted }]}>{t.appBlockDailyLimit}</Text>
              <DurationPicker value={limitMinutes} onChange={setLimitMinutes} colors={c} />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: c.accent, marginTop: 20,
                  opacity: (limitSelectedApp || limitPickerFor !== 'new') && limitMinutes >= 15 ? 1 : 0.45 }]}
                onPress={saveTimeLimit}>
                <Ionicons name="timer" size={18} color="#fff" />
                <Text style={styles.saveTxt}>{t.appBlockSetLimit}</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Emergency Unlock Modal ── */}
      <Modal visible={showEmergency} transparent animationType="fade"
        onRequestClose={() => setShowEmergency(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBg} onPress={() => setShowEmergency(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.bgCard }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Ionicons name="warning" size={28} color="#EF4444" />
                </View>
                <Text style={[styles.sheetTitle, { color: c.text, textAlign: 'center', marginBottom: 4 }]}>Emergency Override</Text>
                <Text style={{ fontSize: 13, fontFamily: FONTS.regular, color: c.textMuted, textAlign: 'center', lineHeight: 18 }}>
                  {(() => {
                    if (!emergencyRoutine) return '';
                    const today = new Date().toISOString().split('T')[0];
                    const count = emergencyRoutine.lastUnlockDate === today
                      ? (emergencyRoutine.emergencyUnlockCount ?? 0) : 0;
                    const max = emergencyRoutine.maxEmergencyUnlocks ?? 3;
                    return `${max - count} of ${max} emergency unlocks remaining today`;
                  })()}
                </Text>
              </View>

              {/* Password if set */}
              {emergencyRoutine?.emergencyPassword && (
                <>
                  <Text style={[styles.lbl, { color: c.textMuted }]}>{t.appBlockEnterPassword}</Text>
                  <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: emergencyError ? '#EF4444' : c.border }]}>
                    <Ionicons name="key-outline" size={16} color={c.textMuted} />
                    <TextInput
                      style={{ color: c.text, flex: 1, marginLeft: 8, fontFamily: FONTS.regular }}
                      placeholder="Password..." placeholderTextColor={c.textFaint}
                      value={emergencyInput} onChangeText={t => { setEmergencyInput(t); setEmergencyError(''); }}
                      secureTextEntry autoFocus
                    />
                  </View>
                  {emergencyError ? (
                    <Text style={{ color: '#EF4444', fontSize: 12, fontFamily: FONTS.regular, marginBottom: 8 }}>{emergencyError}</Text>
                  ) : null}
                </>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#EF4444', marginTop: 8 }]}
                onPress={() => {
                  if (!emergencyRoutine) return;
                  // Check password
                  if (emergencyRoutine.emergencyPassword) {
                    if (emergencyInput !== emergencyRoutine.emergencyPassword) {
                      setEmergencyError('Wrong password. Try again.');
                      return;
                    }
                  }
                  // Update unlock count
                  const today = new Date().toISOString().split('T')[0];
                  const prevCount = emergencyRoutine.lastUnlockDate === today
                    ? (emergencyRoutine.emergencyUnlockCount ?? 0) : 0;
                  updateBlockRoutine({
                    ...emergencyRoutine,
                    enabled: false,
                    emergencyUnlockCount: prevCount + 1,
                    lastUnlockDate: today,
                  });
                  setShowEmergency(false);
                  setEmergencyRoutine(null);
                }}>
                <Ionicons name="shield-outline" size={18} color="#fff" />
                <Text style={styles.saveTxt}>{t.appBlockDisableTemp}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEmergency(false)} style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: c.textMuted, fontFamily: FONTS.regular, fontSize: 14 }}>{t.appBlockCancel}</Text>
              </TouchableOpacity>
              <View style={{ height: 8 }} />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
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
              <Text style={[styles.sheetTitle, { color: c.text }]}>{t.appBlockBlockWebsite}</Text>
              <View style={{ width: 22 }} />
            </View>
            <Text style={[styles.lbl, { color: c.textMuted }]}>Website URL or Domain</Text>
            <View style={[styles.webInputRow, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              <Ionicons name="globe-outline" size={18} color={c.textMuted} />
              <TextInput
                style={{ color: c.text, flex: 1, marginLeft: 10, fontSize: 15 }}
                placeholder="e.g. facebook.com or https://reddit.com"
                placeholderTextColor={c.textFaint}
                value={websiteInput} onChangeText={setWebsiteInput}
                autoCapitalize="none" keyboardType="url" autoCorrect={false} />
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
              onPress={addWebsite}>
              <Ionicons name="globe" size={18} color="#fff" />
              <Text style={styles.saveTxt}>{t.appBlockBlockWebsiteBtn}</Text>
            </TouchableOpacity>
            <Text style={[styles.lbl, { color: c.textMuted, marginTop: 20 }]}>Quick Add</Text>
            <View style={styles.quickAddRow}>
              {['youtube.com','instagram.com','facebook.com','twitter.com','reddit.com','tiktok.com'].map(site => (
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
                  }}>
                  {blockedWebsites.includes(site)
                    ? <Ionicons name="checkmark-circle" size={12} color={c.success} />
                    : <Ionicons name="add-circle-outline" size={12} color={c.textMuted} />}
                  <Text style={[styles.quickChipTxt, {
                    color: blockedWebsites.includes(site) ? c.success : c.textMuted }]}>{site}</Text>
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
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  tabTxt: { fontSize: 11, fontFamily: FONTS.semibold },
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