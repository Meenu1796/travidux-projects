import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { addToCart } from '../store/slices/cartSlice';
import {
  addToWishlist,
  removeFromWishlist,
} from '../store/slices/wishlistSlice';
import { BASE_URL } from '../api/API';
import { COLORS } from '../constants/Colors';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import ErrorModal from '../components/ErrorModal';
import NetworkErrorScreen from '../components/NetworkErrorScreen';
import { checkNetworkConnection } from '../utils/networkUtils';

const { width } = Dimensions.get('window');

// ─── Star Rating component ────────────────────────────────────────────────────
const StarRating = ({ rating, size = 18, interactive = false, onRate }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => interactive && onRate && onRate(star)}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Icon
            name={
              rating >= star
                ? 'star'
                : rating >= star - 0.5
                ? 'star-half'
                : 'star-border'
            }
            size={size}
            color="#FFB300"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ visible, onClose, onSubmit, existingReview }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setTitle('');
      setComment('');
    }
  }, [existingReview, visible]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select at least 1 star.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ rating, title, comment });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={reviewStyles.overlay}>
        <View style={reviewStyles.sheet}>
          <View style={reviewStyles.header}>
            <Text style={reviewStyles.headerTitle}>
              {existingReview ? 'Edit Your Review' : 'Write a Review'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={reviewStyles.label}>Your Rating *</Text>
          <StarRating
            rating={rating}
            size={32}
            interactive
            onRate={setRating}
          />

          <Text style={[reviewStyles.label, { marginTop: 16 }]}>
            Title (optional)
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={reviewStyles.input}
            placeholder="Summarise your experience"
          />

          <Text style={[reviewStyles.label, { marginTop: 12 }]}>
            Comment (optional)
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            style={[reviewStyles.input, reviewStyles.multiline]}
            multiline
            numberOfLines={4}
            placeholder="Tell others about this product…"
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[reviewStyles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={reviewStyles.submitTxt}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductDetailScreen({ navigation, route }) {
  const { product: initialProduct } = route.params;
  const dispatch = useDispatch();

  const { user, token, isAuthenticated, isGuest } = useSelector(s => s.auth);
  const wishlistItems = useSelector(s => s.wishlist?.items || []);

  const [product, setProduct] = useState(initialProduct);
  const [allImages, setAllImages] = useState([]); // cover + extra images
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Error handling
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);

  const flatListRef = useRef(null);

  // ── Wishlist state: check by product id ────────────────────────────────────
  const wishlistEntry = wishlistItems.find(i => i.product?.id === product.id);
  const isInWishlist = !!wishlistEntry;

  // ── Load full product details (includes images array) ────────────────────
  useEffect(() => {
    loadProduct();
    loadReviews();
  }, []);

  const loadProduct = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/products/products/${initialProduct.id}/`,
      );
      const p = res.data.product || res.data; // handle both wrapped and flat responses
      setProduct(p);

      // Build image list: main image first, then extra images
      const imgs = [];
      if (p.image) imgs.push({ id: 'main', image: p.image });
      if (Array.isArray(p.images)) {
        p.images.forEach(img => {
          if (img.image && img.image !== p.image) imgs.push(img);
        });
      }
      setAllImages(
        imgs.length > 0 ? imgs : [{ id: 'placeholder', image: null }],
      );
    } catch (e) {
      console.log('loadProduct error:', e);
      // Use initial data if fetch fails
      const p = initialProduct;
      const imgs = [];
      if (p.image) imgs.push({ id: 'main', image: p.image });
      if (Array.isArray(p.images)) p.images.forEach(img => imgs.push(img));
      setAllImages(
        imgs.length > 0 ? imgs : [{ id: 'placeholder', image: null }],
      );
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/products/reviews/?product=${initialProduct.id}`,
      );
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log('loadReviews error:', e);
    } finally {
      setReviewsLoading(false);
    }
  };

  // ── Wishlist toggle ────────────────────────────────────────────────────────
  const handleToggleWishlist = async () => {
    if (isGuest || !isAuthenticated || !token) {
      Alert.alert(
        'Login Required',
        'Please login to save items to your wishlist',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('AuthFlow') },
        ],
      );
      return;
    }
    try {
      const connected = await checkNetworkConnection();
      if (!connected) {
        setIsNetworkError(true);
        return;
      }

      if (isInWishlist) {
        await axios.delete(`${BASE_URL}/products/wishlist/remove_item/`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { product_id: product.id },
        });
        dispatch(removeFromWishlist(product.id));
      } else {
        const res = await axios.post(
          `${BASE_URL}/products/wishlist/`,
          { product_id: product.id },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        dispatch(addToWishlist(res.data));
      }
    } catch (error) {
      setErrorMessage('Failed to update wishlist');
      setShowErrorModal(true);
    }
  };

  // ── Add to cart ────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (isGuest || !isAuthenticated || !token) {
      Alert.alert('Login Required', 'Please login to add items to cart', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('AuthFlow') },
      ]);
      return;
    }
    try {
      setAddingToCart(true);
      await axios.post(
        `${BASE_URL}/products/cart/`,
        { product_id: product.id, quantity },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      dispatch(addToCart({ product, quantity }));
      Alert.alert('Added to Cart 🛒', product.name, [
        { text: 'Continue Shopping' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // ── Submit review ──────────────────────────────────────────────────────────
  const handleSubmitReview = async ({ rating, title, comment }) => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to leave a review');
      return;
    }
    await axios.post(
      `${BASE_URL}/products/reviews/`,
      { product_id: product.id, rating, title, comment },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    // Reload reviews + product (to refresh average rating)
    await Promise.all([loadReviews(), loadProduct()]);
  };

  const myReview = reviews.find(r => r.username === user?.username);

  const handleSearch = query => {
    if (query.trim()) navigation.navigate('SearchResults', { query });
  };

  if (isNetworkError) {
    return (
      <NetworkErrorScreen
        onRetry={() => {
          setIsNetworkError(false);
          loadProduct();
        }}
      />
    );
  }

  // ── Image gallery item ─────────────────────────────────────────────────────
  const renderImageItem = ({ item, index }) => (
    <View style={{ width, height: 320 }}>
      <Image
        source={
          item.image
            ? { uri: item.image }
            : { uri: 'https://via.placeholder.com/400x320?text=No+Image' }
        }
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Product Details"
        showBack
        showSearch
        onSearch={handleSearch}
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={errorMessage}
      />

      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        existingReview={myReview}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── IMAGE GALLERY ──────────────────────────────────────────────── */}
        <View style={styles.galleryContainer}>
          <FlatList
            ref={flatListRef}
            data={allImages}
            renderItem={renderImageItem}
            keyExtractor={(item, i) => String(item.id || i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImgIdx(idx);
            }}
          />

          {/* Wishlist heart */}
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={handleToggleWishlist}
          >
            <Icon
              name={isInWishlist ? 'favorite' : 'favorite-border'}
              size={28}
              color={isInWishlist ? '#FF6B6B' : '#fff'}
            />
          </TouchableOpacity>

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <View style={styles.dotsRow}>
              {allImages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImgIdx && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Image counter badge */}
          {allImages.length > 1 && (
            <View style={styles.imgCountBadge}>
              <Text style={styles.imgCountText}>
                {activeImgIdx + 1}/{allImages.length}
              </Text>
            </View>
          )}

          {(isGuest || !isAuthenticated) && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeTxt}>Login to buy & save</Text>
            </View>
          )}
        </View>

        {/* ── PRODUCT INFO ─────────────────────────────────────────────── */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating summary row */}
          <View style={styles.ratingRow}>
            <StarRating rating={product.average_rating || 0} size={18} />
            <Text style={styles.ratingValue}>
              {(product.average_rating || 0).toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({product.review_count || reviews.length} review
              {(product.review_count || reviews.length) !== 1 ? 's' : ''})
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{product.price}</Text>
            <View
              style={[
                styles.stockBadge,
                product.stock === 0 && styles.outOfStock,
              ]}
            >
              <Text style={styles.stockText}>
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Category-specific fields */}
          {product.warranty && (
            <View style={styles.specRow}>
              <Icon name="verified-user" size={16} color="#666" />
              <Text style={styles.specText}>Warranty: {product.warranty}</Text>
            </View>
          )}
          {product.pet_breed && (
            <View style={styles.specRow}>
              <Icon name="pets" size={16} color="#666" />
              <Text style={styles.specText}>Breed: {product.pet_breed}</Text>
            </View>
          )}
          {product.pet_age && (
            <View style={styles.specRow}>
              <Icon name="cake" size={16} color="#666" />
              <Text style={styles.specText}>Age: {product.pet_age}</Text>
            </View>
          )}

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.optionsRow}>
                {product.sizes.map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.optionButton,
                      selectedSize === size && styles.optionButtonActive,
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedSize === size && styles.optionTextActive,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Select Color</Text>
              <View style={styles.optionsRow}>
                {product.colors.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color.toLowerCase() },
                      selectedColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Quantity */}
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
            >
              <Icon name="remove" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(q => q + 1)}
            >
              <Icon name="add" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {/* ── REVIEWS SECTION ──────────────────────────────────────────── */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {isAuthenticated && !isGuest && (
              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() => setShowReviewModal(true)}
              >
                <Icon name="edit" size={16} color={COLORS.primary} />
                <Text style={styles.writeReviewTxt}>
                  {myReview ? 'Edit Review' : 'Write Review'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {reviewsLoading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: 20 }}
            />
          ) : reviews.length === 0 ? (
            <View style={styles.noReviews}>
              <Icon name="rate-review" size={40} color="#ddd" />
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first!
              </Text>
            </View>
          ) : (
            reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {(review.user_full_name ||
                        review.username ||
                        '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewAuthor}>
                      {review.user_full_name || review.username}
                    </Text>
                    <StarRating rating={review.rating} size={14} />
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {review.title ? (
                  <Text style={styles.reviewTitle}>{review.title}</Text>
                ) : null}
                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : null}
              </View>
            ))
          )}

          <View style={{ height: 16 }} />
        </View>
      </ScrollView>

      {/* ── BOTTOM ACTIONS ─────────────────────────────────────────────── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.buyNowButton,
            (product.stock === 0 || addingToCart) && { opacity: 0.6 },
          ]}
          onPress={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buyNowText}>
              {isGuest || !isAuthenticated ? 'Login to Buy' : 'Add to Cart'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewCartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="shopping-cart" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <BottomTabBar navigation={navigation} currentScreen="ProductDetail" />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  galleryContainer: {
    position: 'relative',
    height: 320,
    backgroundColor: '#f0f0f0',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: '#fff', width: 20 },
  imgCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  imgCountText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  guestBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  guestBadgeTxt: { color: '#fff', fontSize: 12 },

  infoContainer: { padding: 16 },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  ratingValue: { fontSize: 14, fontWeight: '700', color: '#333' },
  reviewCount: { fontSize: 13, color: '#888' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productPrice: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  outOfStock: { backgroundColor: '#FFEBEE' },
  stockText: { fontSize: 12, fontWeight: '600', color: '#388E3C' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginTop: 14,
    marginBottom: 8,
  },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },

  specRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  specText: { fontSize: 13, color: '#555' },

  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  optionText: { fontSize: 13, color: '#444' },
  optionTextActive: { color: COLORS.primary, fontWeight: '700' },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorButtonActive: { borderColor: '#333', transform: [{ scale: 1.15 }] },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },

  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 4,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  writeReviewTxt: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  noReviews: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  noReviewsText: { color: '#aaa', fontSize: 14 },

  reviewCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reviewMeta: { flex: 1, gap: 3 },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: '#222' },
  reviewDate: { fontSize: 11, color: '#aaa', marginTop: 2 },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewComment: { fontSize: 13, color: '#555', lineHeight: 20 },

  bottomActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  viewCartButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const reviewStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  multiline: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
  submitBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
