import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { IconButton, Checkbox, Divider } from 'react-native-paper';

export default function WelcomeScreen() {
  const [todoList, setTodoList] = useState([
    { id: '1', title: 'Buy groceries', completed: false },
    { id: '2', title: 'Finish React Native project', completed: true },
  ]);

  // Toggle completion status
  const toggleComplete = id => {
    setTodoList(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  // Delete from both views (the entire state)
  const deleteTask = id => {
    setTodoList(prev => prev.filter(item => item.id !== id));
  };

  // Filtered lists
  const activeTasks = todoList.filter(item => !item.completed);
  const completedTasks = todoList.filter(item => item.completed);

  const renderTask = ({ item }) => (
    <View style={styles.itemRow}>
      <Checkbox
        status={item.completed ? 'checked' : 'unchecked'}
        onPress={() => toggleComplete(item.id)}
        color="#6200EE"
      />
      <Text style={[styles.taskText, item.completed && styles.completedText]}>
        {item.title}
      </Text>
      <IconButton
        icon="delete-outline"
        iconColor="red"
        onPress={() => deleteTask(item.id)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        To-Do Tasks ({activeTasks.length})
      </Text>
      <FlatList
        data={activeTasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No active tasks!</Text>}
      />

      <Divider style={styles.divider} />

      <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>
        Completed ({completedTasks.length})
      </Text>
      <FlatList
        data={completedTasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No completed tasks yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    color: '#6200EE',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 10,
    paddingRight: 5,
  },
  taskText: { flex: 1, fontSize: 16, color: '#333' },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },
  divider: { marginVertical: 20, height: 2, backgroundColor: '#e0e0e0' },
  empty: { textAlign: 'center', color: '#999', marginVertical: 10 },
});
