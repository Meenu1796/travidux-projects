import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { addTodo } from '../redux/ToDoSlice.js';
import { COLORS } from '../constants/Colors.js';

// useDispatch  → a React Redux hook that gives you
//                the dispatch function
//                dispatch is how you SEND actions to Redux store
//                like a postman that delivers your message

const TodoSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(50, 'Title must be under 50 characters')
    .required('Task title is required'),
  date: Yup.string().required('Please select a date'),
  time: Yup.string().nullable(), // optional
});

const formatDate = d =>
  d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatTime = d =>
  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export default function R_AddToDoScreen({ navigation }) {
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const dispatch = useDispatch();
  // Gets the dispatch function from Redux.
  // This is how you talk to the Redux store.

  const handleSubmit = async values => {
    const newTodo = {
      id: Date.now().toString(),
      title: values.title.trim(),
      completed: false,
      datetime:
        values.date || values.time
          ? `${values.date || ''}${
              values.time ? ' at ' + values.time : ''
            }`.trim()
          : null,
      createdAt: new Date().toISOString(),
    };

    try {
      setSaving(true);
      dispatch(addTodo(newTodo));
      //       addTodo(newTodo) creates an action:
      // {
      //     type: 'todos/addTodo',
      //     payload: {
      //         id: '1742387400000',
      //         title: 'Buy groceries',
      //         completed: false,
      //         datetime: 'Fri, Mar 19, 2026 at 10:30 AM',
      //         createdAt: '2026-03-19T10:30:00.000Z'
      //     }
      // }
      // dispatch() sends that action to the Redux store
      // Redux store passes it to the reducer:
      // addTodo: (state, action) => {
      //     state.todos.unshift(action.payload) ← adds to top
      // }
      // Store updates → persistor auto saves to AsyncStorage
      // TodoListScreen's useSelector detects change because useSelector watches the store for changes
      // FlatList re-renders with new todo at top

      navigation.goBack();
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Could not save the task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.grey} />

      <Formik
        initialValues={{ title: '', date: '', time: '' }}
        validationSchema={TodoSchema}
        validateOnChange={true}
        validateOnBlur={true}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit: formikSubmit,
          setFieldValue,
          setFieldTouched,
        }) => (
          <>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  style={styles.icons}
                  onPress={() => navigation.goBack()}
                />
                <Text style={styles.headerTitle}>New Task</Text>
                <View style={{ width: 60 }} />
              </View>

              {/* Card  */}
              <View style={styles.card}>
                <Text style={styles.label}>Task Title</Text>
                <TextInput
                  style={[
                    styles.input,
                    touched.title && errors.title && styles.inputError,
                    touched.title &&
                      !errors.title &&
                      values.title &&
                      styles.inputSuccess,
                  ]}
                  placeholder="Add a task.."
                  placeholderTextColor="#555577"
                  value={values.title}
                  onChangeText={handleChange('title')}
                  onBlur={handleBlur('title')}
                />
                {touched.title && errors.title && (
                  <View style={styles.errorRow}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={13}
                      color="#E05252"
                    />
                    <Text style={styles.errorText}>{errors.title}</Text>
                  </View>
                )}

                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={[styles.pickerBtn]}
                  onPress={() => {
                    setFieldTouched('date', true); // mark as touched because pickers don't have onChangeText

                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      values.date && styles.pickerTextSelected,
                    ]}
                  >
                    {values.date || 'Select a date'}
                  </Text>
                  {touched.date && errors.date && (
                    <View style={styles.errorRow}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={13}
                        color="#E05252"
                      />
                      <Text style={styles.errorText}>{errors.date}</Text>
                    </View>
                  )}
                  {values.date && (
                    <TouchableOpacity
                      onPress={() => setFieldValue('date', '')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.clearBtn}>✕</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {/* Time Picker */}
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => {
                    setFieldTouched('time', true);
                    setShowTimePicker(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      values.time && styles.pickerTextSelected,
                    ]}
                  >
                    {values.time || 'Select a time (optional)'}
                  </Text>
                  {values.time && (
                    <TouchableOpacity
                      onPress={() => setFieldValue('time', '')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.clearBtn}>✕</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* Submit Button  */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!values.title.trim() || saving) && styles.submitBtnDisabled,
                ]}
                onPress={formikSubmit}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" /> //spinner
                ) : (
                  <Text style={styles.submitBtnText}>Add Task</Text>
                )}
              </TouchableOpacity>
            </ScrollView>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <DatePicker
                modal
                open={showDatePicker}
                date={dateObj}
                mode="date"
                minimumDate={new Date()}
                onConfirm={d => {
                  setShowDatePicker(false);
                  if (d) {
                    setDateObj(d);
                    setFieldValue('date', formatDate(d));
                  }
                }}
                onCancel={() => setShowDatePicker(false)}
              />
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
              <DatePicker
                modal
                open={showTimePicker}
                date={dateObj}
                mode="time"
                onConfirm={t => {
                  setShowTimePicker(false);
                  if (t) {
                    setDateObj(prev => {
                      const updated = new Date(prev);
                      updated.setHours(t.getHours());
                      updated.setMinutes(t.getMinutes());
                      return updated;
                    });
                    setFieldValue('time', formatTime(t));
                  }
                }}
                onCancel={() => setShowTimePicker(false)}
              />
            )}
          </>
        )}
      </Formik>
    </SafeAreaView>
  );
}

// newTodo object built
//     ↓
// dispatch(addTodo(newTodo)) → sent to Redux store
//     ↓
// Reducer adds to todos array
//     ↓
// persistor saves to AsyncStorage
//     ↓
// navigation.goBack()
//     ↓
// TodoListScreen re-renders with new todo at top

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.beige,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.orange,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: COLORS.grey,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.grey,
  },
  icons: {
    fontSize: 30,
    backgroundColor: COLORS.beige,
    padding: 10,
    color: COLORS.orange,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a2e',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.grey,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: 'black',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.beige,
  },
  inputError: {
    borderColor: '#E05252',
    borderWidth: 1.5,
  },
  inputSuccess: {
    borderColor: '#34C38F',
    borderWidth: 1.5,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#E05252',
    fontWeight: '500',
  },
  pickerBtn: {
    backgroundColor: COLORS.grey,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.beige,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: '#555577',
  },
  pickerTextSelected: {
    color: 'black',
    fontWeight: '500',
  },
  clearBtn: {
    color: '#555577',
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 8,
  },
  submitBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.orange,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

// REDUX STORE
//                    (global storage)
//                     [ todos data ]
//                          ↕
//         ┌────────────────┼────────────────┐
//         ↕                ↕                ↕
// TodoListScreen    AddTodoScreen    Any other screen
