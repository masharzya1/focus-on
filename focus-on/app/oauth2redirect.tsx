import { useEffect } from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

export default function OAuth2RedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    // Complete the auth session — passes token back to AuthContext
    WebBrowser.maybeCompleteAuthSession();
    // Navigate back after a short delay
    const t = setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return <View style={{ flex: 1 }} />;
}