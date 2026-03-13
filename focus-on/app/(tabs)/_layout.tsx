import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Platform, Animated } from 'react-native';
import Animated2, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

const TAB_NAMES = ['index', 'subjects', 'timer', 'plan', 'more-placeholder'];

// Sliding indicator that moves between tabs
function SlideIndicator({ activeIndex, color }: { activeIndex: number; color: string }) {
  const x = useSharedValue(0);
  const TAB_WIDTH = 72; // approximate

  useEffect(() => {
    x.value = withSpring(activeIndex * TAB_WIDTH, { damping: 18, stiffness: 260 });
  }, [activeIndex]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <Animated2.View
      pointerEvents="none"
      style={[styles.indicator, style, { backgroundColor: color + '22', width: TAB_WIDTH }]}
    />
  );
}

function TabIcon({
  name, focused, color,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean; color: string;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 300 });
  }, [focused]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated2.View style={[styles.iconWrap, anim]}>
      <Ionicons name={name} size={22} color={color} />
    </Animated2.View>
  );
}

function CenterBtn({ focused, color }: { focused: boolean; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 10, stiffness: 300 });
  }, [focused]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Deep solid color, darker bottom border for 3D effect
  return (
    <Animated2.View style={[
      styles.centerBtn,
      {
        backgroundColor: focused ? color : color,
        borderBottomColor: focused ? '#3730A3' : '#4B42D6',
        shadowColor: color,
        shadowOpacity: focused ? 0.55 : 0.3,
      },
      anim,
    ]}>
      <Ionicons name="timer" size={24} color="#fff" />
      <Text style={styles.centerLabel}>Focus</Text>
    </Animated2.View>
  );
}

const MORE_ITEMS = [
  { name: 'calendar',  icon: 'calendar-outline' as const,  label: 'Calendar'  },
  { name: 'analytics', icon: 'bar-chart-outline' as const, label: 'Analytics' },
  { name: 'app-block', icon: 'shield-outline' as const,    label: 'App Block' },
  { name: 'settings',  icon: 'settings-outline' as const,  label: 'Settings'  },
];

export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showMore, setShowMore] = React.useState(false);

  // Which tab index is active — for the sliding bg
  const activeIndex = React.useMemo(() => {
    if (pathname === '/' || pathname.includes('index')) return 0;
    if (pathname.includes('subjects')) return 1;
    if (pathname.includes('timer')) return 2;
    if (pathname.includes('plan')) return 3;
    return 4;
  }, [pathname]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.label,
          animation: 'shift',
          tabBarBackground: () => (
            <View style={[styles.tabBg, { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder }]}>
              <SlideIndicator activeIndex={activeIndex} color={colors.accent} />
            </View>
          ),
          tabBarStyle: {
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
        <Tabs.Screen name="calendar"  options={{ href: null }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="app-block" options={{ href: null }} />
        <Tabs.Screen name="settings"  options={{ href: null }} />

        <Tabs.Screen
          name="more-placeholder"
          options={{
            title: 'More',
            tabBarButton: () => (
              <TouchableOpacity style={styles.moreBtn} onPress={() => setShowMore(true)} activeOpacity={0.7}>
                <View style={styles.iconWrap}>
                  <Ionicons name="ellipsis-horizontal-circle-outline" size={22} color={colors.textFaint} />
                </View>
                <Text style={[styles.label, { color: colors.textFaint }]}>More</Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>

      <Modal visible={showMore} transparent animationType="fade" onRequestClose={() => setShowMore(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMore(false)}>
          <Pressable style={[styles.menu, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.menuTitle, { color: colors.textMuted }]}>MORE OPTIONS</Text>
            {MORE_ITEMS.map(item => (
              <TouchableOpacity key={item.name}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => { setShowMore(false); router.push(`/(tabs)/${item.name}` as any); }}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name={item.icon} size={20} color={colors.accent} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabBg: {
    flex: 1,
    borderTopWidth: 1,
  },
  indicator: {
    position: 'absolute',
    top: 4, bottom: 4,
    borderRadius: RADIUS.lg,
  },
  iconWrap: {
    height: 32, minWidth: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
  centerBtn: {
    width: 58, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderBottomWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, elevation: 10,
    gap: 1,
  },
  centerLabel: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  moreBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  overlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end', paddingBottom: 90, paddingHorizontal: 16 },
  menu: { borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden', paddingTop: 4 },
  menuTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, paddingHorizontal: 20, paddingVertical: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  menuIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
