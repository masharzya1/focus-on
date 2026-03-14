import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ──────────────────────────────────────────────────────────────────
const RUPANTOR_API_KEY = 'ugPzO6mBwXeSR1ubF3fb45wPdTS0qR1wbcoIsJaCNfC26ziBXl'; // Replace with real key
const RUPANTOR_ENDPOINT = 'https://payment.rupantorpay.com/api/payment/checkout';
const RUPANTOR_VERIFY = 'https://payment.rupantorpay.com/api/payment/verify-payment';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51MNabtHWXTT2IauvIzGNFPFghStdWgvl6ioLpqHmadATSzbA7KCW8bA16WjQo9LdYDtMpwz51MnT2JyAQzhEmluB00TL5aoBWG'; // Replace with real key
const STRIPE_BACKEND_URL = 'YOUR_BACKEND_URL/create-payment-intent'; // Replace with backend URL

export const PRO_PRICE_BDT = 999;   // One-time lifetime price in BDT
export const PRO_PRICE_USD = 9.99;  // One-time lifetime price in USD

const PENDING_TX_KEY = 'focuson_pending_tx';

// ─── RupantorPay ─────────────────────────────────────────────────────────────
export async function initiateRupantorPayment(
  userName: string,
  userEmail: string,
  userId: string
): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  try {
    const response = await fetch(RUPANTOR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': RUPANTOR_API_KEY,
        'X-CLIENT': 'com.focuson',
      },
      body: JSON.stringify({
        fullname: userName,
        email: userEmail,
        amount: PRO_PRICE_BDT.toString(),
        success_url: `focuson://payment/success`,
        cancel_url: `focuson://payment/cancel`,
        webhook_url: `https://your-backend.com/webhook/rupantor`, // optional
        meta_data: JSON.stringify({ userId, plan: 'pro_lifetime' }),
      }),
    });

    const data = await response.json();

    if (data.status === 1 && data.payment_url) {
      return { success: true, paymentUrl: data.payment_url };
    }
    return { success: false, error: data.message || 'Payment initiation failed' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function verifyRupantorPayment(
  transactionId: string
): Promise<{ verified: boolean; status?: string }> {
  try {
    const response = await fetch(RUPANTOR_VERIFY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': RUPANTOR_API_KEY,
      },
      body: JSON.stringify({ transaction_id: transactionId }),
    });

    const data = await response.json();
    return {
      verified: data.status === 'COMPLETED',
      status: data.status,
    };
  } catch {
    return { verified: false };
  }
}

// Save pending transaction so we can verify after deep link redirect
export async function savePendingTransaction(transactionId: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_TX_KEY, transactionId);
}

export async function getPendingTransaction(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_TX_KEY);
}

export async function clearPendingTransaction(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_TX_KEY);
}

// Open payment URL in browser
export async function openPaymentUrl(url: string): Promise<void> {
  const supported = await Linking.canOpenURL(url);
  if (supported) await Linking.openURL(url);
}

// ─── Stripe ──────────────────────────────────────────────────────────────────
// NOTE: Stripe requires a backend to create PaymentIntent.
// This calls YOUR backend which calls Stripe API.
export async function initiateStripePayment(
  userId: string,
  userEmail: string
): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
  try {
    const response = await fetch(STRIPE_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(PRO_PRICE_USD * 100), // Stripe uses cents
        currency: 'usd',
        metadata: { userId, plan: 'pro_lifetime', email: userEmail },
      }),
    });

    const data = await response.json();
    if (data.clientSecret) {
      return { success: true, clientSecret: data.clientSecret };
    }
    return { success: false, error: data.error || 'Failed to create payment' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export const stripePublishableKey = STRIPE_PUBLISHABLE_KEY;