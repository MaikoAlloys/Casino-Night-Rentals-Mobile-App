import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Animated } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import api from "./api";  // Ensure you have an API utility file or adjust accordingly
import AsyncStorage from '@react-native-async-storage/async-storage';


const EventManagerDashboard = () => {
    const router = useRouter();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const sidebarAnim = useRef(new Animated.Value(-300)).current;

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const response = await api.get("/eventmanager/approved-payments");
                if (response.data.success) {
                    setPayments(response.data.data);
                    setError(null);
                } else {
                    setError(response.data.message || "Failed to fetch payments");
                }
            } catch (error) {
                console.error("Error fetching payments:", error);
                setError(error.response?.data?.message || "Network error, please try again");
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    useEffect(() => {
        Animated.timing(sidebarAnim, {
            toValue: sidebarVisible ? 0 : -300,
            duration: 300,
            useNativeDriver: false
        }).start();
    }, [sidebarVisible]);

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    const handleLogout = () => {
        router.push("/");  // Push to root without AsyncStorage
    };

    const renderPaymentItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.paymentCard}
            onPress={() => router.push(`/event-manager-reserve?id=${item.payment_id}`)}
        >
            <View style={styles.paymentHeader}>
                <Text style={styles.customerName}>
                    {item.customer_first_name} {item.customer_last_name}
                </Text>
                <Text style={styles.quantity}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.productName}>
                {item.product_name ? item.product_name.trim() : 'No product name'}
            </Text>
            <Text style={styles.date}>
                Paid on: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
            </Text>
            <View style={styles.viewDetails}>
                <Text style={styles.detailsText}>Reserve Product</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#3498db" />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Loading approved payments...</Text>
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
                    onPress={() => {
                        setError(null);
                        setLoading(true);
                    }}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Sidebar Navigation */}
            <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
                <View style={styles.sidebarHeader}>
                    <Text style={styles.sidebarTitle}>Event Manager</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
                        <MaterialIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.sidebarMenu}>
                    <TouchableOpacity 
                        style={styles.navButton} 
                        onPress={() => { 
                            router.push("/event-manager-dashboard"); 
                            toggleSidebar(); 
                        }}
                    >
                        <MaterialIcons name="dashboard" size={20} color="#3498db" />
                        <Text style={styles.navItem}>Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.navButton} 
                        onPress={() => { 
                            router.push("/event-manager-profile"); 
                            toggleSidebar(); 
                        }}
                    >
                        <MaterialIcons name="person" size={20} color="#3498db" />
                        <Text style={styles.navItem}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.navButton} 
                        onPress={() => { 
                            router.push("/event-manager-dashboard"); 
                            toggleSidebar(); 
                        }}
                    >
                        <MaterialIcons name="inventory" size={20} color="#3498db" />
                        <Text style={styles.navItem}>Reserve Items</Text>
                    </TouchableOpacity>

                              <TouchableOpacity 
                                style={styles.navButton}
                                onPress={() => { 
                                  router.push("/event-manager-feedback"); 
                                  toggleSidebar(); 
                                }}
                                >
                                <MaterialIcons name="feedback" size={20} color="#3498db" />
                                <Text style={styles.navItem}>Feedback</Text>
                                </TouchableOpacity>
                    
                    <TouchableOpacity 
                    style={styles.navButton} 
                    onPress={() => { 
                        
                            router.push("/");  // Router push to home
                            toggleSidebar();  // Close the sidebar after logout
                        }}
                    >
                        <MaterialIcons name="logout" size={20} color="#3498db" />
                        <Text style={styles.navItem}>Logout</Text>
                    </TouchableOpacity>

                </View>
            </Animated.View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={toggleSidebar}>
                        <MaterialIcons name="menu" size={28} color="#2c3e50" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Approved Product Payments</Text>
                    <View style={{ width: 28 }} /> {/* Spacer for alignment */}
                </View>

                <FlatList
                    data={payments}
                    renderItem={renderPaymentItem}
                    keyExtractor={(item) => item.payment_id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialIcons name="receipt" size={48} color="#bdc3c7" />
                            <Text style={styles.emptyText}>No approved payments found</Text>
                        </View>
                    }
                />
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
    closeButton: {
        padding: 5,
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
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        color: "#2c3e50",
    },
    listContainer: {
        paddingBottom: 20,
    },
    paymentCard: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    paymentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    customerName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2c3e50",
    },
    quantity: {
        fontSize: 14,
        color: "#7f8c8d",
        fontWeight: "500",
    },
    productName: {
        fontSize: 15,
        color: "#2c3e50",
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        color: "#7f8c8d",
        marginBottom: 8,
    },
    viewDetails: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    detailsText: {
        color: "#3498db",
        marginRight: 8,
        fontWeight: "500",
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
    retryButton: {
        backgroundColor: "#3498db",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
        marginTop: 16,
    },
    retryText: {
        color: "#fff",
        fontWeight: "500",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyText: {
        color: "#bdc3c7",
        fontSize: 16,
        marginTop: 16,
        fontWeight: "500",
    },
});

export default EventManagerDashboard;
