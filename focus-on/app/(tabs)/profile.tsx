import React, { useState } from 'react';
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
import { RADIUS, FONTS, SPACING, HEADER_TOP, TYPE } from '@/constants/theme';
import PaywallModal from '@/components/PaywallModal';
import { PRO_PRICE_BDT } from '@/services/payment';

function getLevelProgress(xp: number) {
  let remaining = xp, lvl = 1;
  while (remaining >= lvl * 100) { remaining -= lvl * 100; lvl++; }
  return { lvl, earned: remaining, total: lvl * 100 };
}

// ── Menu Row ──────────────────────────────────────────────────────────────────
function MenuRow({
  icon, label, iconBg, iconColor, badge, onPress, isLast = false,
}: {
  icon: string; label: string; iconBg: string; iconColor: string;
  badge?: string | number; onPress: () => void; isLast?: boolean;
}) {
  const { colors: c } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && { borderBottomWidth: 1, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[styles.menuLabel, { color: c.text }]}>{label}</Text>
      <View style={styles.menuRight}>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
            <Text style={[styles.badgeTxt, { color: c.accent }]}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
      </View>
    </TouchableOpacity>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function MenuSection({ children }: { children: React.ReactNode }) {
  const { colors: c } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: c.bgCard }]}>
      {children}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { state } = useStudy();
  const { user, isPro, signInWithGoogle, signOut } = useAuth();
  const { colors: c, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  const { lvl, earned, total } = getLevelProgress(state.xp);
  const xpPct = Math.round((earned / total) * 100);

  const completedSessions = state.sessions.filter(s => s.completed);
  const totalMinutes = completedSessions.reduce((s, sess) => s + sess.durationMinutes, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;
  const studiedStr = totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`;

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSignOut = () => Alert.alert('Sign Out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: signOut },
  ]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} hitSlop={12}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={c.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Profile Header ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          {/* Avatar */}
          <LinearGradient
            colors={['#6C63FF', '#9C5FFF']}
            style={styles.avatarRing}
          >
            <View style={[styles.avatar, { backgroundColor: c.bgCard }]}>
              <Text style={[styles.avatarInitials, { color: c.accent }]}>{initials}</Text>
            </View>
          </LinearGradient>

          {/* Name + info */}
          <Text style={[styles.displayName, { color: c.text }]}>
            {user?.displayName ?? 'Student'}
          </Text>
          {user?.email && (
            <Text style={[styles.email, { color: c.textMuted }]}>{user.email}</Text>
          )}

          {/* Level badge */}
          <View style={[styles.levelBadge, { backgroundColor: c.accentSoft }]}>
            <Ionicons name="star" size={12} color={c.accent} />
            <Text style={[styles.levelBadgeTxt, { color: c.accent }]}>
              Level {lvl} · {state.xp} XP
            </Text>
            {isPro && (
              <>
                <View style={{ width: 1, height: 12, backgroundColor: c.accent + '40', marginHorizontal: 4 }} />
                <Text style={[styles.levelBadgeTxt, { color: c.accent }]}>PRO</Text>
              </>
            )}
          </View>
        </Animated.View>

        {/* ── XP Bar ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}
          style={[styles.xpCard, { backgroundColor: c.bgCard }]}>
          <View style={styles.xpTop}>
            <Text style={[styles.xpLabel, { color: c.textMuted }]}>Level {lvl}</Text>
            <Text style={[styles.xpLabel, { color: c.textMuted }]}>{earned}/{total} XP</Text>
          </View>
          <View style={[styles.xpBg, { backgroundColor: c.border }]}>
            <View style={[styles.xpFill, { width: `${xpPct}%`, backgroundColor: c.accent }]} />
          </View>
        </Animated.View>

        {/* ── Stats strip ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()}
          style={[styles.statsCard, { backgroundColor: c.bgCard }]}>
          {[
            { icon: 'flame',           color: '#FF9500', val: String(state.streak),             lbl: 'Streak'   },
            { icon: 'time-outline',    color: c.accent,  val: String(completedSessions.length), lbl: 'Sessions' },
            { icon: 'hourglass',       color: '#3B82F6', val: studiedStr,                       lbl: 'Studied'  },
            { icon: 'checkmark-circle',color: '#10B981', val: String(state.totalTopicsCompleted), lbl: 'Done'   },
          ].map((s, i, arr) => (
            <React.Fragment key={s.lbl}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: c.text }]}>{s.val}</Text>
                <View style={styles.statRow}>
                  <Ionicons name={s.icon as any} size={11} color={s.color} />
                  <Text style={[styles.statLbl, { color: c.textMuted }]}> {s.lbl}</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={[styles.statDivider, { backgroundColor: c.border }]} />}
            </React.Fragment>
          ))}
        </Animated.View>

        {/* ── Upgrade banner (if not pro) ── */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <TouchableOpacity onPress={() => setShowPaywall(true)} activeOpacity={0.9}>
              <LinearGradient
                colors={['#6C63FF', '#9C5FFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.upgradeBanner}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.upgradeTitle}>Upgrade to PRO</Text>
                  <Text style={styles.upgradeSub}>৳{PRO_PRICE_BDT} · One-time · Lifetime</Text>
                </View>
                <View style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnTxt}>Upgrade</Text>
                  <Ionicons name="arrow-forward" size={14} color="#6C63FF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Menu Group 1: Study ── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <MenuSection>
            <MenuRow icon="book-outline"       label="Subjects"     iconBg="#DBEAFE" iconColor="#3B82F6"
              onPress={() => router.push('/(tabs)/subjects' as any)} />
            <MenuRow icon="calendar-outline"   label="Plans"        iconBg="#EDE9FF" iconColor="#6C63FF"
              onPress={() => router.push('/(tabs)/plan' as any)} />
            <MenuRow icon="timer-outline"      label="Focus Timer"  iconBg="#D1FAE5" iconColor="#10B981"
              onPress={() => router.push('/(tabs)/timer' as any)} />
            <MenuRow icon="shield-outline"     label="App Blocking" iconBg="#FEE2E2" iconColor="#EF4444"
              badge={state.blockRoutines.length > 0 ? state.blockRoutines.length : undefined}
              onPress={() => router.push('/(tabs)/app-block' as any)} isLast />
          </MenuSection>
        </Animated.View>

        {/* ── Menu Group 2: Account ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <MenuSection>
            <MenuRow icon="person-outline"     label="Edit Profile"  iconBg="#FEF3C7" iconColor="#D97706"
              onPress={() => router.push('/(tabs)/settings' as any)} />
            <MenuRow icon="moon-outline"       label="Appearance"    iconBg="#EDE9FF" iconColor="#6C63FF"
              onPress={toggleTheme} />
            <MenuRow icon="notifications-outline" label="Notifications" iconBg="#FEE2E2" iconColor="#EF4444"
              onPress={() => router.push('/(tabs)/settings' as any)} isLast />
          </MenuSection>
        </Animated.View>

        {/* ── Menu Group 3: More ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <MenuSection>
            <MenuRow icon="settings-outline"   label="Settings"      iconBg="#F0FDF4" iconColor="#10B981"
              onPress={() => router.push('/(tabs)/settings' as any)} />
            <MenuRow icon="information-circle-outline" label="About" iconBg="#EFF6FF" iconColor="#3B82F6"
              onPress={() => {}} />
            <MenuRow icon="document-text-outline" label="Privacy Policy" iconBg="#F5F3FF" iconColor="#8B5CF6"
              onPress={() => {}} isLast />
          </MenuSection>
        </Animated.View>

        {/* ── Sign out ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <MenuSection>
            {user ? (
              <MenuRow icon="log-out-outline"  label="Sign Out"      iconBg="#FEE2E2" iconColor="#EF4444"
                onPress={handleSignOut} isLast />
            ) : (
              <MenuRow icon="logo-google"      label="Sign in with Google" iconBg="#EDE9FF" iconColor="#6C63FF"
                onPress={signInWithGoogle} isLast />
            )}
          </MenuSection>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 16,
    gap: 12,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },

  // Header
  header: { alignItems: 'center', paddingVertical: 8, gap: 8 },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', padding: 3,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 28, fontFamily: FONTS.bold },
  displayName: { fontSize: 20, fontFamily: FONTS.bold, marginTop: 4 },
  email: { fontSize: 13, fontFamily: FONTS.regular },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  levelBadgeTxt: { fontSize: 13, fontFamily: FONTS.bold },

  // XP
  xpCard: { borderRadius: 16, padding: 16, gap: 8 },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontSize: 12, fontFamily: FONTS.medium },
  xpBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 4 },

  // Stats
  statsCard: {
    borderRadius: 16, flexDirection: 'row',
    paddingVertical: 16, paddingHorizontal: 8,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontFamily: FONTS.bold },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statLbl: { fontSize: 11, fontFamily: FONTS.regular },
  statDivider: { width: 1, alignSelf: 'stretch', marginVertical: 4 },

  // Upgrade
  upgradeBanner: {
    borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  upgradeTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  upgradeSub: { color: '#ffffffAA', fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  upgradeBtn: {
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  upgradeBtnTxt: { color: '#6C63FF', fontFamily: FONTS.bold, fontSize: 14 },

  // Menu
  section: { borderRadius: 16, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: FONTS.medium },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeTxt: { fontSize: 12, fontFamily: FONTS.bold },
});