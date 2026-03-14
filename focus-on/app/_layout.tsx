import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StudyProvider, useStudy } from '@/contexts/StudyContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { View } from 'react-native';
import { useAutoBlocking } from '@/hooks/useAutoBlocking';
import { useEffect } from 'react';

function InnerLayout() {
  const { colors, isDark } = useTheme();
  const { state, ready } = useStudy();
  const router = useRouter();
  const segments = useSegments();

  useAutoBlocking();

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
  return (
    <StudyProvider>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </StudyProvider>
  );
}
