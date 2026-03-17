import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Platform, Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[s.menuLabel, { color: danger ? '#FF5F6D' : c.text }]}>{label}</Text>
      <View style={s.menuRight}>
        {badge !== undefined && (
          <View style={[s.badge, { backgroundColor: c.accentSoft }]}>
            <Text style={[s.badgeTxt, { color: c.accent }]}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={danger ? '#FF5F6D50' : c.textFaint} />
      </View>
    </TouchableOpacity>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  const { colors: c } = useTheme();
  return <View style={[s.section, { backgroundColor: c.bgCard }]}>{children}</View>;
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
    { icon: 'flame',            color: '#FF8C42', bg: '#FFF0E6', val: String(state.streak),              lbl: 'Streak'   },
    { icon: 'timer-outline',    color: '#7C6FF7', bg: '#EAE8FF', val: String(completedSessions.length),  lbl: 'Sessions' },
    { icon: 'time-outline',     color: '#40AEFF', bg: '#E4F4FF', val: studiedStr,                        lbl: 'Studied'  },
    { icon: 'checkmark-circle', color: '#30D9A4', bg: '#E4FAF3', val: String(state.totalTopicsCompleted), lbl: 'Done'    },
  ];

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* ── Gradient Header ── */}
        <LinearGradient
          colors={['#7C6FF7', '#A888FF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.headerBanner}
        >
          {/* Top controls */}
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

          {/* Chart illustration top-right */}
          <Image
            source={require('@/assets/images/illus-chart.png')}
            style={s.headerIllus}
            resizeMode="contain"
          />

          {/* Decorative circles */}
          <View style={s.heroDeco1} />
          <View style={s.heroDeco2} />
        </LinearGradient>

        {/* ── Avatar (overlapping header) ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.avatarWrap}>
          <LinearGradient colors={['#7C6FF7', '#A888FF']} style={s.avatarRing}>
            <View style={[s.avatar, { backgroundColor: c.bgCard }]}>
              <Text style={[s.avatarTxt, { color: c.accent }]}>{initials}</Text>
            </View>
          </LinearGradient>
          <Text style={[s.name, { color: c.text }]}>{user?.displayName ?? 'Champion'}</Text>
          {user?.email && <Text style={[s.email, { color: c.textMuted }]}>{user.email}</Text>}

          <View style={s.badgeRow}>
            <View style={[s.levelBadge, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="star" size={12} color={c.accent} />
              <Text style={[s.levelTxt, { color: c.accent }]}>Level {lvl} · {state.xp} XP</Text>
            </View>
            {isPro && (
              <View style={[s.proBadge, { backgroundColor: '#FFD700' }]}>
                <Text style={s.proTxt}>PRO</Text>
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
          style={[s.xpCard, { backgroundColor: c.bgCard }]}>
          <View style={s.xpTop}>
            <Text style={[s.xpLbl, { color: c.textMuted }]}>Level {lvl}</Text>
            <Text style={[s.xpLbl, { color: c.accent }]}>{earned} / {total} XP</Text>
          </View>
          <View style={[s.xpBg, { backgroundColor: c.border }]}>
            <LinearGradient
              colors={['#7C6FF7', '#A888FF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.xpFill, { width: `${xpPct}%` }]}
            />
          </View>
          <Text style={[s.xpHint, { color: c.textFaint }]}>{total - earned} XP to Level {lvl + 1}</Text>
        </Animated.View>

        {/* ── Stats ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.statsRow}>
          {STATS.map(item => (
            <View key={item.lbl} style={[s.statCard, { backgroundColor: item.bg }]}>
              <View style={[s.statIconCircle, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[s.statVal, { color: item.color }]}>{item.val}</Text>
              <Text style={[s.statLbl, { color: item.color + 'AA' }]}>{item.lbl}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Upgrade banner ── */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <TouchableOpacity onPress={() => router.push('/profile/upgrade' as any)} activeOpacity={0.9}>
              <LinearGradient colors={['#FF8C42', '#FFCB47']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.upgradeBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={s.upgradeTitle}>✨ {t.profileUpgradeTitle}</Text>
                  <Text style={s.upgradeSub}>{t.profileUpgradeSub}</Text>
                </View>
                <View style={s.upgradeBtn}>
                  <Text style={s.upgradeBtnTxt}>{t.profileUpgradeBtn}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FF8C42" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Study ── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>STUDY</Text>
          <Section>
            <MenuRow icon="bar-chart-outline"      label={t.profileProgress}        iconBg="#EAE8FF" iconColor="#7C6FF7" onPress={() => router.push('/profile/progress' as any)} />
            <MenuRow icon="checkmark-done-outline" label={t.profileCompletedTasks}  iconBg="#E4FAF3" iconColor="#30D9A4" onPress={() => router.push('/profile/completed-tasks' as any)} />
            <MenuRow icon="timer-outline"          label={t.profileSessionHistory}  iconBg="#E4F4FF" iconColor="#40AEFF" onPress={() => router.push('/profile/session-history' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Account ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>ACCOUNT</Text>
          <Section>
            <MenuRow icon="person-outline"   label={t.profilePersonalInfo}  iconBg="#FFF0E6" iconColor="#FF8C42" onPress={() => router.push('/profile/personal-info' as any)} />
            <MenuRow icon="diamond-outline"  label={t.profileSubscription}  iconBg="#EAE8FF" iconColor="#7C6FF7" onPress={() => router.push('/profile/subscription' as any)} badge={isPro ? 'PRO' : undefined} />
            <MenuRow icon="settings-outline" label={t.profileAppSettings}   iconBg="#E4FAF3" iconColor="#30D9A4" onPress={() => router.push('/(tabs)/settings' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Info ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>INFO</Text>
          <Section>
            <MenuRow icon="information-circle-outline" label={t.profileAboutUs}       iconBg="#E4F4FF" iconColor="#40AEFF" onPress={() => router.push('/profile/about' as any)} />
            <MenuRow icon="document-text-outline"      label={t.profilePrivacyPolicy} iconBg="#EAE8FF" iconColor="#7C6FF7" onPress={() => router.push('/profile/privacy-policy' as any)} />
            <MenuRow icon="reader-outline"             label={t.profileTerms}         iconBg="#FFF0E6" iconColor="#FF8C42" onPress={() => router.push('/profile/terms-conditions' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Sign out / Danger ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Section>
            {user ? (
              <>
                <MenuRow icon="trash-outline"   label={t.profileDeleteAccount} iconBg="#FFE8EE" iconColor="#FF5F6D" onPress={() => router.push('/profile/delete-account' as any)} danger />
                <MenuRow icon="log-out-outline" label={t.profileLogout}        iconBg="#FFE8EE" iconColor="#FF5F6D" onPress={handleSignOut} isLast danger />
              </>
            ) : (
              <MenuRow icon="logo-google" label={t.profileSignInGoogle} iconBg="#EAE8FF" iconColor="#7C6FF7" onPress={signInWithGoogle} isLast />
            )}
          </Section>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const HEADER_H = Platform.OS === 'ios' ? 200 : 185;

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 12 },

  headerBanner: {
    height: HEADER_H,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBtn: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  headerIllus: { position: 'absolute', right: -10, bottom: -10, width: 160, height: 160, opacity: 0.85 },
  heroDeco1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.07)', right: -40, top: -40 },
  heroDeco2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.06)', left: 30, bottom: -30 },

  avatarWrap: { alignItems: 'center', marginTop: -52, paddingHorizontal: 20, gap: 4 },
  avatarRing: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', padding: 3, shadowColor: '#7C6FF7', shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 30, fontFamily: FONTS.bold },
  name: { fontSize: 22, fontFamily: FONTS.bold, marginTop: 8 },
  email: { fontSize: 13, fontFamily: FONTS.regular },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  levelTxt: { fontSize: 13, fontFamily: FONTS.bold },
  proBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  proTxt: { fontSize: 11, fontFamily: FONTS.bold, color: '#7A4800' },
  signInBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  signInTxt: { fontSize: 14, fontFamily: FONTS.semibold },

  xpCard: { borderRadius: RADIUS.xl, padding: 16, gap: 8, marginHorizontal: 16 },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLbl: { fontSize: 13, fontFamily: FONTS.semibold },
  xpBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 5 },
  xpHint: { fontSize: 11, fontFamily: FONTS.regular },

  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  statCard: { flex: 1, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', gap: 4 },
  statIconCircle: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statVal: { fontSize: 16, fontFamily: FONTS.bold },
  statLbl: { fontSize: 10, fontFamily: FONTS.semibold },

  upgradeBanner: { borderRadius: RADIUS.xl, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16 },
  upgradeTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  upgradeSub: { color: '#ffffffCC', fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  upgradeBtn: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  upgradeBtnTxt: { color: '#FF8C42', fontFamily: FONTS.bold, fontSize: 14 },

  sectionTitle: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 4 },
  section: { borderRadius: RADIUS.xl, overflow: 'hidden', marginHorizontal: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: FONTS.medium },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeTxt: { fontSize: 12, fontFamily: FONTS.bold },
});
