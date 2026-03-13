import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

function AnimatedTabIcon({
  name, focused, color, size = 22,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean; color: string; size?: number;
}) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.18 : 1, { damping: 10, stiffness: 280 });
    bgOpacity.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  return (
    <Animated.View style={[styles.iconWrap, animStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.iconBg, bgStyle, { backgroundColor: color + '20' }]} />
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

function CenterFocusButton({ focused, color }: { focused: boolean; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 10, stiffness: 300 });
  }, [focused]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.centerBtn, { backgroundColor: color, borderBottomColor: '#4B42D6' }, animStyle]}>
      <Ionicons name={focused ? 'timer' : 'timer-outline'} size={26} color="#fff" />
    </Animated.View>
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
  const [showMore, setShowMore] = React.useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          animation: 'shift',
          tabBarStyle: {
            backgroundColor: colors.tabBg,
            borderTopWidth: 1,
            borderTopColor: colors.tabBorder,
            height: 62 + (Platform.OS === 'ios' ? 22 : 0),
            paddingBottom: Platform.OS === 'ios' ? 22 : 8,
            paddingTop: 4,
            elevation: 0,
            shadowColor: '#6C63FF',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="subjects"
          options={{
            title: 'Subjects',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name={focused ? 'book' : 'book-outline'} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="timer"
          options={{
            title: 'Focus',
            tabBarIcon: ({ focused, color }) => (
              <CenterFocusButton focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Plans',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name={focused ? 'clipboard' : 'clipboard-outline'} focused={focused} color={color} />
            ),
          }}
        />

        {/* Hidden tabs */}
        <Tabs.Screen name="calendar"  options={{ href: null }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="app-block" options={{ href: null }} />
        <Tabs.Screen name="settings"  options={{ href: null }} />

        {/* More — tabBarButton only, NO href */}
        <Tabs.Screen
          name="more-placeholder"
          options={{
            title: 'More',
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.moreTabBtn}
                onPress={() => setShowMore(true)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name="ellipsis-horizontal-circle-outline"
                    size={22}
                    color={colors.textFaint}
                  />
                </View>
                <Text style={[styles.tabLabel, { color: colors.textFaint }]}>More</Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>

      {/* More Popup */}
      <Modal
        visible={showMore}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMore(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowMore(false)}>
          <Pressable
            style={[styles.moreMenu, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <Text style={[styles.moreTitle, { color: colors.textMuted }]}>MORE OPTIONS</Text>
            {MORE_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[styles.moreItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowMore(false);
                  router.push(`/(tabs)/${item.name}` as any);
                }}
              >
                <View style={[styles.moreIconBox, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name={item.icon} size={20} color={colors.accent} />
                </View>
                <Text style={[styles.moreLabel, { color: colors.text }]}>{item.label}</Text>
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
  iconWrap: {
    width: 44, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md, overflow: 'hidden',
  },
  iconBg: { borderRadius: RADIUS.md },
  centerBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderBottomWidth: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
  tabLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 0.1,
  },
  moreTabBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  overlay: {
    flex: 1, backgroundColor: '#00000055',
    justifyContent: 'flex-end',
    paddingBottom: 90, paddingHorizontal: 16,
  },
  moreMenu: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    overflow: 'hidden', paddingTop: 4,
  },
  moreTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  moreItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  moreIconBox: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  moreLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
