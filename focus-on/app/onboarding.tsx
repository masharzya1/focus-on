import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ScrollView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 'welcome',
    icon: 'sparkles' as const,
    iconColor: '#6C63FF',
    bg: '#EDE9FF',
    title: 'Welcome to Focus On!',
    desc: 'Your smartest companion for studying — organized, focused, and actually fun.',
  },
  {
    id: 'home',
    icon: 'home' as const,
    iconColor: '#3B82F6',
    bg: '#DBEAFE',
    title: 'Home — Your Dashboard',
    desc: 'See your streak, daily goal progress, and today\'s plan at a glance.',
  },
  {
    id: 'subjects',
    icon: 'book' as const,
    iconColor: '#10B981',
    bg: '#D1FAE5',
    title: 'Subjects — Stay Organized',
    desc: 'Create subjects with chapters and topics. Track progress with a visual bar.',
  },
  {
    id: 'timer',
    icon: 'timer' as const,
    iconColor: '#6C63FF',
    bg: '#EDE9FF',
    title: 'Timer — Just Focus',
    desc: 'Distraction-free Pomodoro timer. One circle. One button. That\'s it.',
  },
  {
    id: 'plan',
    icon: 'calendar' as const,
    iconColor: '#F59E0B',
    bg: '#FEF3C7',
    title: 'Plans — Smart Schedule',
    desc: 'Set your exam date, pick topics, and get a full auto-generated study schedule with notifications.',
  },
  {
    id: 'block',
    icon: 'shield-checkmark' as const,
    iconColor: '#EF4444',
    bg: '#FEE2E2',
    title: 'App Block — Stay Focused',
    desc: 'Block distracting apps during study time. Choose soft or hard block — even uninstall-proof.',
  },
];

function AnimatedIcon({ icon, color, bg }: { icon: any; color: string; bg: string }) {
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.iconContainer, { backgroundColor: bg }, anim]}>
      <Ionicons name={icon} size={72} color={color} />
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const { completeOnboarding } = useStudy();
  const { colors } = useTheme();
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (index: number) => {
    setCurrent(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const finish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <AnimatedIcon icon={slide.icon} color={slide.iconColor} bg={slide.bg} />
            <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
            <Text style={[styles.desc, { color: colors.textMuted }]}>{slide.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[styles.dot,
              { backgroundColor: i === current ? colors.accent : colors.border,
                width: i === current ? 20 : 8 }]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom buttons */}
      <View style={[styles.bottom, { paddingBottom: Platform.OS === 'ios' ? 48 : 32 }]}>
        {!isLast && (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={[styles.skipTxt, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.accent, flex: isLast ? 1 : undefined }]}
          onPress={isLast ? finish : () => goTo(current + 1)}>
          <Text style={styles.nextTxt}>{isLast ? "Let's go!" : 'Next'}</Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  iconContainer: {
    width: 160, height: 160, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  title: { fontSize: 28, fontWeight: '800', fontFamily: 'Inter_800ExtraBold', textAlign: 'center', letterSpacing: -0.5, marginBottom: 16 },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  skipTxt: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 56, borderRadius: 16 },
  nextTxt: { color: '#fff', fontSize: 17, fontWeight: '800', fontFamily: 'Inter_800ExtraBold' },
});
