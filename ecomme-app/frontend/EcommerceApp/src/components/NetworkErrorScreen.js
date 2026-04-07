import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import { checkNetworkConnection } from '../utils/networkUtils';

const { width, height } = Dimensions.get('window');

const NetworkErrorScreen = ({ onRetry, onSuccess, searchQuery = '' }) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);

    try {
      const isConnected = await checkNetworkConnection();

      if (isConnected) {
        if (onSuccess) {
          await onSuccess();
        }
        if (onRetry) {
          await onRetry(searchQuery);
        }
      }
    } catch (error) {
      console.log('Retry failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Text style={styles.emojiIcon}>📡</Text>
      </View>
      <Text style={styles.oopsText}>OOPS!</Text>
      <Text style={styles.noInternetText}>NO INTERNET</Text>
      <Text style={styles.messageText}>
        Please check your internet connection and try again.
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRetry}
        disabled={isChecking}
      >
        {isChecking ? (
          <ActivityIndicator color="#FF6B6B" />
        ) : (
          <Text style={styles.retryButtonText}>TRY AGAIN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  imageContainer: { marginBottom: 30 },
  emojiIcon: { fontSize: 80 },
  oopsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    letterSpacing: 2,
  },
  noInternetText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 15,
    letterSpacing: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 1,
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: 'transparent',
  },
  retryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default NetworkErrorScreen;
