import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants/Colors';

export default function OrderSuccessScreen({ navigation, route }) {
  const { order } = route.params || {};

  // Animated checkmark
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const STATUS_MAP = {
    Pending: { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
    Processing: { color: '#3b82f6', bg: '#dbeafe', label: 'Processing' },
    Shipped: { color: '#8b5cf6', bg: '#ede9fe', label: 'Shipped' },
    Delivered: { color: '#10b981', bg: '#d1fae5', label: 'Delivered' },
    Cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'Cancelled' },
  };

  const statusInfo = STATUS_MAP[order?.status] || STATUS_MAP.Pending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated checkmark */}
        <Animated.View
          style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.iconCircle}>
            <Icon name="check" size={60} color="white" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>Order Placed! 🎉</Text>
          <Text style={styles.subtitle}>
            Thank you for your purchase. Your order has been received.
          </Text>

          {/* Order Details Card */}
          {order && (
            <View style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Order Number</Text>
                <Text style={styles.orderValue}>
                  #{order.order_number || order.id}
                </Text>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusInfo.bg },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: statusInfo.color }]}
                  >
                    {statusInfo.label}
                  </Text>
                </View>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Total Amount</Text>
                <Text style={styles.orderAmount}>₹{order.total_amount}</Text>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Delivery Address</Text>
                <Text
                  style={[styles.orderValue, { flex: 1, textAlign: 'right' }]}
                  numberOfLines={2}
                >
                  {order.shipping_address}
                </Text>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Date</Text>
                <Text style={styles.orderValue}>
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Order Items */}
          {order?.items?.length > 0 && (
            <View style={styles.itemsCard}>
              <Text style={styles.itemsTitle}>Items Ordered</Text>
              {order.items.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.product_name}
                  </Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Delivery info */}
          <View style={styles.infoBox}>
            <Icon name="local-shipping" size={22} color="#FF6B6B" />
            <Text style={styles.infoText}>
              Your order will be delivered within 3-7 business days
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.replace('Profile')}
          >
            <Icon name="receipt" size={20} color="white" />
            <Text style={styles.primaryBtnText}>View My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconWrap: { marginBottom: 24 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  orderCard: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderLabel: { fontSize: 13, color: '#888', fontWeight: '500' },
  orderValue: { fontSize: 13, fontWeight: '700', color: '#333' },
  orderAmount: { fontSize: 18, fontWeight: '900', color: '#FF6B6B' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  itemsCard: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: { flex: 1, fontSize: 13, color: '#444', fontWeight: '500' },
  itemQty: { fontSize: 12, color: '#888', marginHorizontal: 10 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#333' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 12,
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#eee',
  },
  secondaryBtnText: { color: '#666', fontSize: 15, fontWeight: '600' },
});
