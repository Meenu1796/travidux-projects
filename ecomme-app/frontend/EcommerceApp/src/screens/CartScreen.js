import React, { useState, useEffect } from 'react';
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

// ✅ Import exact action names from YOUR cartSlice
import {
  setCartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
} from '../store/slices/cartSlice';
import { BASE_URL } from '../api/API';
import { COLORS } from '../constants/Colors';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import ErrorModal from '../components/ErrorModal';

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();

  // ✅ Your authSlice: token, isAuthenticated
  const { token, isAuthenticated, isGuest, user } = useSelector(s => s.auth);
  // ✅ Your cartSlice: items array
  const { items } = useSelector(s => s.cart || { items: [] });

  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ─── Load cart from backend ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/products/cart/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        dispatch(setCartItems(res.data));
      } catch {
        /* keep local items */
      } finally {
        setLoading(false);
      }
    })();
  }, [token, isAuthenticated]);

  // ─── Update Quantity ──────────────────────────────────────────────────────────
  const handleUpdateQuantity = async (item, newQty) => {
    if (newQty < 1) {
      handleRemoveItem(item.id);
      return;
    }
    try {
      if (token) {
        await axios.patch(
          `${BASE_URL}/products/cart/${item.id}/`,
          { quantity: newQty },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      // ✅ Your updateQuantity reducer: action.payload = { cart_id, quantity }
      dispatch(updateQuantity({ cart_id: item.id, quantity: newQty }));
    } catch {
      Alert.alert('Error', 'Could not update quantity');
    }
  };

  // ─── Remove Item ──────────────────────────────────────────────────────────────
  const handleRemoveItem = cartItemId => {
    Alert.alert('Remove Item', 'Remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            if (token) {
              await axios.delete(`${BASE_URL}/products/cart/${cartItemId}/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
            }
            // ✅ Your removeFromCart reducer: filters where item.id !== action.payload
            dispatch(removeFromCart(cartItemId));
          } catch {
            Alert.alert('Error', 'Could not remove item');
          }
        },
      },
    ]);
  };

  // ─── Clear Cart ───────────────────────────────────────────────────────────────
  const handleClearCart = () => {
    if (!items.length) return;
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => dispatch(clearCart()),
      },
    ]);
  };

  // ─── Checkout ─────────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (!items.length) {
      Alert.alert('Empty Cart', 'Please add items before checkout');
      return;
    }
    // Navigate to checkout page
    navigation.navigate('Checkout');
  };

  // ─── Calculate totals ─────────────────────────────────────────────────────────
  // ✅ Your cartSlice items structure: { product: { price, ... }, quantity, id }
  const totalAmount = items.reduce((sum, item) => {
    const price = parseFloat(item.product?.price || item.price || 0);
    return sum + price * (item.quantity || 1);
  }, 0);

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // ─── Render cart item ─────────────────────────────────────────────────────────
  const renderCartItem = ({ item }) => {
    // ✅ Your cartSlice stores items as { product: {...}, quantity, id }
    const productData = item.product || item;

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
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
        </TouchableOpacity>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {productData.name}
          </Text>
          <Text style={styles.itemPrice}>₹{productData.price}</Text>

          {item.selectedSize && (
            <Text style={styles.itemMeta}>Size: {item.selectedSize}</Text>
          )}
          {item.selectedColor && (
            <Text style={styles.itemMeta}>Color: {item.selectedColor}</Text>
          )}

          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleUpdateQuantity(item, item.quantity - 1)}
            >
              <Icon name="remove" size={16} color="#666" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleUpdateQuantity(item, item.quantity + 1)}
            >
              <Icon name="add" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Icon name="delete-outline" size={22} color="#f44336" />
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Guest View ───────────────────────────────────────────────────────────────
  if (isGuest || !isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Cart" showBack />
        <View style={styles.emptyContainer}>
          <Icon name="shopping-cart" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Login to view your cart</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('AuthFlow')}
          >
            <Text style={styles.shopButtonText}>Login Now</Text>
          </TouchableOpacity>
        </View>
        <BottomTabBar navigation={navigation} currentScreen="Cart" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="My Cart"
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
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="shopping-cart" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={item =>
              item.id?.toString() || Math.random().toString()
            }
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />

          {/* Order Summary */}
          <View style={styles.summaryContainer}>
            <TouchableOpacity
              onPress={handleClearCart}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear Cart</Text>
            </TouchableOpacity>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Items:</Text>
              <Text style={styles.totalValue}>{totalItems}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalPrice}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery:</Text>
              <Text style={[styles.totalValue, { color: 'green' }]}>FREE</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Icon name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}

      <BottomTabBar navigation={navigation} currentScreen="Cart" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999', marginTop: 20 },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  shopButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cartList: { padding: 15, paddingBottom: 20 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  itemMeta: { fontSize: 12, color: '#999', marginBottom: 2 },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: { padding: 8, justifyContent: 'center' },
  summaryContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  clearButton: { alignSelf: 'flex-end', marginBottom: 15 },
  clearButtonText: { color: '#f44336', fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: { fontSize: 16, color: '#666' },
  totalValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 15,
  },
  checkoutButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
