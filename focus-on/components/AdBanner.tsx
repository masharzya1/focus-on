/**
 * AdBanner.tsx
 *
 * ── Setup করতে হবে ──────────────────────────────────────────────────────────
 *
 * Step 1: Install
 *   npx expo install react-native-google-mobile-ads
 *
 * Step 2: app.json এ add করো:
 *   "plugins": [
 *     ["react-native-google-mobile-ads", {
 *       "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
 *     }]
 *   ]
 *
 * Step 3: নিচের ADS_ENABLED = true করো
 *         আর AD_UNITS এ তোমার real IDs বসাও
 *
 * ── Ad placements ────────────────────────────────────────────────────────────
 *  session_complete  → timer শেষ হলে modal এ (banner) — সবচেয়ে বেশি impression
 *  analytics         → analytics screen এর নিচে (banner)
 *  plan_list         → plan list এর নিচে (banner)
 *
 * ── $100/month এর হিসাব ─────────────────────────────────────────────────────
 *  Bangladesh eCPM ≈ $0.3–0.8
 *  Session complete ad: user প্রতিদিন ৫টা session করলে = ৫ impressions/user/day
 *  ১০০০ daily active users × ৫ = ৫০০০ impressions/day = ১৫০,০০০/month
 *  ১৫০,০০০ × $0.5 CPM = $75 (banner)
 *  Analytics + Plan = আরো ~$25
 *  Total ≈ $100/month at 1000 DAU
 */

import React from 'react';
import { View } from 'react-native';

// ── Config — এখানে change করো ────────────────────────────────────────────────
const ADS_ENABLED = false; // ← AdMob setup হলে true করো

const AD_UNITS = {
  // AdMob console থেকে এই IDs নাও
  // Test IDs দিয়ে test করতে পারো (নিচে দেওয়া আছে)
  banner_session:  'ca-app-pub-3940256099942544/6300978111', // test banner
  banner_analytics:'ca-app-pub-3940256099942544/6300978111', // test banner
  banner_plan:     'ca-app-pub-3940256099942544/6300978111', // test banner
};
// ─────────────────────────────────────────────────────────────────────────────

export type AdPlacement = 'session_complete' | 'analytics' | 'plan_list';

interface AdBannerProps {
  placement: AdPlacement;
}

export default function AdBanner({ placement }: AdBannerProps) {
  if (!ADS_ENABLED) return null;

  // Uncomment এই block টা AdMob install করার পর:
  //
  // import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
  //
  // const unitId = placement === 'session_complete' ? AD_UNITS.banner_session
  //              : placement === 'analytics'        ? AD_UNITS.banner_analytics
  //              : AD_UNITS.banner_plan;
  //
  // return (
  //   <View style={{ alignItems: 'center', marginVertical: 6 }}>
  //     <BannerAd
  //       unitId={unitId}
  //       size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
  //       requestOptions={{ requestNonPersonalizedAdsOnly: true }}
  //       onAdFailedToLoad={() => {}} // fail হলে silently hide
  //     />
  //   </View>
  // );

  return <View />;
}