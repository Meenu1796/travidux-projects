import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProductListScreen from '../screens/adminDB/ProductListScreen';
import AddEditProductScreen from '../screens/adminDB/AddEditProductScreen';
import AdminProductDetailsScreen from '../screens/adminDB/AdminProductDetailsScreen';
import CategoryListScreen from '../screens/adminDB/CategoryListScreen';
import AddCategoryScreen from '../screens/adminDB/AddCategoryScreen';

const Stack = createStackNavigator();

function AdminCategoryProductNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // 👈 This hides the default "Manage Category" bar
      }}
    >
      {/* The "Dashboard" or entry point for Admin */}
      <Stack.Screen
        name="ManageCategories"
        component={CategoryListScreen}
        // options={{ title: 'Categories' }}
      />

      <Stack.Screen
        name="AddEditCategory"
        component={AddCategoryScreen}
        // options={({ route }) => ({
        //   title: route.params?.category ? 'Edit Category' : 'New Category',
        // })}
      />

      <Stack.Screen
        name="ProductManagement"
        component={ProductListScreen}
        // options={{ title: 'Inventory' }}
      />

      <Stack.Screen
        name="AddEditProduct"
        component={AddEditProductScreen}
        options={{ title: 'Product Editor' }}
      />

      <Stack.Screen
        name="AdminProductDetail"
        component={AdminProductDetailsScreen}
        options={{ title: 'Product Overview' }}
      />
    </Stack.Navigator>
  );
}
export default AdminCategoryProductNavigator;
