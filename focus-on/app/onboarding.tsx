import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ScrollView, Platform, Image,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FONTS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SLIDE_DATA = [
  { id: 'welcome',  src: require('@/assets/images/illus-student-desk.png'),  bg: '#EAE8FF' },
  { id: 'home',     src: require('@/assets/images/illus-hero-reading.png'),  bg: '#E4FAF3' },
  { id: 'subjects', src: require('@/assets/images/illus-cat-books.png'),     bg: '#FFF0E6' },
  { id: 'timer',    src: require('@/assets/images/illus-clock.png'),         bg: '#FFE8EE' },
  { id: 'plan',     src: require('@/assets/images/illus-planner.png'),       bg: '#FFF8E0' },
  { id: 'block',    src: require('@/assets/images/illus-shield.png'),        bg: '#E4F4FF' },
];

function AnimatedIllustration({ src, bg }: { src: any; bg: string }) {
  const translateY = useSharedValue(0);
  const scale      = useSharedValue(0.85);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 90 });
    translateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,   { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.illustrationWrap, { backgroundColor: bg }, anim]}>
      <Image source={src} style={styles.illustrationImg} resizeMode="contain" />
    </Animated.View>
  );
}

function LangPickerSlide({ colors: c, onPick }: {
  colors: any;
  onPick: (lang: 'en' | 'bn') => void;
}) {
  const [selected, setSelected] = useState<'en' | 'bn' | null>(null);

  const pick = (lang: 'en' | 'bn') => {
    setSelected(lang);
    setTimeout(() => onPick(lang), 260);
  };

  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.illustrationWrap, { backgroundColor: '#EAE8FF', marginBottom: 40 }]}>
        <Ionicons name="globe-outline" size={72} color="#7C6FF7" />
      </View>

      <Text style={[styles.title, { color: c.text }]}>Choose Your Language</Text>
      <Text style={[styles.titleBn, { color: c.textMuted }]}>ভাষা বেছে নিন</Text>

      <View style={styles.langRow}>
        <TouchableOpacity
          style={[
            styles.langCard,
            { backgroundColor: c.bgCard, borderColor: selected === 'en' ? '#7C6FF7' : c.border },
            selected === 'en' && styles.langCardActive,
          ]}
          onPress={() => pick('en')}
          activeOpacity={0.8}
        >
          <View style={[styles.langIconCircle, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.langFlagText}>EN</Text>
          </View>
          <Text style={[styles.langName, { color: c.text }]}>English</Text>
          <Text style={[styles.langSub, { color: c.textMuted }]}>English</Text>
          {selected === 'en' && (
            <View style={styles.langCheck}>
              <Ionicons name="checkmark-circle" size={22} color="#7C6FF7" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.langCard,
            { backgroundColor: c.bgCard, borderColor: selected === 'bn' ? '#7C6FF7' : c.border },
            selected === 'bn' && styles.langCardActive,
          ]}
          onPress={() => pick('bn')}
          activeOpacity={0.8}
        >
          <View style={[styles.langIconCircle, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.langFlagText, { color: '#059669' }]}>বাং</Text>
          </View>
          <Text style={[styles.langName, { color: c.text }]}>বাংলা</Text>
          <Text style={[styles.langSub, { color: c.textMuted }]}>Bengali</Text>
          {selected === 'bn' && (
            <View style={styles.langCheck}>
              <Ionicons name="checkmark-circle" size={22} color="#7C6FF7" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.langHint, { color: c.textFaint }]}>
        {'You can change this anytime in Settings\nসেটিংস থেকে পরে পরিবর্তন করা যাবে'}
      </Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const { completeOnboarding } = useStudy();
  const { colors } = useTheme();
  const { setLanguage, t } = useLanguage();
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const TOTAL = 1 + SLIDE_DATA.length;
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (index: number) => {
    setCurrent(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleLangPick = async (lang: 'en' | 'bn') => {
    await setLanguage(lang);
    goTo(1);
  };

  const finish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const isLangSlide = current === 0;
  const isLast = current === TOTAL - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <LangPickerSlide colors={colors} onPick={handleLangPick} />

        {SLIDE_DATA.map((slide, i) => {
          const content = t.onboarding[i];
          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              <AnimatedIllustration src={slide.src} bg={slide.bg} />
              <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>
              <Text style={[styles.desc, { color: colors.textMuted }]}>{content.desc}</Text>
            </View>
          );
        })}
      </ScrollView>

      {!isLangSlide && (
        <View style={styles.dotsRow}>
          {SLIDE_DATA.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i + 1)}>
              <View style={[styles.dot,
                { backgroundColor: i + 1 === current ? colors.accent : colors.border,
                  width: i + 1 === current ? 20 : 8 }]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isLangSlide && (
        <View style={[styles.bottom, { paddingBottom: Platform.OS === 'ios' ? 48 : 32 }]}>
          {!isLast && (
            <TouchableOpacity onPress={finish} style={styles.skipBtn}>
              <Text style={[styles.skipTxt, { color: colors.textMuted }]}>{t.onboardingSkip}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.accent, flex: isLast ? 1 : undefined }]}
            onPress={isLast ? finish : () => goTo(current + 1)}>
            <Text style={styles.nextTxt}>{isLast ? t.onboardingFinish : t.onboardingNext}</Text>
            {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 80,
  },
  illustrationWrap: {
    width: 180, height: 180, borderRadius: 52,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
  },
  illustrationImg: { width: 150, height: 150 },
  title: {
    fontSize: 28, fontFamily: FONTS.bold,
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 16,
  },
  titleBn: {
    fontSize: 22, fontFamily: FONTS.bold,
    textAlign: 'center', marginTop: -8, marginBottom: 36,
  },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 26, fontFamily: FONTS.regular },
  langRow: { flexDirection: 'row', gap: 16, marginBottom: 28, width: '100%' },
  langCard: {
    flex: 1, alignItems: 'center', padding: 24, borderRadius: 20,
    borderWidth: 2, gap: 6, position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  langCardActive: {
    shadowColor: '#7C6FF7', shadowOpacity: 0.18, shadowRadius: 12, elevation: 6,
  },
  langIconCircle: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  langFlagText: { fontSize: 22, fontFamily: FONTS.bold, color: '#1E40AF' },
  langName: { fontSize: 20, fontFamily: FONTS.bold, letterSpacing: -0.3 },
  langSub: { fontSize: 13, fontFamily: FONTS.medium },
  langCheck: { position: 'absolute', top: 10, right: 10 },
  langHint: { fontSize: 12, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, paddingBottom: 20,
  },
  dot: { height: 8, borderRadius: 4 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  skipTxt: { fontSize: 16, fontFamily: FONTS.semibold },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 56, borderRadius: 16,
  },
  nextTxt: { color: '#fff', fontSize: 17, fontFamily: FONTS.bold },
});
