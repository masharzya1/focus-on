import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS } from '@/constants/theme';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide when you sign in with Google, including your name and email address. We also collect study data you create within the app — subjects, chapters, topics, study plans, and session history.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to:\n• Sync your study data across devices\n• Track your study progress and streaks\n• Send study reminders and notifications\n• Improve the app experience`,
  },
  {
    title: '3. Data Storage & Security',
    body: `Your data is stored securely on Firebase (Google Cloud). We use industry-standard encryption and security measures. We do not sell your personal information to any third parties.`,
  },
  {
    title: '4. App Blocking Feature',
    body: `Focus On uses Android Accessibility Services and Device Administrator permissions solely to block distracting apps during study time. We do not monitor, read, or transmit any data from other apps on your device.`,
  },
  {
    title: '5. Data Deletion',
    body: `You can permanently delete your account and all associated data at any time from Profile → Delete Account. Once deleted, your data cannot be recovered.`,
  },
  {
    title: '6. Children\'s Privacy',
    body: `Focus On is designed for students. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us.`,
  },
  {
    title: '7. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the date at the top of this page.`,
  },
  {
    title: '8. Contact Us',
    body: `If you have any questions about this Privacy Policy, please contact us through the app's feedback feature.`,
  },
];

export default function PrivacyPolicyScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: c.text }]}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={[st.lastUpdated, { color: c.textFaint }]}>Last updated: March 2026</Text>

        <View style={[st.card, { backgroundColor: c.bgCard }]}>
          <Text style={[st.intro, { color: c.textMuted }]}>
            Focus On is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
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