import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, TextInput, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useT, useLanguage } from '@/contexts/LanguageContext';
import { FONTS } from '@/constants/theme';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '@/services/firebase';

const CONFIRM_PHRASE = 'delete my account';

export default function DeleteAccountScreen() {
  const { user, signOut } = useAuth();
  const { colors: c } = useTheme();
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (input.toLowerCase().trim() !== CONFIRM_PHRASE) {
      Alert.alert('Incorrect', `Please type "${CONFIRM_PHRASE}" exactly to confirm.`);
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      // Delete Firestore data
      await deleteDoc(doc(db, 'users', user.uid, 'data', 'app'));
      await deleteDoc(doc(db, 'users', user.uid, 'data', 'pro'));
      // Delete Firebase auth account
      await deleteUser(auth.currentUser!);
      await signOut();
      Alert.alert('Account Deleted', 'Your account and all data have been permanently deleted.');
      router.replace('/(tabs)/' as any);
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security, please sign out and sign back in before deleting your account.',
          [{ text: 'OK', onPress: signOut }]
        );
      } else {
        Alert.alert('Error', e.message ?? 'Failed to delete account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const WARNINGS = [
    { icon: 'warning-outline',          color: '#EF4444', text: 'All your study subjects, chapters and topics will be permanently deleted' },
    { icon: 'calendar-outline',          color: '#F59E0B', text: 'All study plans and scheduled tasks will be lost' },
    { icon: 'timer-outline',             color: '#8B5CF6', text: 'Your session history and progress data will be erased' },
    { icon: 'shield-outline',            color: '#EF4444', text: 'Your app blocking routines will be removed' },
    { icon: 'person-remove-outline',     color: '#EF4444', text: 'Your Google account will be unlinked and cannot be undone' },
  ];

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      <View style={[st.header, { backgroundColor: c.bgCard, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: c.destructive }]}>Delete Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <Animated.View entering={FadeInDown.springify()} style={{ gap: 16 }}>
            {/* Danger icon */}
            <View style={[st.dangerIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trash-outline" size={36} color="#EF4444" />
            </View>
            <Text style={[st.title, { color: c.text }]}>Delete Your Account</Text>
            <Text style={[st.subtitle, { color: c.textMuted }]}>
              This action is permanent and cannot be undone. Please read the following carefully:
            </Text>

            {/* Warnings */}
            <View style={[st.warningsCard, { backgroundColor: c.bgCard }]}>
              {WARNINGS.map((w, i) => (
                <View key={i} style={[st.warningRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                  <View style={[st.warningIcon, { backgroundColor: w.color + '18' }]}>
                    <Ionicons name={w.icon as any} size={18} color={w.color} />
                  </View>
                  <Text style={[st.warningTxt, { color: c.text }]}>{w.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[st.nextBtn, { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 1.5 }]}
              onPress={() => setStep(1)}>
              <Text style={[st.nextTxt, { color: '#EF4444' }]}>I Understand, Continue</Text>
              <Ionicons name="arrow-forward" size={16} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity style={st.cancelBtn} onPress={() => router.back()}>
              <Text style={[st.cancelTxt, { color: c.textMuted }]}>Keep My Account</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInDown.springify()} style={{ gap: 16 }}>
            <View style={[st.dangerIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
            </View>
            <Text style={[st.title, { color: c.text }]}>Final Confirmation</Text>
            <Text style={[st.subtitle, { color: c.textMuted }]}>
              To confirm deletion, type exactly:
            </Text>
            <View style={[st.phraseBox, { backgroundColor: c.bgSecondary }]}>
              <Text style={[st.phrase, { color: c.accent }]}>{CONFIRM_PHRASE}</Text>
            </View>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={`Type "${CONFIRM_PHRASE}"`}
              placeholderTextColor={c.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              style={[st.input, {
                backgroundColor: c.inputBg,
                borderColor: input && input.toLowerCase().trim() !== CONFIRM_PHRASE ? '#EF4444' : c.border,
                color: c.text,
              }]}
            />

            <TouchableOpacity
              style={[st.deleteBtn, { opacity: loading ? 0.6 : 1 }]}
              onPress={handleDelete}
              disabled={loading}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={st.deleteTxt}>{loading ? 'Deleting...' : 'Permanently Delete Account'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={st.cancelBtn} onPress={() => { setStep(0); setInput(''); }}>
              <Text style={[st.cancelTxt, { color: c.textMuted }]}>Go Back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  content: { padding: 20, alignItems: 'center', gap: 0 },
  dangerIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontFamily: FONTS.bold, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  warningsCard: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  warningIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  warningTxt: { flex: 1, fontSize: 13, fontFamily: FONTS.regular, lineHeight: 18 },
  nextBtn: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  nextTxt: { fontSize: 15, fontFamily: FONTS.bold },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, width: '100%' },
  cancelTxt: { fontSize: 15, fontFamily: FONTS.medium },
  phraseBox: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start' },
  phrase: { fontSize: 15, fontFamily: FONTS.bold },
  input: { width: '100%', height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, fontFamily: FONTS.regular, borderWidth: 1.5 },
  deleteBtn: { height: 52, borderRadius: 14, backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' },
  deleteTxt: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },
});