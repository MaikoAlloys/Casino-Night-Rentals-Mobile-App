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
  TouchableOpacity,
  Platform,
  UIManager,
  findNodeHandle,
  PixelRatio
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const CustomerReservation = () => {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const viewRefs = useRef({});

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    })();
  }, []);

  const fetchReservations = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      if (!token) {
        router.push("/customer-login");
        return;
      }

      const response = await api.get("/customer/event-product-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        // Map booking_id to id for consistency
        const formattedReservations = response.data.map((item, index) => ({
          ...item,
          id: item.booking_id, // Map booking_id to id
          tempId: index.toString(),
        }));
        setReservations(formattedReservations);
        setError(null);
      } else {
        throw new Error("Failed to fetch reservations");
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError(error.message || "Failed to load reservations. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservations();
  };

  const handleConfirmReservation = async (bookingId) => {
    if (!bookingId) {
      Alert.alert("Error", "Invalid reservation ID");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("customerToken");
      if (!token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const response = await api.put(
        `/customer/confirm-reservation/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setReservations(prevState =>
          prevState.map(booking =>
            booking.id === bookingId ? { ...booking, status: "confirmed" } : booking
          )
        );
        Alert.alert("Success", "Reservation confirmed successfully");
      }
    } catch (error) {
      console.error("Error confirming reservation:", error);
      let errorMessage = "Failed to confirm reservation";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "Reservation not found";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      Alert.alert("Error", errorMessage);
      fetchReservations();
    }
  };

  const handlePrintReceipt = async (tempId) => {
    let uri;
    try {
      if (!hasMediaPermission) {
        Alert.alert("Permission required", "Please grant media permissions to save receipts");
        return;
      }

      const viewRef = viewRefs.current[tempId];
      if (!viewRef) {
        throw new Error("Could not find receipt view");
      }

      const node = findNodeHandle(viewRef);
      if (!node) {
        throw new Error("Could not capture receipt");
      }

      uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: PixelRatio.getPixelSizeForLayoutSize(300),
        height: PixelRatio.getPixelSizeForLayoutSize(400),
      });

      const albumName = "Reservation Receipts";
      const asset = await MediaLibrary.createAssetAsync(uri);
      const album = await MediaLibrary.getAlbumAsync(albumName);
      
      if (album === null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert("Success", "Receipt saved to your gallery");
    } catch (error) {
      console.error("Error saving receipt:", error);
      Alert.alert("Error", "Failed to save receipt");
    } finally {
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    }
  };

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
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={fetchReservations} />
      </View>
    );
  }

  if (!loading && reservations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No reservations found</Text>
        <Button title="Refresh" onPress={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.tempId}
        renderItem={({ item }) => (
          <View 
            ref={ref => viewRefs.current[item.tempId] = ref}
            style={[styles.card, item.status === "confirmed" ? styles.confirmedCard : styles.pendingCard]}
          >
            <Text style={styles.title}>{item.first_name} {item.last_name}</Text>
            <Text style={styles.detail}>Product: {item.product_name}</Text>
            <Text style={styles.detail}>Quantity: {item.quantity}</Text>
            <Text style={styles.detail}>Status: {item.status}</Text>
            <Text style={styles.detail}>ID: {item.id}</Text>
            
            {item.status === "reserved" && (
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => handleConfirmReservation(item.id)}
              >
                <Text style={styles.buttonText}>Confirm Reservation</Text>
              </TouchableOpacity>
            )}
            
            {item.status === "confirmed" && (
              <TouchableOpacity 
                style={styles.printButton}
                onPress={() => handlePrintReceipt(item.tempId)}
              >
                <Text style={styles.buttonText}>Download Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { 
    padding: 15, 
    marginVertical: 10, 
    borderRadius: 10, 
    backgroundColor: "#f9f9f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmedCard: { borderLeftWidth: 5, borderLeftColor: "green" },
  pendingCard: { borderLeftWidth: 5, borderLeftColor: "orange" },
  title: { 
    fontSize: 18, 
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
    color: "#555",
  },
  confirmButton: {
    backgroundColor: "#0066cc",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  printButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: { color: "red", textAlign: "center", marginBottom: 20 },
  emptyText: { color: "gray", textAlign: "center", marginBottom: 20 },
});

export default CustomerReservation;