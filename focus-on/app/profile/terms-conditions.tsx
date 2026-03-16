import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';
import { FONTS } from '@/constants/theme';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using Focus On, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the app.`,
  },
  {
    title: '2. Use of the App',
    body: `Focus On is designed for personal, non-commercial educational use. You agree to:\n• Use the app only for lawful purposes\n• Not attempt to reverse engineer or modify the app\n• Not misuse the app blocking features to interfere with others' devices`,
  },
  {
    title: '3. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account. You agree to notify us immediately of any unauthorized use. We reserve the right to terminate accounts that violate these terms.`,
  },
  {
    title: '4. PRO Subscription',
    body: `The PRO upgrade is a one-time payment for lifetime access to premium features. Payments are processed securely. We do not offer refunds once a purchase is confirmed. If you experience technical issues, please contact us within 7 days of purchase.`,
  },
  {
    title: '5. App Blocking Features',
    body: `The app blocking and Device Administrator features are provided to help you focus. By enabling these features, you grant necessary permissions. We are not responsible for any unintended consequences of blocking apps on your device.`,
  },
  {
    title: '6. Intellectual Property',
    body: `All content, design, and code within Focus On is owned by the developers. You may not copy, reproduce, or distribute any part of the app without written permission.`,
  },
  {
    title: '7. Disclaimer of Warranties',
    body: `Focus On is provided "as is" without warranties of any kind. We do not guarantee that the app will be error-free or uninterrupted. Study results depend on individual effort and consistency.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the app.`,
  },
  {
    title: '9. Changes to Terms',
    body: `We may update these Terms and Conditions from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.`,
  },
  {
    title: '10. Contact',
    body: `For questions about these terms, please contact us through the app's feedback feature.`,
  },
];

export default function TermsConditionsScreen() {
  const { colors: c } = useTheme();
  const t = useT();
  const router = useRouter();

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: c.text }]}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={[st.lastUpdated, { color: c.textFaint }]}>Last updated: March 2026</Text>

        <View style={[st.card, { backgroundColor: c.bgCard }]}>
          <Text style={[st.intro, { color: c.textMuted }]}>
            Please read these Terms and Conditions carefully before using Focus On. These terms govern your use of our app and services.
          </Text>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} style={[st.section, { backgroundColor: c.bgCard }]}>
            <Text style={[st.sectionTitle, { color: c.text }]}>{s.title}</Text>
            <Text style={[st.sectionBody, { color: c.textMuted }]}>{s.body}</Text>
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  content: { padding: 16, gap: 10 },
  lastUpdated: { fontSize: 12, fontFamily: FONTS.regular, textAlign: 'center', paddingVertical: 4 },
  card: { borderRadius: 16, padding: 16 },
  intro: { fontSize: 14, fontFamily: FONTS.regular, lineHeight: 22 },
  section: { borderRadius: 16, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: FONTS.bold },
  sectionBody: { fontSize: 14, fontFamily: FONTS.regular, lineHeight: 22 },
});