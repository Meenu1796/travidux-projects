import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

import { BASE_URL } from '../../api/API';
import { COLORS } from '../../constants/Colors';

export default function ProductManagementScreen({ navigation }) {
  const { token } = useSelector(state => state.auth);
  const { items: categories } = useSelector(state => state.categories);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   fetchProducts();
  // }, []);

  useFocusEffect(
    React.useCallback(() => {
      setSelectedCategory('All');
      fetchProducts();
    }, []),
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/products/products/`);
      setProducts(res.data);
      //setFilteredProducts(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => {
        const pCatId =
          typeof p.category === 'object' ? p.category.id : p.category;

        return pCatId === selectedCategory;
      });

      setFilteredProducts(filtered);
    }
  }, [products, selectedCategory]);

  // const fetchProducts = async () => {
  //   try {
  //     setLoading(true);
  //     const res = await axios.get(`${BASE_URL}/products/products/`);

  //     setProducts(res.data);

  //     //keep current filter applied
  //     if (selectedCategory === 'All') {
  //       setFilteredProducts(res.data);
  //     } else {
  //       const filtered = res.data.filter(p => {
  //         const pCatId =
  //           typeof p.category === 'object' ? p.category.id : p.category;
  //         return pCatId === selectedCategory;
  //       });
  //       setFilteredProducts(filtered);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     Alert.alert('Error', 'Could not load products');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const filterByCategory = catId => {
    setSelectedCategory(catId); // Store the ID of the selected category

    if (catId === 'All') {
      console.log('all');
      setFilteredProducts(products); // Show everything
    } else {
      // Ensure 'p.category' in your API is an ID (e.g., 7) and not an object.
      const filtered = products.filter(p => {
        // Handle both cases: if category is an ID or an object
        const pCatId =
          typeof p.category === 'object' ? p.category.id : p.category;
        console.log(
          'Product Name:',
          p.name,
          'Product Category ID:',
          p.category,
          'Filter ID:',
          catId,
        );
        return pCatId === catId;
      });
      setFilteredProducts(filtered);
    }
  };

  // const handleDelete = id => {
  //   Alert.alert(
  //     'Delete Product',
  //     'This will remove the item from Flipkart. Continue?',
  //     [
  //       { text: 'Cancel' },
  //       {
  //         text: 'Delete',
  //         style: 'destructive',
  //         onPress: async () => {
  //           try {
  //             await axios.delete(`${BASE_URL}/products/products/${id}/`, {
  //               headers: { Authorization: `Bearer ${token}` },
  //             });
  //             setProducts(products.filter(p => p.id !== id));
  //             setFilteredProducts(filteredProducts.filter(p => p.id !== id));
  //           } catch (err) {
  //             Alert.alert('Error', 'Delete failed');
  //           }
  //         },
  //       },
  //     ],
  //   );
  // };

  const handleDelete = async productId => {
    if (!token) {
      Alert.alert('Session Expired', 'Please login again.');
      return;
    }
    try {
      await axios.delete(`${BASE_URL}/products/products/${productId}/`, {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 This is the missing "Badge"
        },
      });

      // Update your local state so the item disappears from the list immediately
      const updatedList = products.filter(p => p.id !== productId);
      setProducts(updatedList);
      setFilteredProducts(
        updatedList.filter(
          p => p.category === selectedCategory || selectedCategory === 'All',
        ),
      );

      Alert.alert('Success', 'Product removed from inventory.');
    } catch (error) {
      // 1. Check if the error came from the server
      if (error.response && error.response.data) {
        const data = error.response.data;

        // 2. Target the specific "Token is expired" path
        // data.messages[0].message
        const serverMessage =
          data.messages?.[0]?.message || data.detail || 'An error occurred';

        console.log('Extracted Message:', serverMessage);
        Alert.alert('Session Error', serverMessage);

        // 3. Logic: If token is expired, force a re-login
        if (data.code === 'token_not_valid') {
          navigation.navigate('Login');
        }
      } else {
        console.error('Network or Setup Error:', error.message);
      }
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('AdminProductDetail', { product: item })
      }
    >
      {/* <Image source={{ uri: item.image }} style={styles.prodImg} /> */}
      <Image source={{ uri: getProductImage(item) }} style={styles.prodImg} />

      <View style={styles.prodInfo}>
        <Text style={styles.prodName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.prodPrice}>₹{item.price}</Text>
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>{item.stock} in stock</Text>
        </View>
      </View>

      <View style={styles.actionColumn}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddEditProduct', {
              product: item,
              categoryId: item.category,
              categoryName: item.category_name || 'Unknown',
            })
          }
        >
          <Icon name="edit" size={22} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={{ marginTop: 15 }}
        >
          <Icon name="delete-outline" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getProductImage = product => {
    if (product.image) return product.image;
    if (product.images && product.images.length > 0) {
      return product.images[0].image;
    }
    return 'https://via.placeholder.com/150';
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER WITH ADD BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        {/* <TouchableOpacity
          style={styles.addIconBtn}
          onPress={() => navigation.navigate('AddEditProduct')}
        >
          <Icon name="add" size={28} color="#fff" />
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.addIconBtn}
          onPress={() =>
            navigation.navigate('AddEditProduct', {
              product: null,
              categoryId: selectedCategory,
              categoryName:
                categories.find(c => c.id === selectedCategory)?.name ||
                'Unknown',
            })
          }
        >
          <Icon name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL CATEGORY FILTER */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'All' && styles.activeChip,
            ]}
            onPress={() => filterByCategory('All')}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === 'All' && styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                selectedCategory === cat.id && styles.activeChip,
              ]}
              onPress={() => filterByCategory(cat.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat.id && styles.activeFilterText,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No products found in this category.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addIconBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterWrapper: { backgroundColor: '#fff', paddingBottom: 10 },
  filterScroll: { paddingHorizontal: 15, gap: 10 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderSize: 1,
    borderColor: '#eee',
  },
  activeChip: { backgroundColor: COLORS.primary },
  filterText: { color: '#666', fontWeight: '500' },
  activeFilterText: { color: '#fff' },
  listContainer: { padding: 15, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
    alignItems: 'center',
  },
  prodImg: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  prodInfo: { flex: 1, marginLeft: 15 },
  prodName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  prodPrice: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  stockBadge: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 8,
  },
  stockText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold' },
  actionColumn: {
    alignItems: 'center',
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
});
