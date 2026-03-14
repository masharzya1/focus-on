import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function FocusMode() {
  const [isFocusing, setIsFocusing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timer | null>(null);

  const startFocus = () => {
    setIsFocusing(true);
    setStartTime(Date.now());
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    }, 1000);
    setIntervalId(id);
  };

  const stopFocus = () => {
    setIsFocusing(false);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setElapsed(0);
    setStartTime(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Focus Mode</Text>
      {isFocusing ? (
        <>
          <Text style={styles.timer}>{elapsed} seconds focused</Text>
          <Button title="End Focus" onPress={stopFocus} color="#d9534f" />
        </>
      ) : (
        <Button title="Start Focus Mode" onPress={startFocus} color="#5cb85c" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  timer: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, color: '#5cb85c' },
});
