import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

export default function CustomerProfile() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const token = await AsyncStorage.getItem("customerToken");
        console.log("Retrieved Token:", token); // Debugging

        if (!token) {
          router.push("/customer-login");
          return;
        }

        const response = await api.get("/customer/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCustomer(response.data);
      } catch (error) {
        console.error("Error fetching customer details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileTitle}>My Profile</Text>
      </View>

      {customer ? (
        <View style={styles.profileDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Username</Text>
            <Text style={styles.detailValue}>{customer.username}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>{customer.first_name} {customer.last_name}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{customer.email}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>{customer.phone_number}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load customer details</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  profileHeader: {
    marginBottom: 32,
    alignItems: "center",
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  profileDetails: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  detailItem: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#fff3cd",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  errorText: {
    color: "#856404",
    fontSize: 16,
  },
});