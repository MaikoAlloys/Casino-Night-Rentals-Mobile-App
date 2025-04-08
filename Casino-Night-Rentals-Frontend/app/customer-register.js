import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import api from './api';

export default function CustomerRegister() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    password: "",
  });

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleRegister = async () => {
    const { username, first_name, last_name, phone_number, email, password } = form;

    // Validation
    if (!username || !first_name || !last_name || !phone_number || !email || !password) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    if (!/^[0-9]{10}$/.test(phone_number)) {
      Alert.alert("Error", "Phone number must be exactly 10 digits.");
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      Alert.alert("Error", "Invalid email format.");
      return;
    }

    try {
      const response = await api.post("/customer/register", form);

      if (response.data) {
        Alert.alert("Success", "Registration successful! Await admin approval.");
        router.push("/customer-login");
      } else {
        throw new Error("Registration failed");
      }

    } catch (error) {
      const errorMessage = error.response?.data?.error || "Network error, please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to get started</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your username" 
            placeholderTextColor="#999"
            onChangeText={(value) => handleChange("username", value)}
          />

          <View style={styles.nameContainer}>
            <View style={[styles.nameInput, { marginRight: 10 }]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="First name" 
                placeholderTextColor="#999"
                onChangeText={(value) => handleChange("first_name", value)}
              />
            </View>
            <View style={styles.nameInput}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Last name" 
                placeholderTextColor="#999"
                onChangeText={(value) => handleChange("last_name", value)}
              />
            </View>
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={styles.input} 
            placeholder="10-digit phone number" 
            placeholderTextColor="#999"
            keyboardType="numeric" 
            onChangeText={(value) => handleChange("phone_number", value)}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput 
            style={styles.input} 
            placeholder="your@email.com" 
            placeholderTextColor="#999"
            keyboardType="email-address" 
            autoCapitalize="none"
            onChangeText={(value) => handleChange("email", value)}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Create a password" 
            placeholderTextColor="#999"
            secureTextEntry 
            onChangeText={(value) => handleChange("password", value)}
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/customer-login")}>
              <Text style={styles.loginLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#718096",
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4a5568",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1a202c",
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nameInput: {
    flex: 1,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#4299e1",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#718096",
    fontSize: 14,
  },
  loginLink: {
    color: "#4299e1",
    fontSize: 14,
    fontWeight: "600",
  },
});