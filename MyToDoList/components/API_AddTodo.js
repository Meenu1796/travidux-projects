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
import { COLORS } from '../constants/Colors.js';
import { saveTodo } from '../api/todoAPI';

export default function API_AddTodo({ navigation, route }) {
  const [title, setTitle] = useState(''); //task text input
  const [date, setDate] = useState(new Date()); //stores selected date & time
  const [showDatePicker, setShowDatePicker] = useState(false); //controls date modal
  const [showTimePicker, setShowTimePicker] = useState(false); //controls time modal
  const [dateSelected, setDateSelected] = useState(false); //whether user picked a date
  const [timeSelected, setTimeSelected] = useState(false); //whether user picked time
  const [saving, setSaving] = useState(false);

  const formatDate = d =>
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }); //Fri, Mar 19, 2026

  const formatTime = d =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); //10:30 AM

  const onDateChange = selectedDate => {
    console.log('Date selected:', selectedDate);
    if (selectedDate) {
      setDate(selectedDate);
      setDateSelected(true);
    }
  };

  const onTimeChange = selectedTime => {
    if (selectedTime) {
      setDate(prev => {
        const updated = new Date(prev);
        updated.setHours(selectedTime.getHours());
        updated.setMinutes(selectedTime.getMinutes());
        return updated;
      });
      setTimeSelected(true);
    }
  };

  //Save to DB then pass back to TodoListScreen
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Alert!', 'Please enter a task title.');
      return;
    }

    const newTodo = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      datetime:
        dateSelected || timeSelected
          ? `${formatDate(date)}${
              timeSelected ? ' at ' + formatTime(date) : '' //Fri, Mar 19, 2026 at 10:30 AM"
            }`
          : null,
      createdAt: new Date().toISOString(),
    };

    try {
      setSaving(true);
      const saved = await saveTodo(newTodo); // ✅ save to Django API
      route.params?.addTodo?.(saved);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not save the task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.grey} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="arrow-left"
            style={styles.icons}
            onPress={() => navigation.goBack()} //back button
          />
          <Text style={styles.headerTitle}>New Task</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Add a task.."
            placeholderTextColor="#555577"
            value={title}
            onChangeText={setTitle}
          />

          {/* Date Picker */}
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowDatePicker(true)} //Opens modal
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pickerText,
                dateSelected && styles.pickerTextSelected,
              ]}
            >
              {dateSelected ? formatDate(date) : 'Select a date (optional)'}
            </Text>
            {dateSelected && (
              <TouchableOpacity
                onPress={() => setDateSelected(false)} //Removes chosen date/time
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
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pickerText,
                timeSelected && styles.pickerTextSelected,
              ]}
            >
              {timeSelected ? formatTime(date) : 'Select a time (optional)'}
            </Text>
            {timeSelected && (
              <TouchableOpacity
                onPress={() => setTimeSelected(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!title.trim() || saving) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={saving} //Prevents multiple taps
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" /> //component that shows a loading spinner
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
          date={date}
          mode="date"
          minimumDate={new Date()}
          onConfirm={d => {
            setShowDatePicker(false);
            onDateChange(d);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DatePicker
          modal
          open={showTimePicker}
          date={date}
          mode="time"
          onConfirm={t => {
            setShowTimePicker(false);
            onTimeChange(t);
          }}
          onCancel={() => setShowTimePicker(false)}
        />
      )}
    </SafeAreaView>
  );
}

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
