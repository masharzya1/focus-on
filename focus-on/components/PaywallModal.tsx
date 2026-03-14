import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { RADIUS } from '@/constants/theme';
import {
  initiateRupantorPayment,
  verifyRupantorPayment,
  openPaymentUrl,
  savePendingTransaction,
  PRO_PRICE_BDT,
  PRO_PRICE_USD,
} from '@/services/payment';

const PRO_FEATURES = [
  { icon: 'infinite' as const,       text: 'Unlimited block routines' },
  { icon: 'apps' as const,           text: 'Unlimited apps per routine' },
  { icon: 'calendar' as const,       text: 'Auto-blocking by schedule' },
  { icon: 'videocam-off' as const,   text: 'Reels / Shorts blocking' },
  { icon: 'shield-checkmark' as const, text: 'Ad-free overlay' },
  { icon: 'sync' as const,           text: 'Cross-device sync' },
  { icon: 'notifications' as const,  text: 'Smart study reminders' },
  { icon: 'star' as const,           text: 'Lifetime access — pay once' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

type PayMethod = 'rupantor' | 'stripe';

export default function PaywallModal({ visible, onClose }: Props) {
  const { colors: c } = useTheme();
  const { user, signInWithGoogle, grantPro, refreshProStatus } = useAuth();

  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<PayMethod>('rupantor');
  const [verifying, setVerifying] = useState(false);

  async function handlePurchase() {
    // Step 1: Must be logged in
    if (!user) {
      Alert.alert(
        'Sign in required',
        'Please sign in with Google to purchase Pro.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign in', onPress: signInWithGoogle },
        ]
      );
      return;
    }

    if (method === 'rupantor') {
      await handleRupantorPay();
    } else {
      await handleStripePay();
    }
  }

  async function handleRupantorPay() {
    setLoading(true);
    try {
      const result = await initiateRupantorPayment(
        user!.displayName || 'Focus On User',
        user!.email || '',
        user!.uid
      );

      if (!result.success || !result.paymentUrl) {
        Alert.alert('Error', result.error || 'Could not start payment');
        return;
      }

      // Open payment page
      await openPaymentUrl(result.paymentUrl);

      // After browser closes, ask user to verify
      setTimeout(() => {
        Alert.alert(
          'Payment complete?',
          'Did you complete the payment?',
          [
            { text: 'Not yet', style: 'cancel' },
            {
              text: 'Yes, verify',
              onPress: () => promptVerify(),
            },
          ]
        );
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  async function promptVerify() {
    Alert.prompt(
      'Enter Transaction ID',
      'Enter the transaction ID from your payment confirmation (e.g. OVKPXW165414)',
      async (txId) => {
        if (!txId?.trim()) return;
        setVerifying(true);
        try {
          const { verified } = await verifyRupantorPayment(txId.trim());
          if (verified) {
            await grantPro(txId.trim());
            Alert.alert('🎉 Welcome to Pro!', 'You now have lifetime access to all Pro features.', [
              { text: 'Awesome!', onPress: onClose },
            ]);
          } else {
            Alert.alert(
              'Not verified',
              'Payment not confirmed yet. Please try again or contact support.',
              [
                { text: 'Try again', onPress: promptVerify },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        } finally {
          setVerifying(false);
        }
      },
      'plain-text'
    );
  }

  async function handleStripePay() {
    // Stripe requires @stripe/stripe-react-native — placeholder for now
    Alert.alert(
      'International Payment',
      'Stripe payment will open in your browser.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // TODO: Replace with your Stripe payment link or backend URL
            Linking.openURL('https://buy.stripe.com/YOUR_PAYMENT_LINK');
          },
        },
      ]
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.container, { backgroundColor: c.bg }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={24} color={c.textMuted} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: c.text }]}>Upgrade to Pro</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={s.hero}>
            <View style={[s.heroIcon, { backgroundColor: '#FFD70020' }]}>
              <Ionicons name="star" size={40} color="#FFD700" />
            </View>
            <Text style={[s.heroTitle, { color: c.text }]}>Focus On Pro</Text>
            <Text style={[s.heroSub, { color: c.textMuted }]}>
              One-time payment. Lifetime access. No subscriptions.
            </Text>
            <View style={[s.priceBadge, { backgroundColor: c.accentSoft }]}>
              <Text style={[s.price, { color: c.accent }]}>৳{PRO_PRICE_BDT}</Text>
              <Text style={[s.priceOr, { color: c.textMuted }]}> or </Text>
              <Text style={[s.price, { color: c.accent }]}>${PRO_PRICE_USD}</Text>
            </View>
          </Animated.View>

          {/* Features */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={[s.featuresCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[s.featuresTitle, { color: c.text }]}>Everything in Pro:</Text>
            {PRO_FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={[s.featureIcon, { backgroundColor: c.accentSoft }]}>
                  <Ionicons name={f.icon} size={16} color={c.accent} />
                </View>
                <Text style={[s.featureText, { color: c.text }]}>{f.text}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Payment method */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={[s.methodCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[s.methodTitle, { color: c.textMuted }]}>PAYMENT METHOD</Text>
            <View style={s.methodRow}>
              <TouchableOpacity
                style={[s.methodBtn, {
                  backgroundColor: method === 'rupantor' ? c.accent : c.bgSecondary,
                  borderColor: method === 'rupantor' ? c.accent : c.border,
                }]}
                onPress={() => setMethod('rupantor')}
              >
                <Ionicons name="phone-portrait-outline" size={18} color={method === 'rupantor' ? '#fff' : c.textMuted} />
                <View>
                  <Text style={[s.methodBtnTitle, { color: method === 'rupantor' ? '#fff' : c.text }]}>bKash / Nagad</Text>
                  <Text style={[s.methodBtnSub, { color: method === 'rupantor' ? '#ffffffaa' : c.textMuted }]}>৳{PRO_PRICE_BDT} BDT</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.methodBtn, {
                  backgroundColor: method === 'stripe' ? c.accent : c.bgSecondary,
                  borderColor: method === 'stripe' ? c.accent : c.border,
                }]}
                onPress={() => setMethod('stripe')}
              >
                <Ionicons name="card-outline" size={18} color={method === 'stripe' ? '#fff' : c.textMuted} />
                <View>
                  <Text style={[s.methodBtnTitle, { color: method === 'stripe' ? '#fff' : c.text }]}>Card / International</Text>
                  <Text style={[s.methodBtnSub, { color: method === 'stripe' ? '#ffffffaa' : c.textMuted }]}>${PRO_PRICE_USD} USD</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Sign in notice */}
          {!user && (
            <Animated.View entering={FadeInDown.delay(220).duration(400)} style={[s.signInNotice, { backgroundColor: c.accentSoft, borderColor: c.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={c.accent} />
              <Text style={[s.signInText, { color: c.text }]}>
                Google sign-in required to purchase. Your data will sync across devices.
              </Text>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Buy button */}
        <View style={[s.footer, { borderTopColor: c.border, backgroundColor: c.bg }]}>
          {verifying ? (
            <View style={[s.buyBtn, { backgroundColor: c.accent }]}>
              <ActivityIndicator color="#fff" />
              <Text style={s.buyBtnText}>Verifying payment...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.buyBtn, { backgroundColor: c.accent, borderBottomColor: c.accentDark, opacity: loading ? 0.7 : 1 }]}
              onPress={handlePurchase}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Ionicons name="star" size={20} color="#fff" />
              }
              <Text style={s.buyBtnText}>
                {!user ? 'Sign in & Purchase' : `Get Lifetime Pro — ${method === 'rupantor' ? `৳${PRO_PRICE_BDT}` : `$${PRO_PRICE_USD}`}`}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={[s.footerNote, { color: c.textFaint }]}>
            One-time payment · No recurring charges
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  hero: { alignItems: 'center', padding: 28, gap: 10 },
  heroIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  priceBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full, marginTop: 4 },
  price: { fontSize: 22, fontWeight: '800' },
  priceOr: { fontSize: 14 },
  featuresCard: { marginHorizontal: 16, borderRadius: RADIUS.xl, borderWidth: 1, padding: 18, marginBottom: 12 },
  featuresTitle: { fontSize: 13, fontWeight: '700', marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, fontWeight: '500', flex: 1 },
  methodCard: { marginHorizontal: 16, borderRadius: RADIUS.xl, borderWidth: 1, padding: 18, marginBottom: 12 },
  methodTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12 },
  methodRow: { flexDirection: 'row', gap: 10 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1.5 },
  methodBtnTitle: { fontSize: 13, fontWeight: '700' },
  methodBtnSub: { fontSize: 11, marginTop: 1 },
  signInNotice: { marginHorizontal: 16, borderRadius: RADIUS.lg, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  signInText: { flex: 1, fontSize: 13, lineHeight: 19 },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1, gap: 8 },
  buyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: RADIUS.xl, borderBottomWidth: 4 },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footerNote: { fontSize: 12, textAlign: 'center' },
});