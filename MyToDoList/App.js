import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Your Screens
// import TodoListScreen from './components/TodoListScreen';
// import AddTodoScreen from './components/AddTodoScreen';
import DB_TodoList from './components/DB_TodoList';
import DB_AddTodo from './components/DB_AddTodo';

const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="TodoList"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="TodoList" component={DB_TodoList} />
          <Stack.Screen name="AddTodo" component={DB_AddTodo} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
