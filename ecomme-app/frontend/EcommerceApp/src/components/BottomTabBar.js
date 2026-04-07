import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

const BottomTabBar = ({ navigation, currentScreen }) => {
  const cartItemCount = useSelector(state => state.cart?.items?.length || 0);
  const wishlistCount = useSelector(
    state => state.wishlist?.items?.length || 0,
  );

  const navItems = [
    { name: 'Home', icon: 'home', screen: 'Home' },
    {
      name: 'Wishlist',
      icon: 'favorite-border',
      screen: 'Wishlist',
      badge: wishlistCount,
    },
    {
      name: 'Cart',
      icon: 'shopping-cart',
      screen: 'Cart',
      badge: cartItemCount,
    },
    { name: 'Profile', icon: 'person-outline', screen: 'Profile' },
  ];

  return (
    <View style={styles.bottomBar}>
      {navItems.map(item => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => navigation.navigate(item.screen)}
        >
          <View>
            <Icon
              name={item.icon}
              size={26}
              color={currentScreen === item.screen ? '#FF6B6B' : '#666'}
            />
            {item.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.navText,
              { color: currentScreen === item.screen ? '#FF6B6B' : '#666' },
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 5,
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  badge: {
    position: 'absolute',
    right: -8,
    top: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});

export default BottomTabBar;
