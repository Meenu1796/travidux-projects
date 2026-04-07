import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
// useDispatch() → send actions to Redux store
// useSelector() → read data from Redux store
import { setLoading } from '../store/slices/authSlice';

const SplashScreen = ({ navigation }) => {
  const dispatch = useDispatch(); //to send actions to Redux.
  const { isAuthenticated, user } = useSelector(state => state.auth);
  //reads the auth slice from Redux -> tells us if the user is logged in.

  useEffect(() => {
    dispatch(setLoading(true));
    const timer = setTimeout(() => {
      dispatch(setLoading(false));
      if (isAuthenticated) {
        console.log('isAuthenticated : ', isAuthenticated);
        //(?.) Prevents crash if user is null
        //Check user from Redux state
        if (user?.user_type === 'admin') {
          navigation.replace('Home');
          console.log('I am admin : ', user?.user_type);
        } else {
          navigation.replace('Home');
          console.log('I am customer : ', user?.user_type);
        }
      } else {
        console.log('I am guest : ', user?.user_type);
        navigation.replace('AuthFlow'); //(login/register screens).
      }
    }, 2000); //Wait 2 seconds

    return () => clearTimeout(timer);
  }, [dispatch, navigation, isAuthenticated, user]);
  //Component mounts
  //OR when dependencies change (isAuthenticated, user, etc.)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>E-Commee</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
});

export default SplashScreen;
