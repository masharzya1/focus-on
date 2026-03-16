import type { Locale } from './en';

// ── Bengali Locale ────────────────────────────────────────────────────────────

const bn: Locale = {
  // ── Language picker ────────────────────────────────────────────────────────
  langPickerTitle: 'ভাষা বেছে নিন',
  langPickerSub: 'সেটিংস থেকে যেকোনো সময় পরিবর্তন করা যাবে',
  langEn: 'English',
  langBn: 'বাংলা',

  // ── Onboarding slides ─────────────────────────────────────────────────────
  onboarding: [
    {
      title: 'Focus On-এ স্বাগতম!',
      desc: 'পড়াশোনার সেরা সঙ্গী — সংগঠিত, মনোযোগী, আর আসলেই মজার।',
    },
    {
      title: 'হোম — তোমার ড্যাশবোর্ড',
      desc: 'স্ট্রিক, দৈনিক লক্ষ্য এবং আজকের প্ল্যান এক নজরে দেখো।',
    },
    {
      title: 'বিষয় — সংগঠিত থাকো',
      desc: 'অধ্যায় ও টপিক দিয়ে বিষয় তৈরি করো। প্রগ্রেস বার দিয়ে ট্র্যাক করো।',
    },
    {
      title: 'টাইমার — শুধু পড়ো',
      desc: 'বিক্ষেপমুক্ত পোমোডোরো টাইমার। একটা সার্কেল। একটা বাটন। ব্যস।',
    },
    {
      title: 'প্ল্যান — স্মার্ট শিডিউল',
      desc: 'পরীক্ষার তারিখ দাও, টপিক বেছে নাও, আর নোটিফিকেশনসহ অটো শিডিউল পাও।',
    },
    {
      title: 'অ্যাপ ব্লক — মনোযোগ ধরে রাখো',
      desc: 'পড়ার সময় বিক্ষেপকারী অ্যাপ ব্লক করো। সফট বা হার্ড ব্লক — আনইনস্টল-প্রুফও।',
    },
  ],
  onboardingSkip: 'এড়িয়ে যাও',
  onboardingNext: 'পরের',
  onboardingFinish: 'শুরু করি!',

  // ── Tab labels ─────────────────────────────────────────────────────────────
  tabHome: 'হোম',
  tabSubjects: 'বিষয়',
  tabPlans: 'প্ল্যান',
  tabBlock: 'ব্লক',
  tabFocus: 'ফোকাস',

  // ── Greetings ──────────────────────────────────────────────────────────────
  greetMorning: 'শুভ সকাল',
  greetAfternoon: 'শুভ দুপুর',
  greetEvening: 'শুভ সন্ধ্যা',

  // ── Home screen ────────────────────────────────────────────────────────────
  homeAppName: 'Focus On',
  homeTodayGoal: 'আজকের লক্ষ্য',
  homeGoalComplete: 'লক্ষ্য পূরণ হয়েছে!',
  homeStartFocus: 'পড়া শুরু করো',
  homeStudy: 'পড়ো',
  homeRoutineBannerTitle: 'আজকের রুটিন সেট করো',
  homeRoutineBannerSub: (n: number) => `${n}টা কাজ বাকি · ট্যাপ করো`,
  homeTodayPlan: 'আজকের প্ল্যান',
  homeSetTimes: 'সময় ঠিক করো',
  homeNoPlan: 'আজকের কোনো প্ল্যান নেই',
  homeCreatePlan: 'প্ল্যান তৈরি করো',
  homeStudyTime: 'পড়ার সময়!',
  homeUpNext: 'এরপর',
  // Morning routine modal
  homeRoutineModalTitle: 'আজকের রুটিন সেট করো',
  homeRoutineModalSub: 'প্রতিটা বিষয়ের শুরু ও শেষ সময় দাও',
  homeRoutineColTopic: 'বিষয়',
  homeRoutineNoSchedule: 'শিডিউল ছাড়াই পড়বো',
  homeRoutineSetBtn: 'রুটিন সেট করো ও নোটিফিকেশন পাও',

  // ── Settings screen ────────────────────────────────────────────────────────
  settingsTitle: 'সেটিংস',
  settingsTimer: 'টাইমার',
  settingsFocusDuration: 'মনোযোগের সময়',
  settingsShortBreak: 'ছোট বিরতি',
  settingsDailyGoal: 'দৈনিক লক্ষ্য',
  settingsAppearance: 'দেখতে',
  settingsDarkMode: 'ডার্ক মোড',
  settingsSoundNotif: 'শব্দ ও নোটিফিকেশন',
  settingsTimerSounds: 'টাইমারের শব্দ',
  settingsFocus: 'মনোযোগ',
  settingsFocusGuard: 'ফোকাস গার্ড',
  settingsBlockedApps: 'ব্লক করা অ্যাপ',
  settingsAbout: 'সম্পর্কে',
  settingsVersion: 'ভার্সন',
  settingsLanguage: 'ভাষা',
  settingsLangCurrent: 'বাংলা',
  settingsPermDenied: 'অনুমতি নেই',
  settingsEnableNotif: 'ডিভাইস সেটিংসে নোটিফিকেশন চালু করো।',
  settingsNotifSent: '✅ পাঠানো হয়েছে!',
  settingsNotifArrives: '৩ সেকেন্ডের মধ্যে নোটিফিকেশন আসবে।',
  settingsError: 'সমস্যা হয়েছে',
  settingsTestNotif: '🧪 টেস্ট নোটিফিকেশন (রিলিজের আগে সরাও)',
  settingsSendTest: 'টেস্ট নোটিফিকেশন পাঠাও (৩ সেকেন্ড)',

  // ── Plans screen ───────────────────────────────────────────────────────────
  plansTitle: 'প্ল্যান',
  plansDaysLeft: (n: number) => `আর ${n} দিন`,
  plansExamDay: 'পরীক্ষার দিন!',
  plansTodayTasks: (done: number, total: number) => `আজকে: ${done}/${total} টাস্ক`,
  plansTopics: (n: number) => `${n}টা বিষয়`,
  plansBlockActive: 'ব্লক চালু',
  plansDeleteTitle: 'প্ল্যান মুছবো?',
  plansDeleteMsg: (name: string) => `"${name}" চিরতরে মুছে যাবে।`,
  plansCancel: 'বাতিল',
  plansDelete: 'মুছে ফেলো',
  plansEmpty: 'এখনো কোনো প্ল্যান নেই',
  plansEmptySub: 'প্রথম পড়ার প্ল্যান তৈরি করো',
  plansCreate: 'প্ল্যান তৈরি করো',

  // ── Plan details screen ────────────────────────────────────────────────────
  planDetailCompleteTask: 'টাস্ক সম্পন্ন করো',
  planDetailCancelTask: 'বাতিল',

  // ── Plan create screen ─────────────────────────────────────────────────────
  planCreateSteps: ['সেটআপ', 'বিষয়', 'ব্লকিং'],
  planCreateDayNames: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'],
  planCreateMonths: ['জান','ফেব','মার','এপ্র','মে','জুন','জুল','আগ','সেপ','অক্ট','নভ','ডিস'],
  planCreateDaysFromToday: (n: number) => `আজ থেকে ${n} দিন পরে`,
  planCreateWeightLabels: {
    1: { label: 'হালকা',       desc: 'দ্রুত পড়া যায়' },
    2: { label: 'মাঝারি',      desc: 'স্বাভাবিক'       },
    3: { label: 'ভারী',        desc: 'মনোযোগ দরকার'    },
    4: { label: 'খুব ভারী',    desc: 'কঠিন বিষয়'       },
  },
  planCreateCapacityLabels: {
    3:  { label: 'সহজ দিন',     desc: 'কম কাজ'        },
    5:  { label: 'স্বাভাবিক',   desc: 'ব্যালান্সড'     },
    8:  { label: 'ফোকাস দিন',   desc: 'নিজেকে ঠেলো'   },
    12: { label: 'গ্রাইন্ড দিন', desc: 'সর্বোচ্চ চেষ্টা' },
  },

  // ── Subjects screen ────────────────────────────────────────────────────────
  subjectsTitle: 'বিষয়সমূহ',
  subjectsDeleteTitle: 'বিষয় মুছবো?',
  subjectsDeleteMsg: (name: string) =>
    `"${name}" এর সব অধ্যায়, টপিক ও টুডু চিরতরে মুছে যাবে।`,
  subjectsCancel: 'বাতিল',
  subjectsDelete: 'মুছে ফেলো',
  subjectsChapter: (n: number) => `${n}টা অধ্যায়`,
  subjectsTopics: (done: number, total: number) => `${done}/${total} টপিক`,
  subjectsChaptersProgress: (done: number, total: number) =>
    `${done}/${total} অধ্যায়`,

  // ── Subject detail ─────────────────────────────────────────────────────────
  subjectDetailChapter: 'অধ্যায়',

  // ── Timer screen ──────────────────────────────────────────────────────────
  timerFocus: 'মনোযোগ',
  timerBreak: 'বিরতি',
  timerTapToEdit: 'পরিবর্তন করো',
  timerSelect: 'বেছে নাও',
  timerNoContext: 'কোনো টপিক নেই — ফ্রি ফোকাস সেশন',
  timerSetDuration: 'সময় ঠিক করো',
  timerApply: 'ঠিক আছে',
  timerFocusLabel: 'মনোযোগ',
  timerBreakLabel: 'বিরতি',
  timerComplete: 'সেশন শেষ!',
  timerTakeBreak: 'বিরতি নাও',
  timerDismiss: 'বন্ধ করো',
  timerTopics: (done: number, total: number) => `${done}/${total} টপিক শেষ`,

  // ── Analytics screen ───────────────────────────────────────────────────────
  analyticsTitle: 'বিশ্লেষণ',
  analyticsThisWeek: 'এই সপ্তাহ',
  analyticsTotalTime: 'মোট সময়',
  analyticsSessions: 'সেশন',
  analyticsAvgDay: 'গড়/দিন',
  analyticsStreak: 'স্ট্রিক',
  analyticsTopApps: 'বেশি ব্যবহৃত অ্যাপ',
  analyticsNoUsage: 'ডেটা নেই',
  analyticsDayLabels: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'],
  analyticsHours: (h: number, m: number) => h > 0 ? `${h}ঘ ${m}মি` : `${m}মি`,

  // ── Profile screen ─────────────────────────────────────────────────────────
  profileTitle: 'প্রোফাইল',
  profileLevel: (n: number) => `লেভেল ${n}`,
  profileSignIn: 'ডেটা সিঙ্ক করতে সাইন ইন করো',
  profileSignOut: 'সাইন আউট',
  profileSignOutConfirm: 'সাইন আউট করবেন?',
  profileCancel: 'বাতিল',
  profileStudent: 'শিক্ষার্থী',

  // ── App Block screen ───────────────────────────────────────────────────────
  appBlockTitle: 'অ্যাপ ব্লক',
  appBlockSearchPlaceholder: 'অ্যাপ খুঁজো...',
  appBlockRoutinePlaceholder: 'যেমন: সকালের পড়া',

  // ── Notifications ──────────────────────────────────────────────────────────
  notifFocusDoneTitle: '🎯 মনোযোগ সেশন শেষ!',
  notifFocusDoneBody: 'দারুণ! এখন একটু বিরতি নাও।',
  notifBreakDoneTitle: '☕ বিরতি শেষ!',
  notifBreakDoneBody: 'আবার পড়ার সময়! চলো শুরু করি।',
  notifDailyTitle: '📚 পড়ার সময়!',
  notifDailyBody: 'ধারাবাহিকতা ধরে রাখো। Focus On খোলো।',
  notifStreakTitle: '🔥 স্ট্রিক ভাঙবে না!',
  notifStreakBody: 'আজকে এখনও পড়োনি। স্ট্রিক বাঁচাতে Focus On খোলো।',
  notifExamTitle: (name: string, days: number) =>
    `📅 ${name} আর ${days} দিন পরে!`,
  notifExamBody: 'পড়ার পরিকল্পনা দেখো এবং ঠিকঠাক এগিয়ে যাও।',
  notifTaskTitle: (topic: string) => `📖 পড়ার সময়: ${topic}`,
  notifTaskBody: (subject: string) => `${subject} · Focus On খোলো!`,
  notifRoutineTitle: '📚 আর ১ ঘন্টা!',
  notifRoutineBody: (count: number, topic: string, time: string) =>
    `${count}টা task আজকে আছে। ${topic} শুরু ${time} এ।`,
  notifNewDayTitle: '🌙 নতুন দিন শুরু!',
  notifNewDayBody: (count: number) =>
    `আজকে ${count}টা task আছে। Home এ গিয়ে routine set করো।`,
  notifPlanReminderTitle: '📅 পড়ার প্ল্যান মনে করিয়ে দিচ্ছি',
  notifPlanReminderBody: 'আজকের প্ল্যান দেখতে ভুলো না!',
};

export default bn;
