import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/Colors';

const WIDTH = (Dimensions.get('window').width - 48) / 2;

export default function ProductCard({
  item,
  onPress,
  onWishlist,
  isWishlisted,
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageBox}>
        <Image
          source={{ uri: `http://10.0.2.2:8000${item.image}` }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.wishBtn} onPress={onWishlist}>
          <Icon
            name="heart"
            size={16}
            color={isWishlisted ? COLORS.error : COLORS.textLight}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.price}>₹{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: WIDTH,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageBox: { position: 'relative' },
  image: { width: '100%', height: 180 },
  wishBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 6,
    elevation: 2,
  },
  info: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
});
