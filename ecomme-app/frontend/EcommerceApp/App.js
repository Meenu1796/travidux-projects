import 'react-native-gesture-handler';
import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from 'react-native';

import MainNavigator from './src/navigation/MainNavigator';
import { store, persistor } from './src/store/redux/Store.js';

const App = () => {
  console.log('STORE:', store);
  console.log('PERSISTOR:', persistor);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        {/* Makes Redux available to the entire app */}
        <PersistGate loading={<Text>Loading...</Text>} persistor={persistor}>
          <SafeAreaProvider>
            <NavigationContainer>
              <MainNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;

//Provider : Makes Redux available to the entire app
//Wraps your entire app with Redux and Navigation so
// all screens can share data and move between each other.”
