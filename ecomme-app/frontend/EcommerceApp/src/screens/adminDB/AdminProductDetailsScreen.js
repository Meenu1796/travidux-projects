import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

import { BASE_URL } from '../../api/API';
import { COLORS } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function AdminProductDetailsScreen({ route, navigation }) {
  const initialProduct = route.params.product;

  const [product, setProduct] = useState(initialProduct);
  const [allImages, setAllImages] = useState([]);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const flatListRef = useRef(null);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/products/products/${initialProduct.id}/`,
      );

      const p = res.data.product || res.data;
      setProduct(p);

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
      console.log(e);
    }
  };

  const renderImageItem = ({ item }) => (
    <View style={{ width, height: 320 }}>
      <Image
        source={
          item.image
            ? { uri: item.image }
            : { uri: 'https://via.placeholder.com/400x320' }
        }
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEditProduct', { product })}
        >
          <Icon name="edit" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* IMAGE GALLERY */}
        <View style={styles.galleryContainer}>
          <FlatList
            ref={flatListRef}
            data={allImages}
            renderItem={renderImageItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => String(i)}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImgIdx(idx);
            }}
          />

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
        </View>

        {/* PRODUCT INFO */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>

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

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Available Sizes</Text>
              <View style={styles.optionsRow}>
                {product.sizes.map(size => (
                  <View key={size} style={styles.optionButton}>
                    <Text style={styles.optionText}>{size}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Available Colors</Text>
              <View style={styles.optionsRow}>
                {product.colors.map(color => (
                  <View
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color.toLowerCase() },
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  galleryContainer: {
    position: 'relative',
    height: 320,
    backgroundColor: '#f0f0f0',
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

  infoContainer: { padding: 16 },

  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  productPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },

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
    marginTop: 14,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  description: { fontSize: 14, color: '#555', lineHeight: 22 },

  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },

  optionText: { fontSize: 13, color: '#444' },

  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ddd',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
});
