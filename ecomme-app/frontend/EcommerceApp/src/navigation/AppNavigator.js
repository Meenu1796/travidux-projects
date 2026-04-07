import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import CustomerTabs from './CustomerTabs';
import AdminTabs from './AdminTabs';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { token, isAdmin } = useSelector(s => s.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        // Not logged in → show auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : isAdmin ? (
        // Admin user → show admin tabs
        <Stack.Screen name="AdminApp" component={AdminTabs} />
      ) : (
        // Customer user → show customer tabs
        <Stack.Screen name="CustomerApp" component={CustomerTabs} />
      )}
    </Stack.Navigator>
  );
}
