import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StudyProvider, useStudy } from '@/contexts/StudyContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { View } from 'react-native';
import { useAutoBlocking } from '@/hooks/useAutoBlocking';
import { useEffect } from 'react';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Wait for fonts before rendering — prevents flash of system font
  if (!fontsLoaded && !fontError) return null;

  return (
    <StudyProvider>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </StudyProvider>
  );
}
