import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup'; //schema validation for forms.
import { useDispatch, useSelector } from 'react-redux';

import {
  loginSuccess,
  setLoading,
  loginStart,
  loginFailure,
} from '../store/slices/authSlice';
import TextInputCustom from '../components/TextInputCustom';
import { BASE_URL } from '../api/API';
import api from '../api/API';
import { setGuest } from '../store/slices/authSlice';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch(); //to send actions to Redux.
  const { loading } = useSelector(state => state.auth); //reducer
  const [isAdminLogin, setIsAdminLogin] = React.useState(false);

  const loginValidationSchema = Yup.object().shape({
    // username: Yup.string()
    //       .min(4, 'Username must be at least 4 characters')
    //       .max(20, 'Username cannot exceed 20 characters')
    //       .required('Username is required')
    //       .matches(
    //         /^[a-zA-Z0-9_]*$/,
    //         'Username can only contain letters, numbers, and underscores',
    //       )
    //       .lowercase()
    //       .trim(),
    // password: Yup.string()
    //       .min(6, 'Password must be at least 6 characters')
    //       .max(50, 'Password cannot exceed 50 characters')
    //       .required('Password is required')
    //       .matches(
    //         /^(?=.*[a-z])/,
    //         'Password must contain at least one lowercase letter',
    //       )
    //       .matches(
    //         /^(?=.*[A-Z])/,
    //         'Password must contain at least one uppercase letter',
    //       )
    //       .matches(/^(?=.*\d)/, 'Password must contain at least one number')
    //       .matches(
    //         /^(?=.*[@$!%*?&])/,
    //         'Password must contain at least one special character (@$!%*?&)',
    //       ),
    username: Yup.string().min(4).required('Username required'),
    password: Yup.string().min(6).required('Password required'),
    user_type: Yup.string()
      .oneOf(['customer', 'admin'], 'Invalid user type')
      .required('User type required'),
  });

  const handleLogin = async values => {
    dispatch(loginStart()); //Start loading
    try {
      console.log('Login Request:', `${BASE_URL}/auth/login/`, values);
      console.log('Values being sent:', JSON.stringify(values, null, 2));
      //const response = await axios.post(`${BASE_URL}/auth/login/`, values);
      const response = await api.post('/auth/login/', values);
      if (response.data.success) {
        console.log('TOKEN:', response.data.access_token);
        console.log('Login successful', response.data);
        const user = response.data.user;
        // You MUST dispatch loginSuccess with the payload.
        // This sets loading to false in your Redux slice.
        dispatch(
          loginSuccess({
            user: response.data.user,
            access_token: response.data.access_token,
          }),
        );
        if (user.user_type === 'admin') {
          console.log('Admin detected, going to Home');
          navigation.replace('Home');
        } else {
          console.log('Customer detected, going to Home');
          navigation.replace('Home'); // Ensure customers also navigate!
        }
      }
    } catch (error) {
      console.log('Login failed:', error.response?.data || error.message);
      // 👈 loginFailure also sets loading to false
      dispatch(
        loginFailure(error.response?.data?.error || 'Something went wrong'),
      );

      Alert.alert(
        'Login Failed',
        error.response?.data?.error || 'Something went wrong',
      );
    } finally {
      //dispatch(setLoading(false));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <Formik
        initialValues={{ username: '', password: '', user_type: 'customer' }}
        validationSchema={loginValidationSchema}
        onSubmit={handleLogin}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => (
          <View style={styles.form}>
            <TextInputCustom
              placeholder="Username"
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              value={values.username}
              error={errors.username && touched.username ? errors.username : ''}
            />
            <TextInputCustom
              placeholder="Password"
              secureTextEntry
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              error={errors.password && touched.password ? errors.password : ''}
            />
            {/* User Type Selector */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.label}>Account Type:</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    values.user_type === 'customer' &&
                      styles.userTypeButtonActive,
                  ]}
                  onPress={() => setFieldValue('user_type', 'customer')}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      values.user_type === 'customer' &&
                        styles.userTypeButtonTextActive,
                    ]}
                  >
                    Customer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    values.user_type === 'admin' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setFieldValue('user_type', 'admin')}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      values.user_type === 'admin' &&
                        styles.userTypeButtonTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.user_type && touched.user_type ? (
                <Text style={styles.errorText}>{errors.user_type}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {/* prevents double submission */}
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => {
                dispatch(setGuest());
                navigation.replace('Home');
              }}
              disabled={loading}
            >
              {/* replace : Login screen is removed from history. */}
              <Text style={styles.guestText}>Continue as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Don't have account? Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 30,
    justifyContent: 'center',
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  form: { gap: 20 },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  guestButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  guestText: { color: '#666', fontSize: 16, fontWeight: '500' },
  signupLink: {
    textAlign: 'center',
    color: '#FF6B6B',
    fontSize: 16,
    marginTop: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#FF6B6B',
  },
  toggleText: {
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: 'white',
  },

  userTypeContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  userTypeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  userTypeButtonTextActive: {
    color: 'white',
  },
});

export default LoginScreen;
