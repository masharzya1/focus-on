import { Tabs, usePathname } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useT } from '@/contexts/LanguageContext';
import { FONTS } from '@/constants/theme';

const NUM_TABS = 5;

function TabIcon({ name, focused, color, label }: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean; color: string; label: string;
}) {
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 12, stiffness: 200 });
    bg.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const bgAnim = useAnimatedStyle(() => ({
    opacity: bg.value,
  }));
  return (
    <View style={styles.tabItem}>
      <View style={styles.iconWrapOuter}>
        <Animated.View style={[styles.iconBgPill, { backgroundColor: color + '18' }, bgAnim]} />
        <Animated.View style={[styles.iconWrap, anim]}>
          <Ionicons name={name} size={22} color={color} />
        </Animated.View>
      </View>
      <Text style={[styles.label, { color, fontFamily: focused ? FONTS.bold : FONTS.regular }]}>
        {label}
      </Text>
    </View>
  );
}

function CenterBtn({ focused, color, label = 'FOCUS' }: { focused: boolean; color: string; label?: string }) {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 12, stiffness: 200 });
    elevation.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: withTiming(elevation.value ? -2 : 0, { duration: 200 }) }],
  }));
  return (
    <View style={styles.centerOuter}>
      <Animated.View style={[styles.centerBtn, {
        backgroundColor: color,
        shadowColor: color,
        shadowOpacity: focused ? 0.5 : 0.25,
      }, anim]}>
        <Ionicons name="timer" size={26} color="#fff" />
        <Text style={styles.centerLabel}>{label}</Text>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const t = useT();
  const pathname = usePathname();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const activeIndex = React.useMemo(() => {
    if (pathname.includes('subjects')) return 1;
    if (pathname.includes('timer'))    return 2;
    if (pathname.includes('plan'))     return 3;
    if (pathname.includes('app-block'))return 4;
    return 0;
  }, [pathname]);

  const tabBarH = 64 + (bottomInset > 0 ? bottomInset : Platform.OS === 'ios' ? 20 : 14);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarShowLabel: false,
        animation: 'shift',
        tabBarBackground: () => (
          <View style={[styles.tabBg, {
            backgroundColor: colors.tabBg,
            borderTopColor: colors.tabBorder,
          }]} />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: tabBarH,
          paddingBottom: bottomInset > 0 ? bottomInset : Platform.OS === 'ios' ? 20 : 14,
          paddingTop: 6,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabHome,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} label={t.tabHome} />
        ),
      }} />
      <Tabs.Screen name="subjects" options={{ title: t.tabSubjects,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} color={color} label={t.tabSubjects} />
        ),
      }} />
      <Tabs.Screen name="timer" options={{ title: '',
        tabBarIcon: ({ focused, color }) => (
          <CenterBtn focused={focused} color={color} label={t.tabFocus.toUpperCase()} />
        ),
      }} />
      <Tabs.Screen name="plan" options={{ title: t.tabPlans,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} label={t.tabPlans} />
        ),
      }} />
      <Tabs.Screen name="app-block" options={{ title: t.tabBlock,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} color={color} label={t.tabBlock} />
        ),
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
  tabBg: {
    flex: 1,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 16,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrapOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 32,
  },
  iconBgPill: {
    position: 'absolute',
    width: 48,
    height: 30,
    borderRadius: 15,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  centerOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  centerBtn: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 12,
  },
  centerLabel: {
    color: '#fff',
    fontSize: 8,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
  },
});
