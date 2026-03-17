# Focus On - Expo Mobile App

## Overview
Focus On is a productivity/study mobile app built with Expo and React Native. It features a focus mode timer, Pomodoro timer, study routine management, app blocking (Android), analytics dashboard, and Firebase authentication with Firestore sync.

## Project Structure

```
focus-on/           # Expo app root
├── app/            # Expo Router file-based routing
│   ├── _layout.tsx # Root layout with providers
│   ├── onboarding.tsx
│   └── oauth2redirect.tsx
├── components/     # Reusable UI components
├── contexts/       # React Context providers (Auth, Study, Theme, Language)
├── hooks/          # Custom hooks
├── services/       # Firebase, auth, notifications, payment services
├── locales/        # Translations (English, Bengali)
├── constants/      # Theme constants
├── types/          # TypeScript types
├── utils/          # Utilities (smart scheduling)
└── plugins/        # Expo config plugins (Android app blocking)
```

## Tech Stack
- **Framework**: Expo SDK 54, React Native 0.81
- **Navigation**: Expo Router (file-based)
- **State**: React Context + Zustand
- **Backend/DB**: Firebase (Firestore + Auth)
- **Payments**: RevenueCat (via services/payment.ts)
- **Fonts**: Hind Siliguri (Google Fonts)
- **Language**: TypeScript

## Running the App

### Development (Web Preview)
The workflow "Start application" runs:
```bash
cd focus-on && npx expo start --web --port 5000
```
This starts the Expo dev server on port 5000 for web preview.

### Mobile (via Expo Go)
Scan the QR code shown in the workflow console with the Expo Go app on your phone.

## Deployment
Configured as a static site:
- **Build**: `cd focus-on && npx expo export --platform web --output-dir dist`
- **Public dir**: `focus-on/dist`

## Key Features
- Focus mode timer with session tracking
- Pomodoro timer
- Study routine scheduling
- App blocking (Android native module)
- Firebase auth (Google OAuth, anonymous)
- Push notifications (expo-notifications)
- Analytics dashboard
- Bilingual support (English + Bengali)
- Dark/light theme

## UI Redesign (Completed)
- **Theme**: New softer palette in `constants/theme.ts`, accent `#7C6FF7`, pastel `SOFT_COLORS` map, richer dark mode.
- **Tab bar** (`app/(tabs)/_layout.tsx`): Animated pill on active tab, floating square Focus button, labels.
- **Home** (`app/(tabs)/index.tsx`): LinearGradient hero card, quick stats row, soft pastel task cards, Ionicons (no emoji).
- **Subjects** (`app/(tabs)/subjects.tsx`): Colored left strip + pastel icon circles, topic-type badge, live modal preview, empty-state illustration placeholder.
- **Profile** (`app/(tabs)/profile.tsx`): Updated all hardcoded colors to new accent, avatar ring + upgrade banner gradients refreshed.
- **Onboarding** (`app/onboarding.tsx`): All slide icon colors updated to new soft pastel palette.
- Timer screen design is solid; illustration slots pending Icons8 assets from user.

## Firebase Configuration
Firebase config is in `focus-on/services/firebase.ts`. The project uses:
- Firebase Auth (Google sign-in)
- Firestore (study data sync)
- Project: `focus-on-e4016`
