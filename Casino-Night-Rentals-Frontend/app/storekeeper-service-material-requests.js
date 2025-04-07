import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import api from "./api";

const StorekeeperServiceMaterialRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [releasingIds, setReleasingIds] = useState([]);

    useEffect(() => {
        fetchApprovedRequests();
    }, []);

    const fetchApprovedRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/storekeeper/approved-customer-service-payments");
            
            if (!response.data) {
                throw new Error("No data received from server");
            }

            if (response.data.success) {
                // Group requests by service_booking_id (one card per payment with multiple items)
                const groupedRequests = response.data.data.reduce((acc, request) => {
                    const serviceBookingId = request.service_booking_id;
                    
                    if (!acc[serviceBookingId]) {
                        acc[serviceBookingId] = {
                            serviceBookingId,
                            customerName: request.customer_name,
                            serviceName: request.service_name,
                            dealerName: request.dealer_name,
                            totalCost: request.total_cost,
                            items: []
                        };
                    }
                    
                    // Add the store item to the request
                    if (request.store_item_name) {
                        acc[serviceBookingId].items.push({
                            name: request.store_item_name,
                            quantity: request.quantity
                        });
                    }
                    
                    return acc;
                }, {});

                setRequests(Object.values(groupedRequests));
            } else {
                setError(response.data.message || "Failed to fetch approved requests");
            }
        } catch (error) {
            console.error("Error fetching approved requests:", error);
            setError(error.message || "Network error, please try again");
        } finally {
            setLoading(false);
        }
    };

    const releaseItems = async (serviceBookingId) => {
        try {
            setReleasingIds(prev => [...prev, serviceBookingId]);
            
            const response = await api.put(`/storekeeper/release-items/${serviceBookingId}`);
            
            if (response.data?.success) {
                Alert.alert("Success", "Materials released successfully");
                fetchApprovedRequests(); // Refresh the list
            } else {
                throw new Error(response.data?.message || "Failed to release materials");
            }
        } catch (error) {
            console.error("Error releasing materials:", error);
            Alert.alert("Error", error.message || "Failed to release materials");
        } finally {
            setReleasingIds(prev => prev.filter(id => id !== serviceBookingId));
        }
    };

    const renderRequestCard = ({ item }) => (
        <View style={styles.requestCard}>
            <View style={styles.cardHeader}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Payment Approved</Text>
                    <FontAwesome name="check-circle" size={16} color="#27ae60" style={styles.statusIcon} />
                </View>
                
                <Text style={styles.customerName}>{item.customerName}</Text>
                <Text style={styles.dealerName}>Dealer: {item.dealerName}</Text>
            </View>
            
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>
                        Ksh {item.totalCost?.toLocaleString() || '0'}
                    </Text>
                </View>
            </View>
            
            <Text style={styles.sectionTitle}>Materials to Release:</Text>
            
            {item.items.map((material, index) => (
                <View key={`${item.serviceBookingId}-${index}`} style={styles.materialItem}>
                    <Text style={styles.materialName}>{material.name}</Text>
                    <Text style={styles.materialQuantity}>Qty: {material.quantity}</Text>
                </View>
            ))}
            
            <TouchableOpacity 
                style={styles.releaseButton}
                onPress={() => releaseItems(item.serviceBookingId)}
                disabled={releasingIds.includes(item.serviceBookingId)}
            >
                {releasingIds.includes(item.serviceBookingId) ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <MaterialIcons name="inventory" size={20} color="#fff" />
                        <Text style={styles.releaseText}>RELEASE MATERIALS</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="inventory" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>No materials pending release</Text>
            <Text style={styles.emptySubtext}>All approved requests have been processed</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Material Release Requests</Text>
                {!loading && (
                    <Text style={styles.subtitle}>
                        {requests.length} request{requests.length !== 1 ? 's' : ''} pending release
                    </Text>
                )}
            </View>

            {loading && requests.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={fetchApprovedRequests}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.serviceBookingId.toString()}
                    renderItem={renderRequestCard}
                    ListEmptyComponent={renderEmptyState}
                    contentContainerStyle={requests.length === 0 && styles.emptyList}
                    refreshing={loading}
                    onRefresh={fetchApprovedRequests}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        padding: 16,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#2c3e50",
    },
    subtitle: {
        fontSize: 14,
        color: "#7f8c8d",
        marginTop: 4,
    },
    requestCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e8f5e9",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: "flex-start",
        marginBottom: 8,
    },
    statusText: {
        color: "#27ae60",
        fontSize: 12,
        fontWeight: "600",
        marginRight: 4,
    },
    statusIcon: {
        marginLeft: 4,
    },
    customerName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2c3e50",
        marginBottom: 4,
    },
    dealerName: {
        fontSize: 14,
        color: "#7f8c8d",
    },
    serviceInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#ecf0f1",
    },
    serviceName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#3498db",
    },
    amountContainer: {
        backgroundColor: "#f8f9fa",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
    },
    amountText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2c3e50",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#7f8c8d",
        marginBottom: 8,
    },
    materialItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#ecf0f1",
    },
    materialName: {
        fontSize: 14,
        color: "#2c3e50",
    },
    materialQuantity: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2c3e50",
    },
    releaseButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#3498db",
        padding: 12,
        borderRadius: 6,
        marginTop: 16,
    },
    releaseText: {
        color: "#fff",
        fontWeight: "bold",
        marginLeft: 8,
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
    },
    errorText: {
        color: "#e74c3c",
        fontSize: 16,
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
        fontWeight: "bold",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: "#7f8c8d",
        marginTop: 16,
        textAlign: "center",
    },
    emptySubtext: {
        fontSize: 14,
        color: "#bdc3c7",
        marginTop: 8,
        textAlign: "center",
    },
    emptyList: {
        flex: 1,
        justifyContent: "center",
    },
});

export default StorekeeperServiceMaterialRequests;