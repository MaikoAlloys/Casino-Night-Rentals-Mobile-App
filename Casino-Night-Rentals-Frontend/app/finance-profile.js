import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import api from "./api";

const FinanceProfile = () => {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await api.get("/finance/profile");
                if (response.data.success) {
                    setProfile(response.data.profile);
                    setError(null);
                } else {
                    setError(response.data.error || "Failed to fetch profile");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                setError("Network error, please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#e74c3c" />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Finance Profile</Text>
            </View>

            {profile && (
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            <MaterialIcons name="account-circle" size={48} color="#3498db" />
                        </View>
                        <Text style={styles.profileName}>
                            {profile.first_name} {profile.last_name}
                        </Text>
                        <Text style={styles.profileRole}>Finance Officer</Text>
                    </View>

                    <View style={styles.detailsSection}>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="person" size={20} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Username:</Text>
                            <Text style={styles.detailValue}>{profile.username}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <MaterialIcons name="email" size={20} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Email:</Text>
                            <Text style={styles.detailValue}>{profile.email}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <MaterialIcons name="phone" size={20} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Phone:</Text>
                            <Text style={styles.detailValue}>{profile.phone_number}</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        color: "#2c3e50",
    },
    profileCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    profileHeader: {
        alignItems: "center",
        marginBottom: 24,
    },
    avatar: {
        marginBottom: 12,
    },
    profileName: {
        fontSize: 20,
        fontWeight: "600",
        color: "#2c3e50",
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 14,
        color: "#7f8c8d",
    },
    detailsSection: {
        borderTopWidth: 1,
        borderTopColor: "#e9ecef",
        paddingTop: 16,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    detailLabel: {
        color: "#7f8c8d",
        marginLeft: 8,
        marginRight: 4,
        fontSize: 14,
        width: 80,
    },
    detailValue: {
        fontSize: 14,
        color: "#2c3e50",
        fontWeight: "500",
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        color: "#7f8c8d",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        color: "#e74c3c",
        fontSize: 16,
        marginTop: 16,
        textAlign: "center",
    },
});

export default FinanceProfile;