import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ScrollView, Animated, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from 'react-native-vector-icons/FontAwesome';

export default function CustomerDashboard() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarAnim = useState(new Animated.Value(-250))[0];

    useEffect(() => {
        const fetchCustomerDetails = async () => {
            try {
                const token = await AsyncStorage.getItem("customerToken");
                console.log("Retrieved Token:", token);

                if (!token) {
                    router.push("/customer-login");
                    return;
                }

                const response = await api.get("/customer/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setCustomer(response.data);
                fetchProductsAndServices();
            } catch (error) {
                console.error("Error fetching customer details:", error);
                Alert.alert("Error", "Failed to load profile. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        const fetchProductsAndServices = async () => {
            try {
                const productResponse = await api.get("/customer/products");
                setProducts(productResponse.data);
                const serviceResponse = await api.get("/customer/services");
                setServices(serviceResponse.data);
            } catch (error) {
                console.error("Error fetching products and services:", error);
                Alert.alert("Error", "Failed to load products/services. Please try again.");
            }
        };

        fetchCustomerDetails();
    }, []);

    const toggleSidebar = () => {
        Animated.timing(sidebarAnim, {
            toValue: sidebarOpen ? -250 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setSidebarOpen(!sidebarOpen);
    };

    const handleCartPress = () => {
        router.push("/customer-cart");
    };

    const handleRentNowPress = async (product) => {
        try {
            if (!customer) {
                Alert.alert("Error", "Please log in to rent a product.");
                router.push("/customer-login");
                return;
            }

            if (product.quantity <= 0) {
                Alert.alert("Out of Stock", "This product is currently out of stock.");
                return;
            }

            const cartResponse = await api.post('/customer/add', {
                customer_id: customer.id,
                product_name: product.name,
                quantity: 1,
                rental_price: product.rental_price,
                image_url: product.image_url,
            });

            if (cartResponse.status === 201) {
                const deductResponse = await api.post('/customer/deduct', {
                    product_name: product.name,
                });

                if (deductResponse.status === 200) {
                    setProducts(prevProducts =>
                        prevProducts.map(p =>
                            p.id === product.id
                                ? { ...p, quantity: p.quantity - 1 }
                                : p
                        )
                    );
                    Alert.alert("Success", `${product.name} added to your cart!`);
                } else {
                    Alert.alert("Warning", "Product added to cart but quantity couldn't be updated.");
                }
            }
        } catch (error) {
            // console.error("Error during rent process:", error);
            if (error.response) {
                if (error.response.status === 400 && error.response.data.message === 'Item already in cart') {
                    Alert.alert("Info", "This item is already in your cart.");
                } else if (error.response.status === 400 && error.response.data.message === 'Product does not exist') {
                    Alert.alert("Error", "This product is no longer available.");
                } else {
                    Alert.alert("Success", error.response.data.message || "Added to your cart!.");
                }
            } else {
                Alert.alert("Network Error", "Please check your internet connection and try again.");
            }
        }
    };

    const handleBookNowPress = async (service) => {
        try {
            if (!customer) {
                Alert.alert("Error", "Please log in to book a service.");
                router.push("/customer-login");
                return;
            }

            Alert.alert(
                "Confirm Booking",
                `Do you want to book ${service.name} for Kshs ${service.service_fee}?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    { 
                        text: "Book Now", 
                        onPress: async () => {
                            try {
                                const response = await api.post('/customer/book-service', {
                                    customer_id: customer.id,
                                    service_id: service.id,
                                    service_name: service.name,
                                    service_fee: service.service_fee,
                                    booking_fee: service.booking_fee
                                });
                                Alert.alert("Success", "Service booked successfully!");
                            } catch (error) {
                                console.error("Error booking service:", error);
                                Alert.alert("Error", "Failed to book service. Please try again.");
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Error initiating booking:", error);
            Alert.alert("Error", "Failed to initiate booking. Please try again.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Sidebar Navigation */}
            <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
                <View style={styles.sidebarHeader}>
                    <Text style={styles.sidebarTitle}>Menu</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
                        <Text style={styles.closeText}>✖</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.sidebarMenu}>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/customer-dashboard"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/customer-profile"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/customer-cart"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>My Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/customer-order"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/help"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Help</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/about"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>About Us</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => { router.push("/contact"); toggleSidebar(); }}>
                        <Text style={styles.navItem}>Contact Us</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={async () => { 
                        await AsyncStorage.removeItem("customerToken"); 
                        router.push("/customer-login"); 
                    }}>
                        <Text style={styles.navItem}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
                        <Text style={styles.menuText}>☰</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Customer Dashboard</Text>
                    
                    <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
                        <Icon name="shopping-cart" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <Text style={styles.sectionTitle}>Available Products</Text>
                    {products.length === 0 ? (
                        <Text style={styles.emptyMessage}>No products available at the moment.</Text>
                    ) : (
                        <FlatList
                            data={products}
                            keyExtractor={(item) => `product-${item.id}`}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={styles.card}>
                                    <Image source={{ uri: item.image_url }} style={styles.image} />
                                    <Text style={styles.name}>{item.name}</Text>
                                    <Text style={styles.price}>Kshs {item.rental_price} / day</Text>
                                    <Text style={[styles.quantity, item.quantity <= 0 && styles.outOfStock]}>
                                        {item.quantity <= 0 ? "Out of Stock" : `Available: ${item.quantity}`}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.button, item.quantity <= 0 && styles.disabledButton]}
                                        onPress={() => handleRentNowPress(item)}
                                        disabled={item.quantity <= 0}
                                    >
                                        <Text style={styles.buttonText}>
                                            {item.quantity <= 0 ? "Out of Stock" : "Rent Now"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}

                    <Text style={styles.sectionTitle}>Available Services</Text>
                    {services.length === 0 ? (
                        <Text style={styles.emptyMessage}>No services available at the moment.</Text>
                    ) : (
                        <FlatList
                            data={services}
                            keyExtractor={(item) => `service-${item.id}`}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={styles.card}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    <Text style={styles.price}>Service Fee: Kshs {item.service_fee}</Text>
                                    <Text style={styles.price}>Booking Fee: Kshs {item.booking_fee}</Text>
                                    <TouchableOpacity 
                                        style={styles.button}
                                        onPress={() => handleBookNowPress(item)}
                                    >
                                        <Text style={styles.buttonText}>Book Now</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#fff" 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#007bff',
    },
    sidebar: { 
        position: "absolute", 
        left: -250, 
        width: 250, 
        height: "100%", 
        backgroundColor: "rgba(44, 62, 80, 0.98)", 
        paddingTop: 50, 
        zIndex: 1000 
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
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    closeText: {
        color: 'white',
        fontSize: 20,
    },
    sidebarMenu: {
        paddingTop: 20,
    },
    navButton: {
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    navItem: {
        color: 'white',
        fontSize: 16,
    },
    header: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: 15, 
        backgroundColor: "#4a6da7" 
    },
    menuButton: {
        padding: 5,
    },
    menuText: {
        color: 'white',
        fontSize: 24,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    cartButton: { 
        padding: 5 
    },
    content: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    emptyMessage: {
        textAlign: 'center',
        marginVertical: 20,
        color: '#666',
    },
    card: {
        width: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginRight: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 120,
        borderRadius: 5,
        marginBottom: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    price: {
        fontSize: 14,
        color: '#4a6da7',
        marginBottom: 5,
    },
    quantity: {
        fontSize: 14,
        color: '#28a745',
        marginBottom: 10,
    },
    outOfStock: {
        color: '#dc3545',
    },
    button: { 
        backgroundColor: "#007bff", 
        padding: 10, 
        borderRadius: 5, 
        marginTop: 10,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#6c757d',
    },
    buttonText: { 
        color: "#fff", 
        fontWeight: "bold" 
    },
    mainContent: {
        flex: 1,
    },
});