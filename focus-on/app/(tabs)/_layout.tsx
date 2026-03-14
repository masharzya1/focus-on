import { Tabs, usePathname } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

const NUM_TABS = 5;

function SlideIndicator({ activeIndex, color, tabWidth }: { activeIndex: number; color: string; tabWidth: number }) {
  const x = useSharedValue(0);
  useEffect(() => { x.value = withTiming(activeIndex * tabWidth, { duration: 220 }); }, [activeIndex, tabWidth]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View pointerEvents="none"
      style={[styles.indicator, style, { backgroundColor: color + '18', width: tabWidth }]} />
  );
}

function TabIcon({ name, focused, color }: { name: React.ComponentProps<typeof Ionicons>['name']; focused: boolean; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => { scale.value = withTiming(focused ? 1.12 : 1, { duration: 180 }); }, [focused]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.iconWrap, anim]}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

function CenterBtn({ focused, color }: { focused: boolean; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => { scale.value = withTiming(focused ? 1.08 : 1, { duration: 180 }); }, [focused]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.centerBtn, {
      backgroundColor: color, borderBottomColor: '#4B42D6',
      shadowColor: color, shadowOpacity: focused ? 0.55 : 0.28,
    }, anim]}>
      <Ionicons name="timer" size={24} color="#fff" />
      <Text style={styles.centerLabel}>Focus</Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const [tabWidth, setTabWidth] = useState(Dimensions.get('window').width / NUM_TABS);

  const activeIndex = React.useMemo(() => {
    if (pathname.includes('subjects')) return 1;
    if (pathname.includes('timer'))    return 2;
    if (pathname.includes('plan'))     return 3;
    if (pathname.includes('app-block'))return 4;
    return 0;
  }, [pathname]);

  const onLayout = useCallback((e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setTabWidth(w / NUM_TABS);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        animation: 'shift',
        tabBarBackground: () => (
          <View style={[styles.tabBg, { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder }]} onLayout={onLayout}>
            <SlideIndicator activeIndex={activeIndex} color={colors.accent} tabWidth={tabWidth} />
          </View>
        ),
        tabBarStyle: {
          backgroundColor: 'transparent', borderTopWidth: 0,
          height: 62 + (Platform.OS === 'ios' ? 22 : 0),
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 4, elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="subjects" options={{ title: 'Subjects',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="timer" options={{ title: '',
        tabBarIcon: ({ focused, color }) => <CenterBtn focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="plan" options={{ title: 'Plans',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="app-block" options={{ title: 'Block',
        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} color={color} />,
      }} />

      {/* Hidden screens */}
      <Tabs.Screen name="profile"   options={{ href: null }} />
      <Tabs.Screen name="calendar"  options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="settings"  options={{ href: null }} />
      <Tabs.Screen name="more-placeholder" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBg: { flex: 1, borderTopWidth: 1 },
  indicator: { position: 'absolute', top: 4, bottom: 4, borderRadius: RADIUS.lg },
  iconWrap: { height: 32, minWidth: 36, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
  centerBtn: {
    width: 58, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderBottomWidth: 4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 10, gap: 1,
  },
  centerLabel: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
});
