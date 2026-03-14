<<<<<<< HEAD
import { Tabs, usePathname } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
=======
import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

const NUM_TABS = 5;

<<<<<<< HEAD
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
=======
// ── Sliding pill background ───────────────────────────────────────────────────
function SlideIndicator({ activeIndex, color, tabWidth }: {
  activeIndex: number; color: string; tabWidth: number;
}) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(activeIndex * tabWidth, { duration: 220 });
  }, [activeIndex, tabWidth]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.indicator, style, { backgroundColor: color + '22', width: tabWidth }]}
    />
  );
}

// ── Regular tab icon ──────────────────────────────────────────────────────────
function TabIcon({ name, focused, color }: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean; color: string;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withTiming(focused ? 1.12 : 1, { duration: 180 });
  }, [focused]);
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.iconWrap, anim]}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

<<<<<<< HEAD
function CenterBtn({ focused, color }: { focused: boolean; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => { scale.value = withTiming(focused ? 1.08 : 1, { duration: 180 }); }, [focused]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.centerBtn, {
      backgroundColor: color, borderBottomColor: '#4B42D6',
      shadowColor: color, shadowOpacity: focused ? 0.55 : 0.28,
=======
// ── Center Focus button ───────────────────────────────────────────────────────
function CenterBtn({ focused, color }: { focused: boolean; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withTiming(focused ? 1.08 : 1, { duration: 180 });
  }, [focused]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.centerBtn, {
      backgroundColor: focused ? color : "#8a83f0",
      borderBottomColor: '#3730A3',
      shadowColor: color,
      shadowOpacity: focused ? 0.55 : 0.28,
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
    }, anim]}>
      <Ionicons name="timer" size={24} color="#fff" />
      <Text style={styles.centerLabel}>Focus</Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
<<<<<<< HEAD
=======
  const router = useRouter();
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
  const pathname = usePathname();
  const [tabWidth, setTabWidth] = useState(Dimensions.get('window').width / NUM_TABS);

  const activeIndex = React.useMemo(() => {
    if (pathname.includes('subjects')) return 1;
    if (pathname.includes('timer'))    return 2;
    if (pathname.includes('plan'))     return 3;
    if (pathname.includes('app-block'))return 4;
<<<<<<< HEAD
    return 0;
  }, [pathname]);

  const onLayout = useCallback((e: any) => {
=======
    return 0; // index / home
  }, [pathname]);

  const onTabBarLayout = useCallback((e: any) => {
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
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
<<<<<<< HEAD
          <View style={[styles.tabBg, { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder }]} onLayout={onLayout}>
=======
          <View
            style={[styles.tabBg, { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder }]}
            onLayout={onTabBarLayout}
          >
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
            <SlideIndicator activeIndex={activeIndex} color={colors.accent} tabWidth={tabWidth} />
          </View>
        ),
        tabBarStyle: {
<<<<<<< HEAD
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
=======
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 62 + (Platform.OS === 'ios' ? 22 : 0),
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 4,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="timer"
        options={{
          title: '',
          tabBarIcon: ({ focused, color }) => <CenterBtn focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen name="plan"
        options={{
          title: 'Plans',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'clipboard' : 'clipboard-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="app-block"
        options={{
          title: 'Block',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} color={color} />
          ),
        }}
      />

      {/* Hidden — accessible from profile screen */}
      <Tabs.Screen name="profile"           options={{ href: null }} />
      <Tabs.Screen name="calendar"          options={{ href: null }} />
      <Tabs.Screen name="analytics"         options={{ href: null }} />
      <Tabs.Screen name="settings"          options={{ href: null }} />
      <Tabs.Screen name="more-placeholder"  options={{ href: null }} />
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
    </Tabs>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  tabBg: { flex: 1, borderTopWidth: 1 },
  indicator: { position: 'absolute', top: 4, bottom: 4, borderRadius: RADIUS.lg },
  iconWrap: { height: 32, minWidth: 36, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
=======
  tabBg:     { flex: 1, borderTopWidth: 1 },
  indicator: { position: 'absolute', top: 4, bottom: 4, borderRadius: RADIUS.lg },
  iconWrap:  { height: 32, minWidth: 36, alignItems: 'center', justifyContent: 'center' },
  label:     { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
  centerBtn: {
    width: 58, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderBottomWidth: 4,
<<<<<<< HEAD
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 10, gap: 1,
=======
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 10,
    gap: 1,
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
  },
  centerLabel: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
});
