import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../api";
import { useRoute } from "@react-navigation/native";

const DealerCompletedServices = () => {
    const route = useRoute();
    const dealerId = route.params?.dealerId;
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completingIds, setCompletingIds] = useState([]);

    useEffect(() => {
        if (dealerId) {
            fetchReleasedServices();
        }
    }, [dealerId]);

    const fetchReleasedServices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/dealers/customer-service-details/${dealerId}`);
            
            if (!response.data) {
                throw new Error("No data received from server");
            }

            if (response.data.success) {
                setServices(response.data.serviceDetails || []);
            } else {
                setError(response.data.message || "No released services found");
            }
        } catch (error) {
            console.error("Error fetching released services:", error);
            setError(error.message || "Network error, please try again");
        } finally {
            setLoading(false);
        }
    };

    const completeService = async (paymentId) => {
        try {
            setCompletingIds(prev => [...prev, paymentId]);
            
            const response = await api.post("/dealers/update-status-to-completed", {
                dealer_id: dealerId,
                payment_id: paymentId
            });
            
            if (response.data?.success) {
                Alert.alert("Success", "Service marked as completed successfully");
                fetchReleasedServices(); // Refresh the list
            } else {
                throw new Error(response.data?.message || "Failed to complete service");
            }
        } catch (error) {
            console.error("Error completing service:", error);
            Alert.alert("Error", error.message || "Failed to complete service");
        } finally {
            setCompletingIds(prev => prev.filter(id => id !== paymentId));
        }
    };

    const renderServiceCard = ({ item }) => (
        <View style={styles.serviceCard}>
            <View style={styles.cardHeader}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Materials Released</Text>
                    <MaterialIcons name="inventory" size={16} color="#2980b9" style={styles.statusIcon} />
                </View>
                
                <Text style={styles.customerName}>{item.customer_name}</Text>
                <Text style={styles.serviceName}>{item.service_name}</Text>
            </View>
            
            <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>
                        {new Date(item.event_date).toLocaleDateString()}
                    </Text>
                </View>
                
                <View style={styles.detailRow}>
                    <MaterialIcons name="people" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>
                        {item.number_of_people} {item.number_of_people === 1 ? 'person' : 'people'}
                    </Text>
                </View>
            </View>
            
            {item.store_items && (
                <>
                    <Text style={styles.sectionTitle}>Materials Provided:</Text>
                    <View style={styles.materialsContainer}>
                        {item.store_items.split(',').map((material, index) => (
                            <View key={index} style={styles.materialItem}>
                                <MaterialIcons name="check-circle" size={14} color="#27ae60" />
                                <Text style={styles.materialText}>{material.trim()}</Text>
                            </View>
                        ))}
                    </View>
                </>
            )}
            
            <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => completeService(item.service_booking_id)}
                disabled={completingIds.includes(item.service_booking_id)}
            >
                {completingIds.includes(item.service_booking_id) ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <MaterialIcons name="done-all" size={20} color="#fff" />
                        <Text style={styles.completeText}>COMPLETE SERVICE</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="inventory" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>No services pending completion</Text>
            <Text style={styles.emptySubtext}>All released materials have been used for services</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Services Pending Completion</Text>
                {!loading && (
                    <Text style={styles.subtitle}>
                        {services.length} service{services.length !== 1 ? 's' : ''} with materials released
                    </Text>
                )}
            </View>

            {loading && services.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={fetchReleasedServices}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={services}
                    keyExtractor={(item) => item.service_booking_id.toString()}
                    renderItem={renderServiceCard}
                    ListEmptyComponent={renderEmptyState}
                    contentContainerStyle={services.length === 0 && styles.emptyList}
                    refreshing={loading}
                    onRefresh={fetchReleasedServices}
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
    serviceCard: {
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
        backgroundColor: "#e3f2fd",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: "flex-start",
        marginBottom: 8,
    },
    statusText: {
        color: "#2980b9",
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
    serviceName: {
        fontSize: 16,
        color: "#3498db",
        marginBottom: 8,
    },
    detailsContainer: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    detailText: {
        fontSize: 14,
        color: "#7f8c8d",
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#7f8c8d",
        marginBottom: 8,
        marginTop: 8,
    },
    materialsContainer: {
        marginBottom: 12,
    },
    materialItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
    },
    materialText: {
        fontSize: 14,
        color: "#2c3e50",
        marginLeft: 8,
    },
    completeButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#27ae60",
        padding: 12,
        borderRadius: 6,
        marginTop: 8,
    },
    completeText: {
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

export default DealerCompletedServices;