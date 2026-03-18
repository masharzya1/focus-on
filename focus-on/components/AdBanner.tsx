import React from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

export type AdPlacement = 'session_complete' | 'analytics' | 'plan_list';

const AD_UNITS: Record<AdPlacement, string> = {
  session_complete: 'ca-app-pub-1374517431669460/3726849051',
  analytics:        'ca-app-pub-1374517431669460/3634649010',
  plan_list:        'ca-app-pub-1374517431669460/3954780460',
};

interface AdBannerProps {
  placement: AdPlacement;
}

export default function AdBanner({ placement }: AdBannerProps) {
  return (
    <View style={{ alignItems: 'center', marginVertical: 6 }}>
      <BannerAd
        unitId={AD_UNITS[placement]}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => {}}
      />
    </View>
  );
}