import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { db } from '@/constants/firebase';
import { collection, addDoc, getDocs, onSnapshot, query, DocumentData } from 'firebase/firestore';

interface RoutineItem {
  id: string;
  task: string;
}

export default function StudyRoutineScreen() {
  const [task, setTask] = useState('');
  const [routine, setRoutine] = useState<RoutineItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'studyRoutines'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: RoutineItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        items.push({ id: doc.id, task: data.task });
      });
      setRoutine(items);
    });
    return () => unsubscribe();
  }, []);

  const addTask = async () => {
    if (task.trim()) {
      await addDoc(collection(db, 'studyRoutines'), { task });
      setTask('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Study Routine</Text>
      <TextInput
        style={styles.input}
        placeholder="Add a study task..."
        value={task}
        onChangeText={setTask}
      />
      <Button title="Add Task" onPress={addTask} />
      <FlatList
        data={routine}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.task}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No tasks yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  empty: { textAlign: 'center', color: '#888', marginTop: 20 },
});
