import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StudyProvider } from '@/contexts/StudyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { View } from 'react-native';

function InnerLayout() {
  const { colors, isDark } = useTheme();
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
