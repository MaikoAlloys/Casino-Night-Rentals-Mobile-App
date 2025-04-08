import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from './api';

const FinanceSupplierPayments = () => {
  const router = useRouter();
  const [receivedItems, setReceivedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [referenceCode, setReferenceCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReceivedItems();
  }, []);

  const fetchReceivedItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/finance/fetch-items-to-pay');
      
      if (response.data?.success) {
        setReceivedItems(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch items');
      }
    } catch (error) {
    //   console.error('Error fetching items:', error);
      setError(error.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!referenceCode) {
      Alert.alert('Error', 'Please enter reference code');
      return;
    }

    // Validate reference code based on payment method
    const isValidReference = paymentMethod === 'mpesa' 
      ? /^[A-Za-z0-9]{10}$/.test(referenceCode)
      : /^[A-Za-z0-9]{14}$/.test(referenceCode);

    if (!isValidReference) {
      Alert.alert(
        'Error', 
        paymentMethod === 'mpesa' 
          ? 'MPesa reference must be 10 alphanumeric characters'
          : 'Bank reference must be 14 alphanumeric characters'
      );
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await api.post('/finance/pay-supplier', {
        payment_method: paymentMethod,
        reference_code: referenceCode,
        paid_amount: selectedItem.grand_total,
        storekeeper_selected_item_id: selectedItem.storekeeper_selected_item_id
      });
      
      if (response.data?.success) {
        Alert.alert('Success', 'Payment processed successfully');
        setPaymentModalVisible(false);
        fetchReceivedItems(); // Refresh the list
      } else {
        throw new Error(response.data?.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', error.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateGrandTotal = () => {
    return receivedItems.reduce((sum, item) => sum + parseFloat(item.grand_total), 0);
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
          onPress={fetchReceivedItems}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Supplier Payments</Text>
      <Text style={styles.subHeader}>Items ready for payment processing</Text>
      
      {receivedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="payment" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No items awaiting payment</Text>
          <Text style={styles.emptySubText}>All received materials have been processed</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={receivedItems}
            keyExtractor={(item) => item.storekeeper_selected_item_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Received</Text>
                  </View>
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Supplier:</Text>
                    <Text style={styles.detailValue}>{item.supplier_full_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantity:</Text>
                    <Text style={styles.detailValue}>{item.quantity}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Unit Cost:</Text>
                    <Text style={styles.detailValue}>Kshs {parseFloat(item.total_cost).toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Amount:</Text>
                    <Text style={[styles.detailValue, styles.totalAmount]}>
                      Kshs {parseFloat(item.grand_total).toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => {
                    setSelectedItem(item);
                    setPaymentModalVisible(true);
                  }}
                >
                  <Icon name="attach-money" size={20} color="#fff" />
                  <Text style={styles.payButtonText}>Process Payment</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Pending Payments:</Text>
            <Text style={styles.totalAmount}>
              Kshs {calculateGrandTotal().toFixed(2)}
            </Text>
          </View>
        </>
      )}

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Process Payment</Text>
            
            <View style={styles.modalItemInfo}>
              <Text style={styles.modalItemName}>{selectedItem?.item_name}</Text>
              <Text style={styles.modalSupplier}>{selectedItem?.supplier_full_name}</Text>
              <Text style={styles.modalAmount}>
                Amount: Kshs {selectedItem?.grand_total.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    paymentMethod === 'mpesa' && styles.methodButtonActive
                  ]}
                  onPress={() => setPaymentMethod('mpesa')}
                >
                  <Text style={paymentMethod === 'mpesa' ? styles.methodTextActive : styles.methodText}>
                    MPesa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    paymentMethod === 'bank' && styles.methodButtonActive
                  ]}
                  onPress={() => setPaymentMethod('bank')}
                >
                  <Text style={paymentMethod === 'bank' ? styles.methodTextActive : styles.methodText}>
                    Bank
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {paymentMethod === 'mpesa' ? 'MPesa Reference' : 'Bank Reference'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={
                  paymentMethod === 'mpesa' 
                    ? 'Enter 10-digit reference' 
                    : 'Enter 14-digit reference'
                }
                value={referenceCode}
                onChangeText={setReferenceCode}
                maxLength={paymentMethod === 'mpesa' ? 10 : 14}
                keyboardType="default"
                autoCapitalize="characters"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPaymentModalVisible(false);
                  setReferenceCode('');
                }}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handlePaymentSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Confirm Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  itemCard: {
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
  itemHeader: {
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
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1976d2',
  },
  itemDetails: {
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
  totalAmount: {
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  payButtonText: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItemInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSupplier: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2e7d32',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  methodButtonActive: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  methodText: {
    color: '#666',
  },
  methodTextActive: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FinanceSupplierPayments;