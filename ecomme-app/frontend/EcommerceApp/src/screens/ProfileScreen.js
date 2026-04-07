import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { logout } from '../store/slices/authSlice';
import { clearCart } from '../store/slices/cartSlice';
import { clearWishlist } from '../store/slices/wishlistSlice';
import { BASE_URL } from '../api/API';
import { COLORS } from '../constants/Colors';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import ErrorModal from '../components/ErrorModal';
import NetworkErrorScreen from '../components/NetworkErrorScreen';
import { checkNetworkConnection } from '../utils/networkUtils';

// ─── Order Status Badge ───────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colorMap = {
    Pending: { bg: '#FFF8E1', text: '#F9A825' },
    Processing: { bg: '#E3F2FD', text: '#1565C0' },
    Shipped: { bg: '#E8EAF6', text: '#3949AB' },
    Delivered: { bg: '#E8F5E9', text: '#2E7D32' },
    Cancelled: { bg: '#FFEBEE', text: '#C62828' },
  };
  const colors = colorMap[status] || colorMap.Pending;
  return (
    <View style={[statusStyles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[statusStyles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
};

const statusStyles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  text: { fontSize: 12, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();

  const auth = useSelector(state => state.auth || {});
  const user = auth.user;
  const token = auth.token; // ← correct: use auth.token, NOT user.access_token
  const isAuthenticated = auth.isAuthenticated;
  const isGuest = auth.isGuest;

  const [activeTab, setActiveTab] = useState('account');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'buyagain') {
      fetchOrders();
    }
  }, [activeTab]);

  // ── Guest / unauthenticated guard ─────────────────────────────────────────
  if (!isAuthenticated || isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Profile" showBack showSearch />
        <View style={styles.guestContainer}>
          <View style={styles.guestCard}>
            <Icon name="person-outline" size={60} color="#999" />
            <Text style={styles.guestTitle}>Login Required</Text>
            <Text style={styles.guestText}>
              Please login to view your profile, orders, and account details.
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('AuthFlow')}
            >
              <Text style={styles.loginButtonText}>Login Now</Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomTabBar navigation={navigation} currentScreen="Profile" />
      </SafeAreaView>
    );
  }

  // ── Fetch orders using the correct Bearer token ───────────────────────────
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        setIsNetworkError(true);
        return;
      }

      // KEY FIX: use `token` from auth state, not `user.access_token`
      const response = await axios.get(`${BASE_URL}/products/orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log(
        'Fetch orders error:',
        error?.response?.status,
        error?.response?.data,
      );
      if (!error.response) {
        setIsNetworkError(true);
      } else if (error.response.status === 401) {
        setErrorMessage('Session expired. Please login again.');
        setShowErrorModal(true);
      } else {
        setErrorMessage('Failed to load orders');
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          dispatch(clearCart());
          dispatch(clearWishlist());
          navigation.replace('AuthFlow');
        },
      },
    ]);
  };

  const handleBuyAgain = order => {
    order.items?.forEach(item => {
      // Dispatch add to cart for each item
    });
    navigation.navigate('Cart');
  };

  const handleSearch = query => {
    if (query.trim()) navigation.navigate('SearchResults', { query });
  };

  const handleNetworkRetry = async () => {
    setIsNetworkError(false);
    if (activeTab === 'orders' || activeTab === 'buyagain') {
      await fetchOrders();
    }
  };

  if (isNetworkError) {
    return <NetworkErrorScreen onRetry={handleNetworkRetry} />;
  }

  // ── Account tab ───────────────────────────────────────────────────────────
  const renderAccountInfo = () => (
    <View style={styles.accountContainer}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.first_name?.charAt(0) || ''}
            {user?.last_name?.charAt(0) || ''}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        {[
          {
            icon: 'person',
            label: 'Full Name',
            value:
              `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
              'N/A',
          },
          { icon: 'email', label: 'Email', value: user?.email || 'N/A' },
          {
            icon: 'phone',
            label: 'Phone',
            value: user?.phone_number || 'Not provided',
          },
          {
            icon: 'person-outline',
            label: 'Username',
            value: user?.username || 'N/A',
          },
          {
            icon: 'badge',
            label: 'Account Type',
            value: user?.user_type === 'admin' ? 'Administrator' : 'Customer',
            valueStyle: {
              color: user?.user_type === 'admin' ? COLORS.primary : '#4CAF50',
            },
          },
        ].map(row => (
          <View key={row.label} style={styles.infoRow}>
            <Icon name={row.icon} size={20} color="#666" />
            <Text style={styles.infoLabel}>{row.label}:</Text>
            <Text style={[styles.infoValue, row.valueStyle]}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={22} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Orders tab ────────────────────────────────────────────────────────────
  const renderOrders = () => (
    <View style={styles.ordersContainer}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loader}
        />
      ) : orders.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Icon name="receipt-long" size={64} color="#ddd" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubText}>
            Your order history will appear here.
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            {/* Order header */}
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>
                  #{order.order_number || order.id}
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <StatusBadge status={order.status} />
            </View>

            {/* Order items */}
            {order.items && order.items.length > 0 && (
              <View style={styles.orderItems}>
                {order.items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.orderItemRow}>
                    {item.product_image ? (
                      <Image
                        source={{ uri: item.product_image }}
                        style={styles.orderItemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.orderItemImage,
                          styles.orderItemImagePlaceholder,
                        ]}
                      >
                        <Icon name="image" size={22} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName} numberOfLines={1}>
                        {item.product_name}
                      </Text>
                      <Text style={styles.orderItemMeta}>
                        Qty: {item.quantity} • ₹{item.price} each
                      </Text>
                    </View>
                    <Text style={styles.orderItemSubtotal}>
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Order footer */}
            <View style={styles.orderFooter}>
              <Text style={styles.orderItemsCount}>
                {order.total_items || order.items?.length || 0} item
                {(order.total_items || order.items?.length || 0) !== 1
                  ? 's'
                  : ''}
              </Text>
              <Text style={styles.orderTotal}>
                Total: ₹{order.total_amount}
              </Text>
            </View>

            {order.status === 'Delivered' && (
              <TouchableOpacity
                style={styles.buyAgainButton}
                onPress={() => handleBuyAgain(order)}
              >
                <Icon name="repeat" size={16} color={COLORS.primary} />
                <Text style={styles.buyAgainText}>Buy Again</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );

  // ── Buy Again tab ─────────────────────────────────────────────────────────
  const renderBuyAgain = () => {
    const delivered = orders.filter(o => o.status === 'Delivered');
    return (
      <View style={styles.ordersContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : delivered.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Icon name="shopping-bag" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No delivered orders yet</Text>
            <Text style={styles.emptySubText}>
              Delivered orders will appear here for easy reorder.
            </Text>
          </View>
        ) : (
          delivered.map(order => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>
                    #{order.order_number || order.id}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <StatusBadge status={order.status} />
              </View>

              {order.items &&
                order.items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.orderItemRow}>
                    {item.product_image ? (
                      <Image
                        source={{ uri: item.product_image }}
                        style={styles.orderItemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.orderItemImage,
                          styles.orderItemImagePlaceholder,
                        ]}
                      >
                        <Icon name="image" size={22} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName} numberOfLines={1}>
                        {item.product_name}
                      </Text>
                      <Text style={styles.orderItemMeta}>
                        Qty: {item.quantity}
                      </Text>
                    </View>
                  </View>
                ))}

              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>₹{order.total_amount}</Text>
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => handleBuyAgain(order)}
                >
                  <Icon name="repeat" size={16} color="#fff" />
                  <Text style={styles.reorderButtonText}>Reorder All</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  // ── Full render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="My Profile" showBack showSearch onSearch={handleSearch} />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
        }}
        errorMessage={errorMessage}
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'account', icon: 'person', label: 'Account' },
          { key: 'orders', icon: 'receipt', label: 'Orders' },
          { key: 'buyagain', icon: 'replay', label: 'Buy Again' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? COLORS.primary : '#888'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'account' && renderAccountInfo()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'buyagain' && renderBuyAgain()}
      </ScrollView>

      <BottomTabBar navigation={navigation} currentScreen="Profile" />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },

  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  guestTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  guestText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 12,
    marginTop: 8,
  },
  loginButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 12, color: '#888' },
  activeTabText: { color: COLORS.primary, fontWeight: '600' },

  // Account
  accountContainer: { padding: 16 },
  avatarContainer: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13, color: '#888', width: 100 },
  infoValue: { flex: 1, fontSize: 13, color: '#333', fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingVertical: 13,
  },
  logoutButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Orders
  ordersContainer: { padding: 16 },
  loader: { marginTop: 50 },
  emptyOrders: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#888' },
  emptySubText: { fontSize: 13, color: '#bbb', textAlign: 'center' },
  shopButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 8,
  },
  shopButtonText: { color: '#fff', fontWeight: '700' },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: '#222' },
  orderDate: { fontSize: 12, color: '#999', marginTop: 2 },

  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    gap: 10,
  },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  orderItemImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontSize: 13, fontWeight: '600', color: '#333' },
  orderItemMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  orderItemSubtotal: { fontSize: 13, fontWeight: '700', color: '#333' },

  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderItemsCount: { fontSize: 12, color: '#999' },
  orderTotal: { fontSize: 15, fontWeight: '800', color: '#222' },

  buyAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buyAgainText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reorderButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
