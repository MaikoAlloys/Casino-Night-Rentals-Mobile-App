import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import api from "./api";

const FinanceServicePayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvingIds, setApprovingIds] = useState([]);

    useEffect(() => {
        fetchPendingServicePayments();
    }, []);

    const fetchPendingServicePayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/finance/pending-customer-service-payments");
            
            if (!response.data) {
                throw new Error("No data received from server");
            }

            if (response.data.success) {
                // Group payments by their ID (one card per payment with multiple items)
                const groupedPayments = response.data.data.reduce((acc, payment) => {
                    const paymentId = payment.id;
                    
                    if (!acc[paymentId]) {
                        acc[paymentId] = {
                            id: paymentId,
                            totalCost: payment.total_cost,
                            customerName: payment.customer_name,
                            serviceName: payment.service_name,
                            paymentMethod: payment.payment_method,
                            referenceCode: payment.reference_code,
                            paymentDate: payment.payment_date,
                            items: []
                        };
                    }
                    
                    // Add the store item to the payment
                    if (payment.store_item_name) {
                        acc[paymentId].items.push(payment.store_item_name);
                    }
                    
                    return acc;
                }, {});

                setPayments(Object.values(groupedPayments));
            } else {
                setError(response.data.message || "Failed to fetch pending service payments");
            }
        } catch (error) {
            console.error("Error fetching pending service payments:", error);
            setError(error.message || "Network error, please try again");
        } finally {
            setLoading(false);
        }
    };

    const approvePayment = async (paymentId) => {
        try {
            setApprovingIds(prev => [...prev, paymentId]);
            const response = await api.post("/finance/approve-customer-service-payment", {
                payment_id: paymentId
            });
            
            if (response.data?.success) {
                setPayments(prev => prev.filter(p => p.id !== paymentId));
                Alert.alert("Service payment approved successfully");
            } else {
                throw new Error(response.data?.message || "Failed to approve payment");
            }
        } catch (error) {
            console.error("Error approving payment:", error);
            setError(error.message);
        } finally {
            setApprovingIds(prev => prev.filter(id => id !== paymentId));
        }
    };

    const renderPaymentCard = ({ item }) => (
        <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
                <Text style={styles.customerName}>{item.customerName}</Text>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>
                        Kshs {item.totalCost?.toLocaleString() || '0'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.paymentMethodRow}>
                <View style={styles.paymentMethod}>
                    <MaterialIcons 
                        name={item.paymentMethod === 'mpesa' ? 'payment' : 'credit-card'} 
                        size={20} 
                        color="#3498db" 
                    />
                    <Text style={styles.methodText}>{item.paymentMethod?.toUpperCase() || 'UNKNOWN'}</Text>
                </View>
                <Text style={styles.date}>
                    {new Date(item.paymentDate).toLocaleDateString()}
                </Text>
            </View>
            
            <View style={styles.referenceRow}>
                <Text style={styles.reference}>Payment ID: {item.id}</Text>
            </View>
            
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            
            {item.items.length > 0 && (
                <>
                    <Text style={styles.itemsTitle}>Included Items:</Text>
                    {item.items.map((itemName, index) => (
                        <Text key={`${item.id}-${index}`} style={styles.itemName}>
                            • {itemName}
                        </Text>
                    ))}
                </>
            )}
            
            <View style={styles.referenceRow}>
                <Text style={styles.reference}>Ref: {item.referenceCode}</Text>
            </View>
            
            <TouchableOpacity 
                style={styles.approveButton}
                onPress={() => approvePayment(item.id)}
                disabled={approvingIds.includes(item.id)}
            >
                {approvingIds.includes(item.id) ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.approveText}>APPROVE PAYMENT</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>All service payments are approved</Text>
            <Text style={styles.emptySubtext}>No pending payments found</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Service Payments Approval</Text>
                {!loading && (
                    <Text style={styles.subtitle}>
                        {payments.length} payment{payments.length !== 1 ? 's' : ''} pending • 
                        Total: Ksh {payments.reduce((sum, p) => sum + (p.totalCost || 0), 0).toLocaleString()}
                    </Text>
                )}
            </View>

            {loading && payments.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={fetchPendingServicePayments}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderPaymentCard}
                    ListEmptyComponent={renderEmptyState}
                    contentContainerStyle={payments.length === 0 && styles.emptyList}
                    refreshing={loading}
                    onRefresh={fetchPendingServicePayments}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    amountContainer: {
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    paymentMethodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    methodText: {
        marginLeft: 6,
        color: '#3498db',
        fontSize: 14,
    },
    referenceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    reference: {
        fontSize: 13,
        color: '#95a5a6',
    },
    date: {
        fontSize: 13,
        color: '#95a5a6',
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#34495e',
        marginBottom: 8,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#34495e',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 13,
        color: '#7f8c8d',
        marginLeft: 8,
        marginBottom: 4,
    },
    approveButton: {
        backgroundColor: '#27ae60',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 12,
    },
    approveText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#95a5a6',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bdc3c7',
        marginTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyList: {
        flex: 1,
    },
});

export default FinanceServicePayments;