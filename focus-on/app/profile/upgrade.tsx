import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT, useLanguage } from '@/contexts/LanguageContext';
import { FONTS } from '@/constants/theme';
import { PRO_PRICE_BDT } from '@/services/payment';

function getFeatures(t: any) { return [
  { icon: 'infinite-outline',         title: t.upgradeUnlimited,    desc: 'No limits on subjects, plans, or sessions' },
  { icon: 'shield-checkmark-outline', title: t.upgradeAppBlocking,  desc: 'Hard block, Device Admin, emergency control' },
  { icon: 'notifications-outline',    title: t.upgradeReminders,    desc: 'Per-task notifications with custom schedules' },
  { icon: 'sync-outline',             title: t.upgradeCloudSync,    desc: t.upgradeCloudSyncDesc },
  { icon: 'analytics-outline',        title: t.upgradeAnalytics,    desc: t.upgradeAnalyticsDesc },
  { icon: 'calendar-outline',         title: t.upgradeScheduling,   desc: 'AI-powered plan with spaced repetition' },
]; }

export default function UpgradeScreen() {
  const { isPro, grantPro } = useAuth();
  const { colors: c, isDark } = useTheme();
  const t = useT();
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);

  if (isPro) {
    return (
      <View style={[st.root, { backgroundColor: c.bg }]}>
        <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={[st.headerTitle, { color: c.text }]}>Pro</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={st.proActive}>
          <LinearGradient colors={['#6C63FF', '#9C5FFF']} style={st.proIcon}>
            <Ionicons name="shield-checkmark" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[st.proTitle, { color: c.text }]}>{t.upgradeProTitle}</Text>
          <Text style={[st.proSub, { color: c.textMuted }]}>All features are unlocked. Thank you for your support!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 0 }}>
        {/* ── Hero ── */}
        <LinearGradient colors={['#1a1040', '#6C63FF', '#9C5FFF']} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
          {/* Back button inside hero */}
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}
            style={[st.backBtn, { backgroundColor: '#ffffff25', alignSelf: 'flex-start', marginBottom: 16 }]}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={st.premiumBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={st.premiumTxt}>{t.upgradePremium}</Text>
          </View>
          <Text style={st.heroTitle}>Unlock Your{'\n'}Full Potential</Text>
          <Text style={st.heroSub}>{t.upgradeTagline}</Text>
          <View style={st.priceRow}>
            <Text style={st.price}>৳{PRO_PRICE_BDT}</Text>
            <View>
              <Text style={st.priceLabel}>{t.upgradeOneTime}</Text>
              <Text style={st.priceLifetime}>{t.upgradeLifetime}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Features ── */}
        <View style={{ padding: 16, gap: 10 }}>
          {getFeatures(t).map((f, i) => (
            <Animated.View key={f.title} entering={FadeInDown.delay(i * 50).springify()}
              style={[st.featureCard, { backgroundColor: c.bgCard }]}>
              <View style={[st.featureIcon, { backgroundColor: c.accentSoft }]}>
                <Ionicons name={f.icon as any} size={22} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.featureTitle, { color: c.text }]}>{f.title}</Text>
                <Text style={[st.featureDesc, { color: c.textMuted }]}>{f.desc}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </Animated.View>
          ))}

          {/* ── CTA ── */}
          <TouchableOpacity onPress={() => setShowPayment(true)} activeOpacity={0.9} style={{ marginTop: 8 }}>
            <LinearGradient colors={['#6C63FF', '#9C5FFF']} style={st.ctaBtn}>
              <Text style={st.ctaTxt}>Upgrade Now · ৳{PRO_PRICE_BDT}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[st.disclaimer, { color: c.textFaint }]}>
            One-time payment · No hidden fees · Lifetime access
          </Text>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* ── Payment Modal ── */}
      <Modal visible={showPayment} transparent animationType="slide" onRequestClose={() => setShowPayment(false)}>
        <Pressable style={st.modalBg} onPress={() => setShowPayment(false)}>
          <Animated.View entering={FadeInUp.springify()}
            style={[st.paymentSheet, { backgroundColor: c.bgCard }]}
            onStartShouldSetResponder={() => true}>
            <View style={[st.handle, { backgroundColor: c.border }]} />
            <Text style={[st.paymentTitle, { color: c.text }]}>{t.upgradePaymentMethod}</Text>
            <Text style={[st.paymentSub, { color: c.textMuted }]}>৳{PRO_PRICE_BDT} · Lifetime Access</Text>

            {[
              { icon: 'phone-portrait-outline', label: 'bKash', color: '#E2136E', onPress: () => {} },
              { icon: 'card-outline',           label: 'Card / Other Methods', color: '#3B82F6', onPress: () => {} },
            ].map((m, i) => (
              <TouchableOpacity key={m.label}
                style={[st.paymentMethod, { backgroundColor: c.bgSecondary }]}
                onPress={m.onPress}>
                <View style={[st.paymentIcon, { backgroundColor: m.color + '20' }]}>
                  <Ionicons name={m.icon as any} size={22} color={m.color} />
                </View>
                <Text style={[st.paymentLabel, { color: c.text }]}>{m.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={() => setShowPayment(false)} style={st.cancelBtn}>
              <Text style={[st.cancelTxt, { color: c.textMuted }]}>{t.upgradeCancel}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 36, paddingHorizontal: 24, gap: 10 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ffffff20', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  premiumTxt: { color: '#FFD700', fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1 },
  heroTitle: { fontSize: 30, fontFamily: FONTS.bold, color: '#fff', lineHeight: 36 },
  heroSub: { fontSize: 14, fontFamily: FONTS.regular, color: '#ffffffAA' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  price: { fontSize: 36, fontFamily: FONTS.bold, color: '#fff' },
  priceLabel: { color: '#ffffffCC', fontFamily: FONTS.semibold, fontSize: 14 },
  priceLifetime: { color: '#ffffff80', fontFamily: FONTS.regular, fontSize: 12 },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontFamily: FONTS.semibold, marginBottom: 2 },
  featureDesc: { fontSize: 12, fontFamily: FONTS.regular },
  ctaBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaTxt: { color: '#fff', fontSize: 17, fontFamily: FONTS.bold },
  disclaimer: { textAlign: 'center', fontSize: 12, fontFamily: FONTS.regular },
  modalBg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  paymentSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, gap: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  paymentTitle: { fontSize: 20, fontFamily: FONTS.bold },
  paymentSub: { fontSize: 14, fontFamily: FONTS.regular, marginTop: -4 },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14 },
  paymentIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paymentLabel: { flex: 1, fontSize: 16, fontFamily: FONTS.semibold },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelTxt: { fontSize: 15, fontFamily: FONTS.medium },
  proActive: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  proIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  proTitle: { fontSize: 24, fontFamily: FONTS.bold },
  proSub: { fontSize: 15, fontFamily: FONTS.regular, textAlign: 'center' },
});