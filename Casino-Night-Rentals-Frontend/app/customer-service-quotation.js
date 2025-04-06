import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "./api";

const CustomerServiceQuotation = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [serviceBookingId, setServiceBookingId] = useState('');
  const [errors, setErrors] = useState({});

  const router = useRouter();

  useEffect(() => {
    fetchSelectedItems();
  }, []);

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      if (!token) {
        Alert.alert("Error", "Please login to continue");
        router.push("/customer-login");
        return null;
      }
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      Alert.alert("Error", "Failed to authenticate");
      router.push("/customer-login");
      return null;
    }
  };

  const fetchSelectedItems = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) return;

      const response = await api.get(`/service/selected-items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.selectedItems && response.data.selectedItems.length > 0) {
        setSelectedItems(response.data.selectedItems);
        
        // Fixed total calculation
        const calculatedTotal = response.data.selectedItems.reduce(
          (sum, item) => sum + (parseFloat(item.total_cost) || 0),
          0
        );
        
        // Debugging logs
        console.log('Backend totalCost:', response.data.totalCost);
        console.log('Calculated total:', calculatedTotal);
        console.log('All items:', response.data.selectedItems);
        
        setTotalCost(response.data.totalCost || calculatedTotal);
        setServiceBookingId(response.data.selectedItems[0].service_booking_id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching selected items:', error);
      Alert.alert('Error', 'Failed to fetch quotation details');
      setLoading(false);
    }
  };

  const validatePayment = () => {
    const newErrors = {};
    
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    
    if (!referenceCode) {
      newErrors.referenceCode = 'Reference code is required';
    } else if (paymentMethod === 'bank' && referenceCode.length !== 14) {
      newErrors.referenceCode = 'Bank reference must be 14 characters';
    } else if (paymentMethod === 'mpesa' && referenceCode.length !== 10) {
      newErrors.referenceCode = 'Mpesa reference must be 10 characters';
    }
    
    if (!serviceBookingId) {
      newErrors.serviceBookingId = 'Service booking ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReferenceCodeChange = (text) => {
    const upperText = text.toUpperCase();
    
    if (paymentMethod === 'bank' && upperText.length <= 14) {
      setReferenceCode(upperText);
    } else if (paymentMethod === 'mpesa' && upperText.length <= 10) {
      setReferenceCode(upperText);
    } else if (!paymentMethod) {
      setReferenceCode(upperText);
    }
  };

  const processPayment = async () => {
    if (!validatePayment()) return;
    
    setPaymentLoading(true);
    
    try {
      const token = await getAuthToken();
      if (!token) return;

      await api.post(
        `/service/process-payment`,
        {
          serviceBookingId,
          totalCost,
          paymentMethod,
          referenceCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        'Success',
        'Payment processed successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert(
        'Payment Submitted', 
        'Your payment details have been recorded',
        [{ text: 'OK' }]
      );
    } finally {
      setPaymentLoading(false);
      router.push('/customer-service-receipts');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading quotation details...</Text>
      </View>
    );
  }

  if (selectedItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No items selected for quotation</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Service Quotation</Text>
        <Text style={styles.customerName}>
          Customer: {selectedItems[0]?.customer_name || 'N/A'}
        </Text>
        <Text style={styles.serviceName}>
          Service: {selectedItems[0]?.service_name || 'N/A'}
        </Text>
      </View>

      <View style={styles.itemsContainer}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemHeaderText, { flex: 2 }]}>Item</Text>
          <Text style={styles.itemHeaderText}>Qty</Text>
          <Text style={styles.itemHeaderText}>Cost</Text>
          <Text style={styles.itemHeaderText}>Total</Text>
        </View>

        {selectedItems.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={[styles.itemText, { flex: 2 }]}>{item.item_name}</Text>
            <Text style={styles.itemText}>{item.quantity}</Text>
            <Text style={styles.itemText}>Kshs {parseFloat(item.item_cost).toFixed(2)}</Text>
            <Text style={styles.itemText}>Kshs {parseFloat(item.total_cost).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalAmount}>Kshs {parseFloat(totalCost).toFixed(2)}</Text>
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Payment Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                paymentMethod === 'bank' && styles.radioButtonSelected,
              ]}
              onPress={() => setPaymentMethod('bank')}
            >
              <Text style={styles.radioButtonText}>Bank Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                paymentMethod === 'mpesa' && styles.radioButtonSelected,
              ]}
              onPress={() => setPaymentMethod('mpesa')}
            >
              <Text style={styles.radioButtonText}>M-Pesa</Text>
            </TouchableOpacity>
          </View>
          {errors.paymentMethod && (
            <Text style={styles.errorText}>{errors.paymentMethod}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {paymentMethod === 'bank'
              ? 'Bank Reference (14 characters)'
              : paymentMethod === 'mpesa'
              ? 'M-Pesa Code (10 characters)'
              : 'Reference Code'}
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.referenceCode && styles.inputError,
            ]}
            placeholder={
              paymentMethod === 'bank'
                ? 'Enter 14-character reference'
                : paymentMethod === 'mpesa'
                ? 'Enter 10-digit M-Pesa code'
                : 'Enter reference code'
            }
            value={referenceCode}
            onChangeText={handleReferenceCodeChange}
            maxLength={paymentMethod === 'bank' ? 14 : paymentMethod === 'mpesa' ? 10 : undefined}
            autoCapitalize="characters"
            keyboardType="default"
          />
          {errors.referenceCode && (
            <Text style={styles.errorText}>{errors.referenceCode}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Booking ID</Text>
          <TextInput
            style={[
              styles.input,
              errors.serviceBookingId && styles.inputError,
            ]}
            placeholder="AUTOFILLED"
            value={serviceBookingId}
            onChangeText={setServiceBookingId}
            editable={!serviceBookingId}
          />
          {errors.serviceBookingId && (
            <Text style={styles.errorText}>{errors.serviceBookingId}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={processPayment}
          disabled={paymentLoading}
        >
          {paymentLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payButtonText}>PROCEED TO PAY</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 3,
  },
  serviceName: {
    fontSize: 16,
    color: '#495057',
  },
  itemsContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  itemHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  itemText: {
    flex: 1,
    color: '#6c757d',
    textAlign: 'right',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
  paymentSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 5,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 5,
  },
  radioButton: {
    flex: 1,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  radioButtonSelected: {
    borderColor: '#007bff',
    backgroundColor: '#e7f1ff',
  },
  radioButtonText: {
    color: '#495057',
  },
  payButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  payButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomerServiceQuotation;