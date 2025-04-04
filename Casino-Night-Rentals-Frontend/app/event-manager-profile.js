import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "./api";

const EventManagerProfile = () => {
    const router = useRouter();
    const [eventManager, setEventManager] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    useEffect(() => {
        const fetchEventManager = async () => {
            try {
                const response = await api.get("/eventmanager/event-manager");
                if (response.data.success) {
                    setEventManager(response.data.eventManager);
                    setError(null);
                } else {
                    setError(response.data.error || "Failed to fetch event manager data");
                }
            } catch (err) {
                console.error("Error fetching event manager data:", err);
                setError("Network error, please try again");
            } finally {
                setLoading(false);
            }
        };

        fetchEventManager();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem("eventManagerToken");
        router.push("/");
    };

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
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => setLoading(true)}
                >
                    <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Sidebar Navigation */}
            <View style={[styles.sidebar, { display: sidebarVisible ? 'flex' : 'none' }]}>
                <View style={styles.sidebarHeader}>
                    <Text style={styles.sidebarTitle}>Event Manager</Text>
                    <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                        <MaterialIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.sidebarMenu}>
                    <TouchableOpacity 
                        style={styles.navButton}
                        onPress={() => {
                            router.push("/event-manager-dashboard");
                            setSidebarVisible(false);
                        }}
                    >
                        <MaterialIcons name="dashboard" size={20} color="#3498db" />
                        <Text style={styles.navItem}>Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.navButton}
                        onPress={() => {
                            router.push("/event-manager-profile");
                            setSidebarVisible(false);
                        }}
                    >
                        <MaterialIcons name="person" size={20} color="#3498db" />
                        <Text style={styles.navItem}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.navButton}
                        onPress={() => {
                            router.push("/event-manager-dashboard");
                            setSidebarVisible(false);
                        }}
                    >
                        <MaterialIcons name="inventory" size={20} color="#3498db" />
                        <Text style={styles.navItem}>Reserve Items</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.navButton}
                        onPress={handleLogout}
                    >
                        <MaterialIcons name="logout" size={20} color="#3498db" />
                        <Text style={styles.navItem}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setSidebarVisible(true)}>
                        <MaterialIcons name="menu" size={28} color="#2c3e50" />
                    </TouchableOpacity>
                    <Text style={styles.title}>My Profile</Text>
                    <View style={{ width: 28 }} /> {/* Spacer */}
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <MaterialIcons name="account-circle" size={80} color="#3498db" />
                    </View>

                    <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="person" size={20} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Name:</Text>
                            <Text style={styles.detailValue}>
                                {eventManager.first_name} {eventManager.last_name}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <MaterialIcons name="email" size={20} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Email:</Text>
                            <Text style={styles.detailValue}>{eventManager.email}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <MaterialIcons name="phone" size={20} color="#7f8c8d" />
                            <Text style={styles.detailLabel}>Phone:</Text>
                            <Text style={styles.detailValue}>{eventManager.phone_number}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 280,
        backgroundColor: '#2c3e50',
        zIndex: 100,
        paddingTop: 50,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#34495e',
    },
    sidebarTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    sidebarMenu: {
        paddingTop: 20,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#34495e',
    },
    navItem: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 15,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#2c3e50',
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    detailsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        paddingTop: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailLabel: {
        color: '#7f8c8d',
        marginLeft: 8,
        marginRight: 4,
        fontSize: 16,
        width: 80,
    },
    detailValue: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: '#7f8c8d',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
        marginTop: 16,
    },
    retryText: {
        color: '#fff',
        fontWeight: '500',
    },
});

export default EventManagerProfile;