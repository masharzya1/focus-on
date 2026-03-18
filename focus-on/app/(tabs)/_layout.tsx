import { Tabs } from 'expo-router';
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

const TAB_ICONS: Record<string, { active: any; inactive: any }> = {
  index:      { active: 'home',     inactive: 'home-outline'     },
  subjects:   { active: 'book',     inactive: 'book-outline'     },
  timer:      { active: 'timer',    inactive: 'timer-outline'    },
  plan:       { active: 'calendar', inactive: 'calendar-outline' },
  'app-block':{ active: 'shield',   inactive: 'shield-outline'   },
};

function TabIcon({ name, focused, tabName }: {
  name: string; focused: boolean; tabName: string;
}) {
  const { colors } = useTheme();
  const cfg   = TAB_ICONS[tabName] ?? { active: name, inactive: name };
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 14, stiffness: 240 });
  }, [focused]);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.iconOuter}>
      <Animated.View style={anim}>
        <Ionicons
          name={focused ? cfg.active : cfg.inactive}
          size={22}
          color={focused ? colors.accent : colors.textFaint}
        />
      </Animated.View>
      {focused && (
        <Animated.View
          style={[styles.dot, { backgroundColor: colors.accent }]}
          entering={undefined}
        />
      )}
    </View>
  );
}

function CenterTabIcon({ focused }: { focused: boolean }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 12, stiffness: 220 });
  }, [focused]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: withTiming(focused ? 0.4 : 0.2, { duration: 180 }),
  }));
  return (
    <View style={styles.centerOuter}>
      <Animated.View style={[
        styles.centerBtn,
        { backgroundColor: colors.accent, shadowColor: colors.accent },
        anim,
      ]}>
        <Ionicons name="timer" size={24} color="#fff" />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const t = useT();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const floatBottom = (bottomInset > 0 ? bottomInset : Platform.OS === 'ios' ? 20 : 14) + 6;

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0, top: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        animation: 'shift',
        tabBarStyle: {
          position: 'absolute',
          bottom: floatBottom,
          left: 24,
          right: 24,
          height: 62,
          borderRadius: 999,
          backgroundColor: colors.tabBg,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.tabBorder,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 16,
          paddingBottom: 0,
          paddingTop: 0,
          overflow: 'visible',
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          height: 62,
          paddingBottom: 0,
          paddingTop: 0,
          margin: 0,
        },
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  centerOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 12,
  },
});
