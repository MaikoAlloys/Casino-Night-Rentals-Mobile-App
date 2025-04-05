import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import api from './api';
import { useRouter } from 'expo-router';

export default function DealerLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      return Alert.alert('Missing Fields', 'Please enter both username and password');
    }

    try {
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
        error.response?.data?.message || 'Something went wrong'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dealer Login</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    color: '#222',
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#444',
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
