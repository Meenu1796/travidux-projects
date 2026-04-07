import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/Colors';

import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminProducts from '../screens/admin/AdminProducts';
import AdminAddProduct from '../screens/admin/AdminAddProduct';
import AdminEditProduct from '../screens/admin/AdminEditProduct';
import AdminOrders from '../screens/admin/AdminOrders';
import ProfileScreen from '../screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminProducts" component={AdminProducts} />
      <Stack.Screen name="AdminAddProduct" component={AdminAddProduct} />
      <Stack.Screen name="AdminEditProduct" component={AdminEditProduct} />
    </Stack.Navigator>
  );
}

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'bar-chart-2',
            Products: 'package',
            AdminOrders: 'clipboard',
            AdminProfile: 'user',
          };
          return <Icon name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{ title: 'Products' }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrders}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
