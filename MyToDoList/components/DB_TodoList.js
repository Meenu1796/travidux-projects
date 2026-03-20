import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/Colors';
import {
  getDBConnection,
  createTable,
  getTodos,
  updateTodoCompleted,
  deleteTodo,
} from '../db/Database';

const TABS = ['All', 'Pending', 'Completed'];

export default function DB_TodoList({ navigation }) {
  const [todos, setTodos] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [db, setDb] = useState(null); //stores DB connection

  //Initialize DB and load todos on mount
  //useCallback() - Prevents function from being recreated on every render.
  // Also, Performance Optimization and Preventing Infinite Loops.  ==> ADD
  // const loadDataCallback = useCallback(async () => {
  //   try {
  //     console.log('DB init:', 'inside data callback');
  //     const database = await getDBConnection(); //Open DB
  //     await createTable(database); //Ensure table exists
  //     const storedTodos = await getTodos(database); //Fetch todos data
  //     setDb(database); //Save DB connection for reuse
  //     setTodos(storedTodos); //Always set (even empty array)
  //   } catch (error) {
  //     console.error('DB init error:', error);
  //     Alert.alert('Error', 'Could not initialize the database.');
  //   }
  // }, []);
  // useEffect(() => {
  //   loadDataCallback();
  // }, [loadDataCallback]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          console.log('DB init:', 'inside data callback');

          const database = await getDBConnection();
          await createTable(database);
          const storedTodos = await getTodos(database);

          setDb(database);
          setTodos(storedTodos);
        } catch (error) {
          console.error('DB init error:', error);
          Alert.alert('Error', 'Could not initialize the database.');
        }
      };

      loadData();

      // optional cleanup (not needed here)
      //return () => {};
    }, []),
  );

  // addTodo callback passed to AddTodoScreen
  // AddTodoScreen saves to DB itself, then calls this to update local state. ==> ADD
  // const addTodo = useCallback(newTodo => {
  //   setTodos(prev => {
  //     const exists = prev.find(t => t.id === newTodo.id);
  //     if (exists) return prev;
  //     return [newTodo, ...prev]; // ✅ Add new todo to top of list
  //   });
  // }, []);

  // Toggle completed in DB + local state
  const toggleComplete = async item => {
    const newStatus = !item.completed;
    try {
      if (db) {
        await updateTodoCompleted(db, item.id, newStatus); // Update in DB
      }
      setTodos(prev =>
        prev.map(todo =>
          todo.id === item.id ? { ...todo, completed: newStatus } : todo,
        ),
      );
    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Error', 'Could not update task status.');
    }
  };

  // Delete from DB + local state
  const handleDelete = id => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (db) {
              await deleteTodo(db, id); //Delete from DB
            }
            setTodos(prev => prev.filter(todo => todo.id !== id));
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Could not delete the task.');
          }
        },
      },
    ]);
  };

  // Filter by tab
  const filteredTodos = todos.filter(todo => {
    if (activeTab === 'Completed') return todo.completed;
    if (activeTab === 'Pending') return !todo.completed;
    return true;
  });

  // Render each todo card
  const renderTodo = ({ item }) => {
    console.log('Rendering Item ID:', item.id, 'Data:', item);
    return (
      <View style={styles.todoCard}>
        <View style={styles.todoLeft}>
          {/* Checkbox Icon */}
          <MaterialCommunityIcons
            name={
              item.completed
                ? 'checkbox-marked-circle'
                : 'checkbox-blank-circle-outline'
            }
            onPress={() => toggleComplete(item)} // Pass full item not just id
            style={styles.icons}
          />

          <View style={styles.todoInfo}>
            <Text
              style={[styles.todoText, item.completed && styles.todoTextDone]}
            >
              {item.title}
            </Text>
            {/* DateTime display */}
            {item.datetime ? (
              <Text style={styles.todoDate}>🗓 {item.datetime}</Text>
            ) : null}
          </View>
        </View>

        {/* Delete Icon */}
        <MaterialCommunityIcons
          name="delete"
          style={styles.icons}
          onPress={() => handleDelete(item.id)} // DB delete with confirmation
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.grey} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Tasks</Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() =>
            navigation.navigate(
              'AddTodo',
              // {addTodo,} <- add here, Pass callback so AddTodoScreen can update this list
            )
          }
        >
          <Text style={styles.addButtonText}> Add task</Text>
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            <Text
              style={[
                styles.tabCount,
                activeTab === tab && styles.activeTabCount,
              ]}
            >
              {tab === 'All'
                ? todos.length
                : tab === 'Completed'
                ? todos.filter(t => t.completed).length
                : todos.filter(t => !t.completed).length}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Todo List */}
      {filteredTodos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            {activeTab === 'Completed' ? (
              <Image
                style={styles.imgStyle}
                source={require('../assets/images/completed-list.png')}
              />
            ) : (
              <Image
                style={styles.imgStyle}
                source={require('../assets/images/pending-list.png')}
              />
            )}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'Completed'
              ? 'No completed tasks yet'
              : activeTab === 'Pending'
              ? 'No pending tasks!'
              : 'No tasks yet. Add one!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTodos}
          keyExtractor={item => item.id}
          renderItem={renderTodo}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// useEffect runs after a component renders
//A component is mounted when it is created and added to the screen (UI)
// | Term      | Meaning            |
// | --------- | ------------------ |
// | Mount     | first time render  |
// | Re-render | update (NOT mount) |
// | Unmount   | removed from UI    |
// useEffect(() => {
//   console.log('Component mounted');
// }, []);
// | Dependency | When it runs         |
// | ---------- | -------------------- |
// | `[]`       | once (on mount)      |
// | `[value]`  | when `value` changes |
// | no array   | every render         |

//useFocusEffect runs when the screen comes into focus (becomes active)
// useFocusEffect(
//   useCallback(() => {
//     console.log('Screen is focused');
//   }, []),
// );
// When does it run?
// Every time:
// you navigate to the screen
// you come back from another screen

// Using only useEffect:
// Problem:
// Runs only once
// If you add a new todo → list won’t refresh
// Using useFocusEffect:
// Works because:
// When you return from AddTodo screen
// It reloads data

// Without useCallback
// Every render:
// Render 1 → new addTodo function (memory A)
// Render 2 → new addTodo function (memory B)
// Render 3 → new addTodo function (memory C)
// 👉 Problem:
// React thinks it's a different function every time
// Can cause:
// unnecessary re-renders
// navigation params changing
// performance issues

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.beige,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'orange',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.white,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: COLORS.grey,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    opacity: 0.5,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.orange,
    opacity: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555577',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeTabCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  todoCard: {
    backgroundColor: COLORS.grey,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.grey,
  },
  todoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  todoInfo: {
    flex: 1,
  },
  todoText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '500',
  },
  todoTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.white,
  },
  todoDate: {
    fontSize: 12,
    color: COLORS.orange,
    marginTop: 4,
  },
  icons: {
    fontSize: 30,
    backgroundColor: COLORS.grey,
    padding: 10,
    color: COLORS.orange,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.grey,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  imgStyle: {
    height: 80,
    width: 80,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#555577',
    fontWeight: '500',
  },
});
