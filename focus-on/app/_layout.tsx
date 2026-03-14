import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StudyProvider } from '@/contexts/StudyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudy } from '@/contexts/StudyContext';
import { View, Linking } from 'react-native';
import { useAutoBlocking } from '@/hooks/useAutoBlocking';
import { useEffect } from 'react';
import { requestNotificationPermission } from '@/services/notifications';
import { verifyRupantorPayment } from '@/services/payment';

function InnerLayout() {
  const { colors, isDark } = useTheme();
  const { user, grantPro } = useAuth();
  const { mergeFirebaseData } = useStudy();

  useAutoBlocking();

  // Request notification permission on first launch
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // When user signs in — merge Firebase data
  useEffect(() => {
    if (user) {
      mergeFirebaseData(user.uid);
    }
  }, [user?.uid]);

  // Handle deep link for payment return (focuson://payment/success?transactionId=xxx)
  useEffect(() => {
    async function handleDeepLink(url: string) {
      if (!url) return;
      if (url.includes('payment/success')) {
        const txMatch = url.match(/transactionId=([^&]+)/);
        const txId = txMatch?.[1];
        if (txId && user) {
          const { verified } = await verifyRupantorPayment(txId);
          if (verified) {
            await grantPro(txId);
          }
        }
      }
    }

    // App opened from deep link
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });

    // App already open, deep link received
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <StudyProvider>
      <ThemeProvider>
        <AuthProvider>
          <InnerLayout />
        </AuthProvider>
      </ThemeProvider>
    </StudyProvider>
  );
}
