import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder analytics data
const analyticsData = {
  totalFocusSessions: 12,
  totalFocusTime: 3600, // seconds
  totalPomodoros: 20,
  totalTasks: 15,
};

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function AnalyticsDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Focus Sessions:</Text>
        <Text style={styles.value}>{analyticsData.totalFocusSessions}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total Focus Time:</Text>
        <Text style={styles.value}>{formatTime(analyticsData.totalFocusTime)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Pomodoros Completed:</Text>
        <Text style={styles.value}>{analyticsData.totalPomodoros}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Tasks Completed:</Text>
        <Text style={styles.value}>{analyticsData.totalTasks}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 18, color: '#333' },
  value: { fontSize: 20, fontWeight: 'bold', color: '#5cb85c' },
});
