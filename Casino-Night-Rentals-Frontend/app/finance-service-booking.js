import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl, 
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import api from './api';

const FinanceServiceBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finance/pending-service-bookings');
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success && Array.isArray(response.data.serviceBookings)) {
          const formattedBookings = response.data.serviceBookings.map((booking, index) => ({
            ...booking,
            service_booking_id: booking.id || booking.service_booking_id || index + 1
          }));
          setBookings(formattedBookings);
        } else {
          throw new Error(response.data.message || 'Invalid data structure received');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      Alert.alert('Error', error.message || 'Failed to load pending bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingBookings();
  };

  const handleApprove = async (serviceBookingId) => {
    if (!serviceBookingId) {
      Alert.alert('Error', 'Invalid booking ID');
      return;
    }

    try {
      setApprovingId(serviceBookingId);
      
      const response = await api.post('/finance/approve-service-booking', 
        { service_booking_id: serviceBookingId },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && typeof response.data === 'object') {
        if (response.data.success) {
          Alert.alert('Success', response.data.message || 'Booking approved successfully');
          setBookings(prev => prev.filter(booking => 
            (booking.id || booking.service_booking_id) !== serviceBookingId
          ));
          setSelectedBooking(null); // Close modal after approval
        } else {
          throw new Error(response.data.message || 'Approval failed');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      Alert.alert('Error', error.message || 'Failed to approve booking');
    } finally {
      setApprovingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return dateString;
    }
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => setSelectedBooking(item)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.serviceName}>{item.service_name || 'Unnamed Service'}</Text>
        <Text style={styles.amount}>Ksh {item.amount ? parseFloat(item.amount).toFixed(2) : '0.00'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Customer:</Text>
        <Text style={styles.value}>{item.customer_name || 'N/A'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Reference:</Text>
        <Text style={styles.value}>{item.reference_code || 'N/A'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{formatDate(item.created_at)}</Text>
      </View>

      <View style={styles.viewDetails}>
        <Text style={styles.detailsText}>View Details</Text>
        <AntDesign name="arrowright" size={16} color="#3498db" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <AntDesign name="inbox" size={48} color="#bdc3c7" />
      <Text style={styles.emptyText}>No pending service bookings</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Service Bookings</Text>
      
      <FlatList
        data={bookings}
        keyExtractor={(item) => (item.id || item.service_booking_id).toString()}
        renderItem={renderBookingItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={bookings.length === 0 && styles.emptyList}
      />

      {/* Details Modal */}
      <Modal
        visible={!!selectedBooking}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedBooking(null)}
      >
        {selectedBooking && (
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedBooking(null)}
            >
              <AntDesign name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Service Name:</Text>
                <Text style={styles.detailValue}>{selectedBooking.service_name || 'N/A'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>{selectedBooking.customer_name || 'N/A'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Number of People:</Text>
                <Text style={styles.detailValue}>{selectedBooking.number_of_people || 'N/A'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>Ksh {selectedBooking.amount ? parseFloat(selectedBooking.amount).toFixed(2) : '0.00'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Payment Method:</Text>
                <Text style={styles.detailValue}>{selectedBooking.payment_method || 'N/A'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Reference Code:</Text>
                <Text style={styles.detailValue}>{selectedBooking.reference_code || 'N/A'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Booking Date:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedBooking.created_at)}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Booking ID:</Text>
                <Text style={styles.detailValue}>{selectedBooking.id || selectedBooking.service_booking_id || 'N/A'}</Text>
              </View>

              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(selectedBooking.id || selectedBooking.service_booking_id)}
                disabled={approvingId === (selectedBooking.id || selectedBooking.service_booking_id)}
              >
                {approvingId === (selectedBooking.id || selectedBooking.service_booking_id) ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>APPROVE PAYMENT</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#34495e',
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  detailsText: {
    color: '#3498db',
    marginRight: 8,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#bdc3c7',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FinanceServiceBooking;