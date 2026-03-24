import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Your Screens
import R_TodoListScreen from './components/R_TodoListScreen.js';
import R_AddToDoScreen from './components/R_AddToDoScreen.js';
// import Form_AddToDoScreen from './components/Form_AddToDoScreen';
// import TodoListScreen from './components/TodoListScreen';
//import AddTodoScreen from './components/AddTodoScreen';
// import DB_TodoList from './components/DB_TodoList';
// import DB_AddTodo from './components/DB_AddTodo';
// import API_TodoList from './components/API_TodoList';
// import API_AddTodo from './components/API_AddTodo';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/Store.js';

const Stack = createStackNavigator();

const App = () => {
  return (
    // Provider makes the Redux store available to every screen in the app
    <Provider store={store}>
      {/*
        PersistGate delays rendering until saved Redux data is reloaded
        from AsyncStorage — like waiting for SQLite to load on startup
        loading={null} means show nothing while loading (pass a
        loading spinner component here)
      */}
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="TodoList"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="TodoList" component={R_TodoListScreen} />
              <Stack.Screen name="AddTodo" component={R_AddToDoScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
