import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CustomerCart() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState([]);
    const [totalCost, setTotalCost] = useState(0);
    const [updatedQuantity, setUpdatedQuantity] = useState({});

    useEffect(() => {
        const fetchCartItems = async () => {
            try {
                const token = await AsyncStorage.getItem("customerToken");
                if (!token) {
                    Alert.alert("Error", "You must be logged in to view your cart.");
                    return;
                }

                const response = await api.get("/customer/cart", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.cartItems) {
                    setCartItems(response.data.cartItems);
                    setTotalCost(response.data.totalCost);
                } else {
                    Alert.alert("Info", response.data.message || "Your cart is empty.");
                }
            } catch (error) {
                console.error("Error fetching cart items:", error);
                Alert.alert("Error", "Something went wrong. Please try again.");
            }
        };

        fetchCartItems();
    }, []);

    const handleCheckout = () => {
        // Pass cart items and total cost as params
        router.push({
            pathname: "/customer-checkout",
            params: {
                cartItems: JSON.stringify(cartItems),
                totalCost: totalCost.toString()
            }
        });
    };

    const handleRemoveFromCart = async (productId) => {
        try {
            const token = await AsyncStorage.getItem("customerToken");
            await api.delete(`/customer/cart/${productId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            const updatedCart = cartItems.filter(item => item.product_id !== productId);
            setCartItems(updatedCart);
            setTotalCost(updatedCart.reduce((acc, item) => acc + (item.rental_price * item.quantity), 0));
            Alert.alert("Success", "Removed Successfully.");
        } catch (error) {
            Alert.alert("Error", "Failed to remove item. Please try again.");
        }
    };

    const handleUpdateQuantity = async (productId, newQuantity) => {
        try {
            if (!newQuantity || newQuantity <= 0) {
                Alert.alert("Error", "Quantity must be greater than zero.");
                return;
            }

            const token = await AsyncStorage.getItem("customerToken");
            const productResponse = await api.get(`/customer/product/${productId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const availableStock = productResponse.data.quantity;
            if (newQuantity > availableStock) {
                Alert.alert("Error", `Quantity cannot exceed available stock (${availableStock}).`);
                return;
            }

            const response = await api.put(
                `/customer/cart/${productId}`,
                { newQuantity },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.cartItems) {
                setCartItems(response.data.cartItems);
                setTotalCost(response.data.totalCost);
                setUpdatedQuantity(prev => ({ ...prev, [productId]: '' }));
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
            Alert.alert(
                "Error", 
                error.response?.data?.message || "Failed to update quantity. Please try again."
            );
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Cart</Text>

            {cartItems.length === 0 ? (
                <Text style={styles.emptyText}>Your cart is empty</Text>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => `cart-item-${item.product_id || item.id}`}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Text style={styles.productName}>{item.product_name}</Text>
                                <Text style={styles.productInfo}>Price: Kshs {item.rental_price} / day</Text>
                                <Text style={styles.productInfo}>Current Quantity: {item.quantity}</Text>
                                <Text style={styles.productInfo}>Subtotal: Kshs {item.rental_price * item.quantity}</Text>
                                
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="New quantity"
                                    value={updatedQuantity[item.product_id || item.id]?.toString() || ''}
                                    onChangeText={(text) => {
                                        const num = parseInt(text) || 0;
                                        setUpdatedQuantity(prev => ({
                                            ...prev,
                                            [item.product_id || item.id]: num > 0 ? num : 0
                                        }));
                                    }}
                                />
                                
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.updateButton]}
                                        onPress={() => handleUpdateQuantity(item.product_id || item.id, updatedQuantity[item.product_id || item.id])}
                                    >
                                        <Text style={styles.buttonText}>Update</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.removeButton]}
                                        onPress={() => handleRemoveFromCart(item.product_id || item.id)}
                                    >
                                        <Text style={styles.buttonText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />

                    <View style={styles.totalContainer}>
                        <Text style={styles.totalText}>Total Cost: Kshs {totalCost}</Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.checkoutButton} 
                        onPress={handleCheckout}
                        disabled={cartItems.length === 0}
                    >
                        <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 15 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
    emptyText: { textAlign: "center", marginTop: 20, fontSize: 16 },
    card: {
        backgroundColor: "#f8f8f8",
        padding: 15,
        marginBottom: 15,
        borderRadius: 10,
        borderColor: "#ddd",
        borderWidth: 1,
    },
    productName: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
    productInfo: { fontSize: 16, color: "#555", marginBottom: 3 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginVertical: 10,
        borderRadius: 5,
        backgroundColor: "#fff",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    actionButton: {
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        flex: 1,
        marginHorizontal: 5,
    },
    updateButton: {
        backgroundColor: "#3498db",
    },
    removeButton: {
        backgroundColor: "#e74c3c",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
    totalContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "#f0f0f0",
        borderRadius: 10,
    },
    totalText: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
    checkoutButton: {
        backgroundColor: "#2ecc71",
        padding: 15,
        borderRadius: 5,
        marginTop: 20,
        alignItems: "center",
    },
    checkoutText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 18,
    },
});