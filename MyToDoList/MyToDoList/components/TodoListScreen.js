import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  StatusBar,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/Colors';

const TABS = ['All', 'Pending', 'Completed'];

export default function TodoListScreen({ navigation, route }) {
  console.log(route);

  const [todos, setTodos] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  // Refresh todos when navigating back from AddTodo
  //   useFocusEffect(
  //     useCallback(() => {
  //       if (route.params?.newTodo) {
  //         setTodos(prev => [route.params.newTodo, ...prev]);
  //         navigation.setParams({ newTodo: null });
  //       }
  //     }, [route.params?.newTodo]),
  //   );

  console.log('todo.  out', todos);

  //check-box -> completed list
  const toggleComplete = id => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  //delete
  const deleteTodo = id => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  //Flatlist- pending/completed
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
            onPress={() => toggleComplete(item.id)}
            style={[
              styles.icons,
              // { color: item.completed ? COLORS.orange : COLORS.orange },
            ]}
          />
          {/* <Pressable
          style={[styles.checkbox, item.completed && styles.checkboxChecked]}
          onPress={() => toggleComplete(item.id)}
        >
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </Pressable> */}
          <View style={styles.todoInfo}>
            <Text
              style={[styles.todoText, item.completed && styles.todoTextDone]}
            >
              {item.title}
            </Text>

            {/* PENDIND TO ADD */}
            {/* {item.datetime && (
            <Text style={styles.todoDate}>🗓 {item.datetime}</Text>
          )} */}
          </View>
        </View>
        <MaterialCommunityIcons
          name="delete"
          style={styles.icons}
          onPress={() => deleteTodo(item.id)}
        />
        {/* <Pressable style={styles.deleteBtn} onPress={() => deleteTodo(item.id)}>
        <Text style={styles.deleteBtnText}>🗑</Text>
      </Pressable> */}
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
          {/* <Text style={styles.headerSubtitle}>
            {todos.length} total · {todos.filter(t => t.completed).length} done
          </Text> */}
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('AddTodo', {
              addTodo: todo => {
                setTodos(prev => {
                  const exists = prev.find(t => t.id === todo.id);
                  if (exists) return prev;
                  return [todo, ...prev];
                });
              },
            })
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

      {/* Todo List (1) If list is empty (2) Flatlist */}
      {filteredTodos.length === 0 ? (
        <View style={styles.emptyState}>
          {/* <Text style={styles.emptyIcon}>
            {activeTab === 'Completed' ? '🏆' : '📋'}
          </Text> */}
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
    color: '#7c3aed',
    marginTop: 4,
  },
  icons: {
    fontSize: 30, // Equivalent to 'size' prop
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
