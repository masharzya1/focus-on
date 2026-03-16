import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FONTS } from '@/constants/theme';

const TABS = ['About', 'Privacy', 'Terms'] as const;

const ABOUT_CONTENT = `Focus On is a smart study companion designed for students who want to take control of their learning.

We help you organize your subjects, plan your studies intelligently, block distracting apps, and track your progress — all in one place.

Version 1.0.0
Developed with ❤️ for students`;

const PRIVACY_CONTENT = `Privacy Policy

Last updated: March 2026

1. Information We Collect
We collect information you provide directly to us, such as your Google account information when you sign in, and your study data (subjects, plans, sessions).

2. How We Use Your Information
We use your information to:
• Sync your study data across devices
• Provide personalized study recommendations
• Improve the app experience

3. Data Storage
Your data is stored securely on Firebase (Google Cloud). We do not sell your personal information to third parties.

4. Data Deletion
You can delete your account and all associated data at any time from Profile → Delete Account.

5. Contact
For privacy concerns, contact us through the app.`;

const TERMS_CONTENT = `Terms & Conditions

Last updated: March 2026

1. Acceptance of Terms
By using Focus On, you agree to these terms. If you do not agree, please do not use the app.

2. Use of Service
You may use Focus On for personal, non-commercial study purposes. You agree not to misuse the app or attempt to circumvent its features.

3. PRO Subscription
The PRO upgrade is a one-time payment for lifetime access. We do not offer refunds once the purchase is complete.

4. App Blocking Features
The app blocking features are designed to help you focus. We are not responsible for any consequences resulting from app blocking.

5. Changes to Terms
We may update these terms from time to time. Continued use of the app constitutes acceptance of updated terms.

6. Contact
For questions about these terms, contact us through the app.`;

export default function AboutScreen() {
  const { colors: c } = useTheme();
  const { fonts: FONTS } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<typeof TABS[number]>('About');

  const content = tab === 'About' ? ABOUT_CONTENT : tab === 'Privacy' ? PRIVACY_CONTENT : TERMS_CONTENT;

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      {/* Header */}
      <LinearGradient colors={['#6C63FF', '#9C5FFF']} style={st.headerGrad}>
        <View style={st.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}
            style={[st.backBtn, { backgroundColor: '#ffffff25' }]}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={st.logoWrap}>
            <Ionicons name="timer-outline" size={28} color="#fff" />
          </View>
        </View>
        <Text style={st.appName}>Focus On</Text>
        <Text style={st.appTagline}>Study smarter. Block distractions. Achieve more.</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={[st.tabBar, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={st.tabBtn} onPress={() => setTab(t)}>
            <Text style={[st.tabTxt, {
              color: tab === t ? c.accent : c.textMuted,
              fontFamily: tab === t ? FONTS.bold : FONTS.regular,
            }]}>{t}</Text>
            {tab === t && <View style={[st.tabLine, { backgroundColor: c.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <View style={[st.textCard, { backgroundColor: c.bgCard }]}>
          <Text style={[st.bodyTxt, { color: c.text }]}>{content}</Text>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 26, fontFamily: FONTS.bold, color: '#fff' },
  appTagline: { fontSize: 13, fontFamily: FONTS.regular, color: '#ffffffAA' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabTxt: { fontSize: 14 },
  tabLine: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, borderRadius: 1 },
  content: { padding: 16 },
  textCard: { borderRadius: 16, padding: 20 },
  bodyTxt: { fontSize: 14, fontFamily: FONTS.regular, lineHeight: 22 },
});