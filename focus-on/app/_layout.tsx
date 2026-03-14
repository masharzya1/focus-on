import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StudyProvider, useStudy } from '@/contexts/StudyContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { View, Text, ScrollView, TouchableOpacity, Clipboard } from 'react-native';
import { useAutoBlocking } from '@/hooks/useAutoBlocking';
import { useEffect, Component, ReactNode } from 'react';
import React from 'react';

import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

// ── Error Boundary ─────────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
  stack: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: '', stack: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: error?.message || String(error),
      stack: error?.stack || '',
    };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const fullMsg = `ERROR:\n${this.state.error}\n\nSTACK:\n${this.state.stack}`;
      return (
        <View style={{ flex: 1, backgroundColor: '#0D0E14', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            🔴 App Crashed
          </Text>
          <Text style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>
            {this.state.error}
          </Text>
          <TouchableOpacity
            onPress={() => Clipboard.setString(fullMsg)}
            style={{ backgroundColor: '#6C63FF', padding: 12, borderRadius: 8, marginBottom: 16 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
              📋 Copy Full Error
            </Text>
          </TouchableOpacity>
          <ScrollView style={{ backgroundColor: '#1C1A3E', borderRadius: 8, padding: 12 }}>
            <Text style={{ color: '#A78BFA', fontSize: 11, fontFamily: 'monospace' }}>
              {this.state.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
// ───────────────────────────────────────────────────────────────────────────────

function InnerLayout() {
  const { colors, isDark } = useTheme();
  const { state, ready } = useStudy();
  const router = useRouter();
  const segments = useSegments();

  const { syncNow } = useAutoBlocking();
  // syncNow is available for child screens via the native module directly

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!state.onboardingCompleted && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [ready, state.onboardingCompleted]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StudyProvider>
          <ThemeProvider>
            <InnerLayout />
          </ThemeProvider>
        </StudyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
         }
