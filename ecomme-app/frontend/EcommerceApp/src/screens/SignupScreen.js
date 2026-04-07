import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { loginSuccess, setLoading } from '../store/slices/authSlice';
import TextInputCustom from '../components/TextInputCustom';
import { BASE_URL } from '../api/API';

const SignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);

  // Comprehensive Signup validation schema
  const signupValidationSchema = Yup.object().shape({
    first_name: Yup.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters')
      .required('First name is required')
      .matches(
        /^[a-zA-Z\s]*$/,
        'First name can only contain letters and spaces',
      )
      .trim(),

    last_name: Yup.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters')
      .required('Last name is required')
      .matches(/^[a-zA-Z\s]*$/, 'Last name can only contain letters and spaces')
      .trim(),

    username: Yup.string()
      .min(4, 'Username must be at least 4 characters')
      .max(20, 'Username cannot exceed 20 characters')
      .required('Username is required')
      .matches(
        /^[a-zA-Z0-9_]*$/,
        'Username can only contain letters, numbers, and underscores',
      )
      .lowercase()
      .trim(),

    email: Yup.string()
      .email('Please enter a valid email address (e.g., name@example.com)')
      .required('Email is required')
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be in a valid format')
      .lowercase()
      .trim(),

    phone_number: Yup.string()
      .required('Phone number is required')
      .matches(
        /^\+?[0-9]{9,15}$/,
        'Phone number must be 9-15 digits and can include + prefix (e.g., +1234567890 or 1234567890)',
      )
      .test(
        'no-spaces',
        'Phone number cannot contain spaces',
        value => !value?.includes(' '),
      )
      .trim(),

    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password cannot exceed 50 characters')
      .required('Password is required')
      .matches(
        /^(?=.*[a-z])/,
        'Password must contain at least one lowercase letter',
      )
      .matches(
        /^(?=.*[A-Z])/,
        'Password must contain at least one uppercase letter',
      )
      .matches(/^(?=.*\d)/, 'Password must contain at least one number')
      .matches(
        /^(?=.*[@$!%*?&])/,
        'Password must contain at least one special character (@$!%*?&)',
      ),

    confirm_password: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
  });

  const handleSignup = async values => {
    dispatch(setLoading(true));
    try {
      // Remove confirm_password before sending to backend
      const { confirm_password, ...signupData } = values;

      console.log('Signup Request:', `${BASE_URL}/auth/register/`);
      console.log('Values being sent:', JSON.stringify(signupData, null, 2));

      const response = await axios.post(
        `${BASE_URL}/auth/register/`,
        signupData,
      );

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Account created successfully! Please login with your credentials.',
          [
            {
              text: 'OK',
              onPress: () => {
                dispatch(setLoading(false)); // Reset loading before navigating
                navigation.replace('Login');
              },
            },
          ],
        );
      }
    } catch (error) {
      console.log('ERROR DATA:', error.response?.data);

      // Handle different error types
      let errorMessage = 'Something went wrong. Please try again.';

      if (error.response?.data) {
        const errors = error.response.data;

        // Check for field-specific errors
        if (errors.username) {
          errorMessage = `Username: ${errors.username[0]}`;
        } else if (errors.email) {
          errorMessage = `Email: ${errors.email[0]}`;
        } else if (errors.phone_number) {
          errorMessage = `Phone: ${errors.phone_number[0]}`;
        } else if (errors.non_field_errors) {
          errorMessage = errors.non_field_errors[0];
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        } else if (errors.error) {
          errorMessage = errors.error;
        }
      }

      Alert.alert('Signup Failed', errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today</Text>

        <Formik
          initialValues={{
            first_name: '',
            last_name: '',
            username: '',
            email: '',
            phone_number: '',
            password: '',
            confirm_password: '',
          }}
          validationSchema={signupValidationSchema}
          onSubmit={handleSignup}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isValid,
            dirty,
          }) => (
            <View style={styles.form}>
              {/* First Name Field */}
              <View>
                <TextInputCustom
                  placeholder="First Name *"
                  onChangeText={handleChange('first_name')}
                  onBlur={handleBlur('first_name')}
                  value={values.first_name}
                  error={
                    errors.first_name && touched.first_name
                      ? errors.first_name
                      : ''
                  }
                />
              </View>

              {/* Last Name Field */}
              <View>
                <TextInputCustom
                  placeholder="Last Name *"
                  onChangeText={handleChange('last_name')}
                  onBlur={handleBlur('last_name')}
                  value={values.last_name}
                  error={
                    errors.last_name && touched.last_name
                      ? errors.last_name
                      : ''
                  }
                />
              </View>

              {/* Username Field */}
              <View>
                <TextInputCustom
                  placeholder="Username *"
                  onChangeText={handleChange('username')}
                  onBlur={handleBlur('username')}
                  value={values.username}
                  error={
                    errors.username && touched.username ? errors.username : ''
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.hintText}>
                  Username can contain letters, numbers, and underscores only
                </Text>
              </View>

              {/* Email Field */}
              <View>
                <TextInputCustom
                  placeholder="Email *"
                  keyboardType="email-address"
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  error={errors.email && touched.email ? errors.email : ''}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Phone Number Field */}
              <View>
                <TextInputCustom
                  placeholder="Phone Number *"
                  keyboardType="phone-pad"
                  onChangeText={handleChange('phone_number')}
                  onBlur={handleBlur('phone_number')}
                  value={values.phone_number}
                  error={
                    errors.phone_number && touched.phone_number
                      ? errors.phone_number
                      : ''
                  }
                />
                <Text style={styles.hintText}>
                  Enter 9-15 digits (e.g., 1234567890 or +1234567890)
                </Text>
              </View>

              {/* Password Field */}
              <View>
                <TextInputCustom
                  placeholder="Password *"
                  secureTextEntry
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  error={
                    errors.password && touched.password ? errors.password : ''
                  }
                />
                <Text style={styles.hintText}>
                  Password must contain: 6+ chars, uppercase, lowercase, number,
                  special char (@$!%*?&)
                </Text>
              </View>

              {/* Confirm Password Field */}
              <View>
                <TextInputCustom
                  placeholder="Confirm Password *"
                  secureTextEntry
                  onChangeText={handleChange('confirm_password')}
                  onBlur={handleBlur('confirm_password')}
                  value={values.confirm_password}
                  error={
                    errors.confirm_password && touched.confirm_password
                      ? errors.confirm_password
                      : ''
                  }
                />
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  loading && styles.buttonDisabled,
                  (!isValid || !dirty) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading || !isValid || !dirty}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.loginLinkContainer}
              >
                <Text style={styles.loginLink}>
                  Already have an account? Log In
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 30,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  form: {
    gap: 15,
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLinkContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  loginLink: {
    textAlign: 'center',
    color: '#FF6B6B',
    fontSize: 16,
  },
  hintText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default SignupScreen;
