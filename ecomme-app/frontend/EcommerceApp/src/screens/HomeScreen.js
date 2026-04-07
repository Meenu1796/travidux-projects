import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Image,
  TextInput,
  RefreshControl,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import debounce from 'lodash/debounce';

import { setCategories } from '../store/slices/categorySlice';
import { setCartItems, addToCart } from '../store/slices/cartSlice';
import {
  setWishlistItems,
  addToWishlist,
  removeFromWishlist,
} from '../store/slices/wishlistSlice';
import { BASE_URL } from '../api/API';
import { logout } from '../store/slices/authSlice';
import { COLORS } from '../constants/Colors';
import BottomNavBar from '../components/BottomTabBar';
import ErrorModal from '../components/ErrorModal';
import NetworkErrorScreen from '../components/NetworkErrorScreen';

const { width } = Dimensions.get('window');
const cardWidth = (width - 50) / 2;

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  //const isFocused = useIsFocused();
  const debouncedSearchRef = useRef(null);

  // 1. Redux Selectors
  const auth = useSelector(state => state.auth || {});
  const categories = useSelector(state => state.categories?.items || []);
  const wishlistItems = useSelector(state => state.wishlist?.items || []);
  const cartItems = useSelector(state => state.cart?.items || []);

  // 2. Auth derived variables
  const user = auth.user;
  const isAuthenticated = auth.isAuthenticated;
  // Based on your authSlice, the key is 'token'
  const token = auth.token;
  //const isTokenValid = () => !!token;

  // 3. Admin/Customer state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});
  const [addingToWishlist, setAddingToWishlist] = useState({});

  const isAdmin = user?.user_type === 'admin';
  //const accessToken = user?.access_token;

  const getWishlistProduct = item => item?.product || item;
  const getWishlistProductId = item => item?.product?.id || item?.id;

  // const isTokenValid = useCallback(() => {
  //   return !!(isAuthenticated && user?.accessToken);
  // }, [isAuthenticated, user?.accessToken]);

  // Memoize allTabs
  const allTabs = useMemo(
    () => [
      { id: 0, name: 'For You', icon: 'auto-awesome' },
      ...categories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || 'category',
      })),
    ],
    [categories],
  );

  const loadData = useCallback(async () => {
    //Fetch base data : categories + products
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${BASE_URL}/products/categories/`),
        axios.get(`${BASE_URL}/products/products/`),
      ]);

      dispatch(setCategories(catRes.data));
      setProducts(prodRes.data);
      setAllProducts(prodRes.data);

      if (token) {
        //If logged in : GET /cart and GET / wishlist;
        try {
          const [cartRes, wishlistRes] = await Promise.all([
            axios.get(`${BASE_URL}/products/cart/`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
            axios.get(`${BASE_URL}/products/wishlist/`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
          ]);

          if (cartRes.data) dispatch(setCartItems(cartRes.data));
          if (wishlistRes.data) dispatch(setWishlistItems(wishlistRes.data));
        } catch (authError) {
          console.log('Token expired - using guest mode');
          dispatch(setCartItems([]));
          dispatch(setWishlistItems([]));
        }
      } else {
        // If not logged in : setCartItems([]) and setWishlistItems([]);
        dispatch(setCartItems([]));
        dispatch(setWishlistItems([]));
      }
    } catch (error) {
      console.error('Data Fetch Error:', error);
      if (error.message === 'Network Error' || !error.response) {
        setIsNetworkError(true);
      } else {
        setErrorMessage(
          error.response?.data?.message || 'Failed to load products',
        );
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch, token]);

  //Filters allProducts → updates filteredProducts
  const performSearch = useCallback(
    query => {
      if (!query?.trim()) {
        if (activeTab === 0) {
          setFilteredProducts(products.filter(p => p.is_featured));
        } else {
          const selectedId = allTabs[activeTab]?.id;
          setFilteredProducts(products.filter(p => p.category === selectedId));
        }
        return;
      }

      const searchLower = query.toLowerCase();
      const results = allProducts.filter(
        product =>
          product.name?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category_name?.toLowerCase().includes(searchLower),
      );
      setFilteredProducts(results);
    },
    [activeTab, products, allProducts, allTabs],
  );

  useEffect(() => {
    const debouncedSearch = debounce(text => {
      performSearch(text);
    }, 200);

    debouncedSearchRef.current = debouncedSearch;

    return () => {
      //debouncedSearchRef.current?.cancel();
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [performSearch]);

  const handleSearchChange = useCallback(text => {
    setSearchQuery(text);
    debouncedSearchRef.current?.(text);
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    setShowLogoutModal(false);
    navigation.replace('AuthFlow');
  }, [dispatch, navigation]);

  const handleAddToCart = useCallback(
    async product => {
      if (addingToCart[product.id]) return;
      setAddingToCart(prev => ({ ...prev, [product.id]: true }));

      if (!token) {
        //Guest user : local storage only
        dispatch(addToCart({ product, quantity: 1 }));
        setErrorMessage('Item added to cart!');
        setShowErrorModal(true);
        setTimeout(() => setShowErrorModal(false), 1200);
        setAddingToCart(prev => ({ ...prev, [product.id]: false }));
        return;
      }

      try {
        //Logged in :  POST /cart/
        await axios.post(
          `${BASE_URL}/products/cart/`,
          { product_id: product.id, quantity: 1 },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000,
          },
        );
        dispatch(addToCart({ product, quantity: 1 }));
        setErrorMessage('✓ Item added to cart!');
      } catch (error) {
        dispatch(addToCart({ product, quantity: 1 }));
        setErrorMessage('✓ Added locally');
      } finally {
        setShowErrorModal(true);
        setTimeout(() => setShowErrorModal(false), 1200);
        setAddingToCart(prev => ({ ...prev, [product.id]: false }));
      }
    },
    [addingToCart, dispatch, token],
  );

  //Used to decide:
  // Fetch cart/wishlist from backend OR
  // Work in guest mode
  // const isTokenValid = useCallback(() => {
  //   // Since 'isAuthenticated' is true in your log, use that!
  //   return !!(auth?.isAuthenticated && auth?.user);
  // }, [auth]);

  const handleAddToWishlist = useCallback(
    async product => {
      console.log('isAuthenticated:', isAuthenticated);
      console.log('token:', token);
      if (!token) {
        setErrorMessage('Please login to save wishlist');
        setShowErrorModal(true);
        return;
      }

      if (addingToWishlist[product.id]) return;
      setAddingToWishlist(prev => ({ ...prev, [product.id]: true }));

      const isInWishlist = (wishlistItems || []).some(wishlistItem => {
        const wishlistProduct = getWishlistProduct(wishlistItem);
        return wishlistProduct?.id === product.id;
      });

      try {
        if (isInWishlist) {
          await axios.delete(`${BASE_URL}/products/wishlist/remove_item/`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { product_id: product.id },
          });
          dispatch(removeFromWishlist(product.id));
          setErrorMessage('✓ Removed from wishlist');
        } else {
          await axios.post(
            `${BASE_URL}/products/wishlist/`,
            { product_id: product.id },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          dispatch(addToWishlist({ product }));
          setErrorMessage('✓ Added to wishlist');
        }
        setShowErrorModal(true);
        setTimeout(() => setShowErrorModal(false), 1200);
      } catch (error) {
        console.log('error', error);
        setErrorMessage('Wishlist sync failed');
        setShowErrorModal(true);
      } finally {
        setAddingToWishlist(prev => ({ ...prev, [product.id]: false }));
      }
    },
    [addingToWishlist, dispatch, token, wishlistItems],
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      if (activeTab === 0) {
        setFilteredProducts(products.filter(p => p.is_featured));
      } else {
        const selectedId = allTabs[activeTab]?.id;
        setFilteredProducts(products.filter(p => p.category === selectedId));
      }
    }
  }, [activeTab, products, searchQuery, allTabs]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setSearchQuery('');
      debouncedSearchRef.current?.cancel();
    }, [loadData]),
  );

  //Pull to Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const renderProductCard = useCallback(
    ({ item }) => {
      const isInWishlist = (wishlistItems || []).some(wishlistItem => {
        const wishlistProduct = getWishlistProduct(wishlistItem);
        return wishlistProduct?.id === item.id;
      });
      const isAddingToCartLoading = addingToCart[item.id];
      const isAddingToWishlistLoading = addingToWishlist[item.id];

      return (
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => {
            if (isAdmin && isAdminMode) {
              navigation.navigate('AdminFlow', {
                screen: 'AdminProductDetail',
                params: { product: item },
              });
            } else {
              navigation.navigate('ProductDetail', { product: item });
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.imageContainer}>
            {/* <Image
              source={{ uri: item.image || 'https://via.placeholder.com/150' }}
              style={styles.productImage}
              resizeMode="cover"
            /> */}
            <Image
              source={{ uri: getProductImage(item) }}
              style={styles.productImage}
              resizeMode="cover"
            />
            {/* {item.is_featured && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🔥 Trending</Text>
              </View>
            )} */}
          </View>
          <View style={styles.productInfo}>
            <Text numberOfLines={1} style={styles.productName}>
              {item.name}
            </Text>
            <Text style={styles.productCategory}>
              {allTabs[activeTab]?.name !== 'For You'
                ? allTabs[activeTab]?.name
                : 'Featured'}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>₹{item.price}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.wishlistButton}
                  onPress={() => handleAddToWishlist(item)}
                  disabled={isAddingToWishlistLoading}
                >
                  <Icon
                    name={isInWishlist ? 'favorite' : 'favorite-border'}
                    size={20}
                    color="#FF6B6B"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cartButton}
                  onPress={() => handleAddToCart(item)}
                  disabled={isAddingToCartLoading}
                >
                  {isAddingToCartLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Icon name="add-shopping-cart" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [
      allTabs,
      activeTab,
      wishlistItems,
      addingToCart,
      addingToWishlist,
      handleAddToCart,
      handleAddToWishlist,
      isAdmin,
      isAdminMode,
      navigation,
    ],
  );

  if (isNetworkError) {
    return (
      <NetworkErrorScreen
        onRetry={() => setIsNetworkError(false)}
        onSuccess={loadData}
        searchQuery={searchQuery}
      />
    );
  }

  const getProductImage = product => {
    if (product.image) return product.image;
    if (product.images && product.images.length > 0) {
      return product.images[0].image;
    }
    return 'https://via.placeholder.com/150';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to leave?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={errorMessage}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.first_name || user?.username || 'Guest'}!
          </Text>
          <Text style={styles.headerTitle}>
            {isAdminMode
              ? 'Dashboard'
              : searchQuery
              ? 'Search Results'
              : 'Discover'}
          </Text>
        </View>

        {/* Admin Toggle Button */}
        {isAdmin && (
          <TouchableOpacity
            style={[
              styles.adminToggle,
              isAdminMode && styles.adminToggleActive,
            ]}
            onPress={() => setIsAdminMode(!isAdminMode)}
          >
            <Icon
              name={isAdminMode ? 'storefront' : 'admin-panel-settings'}
              size={20}
              color="white"
            />
            <Text style={styles.adminToggleText}>
              {isAdminMode ? 'Shop' : 'Admin'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Profile Avatar */}
        {!isAdmin && user && (
          <TouchableOpacity onPress={() => setShowLogoutModal(true)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.first_name?.charAt(0) ||
                  user?.username?.charAt(0) ||
                  'G'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Mode Content */}
      {isAdmin && isAdminMode ? (
        <ScrollView
          style={styles.adminPanel}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.sectionTitle}>Store Controls</Text>

          <TouchableOpacity
            style={styles.adminCard}
            onPress={() =>
              navigation.navigate('AdminFlow', { screen: 'ManageCategories' })
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="category" size={28} color="#1E88E5" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Manage Categories</Text>
              <Text style={styles.cardSub}>
                View, Edit, or Delete Categories
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminCard}
            onPress={() =>
              navigation.navigate('AdminFlow', {
                screen: 'ProductManagement',
              })
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
              <Icon name="add-business" size={28} color="#8E24AA" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Add Product</Text>
              <Text style={styles.cardSub}>Upload new items to your store</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  const emptyQuery = '';
                  setSearchQuery(emptyQuery);
                  performSearch(emptyQuery);
                }}
                style={styles.clearButton}
              >
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Tabs */}
          {!searchQuery && (
            <View style={styles.tabBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabScroll}
              >
                {allTabs.map((tab, index) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.tab,
                      activeTab === index && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab(index)}
                  >
                    <Icon
                      name={tab.icon}
                      size={18}
                      color={activeTab === index ? 'white' : '#666'}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === index && styles.activeTabText,
                      ]}
                    >
                      {tab.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Products FlatList */}
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={item =>
              item.id?.toString() || Math.random().toString()
            }
            numColumns={2}
            columnWrapperStyle={styles.productGrid}
            contentContainerStyle={styles.shopContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                progressBackgroundColor="#fff"
              />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Icon name="sentiment-dissatisfied" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? 'No products found'
                      : 'No items found in this category.'}
                  </Text>
                  {searchQuery && (
                    <TouchableOpacity
                      style={styles.browseButton}
                      onPress={() => {
                        const emptyQuery = '';
                        setSearchQuery(emptyQuery);
                        performSearch(emptyQuery);
                      }}
                    >
                      <Text style={styles.browseButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null
            }
            ListHeaderComponent={
              loading && filteredProducts.length === 0 ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  size="large"
                  style={styles.loader}
                />
              ) : null
            }
            removeClippedSubviews={false}
            maxToRenderPerBatch={8}
            windowSize={5}
            initialNumToRender={6}
          />
        </>
      )}

      {/* Bottom Navigation */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
      >
        <BottomNavBar navigation={navigation} currentScreen="Home" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greeting: { fontSize: 14, color: '#666', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },

  // Admin Toggle Styles
  adminToggle: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 5,
    elevation: 4,
  },
  adminToggleActive: { backgroundColor: '#333' },
  adminToggleText: { color: 'white', fontWeight: '700', fontSize: 12 },

  // Admin Panel Styles
  adminPanel: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    color: '#444',
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardSub: { fontSize: 12, color: '#999', marginTop: 2 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: { flexDirection: 'row', gap: 15 },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  logoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
  },
  cancelBtnText: { fontWeight: 'bold', color: '#333' },
  logoutBtnText: { fontWeight: 'bold', color: '#fff' },

  // Existing styles
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },
  clearButton: { padding: 5 },
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabScroll: { paddingHorizontal: 15, paddingVertical: 12 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  activeTab: { backgroundColor: '#FF6B6B' },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  activeTabText: { color: 'white' },
  shopContent: { padding: 15, paddingBottom: 120 },
  productGrid: { justifyContent: 'space-between', gap: 15 },
  productCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 15,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: { position: 'relative', height: 150 },
  productImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  productInfo: { padding: 10 },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: { fontSize: 12, color: '#999', marginBottom: 6 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#FF6B6B' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  wishlistButton: { padding: 5 },
  cartButton: {
    backgroundColor: '#FF6B6B',
    padding: 5,
    borderRadius: 8,
    minWidth: 30,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 },
  browseButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  browseButtonText: { color: 'white', fontWeight: '600' },
  loader: { marginTop: 50 },
});
