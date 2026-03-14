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
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900ExtraBlack,
} from '@expo-google-fonts/nunito';
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
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900ExtraBlack,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <StudyProvider>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </StudyProvider>
  );
}
