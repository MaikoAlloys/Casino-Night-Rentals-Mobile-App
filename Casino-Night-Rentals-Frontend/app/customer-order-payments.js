import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Button, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl, 
  Alert, 
  Platform,
  Linking,
  TouchableOpacity
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from 'expo-file-system';

const CustomerOrderPayments = () => {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const viewShotRefs = useRef({});

  const fetchPayments = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      console.log("Retrieved Token:", token);

      if (!token) {
        router.push("/customer-login");
        return;
      }

      const response = await api.get("/payments/customer-payments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Add unique key to each payment item to prevent duplicate key warnings
        const paymentsWithUniqueKeys = response.data.payments.map((payment, index) => ({
          ...payment,
          uniqueKey: `${payment.reference_code}_${index}`
        }));
        setPayments(paymentsWithUniqueKeys);
        setError(null);
      } else {
        throw new Error(response.data.message || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError(error.message || "Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
  };

  const handleDownload = async (referenceCode) => {
    try {
      // Check permissions
      const { status } = await MediaLibrary.getPermissionsAsync();
      let finalStatus = status;

      if (status !== 'granted') {
        const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Please enable media library permissions in settings to save receipts",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Capture the view
      const uri = await viewShotRefs.current[referenceCode].capture();
      
      // Create a local file URI first
      const fileUri = FileSystem.cacheDirectory + `${referenceCode}_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: fileUri });

      // Create asset from the local file
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      
      // Save to album
      const albumName = "Casino Night Rentals";
      let album = await MediaLibrary.getAlbumAsync(albumName);
      
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      // Clean up the temporary file
      await FileSystem.deleteAsync(fileUri);

      Alert.alert(
        "Success",
        "Receipt saved to your gallery!",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error saving receipt:", error);
      Alert.alert(
        "Error",
        "Could not save receipt. Please check app permissions.",
        [{ text: "OK" }]
      );
    }
  };

  const renderPaymentCard = ({ item }) => (
    <ViewShot 
      ref={ref => viewShotRefs.current[item.reference_code] = ref} 
      options={{ format: "png", quality: 1.0 }}
    >
      <View style={[
        styles.card,
        item.status === 'approved' ? styles.approvedCard : styles.pendingCard
      ]}>
        <Text style={styles.title}>Casino Night Rentals</Text>
        <Text style={styles.subtitle}>Payment Receipt</Text>
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.label}>Customer ID:</Text>
          <Text style={styles.value}>{item.customer_id}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{item.first_name} {item.last_name}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Product:</Text>
          <Text style={styles.value}>{item.product_name.trim()}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.value}>{item.quantity}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total amount:</Text>
          <Text style={styles.value}>{item.total_amount}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Reference:</Text>
          <Text style={[styles.value, styles.reference]}>{item.reference_code}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={styles.value}>
            {item.payment_method.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[
            styles.value,
            item.status === 'approved' ? styles.approvedText : styles.pendingText
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
        
        {item.status === "approved" && (
          <View style={styles.buttonContainer}>
            <Button 
              title="Download" 
              onPress={() => handleDownload(item.reference_code)}
              color="#4CAF50"
            />
          </View>
        )}
      </View>
    </ViewShot>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color="#FF3D00" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchPayments}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && payments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="receipt" size={50} color="#6200EE" />
        <Text style={styles.emptyText}>No payment records found</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.uniqueKey}  // Use the unique key we added
        renderItem={renderPaymentCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#0066cc"]}
            tintColor="#0066cc"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  approvedCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#28a745",
  },
  pendingCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#ffc107",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#0066cc",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6c757d",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#dee2e6",
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  reference: {
    color: "#0066cc",
  },
  approvedText: {
    color: "#28a745",
  },
  pendingText: {
    color: "#ffc107",
  },
  buttonContainer: {
    marginTop: 16,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    marginVertical: 20,
    textAlign: "center",
  },
  emptyText: {
    color: "#6c757d",
    fontSize: 16,
    marginVertical: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0066cc",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#0066cc",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginTop: 10,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default CustomerOrderPayments;