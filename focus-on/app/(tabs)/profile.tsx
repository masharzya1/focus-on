import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';
import { RADIUS, FONTS } from '@/constants/theme';

function getLevelProgress(xp: number) {
  let remaining = xp, lvl = 1;
  while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
  return { lvl, earned: remaining, total: lvl * 100 };
}

function MenuRow({
  icon, label, iconBg, iconColor, badge, onPress, isLast = false, danger = false,
}: {
  icon: string; label: string; iconBg: string; iconColor: string;
  badge?: string | number; onPress: () => void; isLast?: boolean; danger?: boolean;
}) {
  const { colors: c } = useTheme();
  return (
    <TouchableOpacity
      style={[s.menuRow, !isLast && { borderBottomWidth: 1, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={[s.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={17} color={iconColor} />
      </View>
      <Text style={[s.menuLabel, { color: danger ? c.destructive : c.text }]}>{label}</Text>
      <View style={s.menuRight}>
        {badge !== undefined && (
          <View style={[s.badge, { backgroundColor: c.accentSoft }]}>
            <Text style={[s.badgeTxt, { color: c.accent }]}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={15} color={c.textFaint} />
      </View>
    </TouchableOpacity>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  const { colors: c } = useTheme();
  return <View style={[s.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>{children}</View>;
}

export default function ProfileScreen() {
  const { state } = useStudy();
  const { user, isPro, signOut, signInWithGoogle } = useAuth();
  const { colors: c, isDark, toggleTheme } = useTheme();
  const t = useT();
  const router = useRouter();

  const { lvl, earned, total } = getLevelProgress(state.xp);
  const xpPct = Math.round((earned / total) * 100);

  const completedSessions = state.sessions.filter(s => s.completed);
  const totalMinutes = completedSessions.reduce((s, sess) => s + sess.durationMinutes, 0);
  const studiedStr = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : `${totalMinutes}m`;

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSignOut = () => Alert.alert(t.profileSignOut, t.profileSignOutConfirm, [
    { text: t.profileCancel, style: 'cancel' },
    { text: t.profileSignOut, style: 'destructive', onPress: signOut },
  ]);

  const STATS = [
    { icon: 'flame',            color: c.streakColor,   val: String(state.streak),               lbl: 'Streak'   },
    { icon: 'timer-outline',    color: c.accent,        val: String(completedSessions.length),   lbl: 'Sessions' },
    { icon: 'time-outline',     color: c.accent,        val: studiedStr,                         lbl: 'Studied'  },
    { icon: 'checkmark-circle', color: c.success,       val: String(state.totalTopicsCompleted), lbl: 'Done'     },
  ];

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* ── Header ── */}
        <View style={[s.headerBanner, { backgroundColor: c.accent }]}>
          <View style={s.headerControls}>
            <TouchableOpacity
              style={[s.headerBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
              onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.headerBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
              onPress={toggleTheme} hitSlop={12}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Avatar (overlapping header) ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.avatarWrap}>
          <View style={[s.avatarRing, { backgroundColor: c.accent }]}>
            <View style={[s.avatar, { backgroundColor: c.bgCard }]}>
              <Text style={[s.avatarTxt, { color: c.accent }]}>{initials}</Text>
            </View>
          </View>
          <Text style={[s.name, { color: c.text }]}>{user?.displayName ?? 'Champion'}</Text>
          {user?.email && <Text style={[s.email, { color: c.textMuted }]}>{user.email}</Text>}

          <View style={s.badgeRow}>
            <View style={[s.levelBadge, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="star" size={11} color={c.accent} />
              <Text style={[s.levelTxt, { color: c.accent }]}>Level {lvl} · {state.xp} XP</Text>
            </View>
            {isPro && (
              <View style={[s.proBadge, { backgroundColor: c.xpColor }]}>
                <Text style={[s.proTxt, { color: c.xpDark }]}>PRO</Text>
              </View>
            )}
          </View>

          {!user && (
            <TouchableOpacity
              style={[s.signInBtn, { backgroundColor: c.accentSoft }]}
              onPress={signInWithGoogle}>
              <Ionicons name="logo-google" size={16} color={c.accent} />
              <Text style={[s.signInTxt, { color: c.accent }]}>Sign in with Google</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ── XP Progress ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}
          style={[s.xpCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={s.xpTop}>
            <Text style={[s.xpLbl, { color: c.textMuted }]}>Level {lvl}</Text>
            <Text style={[s.xpLbl, { color: c.accent }]}>{earned} / {total} XP</Text>
          </View>
          <View style={[s.xpBg, { backgroundColor: c.border }]}>
            <View style={[s.xpFill, { width: `${xpPct}%` as any, backgroundColor: c.accent }]} />
          </View>
          <Text style={[s.xpHint, { color: c.textFaint }]}>{total - earned} XP to Level {lvl + 1}</Text>
        </Animated.View>

        {/* ── Stats ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.statsRow}>
          {STATS.map(item => (
            <View key={item.lbl} style={[s.statCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
              <Text style={[s.statVal, { color: c.text }]}>{item.val}</Text>
              <Text style={[s.statLbl, { color: c.textMuted }]}>{item.lbl}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Upgrade banner ── */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <TouchableOpacity
              style={[s.upgradeBanner, { backgroundColor: c.accentSoft, borderColor: c.accent + '30', borderWidth: 1 }]}
              onPress={() => router.push('/profile/upgrade' as any)} activeOpacity={0.88}>
              <View style={[s.upgradeIcon, { backgroundColor: c.accent }]}>
                <Ionicons name="diamond-outline" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.upgradeTitle, { color: c.accent }]}>{t.profileUpgradeTitle}</Text>
                <Text style={[s.upgradeSub, { color: c.textMuted }]}>{t.profileUpgradeSub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.accent} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Study ── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>STUDY</Text>
          <Section>
            <MenuRow icon="bar-chart-outline"      label={t.profileProgress}        iconBg={c.accentSoft}    iconColor={c.accent}   onPress={() => router.push('/profile/progress' as any)} />
            <MenuRow icon="checkmark-done-outline" label={t.profileCompletedTasks}  iconBg={c.bgSecondary}   iconColor={c.success}  onPress={() => router.push('/profile/completed-tasks' as any)} />
            <MenuRow icon="timer-outline"          label={t.profileSessionHistory}  iconBg={c.bgSecondary}   iconColor={c.textMuted} onPress={() => router.push('/profile/session-history' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Account ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>ACCOUNT</Text>
          <Section>
            <MenuRow icon="person-outline"   label={t.profilePersonalInfo}  iconBg={c.bgSecondary}  iconColor={c.textMuted} onPress={() => router.push('/profile/personal-info' as any)} />
            <MenuRow icon="diamond-outline"  label={t.profileSubscription}  iconBg={c.accentSoft}   iconColor={c.accent}   onPress={() => router.push('/profile/subscription' as any)} badge={isPro ? 'PRO' : undefined} />
            <MenuRow icon="settings-outline" label={t.profileAppSettings}   iconBg={c.bgSecondary}  iconColor={c.textMuted} onPress={() => router.push('/(tabs)/settings' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Info ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>INFO</Text>
          <Section>
            <MenuRow icon="information-circle-outline" label={t.profileAboutUs}       iconBg={c.bgSecondary}  iconColor={c.textMuted} onPress={() => router.push('/profile/about' as any)} />
            <MenuRow icon="document-text-outline"      label={t.profilePrivacyPolicy} iconBg={c.bgSecondary}  iconColor={c.textMuted} onPress={() => router.push('/profile/privacy-policy' as any)} />
            <MenuRow icon="reader-outline"             label={t.profileTerms}         iconBg={c.bgSecondary}  iconColor={c.textMuted} onPress={() => router.push('/profile/terms-conditions' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Sign out ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Section>
            {user ? (
              <>
                <MenuRow icon="trash-outline"   label={t.profileDeleteAccount} iconBg={c.bgSecondary} iconColor={c.destructive} onPress={() => router.push('/profile/delete-account' as any)} danger />
                <MenuRow icon="log-out-outline" label={t.profileLogout}        iconBg={c.bgSecondary} iconColor={c.destructive} onPress={handleSignOut} isLast danger />
              </>
            ) : (
              <MenuRow icon="logo-google" label={t.profileSignInGoogle} iconBg={c.accentSoft} iconColor={c.accent} onPress={signInWithGoogle} isLast />
            )}
          </Section>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const HEADER_H = Platform.OS === 'ios' ? 160 : 140;

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 10 },

  headerBanner: {
    height: HEADER_H,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20,
  },
  headerControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBtn: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  avatarWrap: { alignItems: 'center', marginTop: -46, paddingHorizontal: 20, gap: 4 },
  avatarRing: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', padding: 3 },
  avatar: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 28, fontFamily: FONTS.bold },
  name: { fontSize: 20, fontFamily: FONTS.bold, marginTop: 8 },
  email: { fontSize: 12, fontFamily: FONTS.regular },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  levelTxt: { fontSize: 12, fontFamily: FONTS.semibold },
  proBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  proTxt: { fontSize: 11, fontFamily: FONTS.bold },
  signInBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  signInTxt: { fontSize: 14, fontFamily: FONTS.semibold },

  xpCard: { borderRadius: RADIUS.lg, padding: 16, gap: 8, marginHorizontal: 16, borderWidth: 1 },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLbl: { fontSize: 12, fontFamily: FONTS.semibold },
  xpBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3 },
  xpHint: { fontSize: 11, fontFamily: FONTS.regular },

  statsRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16 },
  statCard: { flex: 1, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', gap: 4, borderWidth: 1 },
  statVal: { fontSize: 15, fontFamily: FONTS.bold },
  statLbl: { fontSize: 10, fontFamily: FONTS.medium },

  upgradeBanner: { borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16 },
  upgradeIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  upgradeTitle: { fontSize: 14, fontFamily: FONTS.bold },
  upgradeSub: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 1 },

  sectionTitle: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 6 },
  section: { borderRadius: RADIUS.lg, overflow: 'hidden', marginHorizontal: 16, borderWidth: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: FONTS.medium },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontFamily: FONTS.bold },
});
