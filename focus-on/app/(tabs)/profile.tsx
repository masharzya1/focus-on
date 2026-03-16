import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';
import { RADIUS, FONTS, SPACING, HEADER_TOP } from '@/constants/theme';

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
      <Text style={[s.menuLabel, { color: danger ? c.destructive : c.text }]}>{label}</Text>
      <View style={s.menuRight}>
        {badge !== undefined && (
          <View style={[s.badge, { backgroundColor: c.accentSoft }]}>
            <Text style={[s.badgeTxt, { color: c.accent }]}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={danger ? c.destructive + '80' : c.textFaint} />
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

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} hitSlop={12}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={c.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Hero ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.hero}>
          <LinearGradient colors={['#6C63FF', '#9C5FFF']} style={s.avatarRing}>
            <View style={[s.avatar, { backgroundColor: c.bgCard }]}>
              {user?.photoURL ? null : (
                <Text style={[s.avatarTxt, { color: c.accent }]}>{initials}</Text>
              )}
            </View>
          </LinearGradient>
          <Text style={[s.name, { color: c.text }]}>{user?.displayName ?? t.profileStudent}</Text>
          {user?.email && <Text style={[s.email, { color: c.textMuted }]}>{user.email}</Text>}
          {!user && (
            <TouchableOpacity
              style={[s.signInBtn, { backgroundColor: c.accentSoft }]}
              onPress={signInWithGoogle}>
              <Ionicons name="logo-google" size={16} color={c.accent} />
              <Text style={[s.signInTxt, { color: c.accent }]}>{t.profileSignIn}</Text>
            </TouchableOpacity>
          )}
          <View style={[s.levelBadge, { backgroundColor: c.accentSoft }]}>
            <Ionicons name="star" size={12} color={c.accent} />
            <Text style={[s.levelTxt, { color: c.accent }]}>{t.profileLevel(lvl)} · {state.xp} XP</Text>
            {isPro && <>
              <View style={{ width: 1, height: 12, backgroundColor: c.accent + '40', marginHorizontal: 4 }} />
              <Text style={[s.levelTxt, { color: c.accent }]}>PRO</Text>
            </>}
          </View>
        </Animated.View>

        {/* ── XP bar ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}
          style={[s.xpCard, { backgroundColor: c.bgCard }]}>
          <View style={s.xpTop}>
            <Text style={[s.xpLbl, { color: c.textMuted }]}>{t.profileLevel(lvl)}</Text>
            <Text style={[s.xpLbl, { color: c.textMuted }]}>{earned}/{total} XP</Text>
          </View>
          <View style={[s.xpBg, { backgroundColor: c.border }]}>
            <View style={[s.xpFill, { width: `${xpPct}%`, backgroundColor: c.accent }]} />
          </View>
        </Animated.View>

        {/* ── Stats ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()}
          style={[s.statsCard, { backgroundColor: c.bgCard }]}>
          {[
            { icon: 'flame',            color: '#FF9500', val: String(state.streak),              lbl: t.profileStreak   },
            { icon: 'time-outline',     color: c.accent,  val: String(completedSessions.length),  lbl: t.profileSessions },
            { icon: 'hourglass',        color: '#3B82F6', val: studiedStr,                        lbl: t.profileStudied  },
            { icon: 'checkmark-circle', color: '#10B981', val: String(state.totalTopicsCompleted), lbl: t.profileDone    },
          ].map((item, i, arr) => (
            <React.Fragment key={item.lbl}>
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: c.text }]}>{item.val}</Text>
                <View style={s.statRow}>
                  <Ionicons name={item.icon as any} size={11} color={item.color} />
                  <Text style={[s.statLbl, { color: c.textMuted }]}> {item.lbl}</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={[s.statDiv, { backgroundColor: c.border }]} />}
            </React.Fragment>
          ))}
        </Animated.View>

        {/* ── Upgrade banner ── */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <TouchableOpacity onPress={() => router.push('/profile/upgrade' as any)} activeOpacity={0.9}>
              <LinearGradient colors={['#6C63FF', '#9C5FFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.upgradeBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={s.upgradeTitle}>{t.profileUpgradeTitle}</Text>
                  <Text style={s.upgradeSub}>{t.profileUpgradeSub}</Text>
                </View>
                <View style={s.upgradeBtn}>
                  <Text style={s.upgradeBtnTxt}>{t.profileUpgradeBtn}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#6C63FF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Study ── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>{t.profileStudy}</Text>
          <Section>
            <MenuRow icon="bar-chart-outline"   label={t.profileProgress}         iconBg="#EDE9FF" iconColor="#6C63FF"  onPress={() => router.push('/profile/progress' as any)} />
            <MenuRow icon="checkmark-done-outline" label={t.profileCompletedTasks} iconBg="#D1FAE5" iconColor="#10B981" onPress={() => router.push('/profile/completed-tasks' as any)} />
            <MenuRow icon="timer-outline"        label={t.profileSessionHistory}  iconBg="#DBEAFE" iconColor="#3B82F6" onPress={() => router.push('/profile/session-history' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Account ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>{t.profileAccount}</Text>
          <Section>
            <MenuRow icon="person-outline"       label={t.profilePersonalInfo} iconBg="#FEF3C7" iconColor="#D97706" onPress={() => router.push('/profile/personal-info' as any)} />
            <MenuRow icon="diamond-outline"      label={t.profileSubscription}         iconBg="#EDE9FF" iconColor="#6C63FF" onPress={() => router.push('/profile/subscription' as any)} badge={isPro ? 'PRO' : undefined} />
            <MenuRow icon="settings-outline"     label={t.profileAppSettings}         iconBg="#F0FDF4" iconColor="#10B981" onPress={() => router.push('/(tabs)/settings' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Info ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>{t.profileInfo}</Text>
          <Section>
            <MenuRow icon="information-circle-outline" label={t.profileAboutUs}           iconBg="#EFF6FF" iconColor="#3B82F6" onPress={() => router.push('/profile/about' as any)} />
            <MenuRow icon="document-text-outline"      label={t.profilePrivacyPolicy}     iconBg="#F5F3FF" iconColor="#8B5CF6" onPress={() => router.push('/profile/privacy-policy' as any)} />
            <MenuRow icon="reader-outline"             label={t.profileTerms} iconBg="#FFF7ED" iconColor="#EA580C" onPress={() => router.push('/profile/terms-conditions' as any)} isLast />
          </Section>
        </Animated.View>

        {/* ── Danger zone ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Text style={[s.sectionTitle, { color: c.textMuted }]}>{t.profileAccount}</Text>
          <Section>
            {user ? (
              <>
                <MenuRow icon="person-outline"  label={t.profilePersonalInfo}   iconBg="#F0F0F0" iconColor="#6B7280" onPress={() => router.push('/profile/personal-info' as any)} />
                <MenuRow icon="trash-outline"   label={t.profileDeleteAccount} iconBg="#FEE2E2" iconColor="#EF4444" onPress={() => router.push('/profile/delete-account' as any)} danger />
                <MenuRow icon="log-out-outline" label={t.profileLogout}         iconBg="#FEE2E2" iconColor="#EF4444" onPress={handleSignOut} isLast danger />
              </>
            ) : (
              <MenuRow icon="logo-google" label={t.profileSignInGoogle} iconBg="#EDE9FF" iconColor="#6C63FF"
                onPress={signInWithGoogle} isLast />
            )}
          </Section>
        </Animated.View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: 16, gap: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hero: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  avatarRing: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', padding: 3 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 28, fontFamily: FONTS.bold },
  name: { fontSize: 20, fontFamily: FONTS.bold, marginTop: 4 },
  email: { fontSize: 13, fontFamily: FONTS.regular },
  signInBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  signInTxt: { fontSize: 14, fontFamily: FONTS.semibold },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  levelTxt: { fontSize: 13, fontFamily: FONTS.bold },
  xpCard: { borderRadius: 16, padding: 16, gap: 8 },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLbl: { fontSize: 12, fontFamily: FONTS.medium },
  xpBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 4 },
  statsCard: { borderRadius: 16, flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontFamily: FONTS.bold },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statLbl: { fontSize: 11, fontFamily: FONTS.regular },
  statDiv: { width: 1, alignSelf: 'stretch', marginVertical: 4 },
  upgradeBanner: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  upgradeSub: { color: '#ffffffAA', fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  upgradeBtn: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  upgradeBtnTxt: { color: '#6C63FF', fontFamily: FONTS.bold, fontSize: 14 },
  sectionTitle: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, paddingHorizontal: 4, paddingTop: 4 },
  section: { borderRadius: 16, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: FONTS.medium },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeTxt: { fontSize: 12, fontFamily: FONTS.bold },
});