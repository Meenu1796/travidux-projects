import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const EmptyList = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/to-do-list.png')}
        style={styles.logo}
      />
      <Text>Start adding your task</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  logo: { width: 150, height: 150, borderRadius: 20 },
  todoText: {
    fontSize: 18,
    color: 'black',
  },
});

export default EmptyList;
