import React, { useState, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const WORK_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

export default function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const startTimer = () => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsWork(!isWork);
          setSecondsLeft(isWork ? BREAK_DURATION : WORK_DURATION);
          setIsRunning(false);
          return prev;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    stopTimer();
    setSecondsLeft(isWork ? WORK_DURATION : BREAK_DURATION);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isWork ? 'Work' : 'Break'} Session</Text>
      <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
      <View style={styles.buttonRow}>
        <Button title={isRunning ? 'Pause' : 'Start'} onPress={isRunning ? stopTimer : startTimer} color={isRunning ? '#d9534f' : '#5cb85c'} />
        <Button title="Reset" onPress={resetTimer} color="#0275d8" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  timer: { fontSize: 48, fontWeight: 'bold', marginBottom: 24, color: '#5cb85c' },
  buttonRow: { flexDirection: 'row', gap: 16 },
});
