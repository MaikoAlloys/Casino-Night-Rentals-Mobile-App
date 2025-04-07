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
  PixelRatio,
  Share
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import Icon from 'react-native-vector-icons/AntDesign';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const CustomerServiceReceipts = () => {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const receiptRefs = useRef({});

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    })();
  }, []);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem("customerToken");
      
      if (!token) {
        setError("You must be logged in to view services");
        Alert.alert("Error", "Please login to view your services");
        router.push("/customer-login");
        return;
      }

      const response = await api.get("/customer/customer-service-details", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && Array.isArray(response.data)) {
        const formattedServices = response.data.map((item, index) => ({
          ...item,
          id: item.payment_id,
          tempId: index.toString(),
          formattedDate: formatDate(item.event_date),
          status: item.payment_status || 'pending'
        }));
        setServices(formattedServices);
      } else {
        throw new Error("No services found");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to load services";
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
    fetchServiceDetails();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServiceDetails();
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
        return '#4CAF50';
      case 'released':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'completed':
        return '#FFC107';
      case 'confirmed':
        return '#9C27B0';
      default:
        return '#9E9E9E';
    }
  };

  const handleConfirmService = async (paymentId) => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      await api.put(`/customer/confirm-service/${paymentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      Alert.alert("Success", "Service confirmed successfully!");
      setServices(services.map(service => 
        service.id === paymentId ? { ...service, status: 'confirmed' } : service
      ));
    } catch (error) {
      console.error("Error confirming service:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to confirm service");
    }
  };

  const handlePrintReceipt = async (tempId) => {
    try {
      const service = services.find(s => s.tempId === tempId);
      if (!service) {
        throw new Error("Service not found");
      }

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 5px 0; }
              .footer { margin-top: 30px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>Service Receipt</h2>
              </div>
              <div class="details">
                <div class="detail-row"><strong>Reference Code:</strong> ${service.reference_code}</div>
                <div class="detail-row"><strong>Customer Name:</strong> ${service.customer_name}</div>
                <div class="detail-row"><strong>Service:</strong> ${service.service_name}</div>
                <div class="detail-row"><strong>Dealer Name:</strong> ${service.dealer_name}</div>
                <div class="detail-row"><strong>Event Date:</strong> ${service.formattedDate}</div>
                <div class="detail-row"><strong>People:</strong> ${service.number_of_people}</div>
                <div class="detail-row"><strong>Payment Method:</strong> ${service.payment_method}</div>
                <div class="detail-row"><strong>Total Cost:</strong> Kshs ${parseFloat(service.total_cost).toFixed(2)}</div>
              </div>
              <div class="footer">
                <p>Thank you for choosing our services.</p>
                <p>Authorized Signature: ___________________</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
    } catch (error) {
      console.error("Error printing receipt:", error);
      Alert.alert("Error", "Failed to print receipt");
    }
  };

  const handleShareReceipt = async (tempId) => {
    try {
      const viewRef = receiptRefs.current[tempId];
      if (!viewRef) {
        throw new Error("Could not find receipt view");
      }

      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
      });

      await Share.share({
        url: uri,
        title: 'Service Receipt',
        message: `Here's my service receipt for ${services[tempId].service_name}`,
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
      Alert.alert("Error", "Failed to share receipt");
    }
  };

  const handleSaveReceipt = async (tempId) => {
    try {
      if (!hasMediaPermission) {
        Alert.alert("Permission required", "Please grant media permissions to save receipts");
        return;
      }

      const viewRef = receiptRefs.current[tempId];
      if (!viewRef) {
        throw new Error("Could not find receipt view");
      }

      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      const albumName = "Service Receipts";
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
    }
  };

  const canPrintReceipt = (status) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'approved' || lowerStatus === 'released' || lowerStatus === 'confirmed';
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
        <Button title="Retry" onPress={fetchServiceDetails} />
      </View>
    );
  }

  if (!loading && services.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No services found</Text>
        <Button title="Refresh" onPress={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Service Receipts</Text>
      <Text style={styles.subheader}>View and manage your service bookings and receipts</Text>
      
      <FlatList
        data={services}
        keyExtractor={(item) => item.tempId}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View 
              ref={ref => receiptRefs.current[item.tempId] = ref}
              style={styles.receiptContent}
              collapsable={false}  // This is important for view capturing
            >
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptTitle}>Service Receipt</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference Code:</Text>
                  <Text style={styles.detailValue}>{item.reference_code}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer Name:</Text>
                  <Text style={styles.detailValue}>{item.customer_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Service:</Text>
                  <Text style={styles.detailValue}>{item.service_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dealer Name:</Text>
                  <Text style={styles.detailValue}>{item.dealer_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Event Date:</Text>
                  <Text style={styles.detailValue}>{item.formattedDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Number of People:</Text>
                  <Text style={styles.detailValue}>{item.number_of_people}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <Text style={styles.detailValue}>{item.payment_method}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Cost:</Text>
                  <Text style={[styles.detailValue, styles.totalCost]}>
                    Kshs {parseFloat(item.total_cost).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptFooter}>
                <Text style={styles.thankYouText}>
                  Thank you for choosing our services. For any inquiries, please contact our support team.
                </Text>
                <Text style={styles.signatureText}>Authorized Signature: ___________________</Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              {canPrintReceipt(item.status) && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#1890ff' }]}
                    onPress={() => handlePrintReceipt(item.tempId)}
                  >
                    <Icon name="printer" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Print</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#13c2c2' }]}
                    onPress={() => handleShareReceipt(item.tempId)}
                  >
                    <Icon name="sharealt" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#722ed1' }]}
                    onPress={() => handleSaveReceipt(item.tempId)}
                  >
                    <Icon name="download" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Save</Text>
                  </TouchableOpacity>
                </>
              )}

              {item.status.toLowerCase() === 'completed' && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#52c41a' }]}
                  onPress={() => handleConfirmService(item.id)}
                >
                  <Icon name="checkcircleo" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirm Completion</Text>
                </TouchableOpacity>
              )}

              {item.status.toLowerCase() === 'confirmed' && (
                <View style={styles.confirmationAlert}>
                  <Icon name="checkcircle" size={20} color="#52c41a" />
                  <Text style={styles.confirmationText}>Service confirmed successfully</Text>
                </View>
              )}
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
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
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1890ff",
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#e8e8e8",
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  receiptContent: {
    padding: 16,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1890ff",
  },
  detailsContainer: {
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#666",
  },
  detailValue: {
    color: "#333",
  },
  totalCost: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1890ff",
  },
  receiptFooter: {
    marginTop: 16,
  },
  thankYouText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  signatureText: {
    textAlign: "right",
    color: "#666",
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  statusLabel: {
    fontWeight: "bold",
    color: "#666",
  },
  statusValue: {
    fontWeight: "bold",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 14,
  },
  confirmationAlert: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f6ffed",
    borderWidth: 1,
    borderColor: "#b7eb8f",
    borderRadius: 4,
    marginBottom: 8,
    width: "100%",
  },
  confirmationText: {
    marginLeft: 8,
    color: "#52c41a",
  },
});

export default CustomerServiceReceipts;