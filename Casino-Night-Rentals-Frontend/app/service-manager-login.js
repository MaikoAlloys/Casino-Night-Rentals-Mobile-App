import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import api from "./api";

const ServiceManagerLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert("Validation Error", "Please enter both username and password");
            return;
        }

        setError("");
        setLoading(true);
        
        try {
            const response = await api.post("/servicemanager/login", { username, password });

            if (response.data.success) {
                await AsyncStorage.setItem("serviceManagerToken", JSON.stringify(response.data.user));
                router.push("/service-manager-dashboard");
                Alert.alert("Login Successful", "Welcome back!");
            } else {
                setError(response.data.message || "Invalid credentials");
                Alert.alert("Login Failed", response.data.message || "Invalid credentials");
            }
        } catch (err) {
            // setError("Network error. Please try again.");
            Alert.alert("Failed", "Incorrect username or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <MaterialIcons name="miscellaneous-services" size={48} color="#27ae60" />
                <Text style={styles.title}>Service Manager Portal</Text>
                <Text style={styles.subtitle}>Please sign in to continue</Text>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={20} color="#e74c3c" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#7f8c8d" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#95a5a6"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color="#7f8c8d" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#95a5a6"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <TouchableOpacity 
                style={styles.button} 
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? "Signing In..." : "Sign In"}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f8f9fa"
    },
    header: {
        alignItems: "center",
        marginBottom: 40
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        color: "#2c3e50",
        marginTop: 16
    },
    subtitle: {
        fontSize: 14,
        color: "#7f8c8d",
        marginTop: 8
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    inputIcon: {
        marginRight: 12
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: "#2c3e50"
    },
    button: {
        backgroundColor: "#27ae60",
        height: 50,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        shadowColor: "#1e8449",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600"
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        padding: 12,
        backgroundColor: "#fde8e8",
        borderRadius: 8
    },
    errorText: {
        color: "#e74c3c",
        marginLeft: 8,
        fontSize: 14
    }
});

export default ServiceManagerLogin;
