import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/Colors';

export default function AddTodoScreen({ navigation, route }) {
  const [title, setTitle] = useState(''); //Stores task text
  const [date, setDate] = useState(new Date()); //Stores selected date & time
  const [showDatePicker, setShowDatePicker] = useState(false); //Controls date picker visibility
  const [showTimePicker, setShowTimePicker] = useState(false); //Controls time picker visibility
  const [dateSelected, setDateSelected] = useState(false); //Tracks if user picked a date
  const [timeSelected, setTimeSelected] = useState(false); //Tracks if user picked a time

  const formatDate = d =>
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }); //Fri, Mar 19, 2026

  const formatTime = d =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); //10:30 AM

  //   const onDateChange = (event, selectedDate) => {
  //     console.log('Date selected by user:', selectedDate);
  //     setShowDatePicker(false);
  //     if (selectedDate) {
  //       setDate(selectedDate);
  //       setDateSelected(true);
  //       console.log('Formatted Date for UI:', formatDate(selectedDate));
  //     }
  //   };
  // Remove 'event' from the arguments

  //call upon the date is selected
  const onDateChange = selectedDate => {
    console.log('Date selected by user:', selectedDate);
    if (selectedDate) {
      setDate(selectedDate); //Save it in state
      setDateSelected(true); //Mark that date is selected
    }
  };
  const onTimeChange = selectedTime => {
    if (selectedTime) {
      setDate(prev => {
        const updated = new Date(prev);
        updated.setHours(selectedTime.getHours());
        updated.setMinutes(selectedTime.getMinutes());
        return updated; //modifying the existing date object with hours & minutes
      });
      setTimeSelected(true);
    }
  };

  //   const onTimeChange = (event, selectedTime) => {
  //     setShowTimePicker(false);
  //     if (selectedTime) {
  //       setDate(prev => {
  //         const updated = new Date(prev);
  //         updated.setHours(selectedTime.getHours());
  //         updated.setMinutes(selectedTime.getMinutes());
  //         return updated;
  //       });
  //       setTimeSelected(true);
  //     }
  //   };

  const handleSubmit = () => {
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
              timeSelected ? ' at ' + formatTime(date) : ''
            }`
          : null, //Fri, Mar 19, 2026 at 10:30 AM | Fri, Mar 19, 2026 | null
      createdAt: new Date().toISOString(), //timestamp for sorting or future purpose
    };
    console.log('newTodo', newTodo);
    //navigation.navigate('TodoList', { newTodo });
    route.params?.addTodo?.(newTodo); // send data back to TodoListScreen
    navigation.goBack(); // 👈 return
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.grey} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        // keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="arrow-left"
            style={styles.icons}
            onPress={() => navigation.goBack()}
          />
          {/* <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity> */}
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
          {/* <Text style={styles.charCount}>{title.length}/150</Text> */}

          {/* Date Picker */}
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            {/* <Text style={styles.pickerIcon}>🗓</Text> */}
            <Text
              style={[
                styles.pickerText,
                dateSelected && styles.pickerTextSelected,
              ]}
            >
              {/* Shows selected value OR placeholder */}
              {dateSelected ? formatDate(date) : 'Select a date (optional)'}
            </Text>
            {dateSelected && (
              <TouchableOpacity
                onPress={() => setDateSelected(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
              //   <MaterialCommunityIcons
              //     name="close-circle-outline"
              //     style={styles.clearBtn}
              //     onPress={() => setDateSelected(false)}
              //   />
            )}
          </TouchableOpacity>

          {/* Time Picker */}
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            {/* <Text style={styles.pickerIcon}>⏰</Text> */}
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

          {/* Preview */}
          {/* {(dateSelected || timeSelected) && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Due:</Text>
              <Text style={styles.previewText}>
                {formatDate(date)}
                {timeSelected ? ` at ${formatTime(date)}` : ''}
              </Text>
            </View>
          )} */}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !title.trim() && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>Add Task</Text>
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
        // <DateTimePicker
        //   value={date}
        //   mode="date"
        //   display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        //   onChange={onDateChange}
        //   minimumDate={new Date()}
        // />
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
        // <DateTimePicker
        //   value={date}
        //   mode="time"
        //   display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        //   onChange={onTimeChange}
        // />
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
  backBtn: {
    width: 60,
  },
  backBtnText: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 30, // Equivalent to 'size' prop
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
  charCount: {
    fontSize: 11,
    color: '#555577',
    textAlign: 'right',
    marginTop: 4,
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
  pickerIcon: {
    fontSize: 18,
    marginRight: 10,
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
  preview: {
    marginTop: 16,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  previewLabel: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '700',
  },
  previewText: {
    fontSize: 13,
    color: '#c4b5fd',
    fontWeight: '500',
    flex: 1,
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
