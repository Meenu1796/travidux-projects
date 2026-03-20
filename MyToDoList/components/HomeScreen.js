import React, { useState } from 'react';
import EmptyList from './EmptyList';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
} from 'react-native';

const HomeScreen = () => {
  const orange = '#FE7615';
  const [addItem, setAddItem] = useState(''); //text on TextInput box
  const [todoList, setTodoList] = useState([]); //To Do List
  const [todoEdited, setTodoEdited] = useState(null); //Editted text

  const addOrupdateToList = () => {
    if (addItem == '') {
      return;
    }
    if (todoEdited) {
      const updatedList = todoList.map(item => {
        if (item.id === todoEdited.id) {
          return { ...item, title: addItem };
        }
        return item;
      });
      setTodoList(updatedList);
      setTodoEdited(null); // Exit edit mode
    } else {
      // ADD  item
      setTodoList([
        ...todoList,
        { id: Date.now().toString(), title: addItem, completed: false },
      ]);
    }
    setAddItem(''); // Clear input
  };

  const todoDelete = id => {
    const updatedTodoList = todoList.filter(todo => todo.id !== id);
    setTodoList(updatedTodoList);
  };
  const todoEdit = todoTitle => {
    setTodoEdited(todoTitle);
    setAddItem(todoTitle.title);
  };
  const toggleComplete = id => {
    setTodoList(
      todoList.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  // Filter the list into two categories
  const activeTasks = todoList.filter(t => !t.completed);
  const completedTasks = todoList.filter(t => t.completed);

  const renderItem = ({ item }) => (
    <View style={styles.todoItem}>
      <Text style={styles.todoText}>{item.title}</Text>
      {/* <Icon name="pencil" style={styles.icons} onPress={() => todoEdit(item)} /> */}

      <Pressable onPress={() => toggleComplete(item.id)}>
        <MaterialCommunityIcons
          name={
            item.completed
              ? 'checkbox-marked-circle'
              : 'checkbox-blank-circle-outline'
          }
          style={[
            styles.icons,
            { color: item.completed ? 'orange' : '#DAD0C3' },
          ]}
        />
      </Pressable>
      <MaterialCommunityIcons
        name="delete"
        style={styles.icons}
        onPress={() => todoDelete(item.id)}
      />
    </View>
  );

  return (
    <View style={styles.safeContainer}>
      <View style={styles.mainWrapper}>
        <TextInput
          style={styles.inputContainer}
          value={addItem}
          onChangeText={userText => setAddItem(userText)}
          placeholder="Add a task..."
          placeholderTextColor="#999"
        />

        <Pressable style={styles.button} onPress={() => addOrupdateToList()}>
          <Text style={styles.buttonText}>
            {todoEdited ? 'Save' : 'Add Task'}
          </Text>
        </Pressable>

        <Text style={styles.subHeader}>To Do ({activeTasks.length})</Text>
        {todoList.length <= 0 && <EmptyList />}

        <ScrollView>
          {activeTasks.length > 0 && (
            <View style={styles.flatList}>
              <FlatList
                data={todoList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                // ListEmptyComponent={<Text>No items found</Text>}
              />
            </View>
          )}
          {completedTasks.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.subHeader, { color: 'orange' }]}>
                Completed ({completedTasks.length})
              </Text>
              {completedTasks.map(item => (
                <View key={item.id}>{renderItem({ item })}</View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
    marginTop: 20,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainWrapper: {
    flex: 1,
    marginTop: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    height: 50,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#FE7615',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  todoItem: {
    backgroundColor: '#F7F2EE',
    padding: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoText: {
    color: '#000000',
    fontSize: 18,
    paddingStart: 10,
    fontWeight: '500',
    flex: 1,
  },
  icons: {
    fontSize: 30, // Equivalent to 'size' prop
    backgroundColor: '#f0f0f0',
    padding: 10,
    color: '#DAD0C3',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    color: 'orange',
  },
  divider: {
    marginVertical: 20,
    height: 2,
    backgroundColor: '#e0e0e0',
  },
  listWrapper: { marginTop: 20 },
  subHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: 'orange',
    marginTop: 30,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
});

export default HomeScreen;
