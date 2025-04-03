import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CustomerCheckout() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [cartItems, setCartItems] = useState([]);
    const [totalCost, setTotalCost] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [referenceCode, setReferenceCode] = useState("");
    const [referenceError, setReferenceError] = useState("");
    const [customerId, setCustomerId] = useState(null);

    useEffect(() => {
        const getCustomerId = async () => {
            const id = await AsyncStorage.getItem("customerId");
            if (id) {
                setCustomerId(parseInt(id));
            }
        };
        getCustomerId();

        if (params?.cartItems) {
            try {
                const parsedItems = JSON.parse(params.cartItems);
                setCartItems(Array.isArray(parsedItems) ? parsedItems : []);
                console.log('Cart items:', parsedItems);
            } catch (e) {
                console.error('Error parsing cart items:', e);
                setCartItems([]);
            }
        }
        if (params?.totalCost) {
            setTotalCost(parseFloat(params.totalCost) || 0);
        }
    }, [params?.cartItems, params?.totalCost]);

    const handlePaymentMethodSelect = (method) => {
        setPaymentMethod(method);
        setReferenceCode("");
        setReferenceError("");
    };

    const handleReferenceChange = (text) => {
        const formattedText = text.toUpperCase().replace(/\s/g, '');
        setReferenceCode(formattedText);
        
        if (paymentMethod === 'mpesa') {
            if (formattedText.length > 10) return;
            const isValid = /^[A-Z0-9]{10}$/.test(formattedText);
            setReferenceError(isValid || !formattedText ? "" : "MPesa code must be 10 alphanumeric characters");
        } else if (paymentMethod === 'bank') {
            if (formattedText.length > 14) return;
            const isValid = /^[A-Z0-9]{14}$/.test(formattedText);
            setReferenceError(isValid || !formattedText ? "" : "Bank code must be 14 alphanumeric characters");
        }
    };

    const validatePaymentDetails = () => {
        if (!paymentMethod) {
            Alert.alert("Error", "Please select a payment method");
            return false;
        }
        
        if (!referenceCode) {
            setReferenceError("Reference code is required");
            return false;
        }
        
        if (paymentMethod === 'mpesa' && !/^[A-Z0-9]{10}$/.test(referenceCode)) {
            setReferenceError("MPesa code must be 10 alphanumeric characters");
            return false;
        }
        
        if (paymentMethod === 'bank' && !/^[A-Z0-9]{14}$/.test(referenceCode)) {
            setReferenceError("Bank code must be 14 alphanumeric characters");
            return false;
        }
        
        if (!customerId) {
            Alert.alert("Error", "Customer ID not found. Please login again.");
            return false;
        }
        
        if (cartItems.length === 0) {
            Alert.alert("Error", "Your cart is empty");
            return false;
        }
        
        return true;
    };

    const clearCart = async () => {
        try {
            const token = await AsyncStorage.getItem("customerToken");
            if (!token) return;

            // Delete all items from product_cart for this customer
            await api.delete("/cart/clear-cart", {
                headers: { Authorization: `Bearer ${token}` },
                data: { customerId }
            });
            
            console.log("Cart cleared successfully");
        } catch (error) {
            // console.error("Error clearing cart:", error);
        }
    };

    const handlePayment = async () => {
        if (!validatePaymentDetails()) return;
        
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("customerToken");
            if (!token) {
                Alert.alert("Error", "You must be logged in to complete payment.");
                return;
            }

            const formattedCartItems = cartItems.map(item => ({
                product_id: item.product_id || item.id,
                quantity: item.quantity
            }));

            const response = await api.post("/payments/order-payment", {
                cartItems: formattedCartItems,
                totalAmount: totalCost,
                paymentMethod,
                referenceCode,
                customerId
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                // Clear the cart after successful payment
                await clearCart();
                
                Alert.alert(
                    "Payment Successful",
                    `Your ${paymentMethod.toUpperCase()} payment of Ksh ${totalCost} was processed successfully.`,
                    [
                        { 
                            text: "OK", 
                            onPress: () => router.push({
                                pathname: "/customer-cart",
                                params: { refresh: new Date().getTime() } // Force refresh
                            }) 
                        }
                    ]
                );
            } else {
                Alert.alert("Payment Failed", response.data.message || "Payment could not be processed.");
            }
        } catch (error) {
            console.error("Payment error:", error);
            Alert.alert(
                "Payment Error",
                error.response?.data?.message || "An error occurred during payment processing."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Checkout</Text>
            
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                {cartItems.map((item, index) => (
                    <View key={`item-${index}`} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.product_name || item.name}</Text>
                        <Text style={styles.itemPrice}>
                            {item.quantity} x Ksh {item.rental_price || item.price} = Ksh {item.quantity * (item.rental_price || item.price)}
                        </Text>
                    </View>
                ))}
                
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>Ksh {totalCost}</Text>
                </View>
            </View>

            <View style={styles.paymentMethodContainer}>
                <Text style={styles.sectionTitle}>Select Payment Method</Text>
                <View style={styles.methodButtonsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.methodButton,
                            paymentMethod === 'mpesa' && styles.methodButtonSelected
                        ]}
                        onPress={() => handlePaymentMethodSelect('mpesa')}
                    >
                        <Text style={[
                            styles.methodButtonText,
                            paymentMethod === 'mpesa' && styles.methodButtonSelectedText
                        ]}>MPesa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.methodButton,
                            paymentMethod === 'bank' && styles.methodButtonSelected
                        ]}
                        onPress={() => handlePaymentMethodSelect('bank')}
                    >
                        <Text style={[
                            styles.methodButtonText,
                            paymentMethod === 'bank' && styles.methodButtonSelectedText
                        ]}>Bank</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {paymentMethod && (
                <View style={styles.referenceContainer}>
                    <Text style={styles.sectionTitle}>
                        {paymentMethod === 'mpesa' ? 'MPesa Reference Code' : 'Bank Reference Code'}
                    </Text>
                    <TextInput
                        style={styles.referenceInput}
                        placeholder={
                            paymentMethod === 'mpesa' 
                                ? 'Enter 10 alphanumeric code' 
                                : 'Enter 14 alphanumeric code'
                        }
                        value={referenceCode}
                        onChangeText={handleReferenceChange}
                        maxLength={paymentMethod === 'mpesa' ? 10 : 14}
                        autoCapitalize="characters"
                    />
                    {referenceError ? (
                        <Text style={styles.errorText}>{referenceError}</Text>
                    ) : (
                        <Text style={styles.hintText}>
                            {paymentMethod === 'mpesa'
                                ? 'Enter your 10 character MPesa reference'
                                : 'Enter your 14 character bank reference'}
                        </Text>
                    )}
                </View>
            )}

            <TouchableOpacity 
                style={styles.payButton} 
                onPress={handlePayment}
                disabled={loading || cartItems.length === 0}
            >
                <Text style={styles.payButtonText}>
                    {loading ? "Processing..." : "Complete Payment"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    summaryContainer: {
        backgroundColor: "#f8f8f8",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        color: "#333",
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    itemName: {
        fontSize: 16,
        color: "#555",
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: "bold",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#ddd",
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: "bold",
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2ecc71",
    },
    paymentMethodContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333",
    },
    methodButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    methodButton: {
        flex: 1,
        padding: 15,
        marginHorizontal: 5,
        backgroundColor: "#e0e0e0",
        borderRadius: 5,
        alignItems: "center",
    },
    methodButtonSelected: {
        backgroundColor: "#3498db",
    },
    methodButtonText: {
        fontWeight: "bold",
        color: "#333",
    },
    methodButtonSelectedText: {
        color: "white",
    },
    referenceContainer: {
        marginBottom: 20,
    },
    referenceInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 15,
        borderRadius: 5,
        fontSize: 16,
        marginBottom: 5,
    },
    errorText: {
        color: "red",
        fontSize: 14,
    },
    hintText: {
        color: "#666",
        fontSize: 14,
    },
    payButton: {
        backgroundColor: "#2ecc71",
        padding: 15,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 20,
    },
    payButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 18,
    },
});