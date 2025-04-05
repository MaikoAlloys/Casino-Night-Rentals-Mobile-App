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

const ServiceBookings = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem("customerToken");
      console.log('Token from storage:', token);
      
      if (!token) {
        setError("You must be logged in to view bookings");
        Alert.alert("Error", "Please login to view your bookings");
        router.push("/customer-login");
        return;
      }

      const response = await api.get("/service/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && Array.isArray(response.data)) {
        const formattedBookings = response.data.map((item, index) => ({
          ...item,
          id: item.booking_id,
          tempId: index.toString(),
          formattedDate: formatDate(item.event_date),
        }));
        setBookings(formattedBookings);
      } else {
        throw new Error("No bookings found");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to load bookings";
      setError(errorMessage);
      
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please login again");
        router.push("/customer-login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4CAF50'; // Green
      case 'assigned':
        return '#2196F3'; // Blue
      case 'pending':
        return '#FF9800'; // Orange
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const handleDownloadReceipt = async (tempId) => {
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

      const albumName = "Service Booking Receipts";
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

  const canDownloadReceipt = (status) => {
    return status.toLowerCase() === 'approved' || status.toLowerCase() === 'assigned';
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
        <Button title="Retry" onPress={fetchBookings} />
      </View>
    );
  }

  if (!loading && bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No bookings found</Text>
        <Button title="Refresh" onPress={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Service Bookings</Text>
      
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.tempId}
        renderItem={({ item }) => (
          <View 
            ref={ref => viewRefs.current[item.tempId] = ref}
            style={styles.card}
          >
            <Text style={styles.serviceName}>{item.service_name}</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Event Date:</Text>
              <Text style={styles.detailValue}>{item.formattedDate}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>People:</Text>
              <Text style={styles.detailValue}>{item.number_of_people}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking Fee:</Text>
              <Text style={styles.detailValue}>Kshs {item.booking_fee}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method:</Text>
              <Text style={styles.detailValue}>{item.payment_method.toUpperCase()}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference:</Text>
              <Text style={styles.detailValue}>{item.reference_code}</Text>
            </View>
            
            {canDownloadReceipt(item.status) && (
              <TouchableOpacity 
                style={[styles.downloadButton, 
                  { backgroundColor: item.status.toLowerCase() === 'assigned' ? '#2196F3' : '#4CAF50' }
                ]}
                onPress={() => handleDownloadReceipt(item.tempId)}
              >
                <Text style={styles.buttonText}>Download Receipt</Text>
              </TouchableOpacity>
            )}
            
            {/* Hidden receipt view for capture */}
            <View style={styles.hiddenReceipt}>
              <ReceiptView booking={item} getStatusColor={getStatusColor} />
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const ReceiptView = ({ booking, getStatusColor }) => {
  return (
    <View style={styles.receiptContainer}>
      <Text style={styles.receiptHeader}>Booking Confirmation</Text>
      
      <View style={styles.receiptDetailRow}>
        <Text style={styles.receiptLabel}>Booking ID:</Text>
        <Text style={styles.receiptValue}>#{booking.booking_id}</Text>
      </View>
      
      <View style={styles.receiptDetailRow}>
        <Text style={styles.receiptLabel}>Service:</Text>
        <Text style={styles.receiptValue}>{booking.service_name}</Text>
      </View>
      
      <View style={styles.receiptDetailRow}>
        <Text style={styles.receiptLabel}>Event Date:</Text>
        <Text style={styles.receiptValue}>{booking.formattedDate}</Text>
      </View>
      
      <View style={styles.receiptDetailRow}>
        <Text style={styles.receiptLabel}>People:</Text>
        <Text style={styles.receiptValue}>{booking.number_of_people}</Text>
      </View>
      
      <View style={styles.receiptDetailRow}>
        <Text style={styles.receiptLabel}>Booking Fee:</Text>
        <Text style={[styles.receiptValue, { fontWeight: 'bold' }]}>
          Kshs {booking.booking_fee}
        </Text>
      </View>
      
      <View style={styles.receiptDetailRow}>
        <Text style={styles.receiptLabel}>Payment Method:</Text>
        <Text style={styles.receiptValue}>{booking.payment_method.toUpperCase()}</Text>
      </View>
      
      <View style={styles.receiptDetailRow}>
        <Text style={styles.receiptLabel}>Reference Code:</Text>
        <Text style={styles.receiptValue}>{booking.reference_code}</Text>
      </View>
      
      <View style={styles.receiptStatus}>
        <Text style={[styles.receiptStatusText, { 
          color: getStatusColor(booking.status) 
        }]}>
          Status: {booking.status.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.receiptFooter}>Thank you for your booking!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
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
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
  },
  downloadButton: {
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  hiddenReceipt: {
    position: "absolute",
    left: -10000,
  },
  receiptContainer: {
    width: 300,
    backgroundColor: "white",
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  receiptHeader: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  receiptDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  receiptLabel: {
    fontSize: 14,
    color: "#666",
  },
  receiptValue: {
    fontSize: 14,
    color: "#333",
  },
  receiptStatus: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    alignItems: "center",
  },
  receiptStatusText: {
    fontStyle: "italic",
    fontWeight: "bold",
  },
  receiptFooter: {
    marginTop: 15,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default ServiceBookings;