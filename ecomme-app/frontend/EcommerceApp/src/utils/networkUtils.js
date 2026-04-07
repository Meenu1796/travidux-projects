import NetInfo from '@react-native-community/netinfo';

/**
 * Checks if device has active internet connection
 * @returns {Promise<boolean>} - True if connected, false otherwise
 */
export const checkNetworkConnection = async () => {
  try {
    const netInfoState = await NetInfo.fetch();
    return netInfoState.isConnected && netInfoState.isInternetReachable;
  } catch (error) {
    console.log('Network check error:', error);
    return false;
  }
};

/**
 * Checks connection and executes callback if connected
 * @param {Function} onSuccess - Callback to execute when connected
 * @returns {Promise<boolean>} - True if connected and callback executed
 */
export const withNetworkCheck = async onSuccess => {
  const isConnected = await checkNetworkConnection();

  if (isConnected) {
    if (onSuccess) await onSuccess();
    return true;
  }

  return false;
};
