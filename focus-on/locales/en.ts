// ── English Locale ────────────────────────────────────────────────────────────

const en = {
  // ── Language picker (onboarding slide 0) ───────────────────────────────────
  langPickerTitle: 'Choose Your Language',
  langPickerSub: 'You can change this anytime in Settings',
  langEn: 'English',
  langBn: 'বাংলা',

  // ── Onboarding slides ─────────────────────────────────────────────────────
  onboarding: [
    {
      title: 'Welcome to Focus On!',
      desc: 'Your smartest companion for studying — organized, focused, and actually fun.',
    },
    {
      title: 'Home — Your Dashboard',
      desc: "See your streak, daily goal progress, and today's plan at a glance.",
    },
    {
      title: 'Subjects — Stay Organized',
      desc: 'Create subjects with chapters and topics. Track progress with a visual bar.',
    },
    {
      title: 'Timer — Just Focus',
      desc: "Distraction-free Pomodoro timer. One circle. One button. That's it.",
    },
    {
      title: 'Plans — Smart Schedule',
      desc: 'Set your exam date, pick topics, and get a full auto-generated study schedule with notifications.',
    },
    {
      title: 'App Block — Stay Focused',
      desc: 'Block distracting apps during study time. Choose soft or hard block — even uninstall-proof.',
    },
  ],
  onboardingSkip: 'Skip',
  onboardingNext: 'Next',
  onboardingFinish: "Let's go!",

  // ── Tab labels ─────────────────────────────────────────────────────────────
  tabHome: 'Home',
  tabSubjects: 'Subjects',
  tabPlans: 'Plans',
  tabBlock: 'Block',
  tabFocus: 'Focus',

  // ── Greetings ──────────────────────────────────────────────────────────────
  greetMorning: 'Good morning',
  greetAfternoon: 'Good afternoon',
  greetEvening: 'Good evening',

  // ── Home screen ────────────────────────────────────────────────────────────
  homeAppName: 'Focus On',
  homeTodayGoal: "Today's Goal",
  homeGoalComplete: 'Goal complete!',
  homeStartFocus: 'Start Focus',
  homeStudy: 'Study',
  homeRoutineBannerTitle: "Set today's study routine",
  homeRoutineBannerSub: (n: number) => `${n} task${n > 1 ? 's' : ''} waiting · tap to schedule`,
  homeTodayPlan: "Today's Plan",
  homeSetTimes: 'Set times',
  homeNoPlan: 'No plan for today',
  homeCreatePlan: 'Create a plan',
  homeStudyTime: 'Study Time!',
  homeUpNext: 'Up next',
  // Morning routine modal
  homeRoutineModalTitle: "Set Today's Routine",
  homeRoutineModalSub: 'Set start & end time for each topic',
  homeRoutineColTopic: 'Topic',
  homeRoutineNoSchedule: "I'll study without a schedule",
  homeRoutineSetBtn: 'Set Routine & Get Notified',

  // ── Settings screen ────────────────────────────────────────────────────────
  settingsTitle: 'Settings',
  settingsTimer: 'Timer',
  settingsFocusDuration: 'Focus Duration',
  settingsShortBreak: 'Short Break',
  settingsDailyGoal: 'Daily Goal',
  settingsAppearance: 'Appearance',
  settingsDarkMode: 'Dark Mode',
  settingsSoundNotif: 'Sound & Notifications',
  settingsTimerSounds: 'Timer Sounds',
  settingsFocus: 'Focus',
  settingsFocusGuard: 'Focus Guard',
  settingsBlockedApps: 'Blocked Apps',
  settingsAbout: 'About',
  settingsVersion: 'Version',
  settingsLanguage: 'Language',
  settingsLangCurrent: 'English',
  settingsPermDenied: 'Permission denied',
  settingsEnableNotif: 'Enable notifications in device settings.',
  settingsNotifSent: '✅ Sent!',
  settingsNotifArrives: 'Notification will arrive in 3 seconds.',
  settingsError: 'Error',
  settingsTestNotif: '🧪 Test Notification (remove before release)',
  settingsSendTest: 'Send Test Notification (3s delay)',

  // ── Plans screen ───────────────────────────────────────────────────────────
  plansTitle: 'Plans',
  plansDaysLeft: (n: number) => `${n} days left`,
  plansExamDay: 'Exam day!',
  plansTodayTasks: (done: number, total: number) => `Today: ${done}/${total} tasks`,
  plansTopics: (n: number) => `${n} topics`,
  plansBlockActive: 'Block active',
  plansDeleteTitle: 'Delete Plan?',
  plansDeleteMsg: (name: string) => `"${name}" will be permanently deleted.`,
  plansCancel: 'Cancel',
  plansDelete: 'Delete',
  plansEmpty: 'No plans yet',
  plansEmptySub: 'Create your first study plan',
  plansCreate: 'Create Plan',

  // ── Plan details screen ────────────────────────────────────────────────────
  planDetailCompleteTask: 'Complete Task',
  planDetailCancelTask: 'Cancel',

  // ── Plan create screen ─────────────────────────────────────────────────────
  planCreateSteps: ['Setup', 'Topics', 'Blocking'],
  planCreateDayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  planCreateMonths: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  planCreateDaysFromToday: (n: number) => `${n} days from today`,
  planCreateWeightLabels: {
    1: { label: 'Light',      desc: 'Quick read'   },
    2: { label: 'Medium',     desc: 'Normal'       },
    3: { label: 'Heavy',      desc: 'Needs focus'  },
    4: { label: 'Very Heavy', desc: 'Tough one'    },
  } as Record<number, { label: string; desc: string }>,
  planCreateCapacityLabels: {
    3:  { label: 'Easy day',   desc: 'Light workload' },
    5:  { label: 'Normal day', desc: 'Balanced'       },
    8:  { label: 'Focus day',  desc: 'Push yourself'  },
    12: { label: 'Grind day',  desc: 'Maximum effort' },
  } as Record<number, { label: string; desc: string }>,

  // ── Subjects screen ────────────────────────────────────────────────────────
  subjectsTitle: 'Subjects',
  subjectsDeleteTitle: 'Delete Subject?',
  subjectsDeleteMsg: (name: string) =>
    `"${name}" and all its chapters, topics and todos will be permanently deleted.`,
  subjectsCancel: 'Cancel',
  subjectsDelete: 'Delete',
  subjectsChapter: (n: number) => `${n} chapter${n !== 1 ? 's' : ''}`,
  subjectsTopics: (done: number, total: number) => `${done}/${total} topics`,
  subjectsChaptersProgress: (done: number, total: number) =>
    `${done}/${total} chapter${total !== 1 ? 's' : ''}`,

  // ── Subject detail ─────────────────────────────────────────────────────────
  subjectDetailChapter: 'Chapter',

  // ── Timer screen ──────────────────────────────────────────────────────────
  timerFocus: 'FOCUS',
  timerBreak: 'BREAK',
  timerTapToEdit: 'tap to edit',
  timerSelect: 'Select',
  timerNoContext: 'No topic selected — free focus session',
  timerSetDuration: 'Set Duration',
  timerApply: 'Apply',
  timerFocusLabel: 'Focus',
  timerBreakLabel: 'Break',
  timerComplete: 'Session Complete!',
  timerTakeBreak: 'Take a Break',
  timerDismiss: 'Dismiss',
  timerTopics: (done: number, total: number) => `${done}/${total} topics done`,

  // ── Analytics screen ───────────────────────────────────────────────────────
  analyticsTitle: 'Analytics',
  analyticsThisWeek: 'This Week',
  analyticsTotalTime: 'Total Time',
  analyticsSessions: 'Sessions',
  analyticsAvgDay: 'Avg / day',
  analyticsStreak: 'Streak',
  analyticsTopApps: 'Top Apps Used',
  analyticsNoUsage: 'No usage data',
  analyticsDayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  analyticsHours: (h: number, m: number) => h > 0 ? `${h}h ${m}m` : `${m}m`,

  // ── Profile screen ─────────────────────────────────────────────────────────
  profileTitle: 'Profile',
  profileLevel: (n: number) => `Level ${n}`,
  profileSignIn: 'Sign in to sync your data',
  profileSignOut: 'Sign Out',
  profileSignOutConfirm: 'Are you sure you want to sign out?',
  profileCancel: 'Cancel',
  profileStudent: 'Student',

  // ── App Block screen ───────────────────────────────────────────────────────
  appBlockTitle: 'App Block',
  appBlockSearchPlaceholder: 'Search apps...',
  appBlockRoutinePlaceholder: 'e.g. Morning Study Block',

  // ── Notifications ──────────────────────────────────────────────────────────
  notifFocusDoneTitle: '🎯 Focus session complete!',
  notifFocusDoneBody: 'Great work! Time for a break.',
  notifBreakDoneTitle: '☕ Break time over!',
  notifBreakDoneBody: "Ready to focus again? Let's go!",
  notifDailyTitle: '📚 Time to study!',
  notifDailyBody: 'Keep your streak going. Open Focus On and start a session.',
  notifStreakTitle: "🔥 Don't break your streak!",
  notifStreakBody: "You haven't studied today. Open Focus On to keep your streak alive.",
  notifExamTitle: (name: string, days: number) =>
    `📅 ${name} in ${days} day${days > 1 ? 's' : ''}!`,
  notifExamBody: "Review your study plan and make sure you're on track.",
  notifTaskTitle: (topic: string) => `📖 Time to study: ${topic}`,
  notifTaskBody: (subject: string) => `${subject} · Open Focus On to start!`,
  notifRoutineTitle: '📚 1 hour to go!',
  notifRoutineBody: (count: number, topic: string, time: string) =>
    `${count} task${count > 1 ? 's' : ''} today. ${topic} starts at ${time}.`,
  notifNewDayTitle: '🌙 New day begins!',
  notifNewDayBody: (count: number) =>
    `You have ${count} task${count > 1 ? 's' : ''} today. Go to Home to set your routine.`,
  notifPlanReminderTitle: '📅 Study plan reminder',
  notifPlanReminderBody: "Don't forget to check your plan for today!",
};

export type Locale = typeof en;
export default en;
