import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/Colors';
import axios from 'axios';
import { SelectList } from 'react-native-dropdown-select-list';
import { useSelector, useDispatch } from 'react-redux';
import { setCategories } from '../../store/slices/categorySlice';
import { BASE_URL } from '../../api/API';

const AddEditProduct = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth || {});
  const { items } = useSelector(state => state.categories);
  const { product, categoryId, categoryName } = route.params || {};

  // ── Form fields ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(String(product?.price || ''));
  const [stock, setStock] = useState(String(product?.stock || 0));
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [sizes, setSizes] = useState(
    Array.isArray(product?.sizes) ? product.sizes.join(', ') : '',
  );
  const [colors, setColors] = useState(
    Array.isArray(product?.colors) ? product.colors.join(', ') : '',
  );
  const [warranty, setWarranty] = useState(product?.warranty || '');
  const [petBreed, setPetBreed] = useState(product?.pet_breed || '');
  const [petAge, setPetAge] = useState(product?.pet_age || '');

  // ── Schema / images / loading ─────────────────────────────────────────────
  const [editSchema, setEditSchema] = useState(null);
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const [imageUris, setImageUris] = useState([]); // newly picked local URIs
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    product?.category || categoryId || '',
  );

  // ── Load schema + categories ──────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
      // Editing: fetch schema from API
      axios
        .get(`${BASE_URL}/products/products/${product.id}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        .then(res => {
          setEditSchema(res.data.editSchema);
          setExistingImages(res.data.product.images || []);
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load product schema');
          setEditSchema({ allowedFields: [] });
        });
    } else {
      // Adding: build schema from category name
      const cat = (categoryName || '').toLowerCase();
      const base = ['name', 'description', 'price', 'stock', 'is_featured'];
      const allowedFields =
        {
          pets: [...base, 'pet_breed', 'pet_age'],
          clothing: [...base, 'sizes', 'colors', 'gender'],
          shoes: [...base, 'sizes', 'colors', 'gender'],
          electronics: [...base, 'warranty'],
          accessories: [...base],
        }[cat] || base;

      setEditSchema({ category: cat, allowedFields });
    }
  }, [product, token, categoryName]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products/categories/`);
      dispatch(setCategories(res.data));
    } catch (e) {
      console.log('Could not load categories', e);
    }
  };

  const categoryOptions = (items || []).map(cat => ({
    key: cat.id,
    value: cat.name,
  }));

  const showField = field => editSchema?.allowedFields.includes(field);

  // ── Image picker ──────────────────────────────────────────────────────────
  const onPickImages = () => {
    const { launchImageLibrary } = require('react-native-image-picker');
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 0, includeBase64: false },
      response => {
        if (response.didCancel || response.errorCode) return;
        const assets = response.assets || [];
        const newUris = assets.map(a => a.uri).filter(Boolean);
        setImageUris(prev => [...prev, ...newUris]);
      },
    );
  };

  // ── Upload pending images to an existing product ──────────────────────────
  const uploadImages = async productId => {
    if (imageUris.length === 0) return;

    const formData = new FormData();
    imageUris.forEach((uri, idx) => {
      formData.append('images', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: 'image/jpeg',
        name: `product_image_${idx}.jpg`,
      });
    });

    await axios.post(
      `${BASE_URL}/products/add-images/${productId}/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT manually set Content-Type — axios sets the correct
          // multipart/form-data boundary automatically when body is FormData
        },
      },
    );
    setImageUris([]);
  };

  // ── Submit (create or update) ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'Not logged in as admin');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }

    // Build payload as a plain JS object (JSON body)
    const payload = {
      name: title.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      is_featured: isFeatured,
      category: selectedCategory,
    };

    if (showField('sizes'))
      payload.sizes = sizes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    if (showField('colors'))
      payload.colors = colors
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    if (showField('warranty')) payload.warranty = warranty;
    if (showField('pet_breed')) payload.pet_breed = petBreed;
    if (showField('pet_age')) payload.pet_age = petAge;
    if (showField('gender')) payload.gender = product?.gender || 'U';

    setLoading(true);
    try {
      let res;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      if (product) {
        res = await axios.patch(
          `${BASE_URL}/products/products/${product.id}/`,
          payload,
          { headers },
        );
      } else {
        res = await axios.post(`${BASE_URL}/products/products/`, payload, {
          headers,
        });
      }

      const productId = product?.id || res.data.id;

      // Upload any selected images separately (multipart)
      if (imageUris.length > 0 && productId) {
        try {
          await uploadImages(productId);
        } catch (imgErr) {
          console.log('Image upload error:', imgErr?.response?.data);
          Alert.alert('Warning', 'Product saved but image upload failed');
        }
      }

      Alert.alert(
        'Success',
        product ? 'Product updated!' : 'Product created!',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.log('Save error status:', error.response?.status);
      console.log('Save error data:', JSON.stringify(error.response?.data));

      if (error.response?.status === 401) {
        Alert.alert('Unauthorized', 'Please login again as admin');
      } else {
        const msg =
          JSON.stringify(error.response?.data) ||
          error.message ||
          'Save failed';
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!editSchema) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {product ? 'Edit Product' : 'Add Product'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── CATEGORY PICKER ───────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            {/* <Picker
              selectedValue={selectedCategory}
              onValueChange={val => setSelectedCategory(val)}
              style={styles.picker}
            >
              <Picker.Item label="— Select a category —" value="" />
              {(items || []).map(cat => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker> */}
            <SelectList
              setSelected={val => setSelectedCategory(val)}
              data={categoryOptions}
              save="key"
              defaultOption={
                selectedCategory
                  ? {
                      key: selectedCategory,
                      value:
                        items.find(c => c.id === selectedCategory)?.name ||
                        'Select category',
                    }
                  : { key: '', value: 'Select category' }
              }
              boxStyles={styles.dropdown}
              dropdownStyles={styles.dropdownMenu}
            />
          </View>
        </View>

        {/* ── TITLE ────────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="Enter product name"
          />
        </View>

        {/* ── DESCRIPTION ──────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.multiline]}
            multiline
            numberOfLines={4}
            placeholder="Product description"
            textAlignVertical="top"
          />
        </View>

        {/* ── PRICE ────────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="0.00"
          />
        </View>

        {/* ── STOCK ────────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Stock</Text>
          <TextInput
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="0"
          />
        </View>

        {/* ── FEATURED ─────────────────────────────────────────────────── */}
        {showField('is_featured') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Featured Product?</Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsFeatured(v => !v)}
            >
              <View
                style={[styles.checkbox, isFeatured && styles.checkboxActive]}
              >
                {isFeatured && <Icon name="check" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>
                {isFeatured ? 'Yes — show in Featured' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SIZES (clothing / shoes) ──────────────────────────────────── */}
        {showField('sizes') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sizes (comma-separated)</Text>
            <TextInput
              value={sizes}
              onChangeText={setSizes}
              style={styles.input}
              placeholder="S, M, L, XL"
            />
          </View>
        )}

        {/* ── COLORS (clothing / shoes) ─────────────────────────────────── */}
        {showField('colors') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Colors (comma-separated)</Text>
            <TextInput
              value={colors}
              onChangeText={setColors}
              style={styles.input}
              placeholder="Red, Blue, Black"
            />
          </View>
        )}

        {/* ── WARRANTY (electronics) ───────────────────────────────────── */}
        {showField('warranty') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Warranty</Text>
            <TextInput
              value={warranty}
              onChangeText={setWarranty}
              style={styles.input}
              placeholder="e.g. 1 year"
            />
          </View>
        )}

        {/* ── PET BREED ────────────────────────────────────────────────── */}
        {showField('pet_breed') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Pet Breed</Text>
            <TextInput
              value={petBreed}
              onChangeText={setPetBreed}
              style={styles.input}
              placeholder="e.g. Labrador"
            />
          </View>
        )}

        {/* ── PET AGE ──────────────────────────────────────────────────── */}
        {showField('pet_age') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Pet Age</Text>
            <TextInput
              value={petAge}
              onChangeText={setPetAge}
              style={styles.input}
              placeholder="e.g. 1–3 years"
            />
          </View>
        )}

        {/* ── IMAGES ───────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Images</Text>

          {/* Existing images from server */}
          {existingImages.length > 0 && (
            <>
              <Text style={styles.subLabel}>Current images:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {existingImages.map((img, idx) => (
                  <Image
                    key={img.id || idx}
                    source={{ uri: img.image }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* Newly picked images (pending upload) */}
          {imageUris.length > 0 && (
            <>
              <Text style={styles.subLabel}>New images to upload:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {imageUris.map((uri, idx) => (
                  <View key={idx} style={styles.imagePreview}>
                    <Image
                      source={{ uri }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageIcon}
                      onPress={() =>
                        setImageUris(prev => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <Icon name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          <TouchableOpacity
            style={styles.addImageButton}
            onPress={onPickImages}
          >
            <Icon name="add-photo-alternate" size={20} color="#fff" />
            <Text style={styles.addImageButtonText}>Add Images</Text>
          </TouchableOpacity>
        </View>

        {/* ── SAVE BUTTON ──────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {product ? 'Update Product' : 'Create Product'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddEditProduct;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  dropdown: {
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },

  dropdownMenu: {
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: '#666', fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#333' },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  fieldGroup: { marginBottom: 16 },

  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
  subLabel: { fontSize: 12, color: '#888', marginBottom: 6, marginTop: 4 },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  multiline: { minHeight: 90, paddingTop: 10 },

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: { height: 50, color: '#333' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: { fontSize: 14, color: '#444' },

  imagePreview: { position: 'relative', marginRight: 10 },
  thumbImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  removeImageIcon: {
    position: 'absolute',
    top: -6,
    right: 4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    padding: 2,
  },

  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#607D8B',
  },
  addImageButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  saveButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
