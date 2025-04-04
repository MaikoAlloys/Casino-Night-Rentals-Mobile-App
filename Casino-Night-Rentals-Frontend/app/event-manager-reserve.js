import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import api from "./api";

const EventManagerReserve = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const payment_id = id;

    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!payment_id) {
                setError("No payment ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await api.get(`/eventmanager/payment-details/${payment_id}`);
                
                if (response.data.success) {
                    setPaymentDetails(response.data.payment);
                } else {
                    setError(response.data.error || "Failed to fetch payment details");
                }
            } catch (error) {
                console.error("Error fetching payment details:", error);
                setError(error.response?.data?.error || error.message || "Network error");
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [payment_id]);

    const handleReserveItem = async () => {
        try {
            const response = await api.post("/eventmanager/reserve-item", { payment_id });
            if (response.data.success) {
                Alert.alert("Success", "Item reserved successfully");
                router.push("/event-manager-dashboard");
            } else {
                Alert.alert("Error", response.data.message || "Failed to reserve item");
            }
        } catch (error) {
            console.error("Error reserving item:", error);
            Alert.alert("Error", error.response?.data?.error || error.message || "Network error");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Loading payment details...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#e74c3c" />
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.title}>Payment Details</Text>
                <View style={{ width: 24 }} /> {/* Spacer */}
            </View>

            {paymentDetails ? (
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <MaterialIcons name="person" size={20} color="#7f8c8d" />
                        <Text style={styles.detailLabel}>Customer:</Text>
                        <Text style={styles.detailValue}>
                            {paymentDetails.first_name} {paymentDetails.last_name}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <MaterialIcons name="shopping-cart" size={20} color="#7f8c8d" />
                        <Text style={styles.detailLabel}>Product:</Text>
                        <Text style={styles.detailValue}>
                            {paymentDetails.product_name}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.reserveButton}
                        onPress={handleReserveItem}
                    >
                        <Text style={styles.reserveButtonText}>Reserve Item</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <MaterialIcons name="receipt" size={48} color="#bdc3c7" />
                    <Text style={styles.emptyText}>No payment details found</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#2c3e50',
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
    },
    detailValue: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
    },
    reserveButton: {
        backgroundColor: '#27ae60',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    reserveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#bdc3c7',
        fontSize: 16,
        marginTop: 16,
    },
});

export default EventManagerReserve;
