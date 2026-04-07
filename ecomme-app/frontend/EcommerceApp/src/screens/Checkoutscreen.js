import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { clearCart } from '../store/slices/cartSlice';
import { BASE_URL } from '../api/API';
import { COLORS } from '../constants/Colors';

export default function CheckoutScreen({ navigation }) {
  const dispatch = useDispatch();

  const { token, user } = useSelector(s => s.auth);
  // ✅ Your cart items structure: { product: {...}, quantity, id }
  const { items } = useSelector(s => s.cart || { items: [] });

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [placing, setPlacing] = useState(false);
  const [payMethod, setPayMethod] = useState('cod'); // cod or online

  const totalAmount = items.reduce((sum, item) => {
    const price = parseFloat(item.product?.price || item.price || 0);
    return sum + price * (item.quantity || 1);
  }, 0);

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handlePlaceOrder = async () => {
    if (!address.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert('Missing Info', 'Please fill all address fields');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Missing Info', 'Please enter your phone number');
      return;
    }

    const fullAddress = `${address}, ${city} - ${pincode}`;

    try {
      setPlacing(true);
      const res = await axios.post(
        `${BASE_URL}/products/orders/`,
        {
          shipping_address: fullAddress,
          phone_number: phone,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        dispatch(clearCart());
        // Navigate to success screen
        navigation.replace('OrderSuccess', {
          order: res.data.order,
        });
      }
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        'Could not place order. Please try again.';
      Alert.alert('Order Failed', msg);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map(item => {
            const p = item.product || item;
            return (
              <View key={item.id?.toString()} style={styles.orderItem}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.orderItemQty}>x{item.quantity}</Text>
                <Text style={styles.orderItemPrice}>
                  ₹{(parseFloat(p.price) * item.quantity).toFixed(2)}
                </Text>
              </View>
            );
          })}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({totalItems} items)</Text>
            <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery</Text>
            <Text
              style={[styles.totalLabel, { color: 'green', fontWeight: '700' }]}
            >
              FREE
            </Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalAmount}>
              ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          <Text style={styles.inputLabel}>Street Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="House no, Street name, Area..."
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 XXXXXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.payOption,
              payMethod === 'cod' && styles.payOptionActive,
            ]}
            onPress={() => setPayMethod('cod')}
          >
            <Icon
              name="money"
              size={24}
              color={payMethod === 'cod' ? '#FF6B6B' : '#666'}
            />
            <View style={styles.payInfo}>
              <Text
                style={[
                  styles.payTitle,
                  payMethod === 'cod' && styles.payTitleActive,
                ]}
              >
                Cash on Delivery
              </Text>
              <Text style={styles.paySub}>Pay when your order arrives</Text>
            </View>
            <Icon
              name={
                payMethod === 'cod'
                  ? 'radio-button-checked'
                  : 'radio-button-unchecked'
              }
              size={22}
              color={payMethod === 'cod' ? '#FF6B6B' : '#ccc'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.payOption,
              payMethod === 'online' && styles.payOptionActive,
            ]}
            onPress={() => setPayMethod('online')}
          >
            <Icon
              name="credit-card"
              size={24}
              color={payMethod === 'online' ? '#FF6B6B' : '#666'}
            />
            <View style={styles.payInfo}>
              <Text
                style={[
                  styles.payTitle,
                  payMethod === 'online' && styles.payTitleActive,
                ]}
              >
                Online Payment
              </Text>
              <Text style={styles.paySub}>UPI, Cards, Net Banking</Text>
            </View>
            <Icon
              name={
                payMethod === 'online'
                  ? 'radio-button-checked'
                  : 'radio-button-unchecked'
              }
              size={22}
              color={payMethod === 'online' ? '#FF6B6B' : '#ccc'}
            />
          </TouchableOpacity>

          {payMethod === 'online' && (
            <View style={styles.onlineNote}>
              <Icon name="info" size={16} color="#4f46e5" />
              <Text style={styles.onlineNoteText}>
                Online payment integration coming soon. Please use COD for now.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <View style={styles.totalPreview}>
          <Text style={styles.totalPreviewLabel}>Total</Text>
          <Text style={styles.totalPreviewAmount}>
            ₹{totalAmount.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.placeOrderBtn,
            (placing || payMethod === 'online') && styles.placeOrderDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={placing || payMethod === 'online'}
        >
          {placing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.placeOrderText}>
              {payMethod === 'online' ? 'Coming Soon' : 'Place Order'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#333' },
  scroll: { padding: 16, paddingBottom: 20 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 14,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemName: { flex: 1, fontSize: 14, color: '#444', fontWeight: '500' },
  orderItemQty: { fontSize: 13, color: '#888', marginHorizontal: 12 },
  orderItemPrice: { fontSize: 14, fontWeight: '700', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: { fontSize: 14, color: '#888' },
  totalAmount: { fontSize: 14, fontWeight: '700', color: '#333' },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#333' },
  grandTotalAmount: { fontSize: 18, fontWeight: '900', color: '#FF6B6B' },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 4,
  },
  row: { flexDirection: 'row', gap: 12 },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#eee',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  payOptionActive: { borderColor: '#FF6B6B', backgroundColor: '#fff5f5' },
  payInfo: { flex: 1 },
  payTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  payTitleActive: { color: '#FF6B6B' },
  paySub: { fontSize: 12, color: '#999', marginTop: 2 },
  onlineNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ede9fe',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  onlineNoteText: { flex: 1, fontSize: 12, color: '#4f46e5', lineHeight: 18 },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 16,
  },
  totalPreview: { flex: 1 },
  totalPreviewLabel: { fontSize: 13, color: '#888' },
  totalPreviewAmount: { fontSize: 20, fontWeight: '900', color: '#FF6B6B' },
  placeOrderBtn: {
    flex: 2,
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  placeOrderDisabled: { backgroundColor: '#aaa' },
  placeOrderText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
