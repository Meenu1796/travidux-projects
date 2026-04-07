import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  setCategories,
  removeCategory,
} from '../../store/slices/categorySlice';
import { BASE_URL } from '../../api/API';

export default function CategoryListScreen({ navigation }) {
  const dispatch = useDispatch();
  const { items } = useSelector(state => state.categories);
  const { token } = useSelector(state => state.auth);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await axios.get(`${BASE_URL}/products/categories/`);
    dispatch(setCategories(res.data));
  };

  const handleDelete = id => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await axios.delete(`${BASE_URL}/products/categories/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          dispatch(removeCategory(id));
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.img} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.iconRow}>
          <Icon name={item.icon} size={16} color="#666" />
          <Text style={styles.iconName}>{item.icon}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddEditCategory', { category: item })
          }
        >
          <Icon name="edit" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Icon name="delete" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddEditCategory')}
        >
          <Icon name="add-circle" size={20} color="white" />
          <Text style={styles.addBtnText}>Add Category</Text>
        </TouchableOpacity>

        <FlatList
          data={items}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  safeContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    alignSelf: 'flex-end',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    gap: 5,
  },
  addBtnText: { color: 'white', fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  img: { width: 60, height: 60, borderRadius: 8 },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: 'bold' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  iconName: { fontSize: 12, color: '#666' },
  actions: { flexDirection: 'row', gap: 15 },
});
