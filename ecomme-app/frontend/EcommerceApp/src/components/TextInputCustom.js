import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const TextInputCustom = ({
  placeholder,
  secureTextEntry, //if true, hides text
  value,
  onChangeText, //callback when input loses focus
  onBlur,
  error,
  keyboardType,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        autoCapitalize="none"
        keyboardType={keyboardType}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  inputError: { borderColor: '#FF6B6B' },
  errorText: { color: '#FF6B6B', fontSize: 14 },
});

export default TextInputCustom;
