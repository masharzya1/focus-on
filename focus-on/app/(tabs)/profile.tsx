import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, FONTS, SPACING, HEADER_TOP, PROGRESS_HEIGHT, TYPE } from '@/constants/theme';
import PaywallModal from '@/components/PaywallModal';
import { PRO_PRICE_BDT } from '@/services/payment';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLevelProgress(xp: number) {
  let remaining = xp, lvl = 1;
  while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
  return { lvl, earned: remaining, total: lvl * 100 };
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDate(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Settings row ──────────────────────────────────────────────────────────────
function SettingsRow({
  icon, label, iconBg, iconColor, value, onPress, isLast = false,
}: {
  icon: string; label: string; iconBg?: string; iconColor?: string;
  value?: string; onPress: () => void; isLast?: boolean;
}) {
  const { colors: c } = useTheme();
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    opacity: withTiming(pressed.value ? 0.6 : 1, { duration: 80 }),
  }));
  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        style={[styles.settingsRow, !isLast && { borderBottomWidth: 1, borderColor: c.border }]}
        onPress={onPress}
        activeOpacity={1}
        onPressIn={() => { pressed.value = 1; }}
        onPressOut={() => { pressed.value = 0; }}
      >
        <View style={[styles.settingsIcon, { backgroundColor: iconBg ?? c.accentSoft }]}>
          <Ionicons name={icon as any} size={17} color={iconColor ?? c.accent} />
        </View>
        <Text style={[TYPE.body, { color: c.text, flex: 1 }]}>{label}</Text>
        {value && (
          <Text style={[TYPE.callout, { color: c.textMuted, marginRight: SPACING.sm }]}>{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { state } = useStudy();
  const { user, isPro, signInWithGoogle, signOut } = useAuth();
  const { colors: c, isDark } = useTheme();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  const { lvl, earned, total } = getLevelProgress(state.xp);
  const xpPct = Math.round((earned / total) * 100);

  const completedSessions = state.sessions.filter(s => s.completed);
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const recentSessions = [...completedSessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 4);

  const topSubjects = state.subjects
    .map(s => {
      const topics = s.chapters.flatMap(c => c.topics);
      const done = topics.filter(t => t.completed).length;
      const pct = topics.length > 0 ? Math.round((done / topics.length) * 100) : 0;
      return { ...s, pct, done, total: topics.length };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSignOut = () => Alert.alert('Sign Out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: signOut },
  ]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={[TYPE.title3, { color: c.text }]}>Profile</Text>
          <TouchableOpacity
            style={[styles.topBtn, { backgroundColor: c.bgCard }]}
            onPress={() => router.push('/(tabs)/settings' as any)}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={19} color={c.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hero card ────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <LinearGradient
            colors={isDark ? ['#2A2860', '#1C1A3E'] : ['#EDE9FF', '#FAFAFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Avatar + name */}
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={[TYPE.title3, { color: c.text }]} numberOfLines={1}>
                  {user?.displayName ?? 'Student'}
                </Text>
                {user?.email ? (
                  <Text style={[TYPE.footnote, { color: c.textMuted, marginTop: 2 }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={signInWithGoogle}>
                    <Text style={[TYPE.footnote, { color: c.accent, marginTop: 3 }]}>
                      Sign in to sync →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {isPro && (
                <View style={styles.proBadge}>
                  <Ionicons name="star" size={11} color="#fff" />
                  <Text style={styles.proBadgeTxt}>PRO</Text>
                </View>
              )}
            </View>

            {/* Level + XP bar */}
            <View style={[styles.levelBox, { backgroundColor: c.accent + '18' }]}>
              <View style={styles.levelLeft}>
                <Text style={[{ fontFamily: FONTS.black, fontSize: 13, color: c.accent }]}>
                  Level {lvl}
                </Text>
                <View style={[styles.xpBar, { backgroundColor: c.border }]}>
                  <View style={[styles.xpFill, { width: `${xpPct}%`, backgroundColor: c.accent }]} />
                </View>
                <Text style={[TYPE.footnote, { color: c.textMuted, marginTop: 3 }]}>
                  {earned} / {total} XP to next level
                </Text>
              </View>
              <View style={styles.levelRight}>
                <Text style={[{ fontFamily: FONTS.black, fontSize: 28, color: c.xpColor }]}>
                  {state.xp}
                </Text>
                <Text style={[TYPE.caption, { color: c.textMuted }]}>Total XP</Text>
              </View>
            </View>

            {/* Stats strip */}
            <View style={[styles.statsStrip, { borderTopColor: c.border + '80' }]}>
              {[
                { icon: 'flame',          color: '#FF9500', val: state.streak,                lbl: 'Streak'   },
                { icon: 'time-outline',   color: c.accent,  val: completedSessions.length,    lbl: 'Sessions' },
                { icon: 'hourglass',      color: '#3B82F6', val: formatDuration(totalMinutes), lbl: 'Studied' },
                { icon: 'checkmark-done', color: c.success, val: state.totalTopicsCompleted,  lbl: 'Topics'   },
              ].map((s, i, arr) => (
                <React.Fragment key={s.lbl}>
                  <View style={styles.stat}>
                    <Text style={[{ fontFamily: FONTS.black, fontSize: 17, color: c.text }]}>
                      {s.val}
                    </Text>
                    <View style={styles.statLabel}>
                      <Ionicons name={s.icon as any} size={11} color={s.color} />
                      <Text style={[TYPE.caption, { color: c.textMuted, marginLeft: 3 }]}>{s.lbl}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={[styles.statDiv, { backgroundColor: c.border }]} />}
                </React.Fragment>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Subscription card ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          {isPro ? (
            <LinearGradient
              colors={['#6C63FF', '#9C5FFF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.proCard}
            >
              <View style={styles.proCardLeft}>
                <View style={styles.proPill}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.proPillTxt}>PRO — Lifetime</Text>
                </View>
                <Text style={styles.proCardTitle}>All features unlocked</Text>
                <Text style={styles.proCardSub}>
                  Unlimited blocks · Smart reminders · Sync
                </Text>
              </View>
              <View style={styles.proCardIconWrap}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
              </View>
            </LinearGradient>
          ) : (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setShowPaywall(true)}>
              <LinearGradient
                colors={isDark ? ['#252347', '#1C1A3E'] : ['#FFFFFF', '#F5F3FF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.freeCard, { borderColor: c.accent + '40' }]}
              >
                {/* Badge row */}
                <View style={styles.badgeRow}>
                  <View style={[styles.freePill, { backgroundColor: c.border }]}>
                    <Text style={[styles.freePillTxt, { color: c.textMuted }]}>FREE</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={12} color={c.textFaint} />
                  <View style={[styles.upgradePill, { borderColor: c.accent }]}>
                    <Ionicons name="star" size={10} color={c.accent} />
                    <Text style={[styles.upgradePillTxt, { color: c.accent }]}>PRO</Text>
                  </View>
                </View>

                <View style={styles.freeCardBody}>
                  <View style={styles.freeCardText}>
                    <Text style={[{ fontFamily: FONTS.black, fontSize: 17, color: c.text }]}>
                      Upgrade to Pro
                    </Text>
                    <Text style={[TYPE.footnote, { color: c.textMuted, marginTop: 3 }]}>
                      ৳{PRO_PRICE_BDT} · One-time · Lifetime access
                    </Text>
                    <View style={styles.featurePills}>
                      {['Unlimited blocks', 'Ad-free', 'Sync', 'Reminders'].map(f => (
                        <View key={f} style={[styles.featurePill, { backgroundColor: c.accentSoft }]}>
                          <Text style={[{ fontFamily: FONTS.semibold, fontSize: 11, color: c.accent }]}>
                            {f}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={[styles.upgradeBtn, { backgroundColor: c.accent }]}>
                    <Ionicons name="arrow-up-circle" size={20} color="#fff" />
                    <Text style={styles.upgradeBtnTxt}>Upgrade</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ── Subject progress ───────────────────────────────────────────────── */}
        {topSubjects.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={[TYPE.label, { color: c.textMuted }]}>Subjects</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/subjects' as any)}>
                <Text style={[TYPE.callout, { color: c.accent }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { backgroundColor: c.bgCard }]}>
              {topSubjects.map((sub, i) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subjectRow,
                    i < topSubjects.length - 1 && { borderBottomWidth: 1, borderColor: c.border }]}
                  onPress={() => router.push(`/subject/${sub.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.subjectIcon, { backgroundColor: sub.color + '20' }]}>
                    <Ionicons name={sub.icon as any} size={17} color={sub.color} />
                  </View>
                  <View style={styles.subjectInfo}>
                    <View style={styles.subjectTop}>
                      <Text style={[TYPE.callout, { color: c.text, flex: 1 }]} numberOfLines={1}>
                        {sub.name}
                      </Text>
                      <Text style={[{ fontFamily: FONTS.black, fontSize: 13,
                        color: sub.pct === 100 ? c.success : sub.color }]}>
                        {sub.pct}%
                      </Text>
                    </View>
                    <View style={[styles.progBg, { backgroundColor: c.border }]}>
                      <View style={[styles.progFill, {
                        backgroundColor: sub.pct === 100 ? c.success : sub.color,
                        width: `${sub.pct}%`,
                      }]} />
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={c.textFaint} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Recent sessions ────────────────────────────────────────────────── */}
        {recentSessions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={[TYPE.label, { color: c.textMuted }]}>Recent Sessions</Text>
            </View>
            <View style={[styles.card, { backgroundColor: c.bgCard }]}>
              {recentSessions.map((session, i) => {
                const subject = state.subjects.find(s => s.id === session.subjectId);
                return (
                  <View key={session.id}
                    style={[styles.sessionRow,
                      i < recentSessions.length - 1 && { borderBottomWidth: 1, borderColor: c.border }]}>
                    <View style={[styles.sessionDot, { backgroundColor: subject?.color ?? c.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[TYPE.callout, { color: c.text }]}>
                        {subject?.name ?? 'Focus session'}
                      </Text>
                      <Text style={[TYPE.footnote, { color: c.textMuted, marginTop: 2 }]}>
                        {formatDate(session.startTime)}
                      </Text>
                    </View>
                    <View style={[styles.durationChip, { backgroundColor: c.accentSoft }]}>
                      <Text style={[{ fontFamily: FONTS.bold, fontSize: 12, color: c.accent }]}>
                        {formatDuration(session.durationMinutes)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── Settings shortcuts ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Text style={[TYPE.label, styles.sectionLabel, { color: c.textMuted }]}>Settings</Text>
          <View style={[styles.card, { backgroundColor: c.bgCard }]}>
            <SettingsRow icon="timer-outline"   label="Timer & Goals"
              iconBg="#EDE9FF" iconColor="#6C63FF"
              value={`${state.settings.pomodoroFocus}m`}
              onPress={() => router.push('/(tabs)/settings' as any)} />
            <SettingsRow icon="moon-outline"    label="Appearance"
              iconBg="#EDE9FF" iconColor="#6C63FF"
              onPress={() => router.push('/(tabs)/settings' as any)} />
            <SettingsRow icon="shield-outline"  label="App Blocking"
              iconBg="#FEE2E2" iconColor="#EF4444"
              onPress={() => router.push('/(tabs)/app-block' as any)} />
            <SettingsRow icon="bar-chart-outline" label="Analytics"
              iconBg="#DBEAFE" iconColor="#3B82F6"
              onPress={() => router.push('/(tabs)/analytics' as any)}
              isLast />
          </View>
        </Animated.View>

        {/* ── Account ───────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[TYPE.label, styles.sectionLabel, { color: c.textMuted }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: c.bgCard }]}>
            {user ? (
              <TouchableOpacity style={styles.settingsRow} onPress={handleSignOut} activeOpacity={0.7}>
                <View style={[styles.settingsIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="log-out-outline" size={17} color="#EF4444" />
                </View>
                <Text style={[TYPE.body, { color: '#EF4444', flex: 1 }]}>Sign Out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.settingsRow} onPress={signInWithGoogle} activeOpacity={0.7}>
                <View style={[styles.settingsIcon, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name="logo-google" size={17} color={c.accent} />
                </View>
                <Text style={[TYPE.body, { color: c.text, flex: 1 }]}>Sign in with Google</Text>
                <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: HEADER_TOP,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  topBtn: {
    width: 36, height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  heroCard: { borderRadius: RADIUS.xl, overflow: 'hidden', paddingTop: SPACING.xl },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarInitials: { fontSize: 22, fontFamily: FONTS.black, color: '#fff', letterSpacing: 1 },
  heroInfo: { flex: 1 },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  proBadgeTxt: { color: '#fff', fontFamily: FONTS.black, fontSize: 10, letterSpacing: 0.8 },

  levelBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  levelLeft: { flex: 1, gap: 4 },
  xpBar: { height: PROGRESS_HEIGHT, borderRadius: PROGRESS_HEIGHT / 2, overflow: 'hidden', marginTop: 5 },
  xpFill: { height: '100%', borderRadius: PROGRESS_HEIGHT / 2 },
  levelRight: { alignItems: 'center', gap: 1 },

  statsStrip: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { flexDirection: 'row', alignItems: 'center' },
  statDiv: { width: 1, alignSelf: 'stretch', marginVertical: 4 },

  // Pro card
  proCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  proCardLeft: { flex: 1, gap: 5 },
  proPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff22',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  proPillTxt: { color: '#FFD700', fontFamily: FONTS.black, fontSize: 11, letterSpacing: 0.5 },
  proCardTitle: { color: '#fff', fontFamily: FONTS.black, fontSize: 17 },
  proCardSub: { color: '#ffffffaa', fontFamily: FONTS.regular, fontSize: 12 },
  proCardIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#ffffff20',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Free card
  freeCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    padding: SPACING.xl,
    overflow: 'hidden',
  },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  freePill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  freePillTxt: { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 0.8 },
  upgradePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1.5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  upgradePillTxt: { fontFamily: FONTS.black, fontSize: 10, letterSpacing: 0.8 },

  freeCardBody: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
  },
  freeCardText: { flex: 1 },
  featurePills: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md,
  },
  featurePill: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  upgradeBtn: {
    alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg, flexShrink: 0,
  },
  upgradeBtnTxt: { color: '#fff', fontFamily: FONTS.black, fontSize: 13 },

  // Sections
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4,
  },
  sectionLabel: { paddingHorizontal: 4 },
  card: { borderRadius: RADIUS.xl, overflow: 'hidden' },

  subjectRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg,
  },
  subjectIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  subjectInfo: { flex: 1 },
  subjectTop: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs,
  },
  progBg: { height: PROGRESS_HEIGHT, borderRadius: PROGRESS_HEIGHT / 2, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: PROGRESS_HEIGHT / 2 },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg,
  },
  sessionDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  durationChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, paddingHorizontal: SPACING.lg, minHeight: 52,
  },
  settingsIcon: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});