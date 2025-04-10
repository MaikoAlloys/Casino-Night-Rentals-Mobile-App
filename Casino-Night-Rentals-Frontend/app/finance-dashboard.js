import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

const FinanceDashboard = () => {
    const router = useRouter();
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const sidebarAnim = useState(new Animated.Value(-300))[0];

    useEffect(() => {
        const fetchPendingPayments = async () => {
            try {
                setLoading(true);
                const response = await api.get("/finance/pending-payments");
                if (response.data.success) {
                    setPendingPayments(response.data.payments);
                    setError(null);
                } else {
                    setError(response.data.error || "Failed to fetch pending payments");
                }
            } catch (error) {
                // console.error("Error fetching pending payments:", error);
                // setError("Network error, please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchPendingPayments();
    }, []);

    const toggleSidebar = () => {
        if (sidebarVisible) {
            Animated.timing(sidebarAnim, {
                toValue: -300,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            Animated.timing(sidebarAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
        setSidebarVisible(!sidebarVisible);
    };

    const renderPaymentItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.paymentCard}
            onPress={() => router.push(`/finance-approve-product?id=${item.payment_id}`)}
        >
            <View style={styles.paymentHeader}>
                <Text style={styles.customerName}>
                    {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.amount}>Ksh {item.amount_paid.toLocaleString()}</Text>
            </View>
            <Text style={styles.reference}>Reference: {item.reference}</Text>
            <View style={styles.viewDetails}>
                <Text style={styles.detailsText}>View Details</Text>
                <AntDesign name="arrowright" size={16} color="#3498db" />
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <AntDesign name="inbox" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>No pending payments</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Sidebar Navigation */}
            <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
                <View style={styles.sidebarHeader}>
                    <Text style={styles.sidebarTitle}>Finance Menu</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
                        <Text style={styles.closeText}>✖</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.sidebarMenu}>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/finance-dashboard"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/finance-profile"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/finance-dashboard"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Pending Product Payments</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/finance-service-booking"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Service bookings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/finance-service-payments"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Service payments</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/finance-supplier-payments"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Supplier payments</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/finance-feedback"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Feedback</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={async () => { 
                        await AsyncStorage.removeItem("financeToken"); 
                        router.push("/"); 
                        toggleSidebar();
                    }}>
                        <Text style={styles.navItem}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Main Content */}
            <View style={styles.header}>
                <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                    <AntDesign name="menuunfold" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.title}>Pending Payments</Text>
                {!loading && (
                    <Text style={styles.subtitle}>
                        {pendingPayments.length} product payment{pendingPayments.length !== 1 ? 's' : ''} awaiting approval
                    </Text>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => setLoading(true)}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={pendingPayments}
                    keyExtractor={(item) => item.payment_id.toString()}
                    renderItem={renderPaymentItem}
                    ListEmptyComponent={renderEmptyState}
                    contentContainerStyle={pendingPayments.length === 0 && styles.emptyList}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#e9ecef",
        marginBottom: 16,
        paddingHorizontal: 16,
        position: 'relative',
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        color: "#2c3e50",
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: "#7f8c8d",
        marginTop: 4,
        textAlign: 'center',
    },
    paymentCard: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginHorizontal: 16,
    },
    paymentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    customerName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#2c3e50",
    },
    amount: {
        fontSize: 16,
        fontWeight: "600",
        color: "#27ae60",
    },
    reference: {
        fontSize: 14,
        color: "#7f8c8d",
        marginBottom: 12,
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
    emptyList: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        color: "#e74c3c",
        marginBottom: 16,
        textAlign: "center",
    },
    retryButton: {
        backgroundColor: "#3498db",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
    },
    retryText: {
        color: "#fff",
        fontWeight: "500",
    },
    // Sidebar styles
    sidebar: {
        position: 'absolute',
        top: 0,
        width: 300,
        height: '100%',
        backgroundColor: '#fff',
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    sidebarTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2c3e50',
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        fontSize: 18,
        color: '#2c3e50',
    },
    sidebarMenu: {
        padding: 16,
    },
    navButton: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    navItem: {
        fontSize: 16,
        color: '#2c3e50',
    },
    menuButton: {
        position: 'absolute',
        left: 16,
        top: 24,
        zIndex: 10,
    },
});

export default FinanceDashboard;