import { useEffect } from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * This screen handles the OAuth2 redirect from Google.
 * After Google signs in, it redirects to focuson://oauth2redirect?code=...
 * WebBrowser.maybeCompleteAuthSession() intercepts the URL and passes it
 * back to the expo-auth-session hook in AuthContext.
 */
export default function OAuth2RedirectScreen() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // Blank screen — closes immediately after completing auth
  return <View />;
}