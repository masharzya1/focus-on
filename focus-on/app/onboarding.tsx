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
    title: 'Focus On এ স্বাগতম!',
    desc: 'পড়াশোনাকে সহজ, মজাদার আর effective করার জন্য তোমার সেরা সঙ্গী।',
  },
  {
    id: 'home',
    icon: 'home' as const,
    iconColor: '#3B82F6',
    bg: '#DBEAFE',
    title: 'Home — তোমার Dashboard',
    desc: 'প্রতিদিনের streak, goal progress আর আজকের tasks এক জায়গায় দেখো।',
  },
  {
    id: 'subjects',
    icon: 'book' as const,
    iconColor: '#10B981',
    bg: '#D1FAE5',
    title: 'Subjects — সব সাজিয়ে রাখো',
    desc: 'Subject বানাও, Chapter আর Topic যোগ করো। Progress bar দেখো কতটুকু শেষ।',
  },
  {
    id: 'timer',
    icon: 'timer' as const,
    iconColor: '#6C63FF',
    bg: '#EDE9FF',
    title: 'Timer — শুধু পড়ো',
    desc: 'Distraction-free Pomodoro timer। শুধু timer circle, mode আর start button।',
  },
  {
    id: 'plan',
    icon: 'calendar' as const,
    iconColor: '#F59E0B',
    bg: '#FEF3C7',
    title: 'Plans — AI Schedule',
    desc: 'Exam date দাও, topics বেছে দাও — AI তোমার পুরো study plan বানিয়ে দেবে। Notification পাবে সময়মতো।',
  },
  {
    id: 'block',
    icon: 'shield-checkmark' as const,
    iconColor: '#EF4444',
    bg: '#FEE2E2',
    title: 'App Block — Focus রাখো',
    desc: 'Study time এ distracting apps block করো। Hard block বা Device Admin দিয়ে নিজেকে আটকাও।',
  },
];

function AnimatedIcon({ icon, color, bg }: { icon: any; color: string; bg: string }) {
  const scale = useSharedValue(0.8);
  const rotate = useSharedValue(0);
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

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
    setCurrent(idx);
  };

  const next = () => {
    if (current < SLIDES.length - 1) goTo(current + 1);
    else finish();
  };

  const finish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const slide = SLIDES[current];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={finish}>
        <Text style={[styles.skipTxt, { color: colors.textMuted }]}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={s.id} style={styles.slide}>
            <AnimatedIcon icon={s.icon} color={s.iconColor} bg={s.bg} />
            <Text style={[styles.title, { color: colors.text }]}>{s.title}</Text>
            <Text style={[styles.desc, { color: colors.textMuted }]}>{s.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[
              styles.dot,
              { backgroundColor: i === current ? slide.iconColor : colors.border },
              i === current && styles.dotActive,
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: slide.iconColor }]}
        onPress={next}
        activeOpacity={0.85}
      >
        <Text style={styles.btnTxt}>
          {current === SLIDES.length - 1 ? 'শুরু করো 🚀' : 'পরবর্তী'}
        </Text>
        {current < SLIDES.length - 1 && (
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        )}
      </TouchableOpacity>

      <View style={{ height: Platform.OS === 'ios' ? 40 : 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8 },
  skipTxt: { fontSize: 14, fontWeight: '600' },
  slide: {
    width, flex: 1,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 60,
  },
  iconContainer: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 48,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 26, fontWeight: '400' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  btn: {
    marginHorizontal: 24, height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    shadowOpacity: 0.3, elevation: 6,
  },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
