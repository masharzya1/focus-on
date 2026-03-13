import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, interpolateColor, useDerivedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';

// ── Animated tab icon with pill background ───────────────────────────────────
function TabIcon({
  name, focused, color,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean; color: string;
}) {
  const scale = useSharedValue(1);
  const width = useSharedValue(36);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 12, stiffness: 300 });
    // Pill expands when focused
    width.value = withSpring(focused ? 52 : 36, { damping: 14, stiffness: 280 });
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: focused ? color + '22' : 'transparent',
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.pill, pillStyle]}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

// ── Center Focus button ───────────────────────────────────────────────────────
function CenterBtn({ focused, color }: { focused: boolean; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 10, stiffness: 300 });
  }, [focused]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.centerBtn, { backgroundColor: focused ? color : color + 'CC' }, anim]}>
      <Ionicons name="timer" size={26} color="#fff" />
      <Text style={styles.centerLabel}>Focus</Text>
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
          tabBarLabelStyle: styles.label,
          animation: 'shift',
          tabBarStyle: {
            backgroundColor: colors.tabBg,
            borderTopWidth: 1,
            borderTopColor: colors.tabBorder,
            height: 62 + (Platform.OS === 'ios' ? 22 : 0),
            paddingBottom: Platform.OS === 'ios' ? 22 : 8,
            paddingTop: 4,
            elevation: 0,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
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

        {/* Hidden tabs */}
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
                <View style={styles.pill}>
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
  pill: {
    height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 36, overflow: 'hidden',
  },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
  // Center Focus button — taller so text fits
  centerBtn: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
    gap: 1,
  },
  centerLabel: {
    color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3,
  },
  moreBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  overlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end', paddingBottom: 90, paddingHorizontal: 16 },
  menu: { borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden', paddingTop: 4 },
  menuTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, paddingHorizontal: 20, paddingVertical: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  menuIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
