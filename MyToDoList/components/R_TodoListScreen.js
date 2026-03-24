import React, { useState } from 'react';
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTodo, deleteTodo } from '../redux/ToDoSlice.js';
import { COLORS } from '../constants/Colors';

// useSelector  → reads data FROM the Redux store
//                anytime store changes, component re-renders

// useDispatch  → gives you the dispatch function
//                used to SEND actions TO the store

// toggleTodo   → action creator from ToDoSlice
// deleteTodo   → action creator from ToDoSlice

const TABS = ['All', 'Pending', 'Completed'];

export default function R_TodoListScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');

  // useSelector reads todos directly from Redux store.
  // Any time the store updates, this component re-renders automatically.
  const todos = useSelector(state => state.todos); //synchronous

  // dispatch is used to send actions to the Redux store
  // Think of it like:
  //   dispatch = a remote control for your store
  //   actions  = the buttons on that remote
  //   store    = the TV that responds
  const dispatch = useDispatch();

  // sends toggleTodo action to Redux — store handles the state update
  const toggleComplete = id => {
    dispatch(toggleTodo(id));
  };
  //   toggleTodo(id) creates this action:
  // {
  //     type: 'todos/toggleTodo',
  //     payload: '1742387400000'
  // }

  // dispatch() sends it to the store.
  // Reducer handles it:
  // const todo = state.todos.find(t => t.id === payload)
  // todo.completed = !todo.completed  ← flips true/false
  // BEFORE dispatch:
  //     { id: '1', title: 'Buy groceries', completed: false }
  // AFTER dispatch:
  //     { id: '1', title: 'Buy groceries', completed: true }
  // useSelector detects change → FlatList re-renders

  // sends deleteTodo action to Redux — store handles the state update
  const handleDelete = id => {
    Alert.alert('Delete?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => dispatch(deleteTodo(id)) },
    ]);
  };

  const filteredTodos = todos.filter(todo => {
    if (activeTab === 'Completed') return todo.completed;
    if (activeTab === 'Pending') return !todo.completed;
    return true;
  });

  const renderTodo = ({ item }) => {
    console.log('Rendering Item ID:', item.id, 'Data:', item);
    return (
      <View style={styles.todoCard}>
        <View style={styles.todoLeft}>
          <MaterialCommunityIcons
            name={
              item.completed
                ? 'checkbox-marked-circle'
                : 'checkbox-blank-circle-outline'
            }
            onPress={() => toggleComplete(item.id)} // dispatches to Redux
            style={styles.icons}
          />
          <View style={styles.todoInfo}>
            <Text
              style={[styles.todoText, item.completed && styles.todoTextDone]}
            >
              {item.title}
            </Text>
            {item.datetime && (
              <Text style={styles.todoDate}>🗓 {item.datetime}</Text>
            )}
          </View>
        </View>
        <MaterialCommunityIcons
          name="delete"
          style={styles.icons}
          onPress={() => handleDelete(item.id)} // dispatches to Redux
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
          onPress={() => navigation.navigate('AddTodo')}
        >
          <Text style={styles.addButtonText}> Add task</Text>
        </Pressable>
      </View>

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

// User in AddTodoScreen fills form and submits
//         ↓
// dispatch(addTodo(newTodo))
//         ↓
// ToDoSlice reducer:
// state.todos.unshift(newTodo)  ← adds to top
//         ↓
// Redux store updates
//         ↓
// persistor saves to AsyncStorage ← survives restart
//         ↓
// useSelector in THIS screen detects change
//         ↓
// todos variable updates with new array
//         ↓
// filteredTodos recalculates
//         ↓
// FlatList re-renders showing new todo at top

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
    color: COLORS.beige,
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
