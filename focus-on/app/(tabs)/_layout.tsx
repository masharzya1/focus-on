import { Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';

const TAB_ICONS: Record<string, { active: any; inactive: any; color: string }> = {
  index:     { active: 'home',           inactive: 'home-outline',           color: '#7C6FF7' },
  subjects:  { active: 'book',           inactive: 'book-outline',           color: '#30D9A4' },
  timer:     { active: 'timer',          inactive: 'timer-outline',          color: '#FFFFFF' },
  plan:      { active: 'calendar',       inactive: 'calendar-outline',       color: '#FF8C42' },
  'app-block':{ active: 'shield',        inactive: 'shield-outline',         color: '#FF5F6D' },
};

function TabIcon({ name, focused, tabName }: {
  name: string; focused: boolean; tabName: string;
}) {
  const cfg   = TAB_ICONS[tabName] ?? { active: name, inactive: name, color: '#7C6FF7' };
  const scale = useSharedValue(1);
  const bg    = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.12 : 1, { damping: 12, stiffness: 220 });
    bg.value    = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused]);

  const animWrap = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const animBg = useAnimatedStyle(() => ({
    opacity: bg.value,
  }));

  return (
    <View style={styles.iconOuter}>
      <Animated.View style={[
        styles.iconBg,
        { backgroundColor: cfg.color + '20' },
        animBg,
      ]} />
      <Animated.View style={animWrap}>
        <Ionicons
          name={focused ? cfg.active : cfg.inactive}
          size={24}
          color={focused ? cfg.color : '#B0A8D0'}
        />
      </Animated.View>
    </View>
  );
}

function CenterTabIcon({ focused }: { focused: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 10, stiffness: 200 });
  }, [focused]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: withTiming(focused ? -2 : 0, { duration: 200 }) }],
  }));
  return (
    <View style={styles.centerOuter}>
      <Animated.View style={[
        styles.centerBtn,
        {
          backgroundColor: '#7C6FF7',
          shadowColor: '#7C6FF7',
          shadowOpacity: focused ? 0.55 : 0.28,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 16,
          elevation: 14,
        },
        anim,
      ]}>
        <Ionicons name="timer" size={26} color="#fff" />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const t = useT();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const floatBottom = (bottomInset > 0 ? bottomInset : Platform.OS === 'ios' ? 20 : 16) + 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        animation: 'shift',
        tabBarStyle: {
          position: 'absolute',
          bottom: floatBottom,
          left: 28,
          right: 28,
          height: 64,
          borderRadius: 999,
          backgroundColor: colors.tabBg,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#5040B0',
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 24,
          paddingBottom: 0,
          paddingTop: 0,
          overflow: 'hidden',
          alignItems: 'center',
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          height: 64,
          paddingVertical: 0,
        },
        tabBarBackground: () => (
          <View style={{
            flex: 1,
            borderRadius: 999,
            backgroundColor: colors.tabBg,
            shadowColor: '#5040B0',
            shadowOpacity: 0.14,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 20,
            elevation: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }} />
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabHome,
        tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} tabName="index" />,
      }} />
      <Tabs.Screen name="subjects" options={{ title: t.tabSubjects,
        tabBarIcon: ({ focused }) => <TabIcon name="book" focused={focused} tabName="subjects" />,
      }} />
      <Tabs.Screen name="timer" options={{ title: '',
        tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
      }} />
      <Tabs.Screen name="plan" options={{ title: t.tabPlans,
        tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} tabName="plan" />,
      }} />
      <Tabs.Screen name="app-block" options={{ title: t.tabBlock,
        tabBarIcon: ({ focused }) => <TabIcon name="shield" focused={focused} tabName="app-block" />,
      }} />

      <Tabs.Screen name="profile"          options={{ href: null }} />
      <Tabs.Screen name="calendar"         options={{ href: null }} />
      <Tabs.Screen name="analytics"        options={{ href: null }} />
      <Tabs.Screen name="settings"         options={{ href: null }} />
      <Tabs.Screen name="more-placeholder" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconOuter: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 999,
  },
  centerOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
