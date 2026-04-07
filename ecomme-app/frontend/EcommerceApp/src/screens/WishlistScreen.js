import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import {
  removeFromWishlist,
  setWishlistItems,
} from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { BASE_URL } from '../api/API';
import { COLORS } from '../constants/Colors';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import ErrorModal from '../components/ErrorModal';
import NetworkErrorScreen from '../components/NetworkErrorScreen';
import { checkNetworkConnection } from '../utils/networkUtils';

export default function WishlistScreen({ navigation }) {
  const dispatch = useDispatch();

  const auth = useSelector(state => state.auth || {});
  const token = auth.token;
  const isAuthenticated = auth.isAuthenticated;
  const isGuest = auth.isGuest;

  const wishlistItems = useSelector(state => state.wishlist?.items || []);

  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);

  const getProduct = item => item?.product || item;
  const getProductId = item => item?.product?.id || item?.id;

  const fetchWishlist = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      // const connected = await checkNetworkConnection();
      // if (!connected) {
      //   setIsNetworkError(true);
      //   setLoading(false);
      //   return;
      // }

      const res = await axios.get(`${BASE_URL}/products/wishlist/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      dispatch(setWishlistItems(res.data || []));
      setIsNetworkError(false);
    } catch (error) {
      if (!error.response) {
        setIsNetworkError(true);
      } else if (error.response.status === 401) {
        setErrorMessage('Session expired. Please login again.');
        setShowErrorModal(true);
      } else {
        setErrorMessage('Failed to load wishlist');
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, dispatch]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = (wishlistItemId, productId) => {
    Alert.alert('Remove Item', 'Remove this item from your wishlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${BASE_URL}/products/wishlist/remove_item/`, {
              headers: { Authorization: `Bearer ${token}` },
              data: { product_id: productId },
            });
            dispatch(removeFromWishlist(productId));
          } catch {
            Alert.alert('Error', 'Failed to remove item');
          }
        },
      },
    ]);
  };

  const handleAddToCart = async productData => {
    if (!token || !isAuthenticated) {
      Alert.alert('Login Required', 'Please login to add to cart');
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/products/cart/`,
        { product_id: productData.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      dispatch(addToCart({ product: productData, quantity: 1 }));
      Alert.alert('Added! 🛒', `${productData.name} added to cart`);
    } catch {
      Alert.alert('Error', 'Could not add to cart');
    }
  };

  const renderWishlistItem = ({ item }) => {
    const productData = getProduct(item);

    if (!productData) return null;

    return (
      <View style={styles.wishlistItem}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() =>
            navigation.navigate('ProductDetail', { product: productData })
          }
        >
          <Image
            source={{
              uri: productData.image || 'https://via.placeholder.com/80',
            }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          <View style={styles.itemDetails}>
            <Text style={styles.itemName} numberOfLines={2}>
              {productData.name}
            </Text>
            <Text style={styles.itemPrice}>₹{productData.price}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {productData.category_name || 'Product'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => handleAddToCart(productData)}
          >
            <Icon name="add-shopping-cart" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleRemove(item.id, getProductId(item))}
          >
            <Icon name="delete-outline" size={22} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isGuest || !isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Wishlist" showBack />
        <View style={styles.emptyContainer}>
          <Icon name="favorite-border" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Login to see your wishlist</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('AuthFlow')}
          >
            <Text style={styles.shopButtonText}>Login Now</Text>
          </TouchableOpacity>
        </View>
        <BottomTabBar navigation={navigation} currentScreen="Wishlist" />
      </SafeAreaView>
    );
  }

  if (isNetworkError) {
    return (
      <NetworkErrorScreen
        onRetry={() => {
          setIsNetworkError(false);
          fetchWishlist();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="My Wishlist"
        showBack
        showSearch
        onSearch={q => navigation.navigate('SearchResults', { query: q })}
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={errorMessage}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="favorite-border" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Your wishlist is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={item => String(getProductId(item) || item.id)}
          contentContainerStyle={styles.wishlistList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomTabBar navigation={navigation} currentScreen="Wishlist" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  wishlistList: { padding: 15, paddingBottom: 90 },
  wishlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 15,
    padding: 10,
    elevation: 2,
  },
  itemContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  itemImage: { width: 80, height: 80, borderRadius: 12, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#333' },
  itemPrice: { fontSize: 14, color: COLORS.primary, marginTop: 4 },
  categoryTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: { fontSize: 12, color: '#666' },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartButton: { padding: 6 },
  deleteButton: { padding: 6 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  shopButtonText: { color: '#fff', fontWeight: '700' },
});
