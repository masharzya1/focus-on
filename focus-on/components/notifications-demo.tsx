import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function NotificationsDemo() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    const subscription = Notifications.addNotificationReceivedListener(setNotification);
    return () => subscription.remove();
  }, []);

  async function sendTestNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Focus Reminder',
        body: 'Time to focus on your study routine!',
      },
      trigger: { seconds: 2 },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notifications</Text>
      <Button title="Send Test Notification" onPress={sendTestNotification} />
      {expoPushToken && (
        <Text style={styles.token}>Push Token: {expoPushToken}</Text>
      )}
      {notification && (
        <Text style={styles.notification}>Last notification: {notification.request.content.body}</Text>
      )}
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return null;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  token: { marginTop: 16, fontSize: 12, color: '#888' },
  notification: { marginTop: 16, fontSize: 16, color: '#5cb85c' },
});
