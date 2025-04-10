import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import api from './api';

const SupplierPayments = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const supplierId = params.id;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const receiptRef = useRef();
  const [hasMediaPermission, setHasMediaPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (supplierId) {
      fetchPayments();
    } else {
      setError('No supplier ID found');
      setLoading(false);
    }
  }, [supplierId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/suppliers/paid-items/${supplierId}`);
      
      if (response.data?.success) {
        setPayments(response.data.items || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setApproving(true);
      
      const response = await api.put(`/suppliers/approve-payment/${supplierId}`, {
        storekeeper_selected_item_id: paymentId
      });
      
      if (response.data?.success) {
        Alert.alert('Success', 'Payment approved successfully');
        // Refetch payments to get the updated status from backend
        fetchPayments();
      } else {
        throw new Error(response.data?.message || 'Approval failed');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      Alert.alert('Error', error.message || 'Failed to approve payment');
    } finally {
      setApproving(false);
    }
  };

  const handleGenerateReceipt = async (payment) => {
    if (!hasMediaPermission) {
      Alert.alert('Permission Required', 'Please allow media access to save receipts');
      return;
    }

    setSelectedPayment(payment);
    setReceiptVisible(true);
  };

  const handleSaveReceipt = async () => {
    try {
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 0.9,
      });

      const albumName = "Payment Receipts";
      const asset = await MediaLibrary.createAssetAsync(uri);
      const album = await MediaLibrary.getAlbumAsync(albumName);
      
      if (album === null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Success', 'Receipt saved to gallery');
      setReceiptVisible(false);
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt');
    }
  };

  const calculateTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + parseFloat(payment.paid_amount), 0);
  };

  if (loading) {
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
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchPayments}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment History</Text>
      <Text style={styles.subHeader}>View and confirm your received payments</Text>
      
      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="payment" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No payments received yet</Text>
          <Text style={styles.emptySubText}>Your payments will appear here once processed</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.storekeeper_selected_item_id.toString()}
          renderItem={({ item }) => (
            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <View style={[
                  styles.statusBadge,
                  item.payment_status === 'approved' ? styles.approvedBadge : styles.pendingBadge
                ]}>
                  <Text style={styles.statusText}>
                    {item.payment_status === 'approved' ? 'Confirmed' : 'Pending Confirmation'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{item.quantity}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unit Price:</Text>
                  <Text style={styles.detailValue}>Kshs {parseFloat(item.total_cost).toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={[styles.detailValue, styles.amountText]}>
                    Kshs {parseFloat(item.grand_total).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid Amount:</Text>
                  <Text style={[styles.detailValue, styles.amountText]}>
                    Kshs {parseFloat(item.paid_amount).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>{item.reference_code}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(item.payment_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              {item.payment_status !== 'approved' ? (
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprovePayment(item.storekeeper_selected_item_id)}
                  disabled={approving}
                >
                  {approving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={20} color="#fff" />
                      <Text style={styles.approveButtonText}>Confirm Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.receiptButton}
                  onPress={() => handleGenerateReceipt(item)}
                >
                  <Icon name="receipt" size={20} color="#fff" />
                  <Text style={styles.receiptButtonText}>Generate Receipt</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Payments Received:</Text>
              <Text style={styles.totalAmount}>
                Kshs {calculateTotalPaid().toFixed(2)}
              </Text>
            </View>
          }
        />
      )}

      {/* Receipt Modal */}
      {selectedPayment && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={receiptVisible}
          onRequestClose={() => setReceiptVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent} ref={receiptRef}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
                <Text style={styles.receiptSubtitle}>Transaction Confirmation</Text>
              </View>
              
              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Supplier:</Text>
                  <Text style={styles.receiptValue}>{selectedPayment.supplier_full_name}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Item:</Text>
                  <Text style={styles.receiptValue}>{selectedPayment.item_name}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Quantity:</Text>
                  <Text style={styles.receiptValue}>{selectedPayment.quantity}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Unit Price:</Text>
                  <Text style={styles.receiptValue}>Kshs {parseFloat(selectedPayment.total_cost).toFixed(2)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Total Amount:</Text>
                  <Text style={styles.receiptValue}>Kshs {parseFloat(selectedPayment.grand_total).toFixed(2)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Paid Amount:</Text>
                  <Text style={styles.receiptValue}>Kshs {parseFloat(selectedPayment.paid_amount).toFixed(2)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Method:</Text>
                  <Text style={styles.receiptValue}>{selectedPayment.reference_code}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Date:</Text>
                  <Text style={styles.receiptValue}>
                    {new Date(selectedPayment.payment_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status:</Text>
                  <Text style={[styles.receiptValue, styles.statusApproved]}>APPROVED</Text>
                </View>
              </View>
              
              <View style={styles.receiptFooter}>
                <Text style={styles.thankYouText}>Thank you for your business!</Text>
                <Text style={styles.footerNote}>This is an official payment receipt</Text>
              </View>
              
              <View style={styles.receiptButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveReceipt}
                >
                  <Icon name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save to Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setReceiptVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
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
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#fff3e0',
  },
  approvedBadge: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDetails: {
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  amountText: {
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  receiptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  receiptSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  receiptBody: {
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusApproved: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  receiptFooter: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    alignItems: 'center',
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
  },
  receiptButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
});

export default SupplierPayments;