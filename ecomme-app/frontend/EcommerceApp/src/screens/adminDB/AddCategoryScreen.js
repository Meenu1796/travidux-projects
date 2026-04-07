import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';

import { createCategory, updateCategoryApi } from '../../api/productAPI'; // Ensure these exist
import { addCategory, updateCategory } from '../../store/slices/categorySlice';
import { COLORS } from '../../constants/Colors';

export default function AddCategoryScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);

  // Check if we are EDITING an existing category
  const editData = route.params?.category;

  const [name, setName] = useState(editData?.name || '');
  const [icon, setIcon] = useState(editData?.icon || 'category');
  const [image, setImage] = useState(null); // Local picked image
  const [loading, setLoading] = useState(false);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, response => {
      if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0]);
      }
    });
  };

  const handleSave = async () => {
    console.log('Current Token in Redux:', token); // 👈 CHECK THIS IN YOUR CONSOLE

    if (!token) {
      console.log(token);
      Alert.alert('Error', 'You are not logged in properly.');
      return;
    }
    // Validation: Name and Icon are REQUIRED. Image is OPTIONAL.
    if (!name.trim() || !icon.trim()) {
      Alert.alert('Error', 'Category Name and Icon are required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('icon', icon);

    // Only append image if a NEW one was picked
    if (image) {
      formData.append('image', {
        uri:
          Platform.OS === 'android'
            ? image.uri
            : image.uri.replace('file://', ''),
        type: image.type || 'image/jpeg',
        name: image.fileName || 'category.jpg',
      });
    }

    try {
      setLoading(true);
      if (editData) {
        // UPDATE MODE
        const response = await updateCategoryApi(editData.id, formData, token);
        dispatch(updateCategory(response));
        Alert.alert('Success', 'Category updated successfully!');
      } else {
        // ADD MODE
        const response = await createCategory(formData, token);
        dispatch(addCategory(response));
        Alert.alert('Success', 'Category added successfully!');
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Operation failed. Please check your backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeContainer}
      edges={['right', 'left', 'bottom', 'top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {editData ? 'Edit Category' : 'Add Category'}
        </Text>

        <Text style={styles.label}>Category Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Electronics"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Material Icon Name *</Text>
        <View style={styles.iconRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="e.g. home, laptop"
            value={icon}
            onChangeText={setIcon}
          />
          <View style={styles.iconPreview}>
            <Icon
              name={icon || 'help-outline'}
              size={30}
              color={COLORS.primary}
            />
          </View>
        </View>

        <Text style={styles.label}>Category Image (Optional)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : editData?.image ? (
            <Image
              source={{ uri: editData.image }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.placeholder}>
              <Icon name="add-a-photo" size={40} color="#ccc" />
              <Text style={{ color: '#999' }}>Select Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveBtnText}>
              {editData ? 'Update Category' : 'Save Category'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  safeContainer: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconPreview: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 10,
  },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 50,
  },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
