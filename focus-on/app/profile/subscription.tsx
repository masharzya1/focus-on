// subscription.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT, useLanguage } from '@/contexts/LanguageContext';
import { FONTS } from '@/constants/theme';

export default function SubscriptionScreen() {
  const { isPro } = useAuth();
  const { colors: c } = useTheme();
  const t = useT();
  const router = useRouter();

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <View style={[s.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]}>{t.subscriptionTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.content}>
        {isPro ? (
          <LinearGradient colors={['#6C63FF', '#9C5FFF']} style={s.proCard}>
            <View style={s.proIconWrap}>
              <Ionicons name="shield-checkmark" size={36} color="#fff" />
            </View>
            <View style={s.proInfo}>
              <View style={s.proBadge}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={s.proBadgeTxt}>{t.subscriptionProLifetime}</Text>
              </View>
              <Text style={s.proTitle}>{t.subscriptionAllUnlocked}</Text>
              <Text style={s.proSub}>{t.subscriptionUnlimitedAccess}</Text>
            </View>
          </LinearGradient>
        ) : (
          <>
            <View style={[s.freeCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <View style={[s.freeIcon, { backgroundColor: c.bgSecondary }]}>
                <Ionicons name="person-outline" size={30} color={c.textMuted} />
              </View>
              <Text style={[s.freeTitle, { color: c.text }]}>{t.subscriptionFreePlan}</Text>
              <Text style={[s.freeSub, { color: c.textMuted }]}>
                You're on the free plan. Upgrade to PRO to unlock all features and support the developer!
              </Text>
            </View>

            <TouchableOpacity
              style={[s.upgradeBtn, { backgroundColor: c.accent }]}
              onPress={() => router.push('/profile/upgrade' as any)}>
              <Ionicons name="diamond-outline" size={20} color="#fff" />
              <Text style={s.upgradeTxt}>{t.subscriptionUpgradeBtn}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  content: { flex: 1, padding: 20, gap: 16 },
  proCard: { borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  proIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' },
  proInfo: { flex: 1, gap: 5 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffffff20', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  proBadgeTxt: { color: '#FFD700', fontFamily: FONTS.bold, fontSize: 11 },
  proTitle: { color: '#fff', fontSize: 18, fontFamily: FONTS.bold },
  proSub: { color: '#ffffffAA', fontSize: 12, fontFamily: FONTS.regular },
  freeCard: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 12, borderWidth: 1.5 },
  freeIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  freeTitle: { fontSize: 20, fontFamily: FONTS.bold },
  freeSub: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  upgradeBtn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  upgradeTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
});