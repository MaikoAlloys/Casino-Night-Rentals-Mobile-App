import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from './api';
import { useRouter } from 'expo-router';

export default function DealerLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      return Alert.alert('Missing Fields', 'Please enter both username and password');
    }

    try {
      setLoading(true);
      const res = await api.post('/dealers/login', { username, password });
      const dealer = res.data.dealer;

      console.log("Dealer ID:", dealer.id);

      Alert.alert('Login Successful', `Welcome ${dealer.first_name || dealer.username}`);

      // Pass dealer ID to next page
      router.push({ pathname: '/dealer-dashboard', params: { id: dealer.id } });

    } catch (error) {
      console.error(error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-circle" size={80} color="#3498db" />
        <Text style={styles.title}>Dealer Portal</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="person" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          placeholder="Username"
          placeholderTextColor="#95a5a6"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#95a5a6"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
      </View>

      <TouchableOpacity 
        onPress={handleLogin} 
        style={styles.button}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#3498db',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#2980b9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});