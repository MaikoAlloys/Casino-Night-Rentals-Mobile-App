import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import api from './api';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DealerDashboard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dealerId = params.id;
  const [bookings, setBookings] = useState([]);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const [error, setError] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.7)).current;

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? -width * 0.7 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (dealerId) {
      fetchBookings();
    } else {
      setError('No dealer ID found in URL');
      setLoading(false);
    }
  }, [dealerId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get(`/dealers/bookings/${dealerId}`);

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }

      if (!res.data.bookings || res.data.bookings.length === 0) {
        setBookings([]);
        return;
      }

      // Process bookings - group by service_booking_id
      const processedBookings = res.data.bookings.reduce((acc, item) => {
        const serviceBookingId = item.service_booking_id;
        
        if (!acc[serviceBookingId]) {
          acc[serviceBookingId] = {
            service_booking_id: serviceBookingId,
            booking_id: item.booking_id,
            event_date: item.event_date,
            number_of_people: item.number_of_people,
            customer_id: item.customer_id,
            customer_name: item.customer_name,
            service_id: item.service_id,
            service_name: item.service_name,
            payment_status: item.payment_status,
            available_items: []
          };
        }
        
        acc[serviceBookingId].available_items.push({
          store_item_id: item.store_item_id,
          item_name: item.item_name,
          item_cost_per_person: parseFloat(item.item_cost_per_person) || 0
        });
        
        return acc;
      }, {});

      const bookingsArray = Object.values(processedBookings);
      setBookings(bookingsArray);
      
      // Initialize empty selections for each booking
      const initialSelections = {};
      bookingsArray.forEach(booking => {
        initialSelections[booking.service_booking_id] = {};
      });
      setSelections(initialSelections);

    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (serviceBookingId, itemId) => {
    setSelections(prev => {
      const currentBookingSelections = prev[serviceBookingId] || {};
      const isSelected = currentBookingSelections[itemId] !== undefined;
      
      return {
        ...prev,
        [serviceBookingId]: {
          ...currentBookingSelections,
          [itemId]: isSelected ? undefined : 1 // Toggle selection
        }
      };
    });
  };

  const handleQuantityChange = (serviceBookingId, itemId, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 1) return; // Minimum quantity is 1
    
    setSelections(prev => ({
      ...prev,
      [serviceBookingId]: {
        ...prev[serviceBookingId],
        [itemId]: numValue
      }
    }));
  };

  const calculateItemTotal = (serviceBookingId, itemId, itemCost) => {
    const quantity = selections[serviceBookingId]?.[itemId] || 0;
    return (quantity * itemCost).toFixed(2);
  };

  const calculateBookingTotal = (serviceBookingId, availableItems) => {
    if (!selections[serviceBookingId]) return '0.00';
    
    return Object.entries(selections[serviceBookingId]).reduce((sum, [itemId, quantity]) => {
      if (!quantity) return sum;
      const item = availableItems.find(i => i.store_item_id == itemId);
      return sum + (quantity * (item?.item_cost_per_person || 0));
    }, 0).toFixed(2);
  };

  const handleSubmit = async (booking) => {
    const serviceBookingId = booking.service_booking_id;
    const currentSelections = selections[serviceBookingId] || {};
    
    // Filter out items with undefined or 0 quantity
    const itemsToSubmit = Object.entries(currentSelections)
      .filter(([_, quantity]) => quantity)
      .map(([itemId, quantity]) => ({
        itemId,
        quantity,
        item: booking.available_items.find(i => i.store_item_id == itemId)
      }));

    if (itemsToSubmit.length === 0) {
      Alert.alert('Error', 'Please select at least one item');
      return;
    }

    try {
      setSubmitting(prev => ({ ...prev, [serviceBookingId]: true }));
      
      // Submit all items for this booking
      const submissionPromises = itemsToSubmit.map(({ itemId, quantity, item }) => {
        return api.post('/dealers/select-item', {
          store_item_id: itemId,
          service_id: booking.service_id,
          dealer_id: dealerId,
          customer_id: booking.customer_id,
          item_cost: item.item_cost_per_person,
          quantity: quantity,
          service_booking_id: serviceBookingId // Include service_booking_id in the request
        });
      });

      await Promise.all(submissionPromises);

      Alert.alert('Success', 'Items submitted successfully');
      
      // Clear selections for this booking only
      setSelections(prev => ({
        ...prev,
        [serviceBookingId]: {}
      }));
      
      // Refresh data
      fetchBookings();
    } catch (err) {
      console.error('Submission failed:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit items');
    } finally {
      setSubmitting(prev => ({ ...prev, [serviceBookingId]: false }));
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return isNaN(date) ? dateString : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('dealerToken');
      router.replace('/');
    } catch (err) {
      console.error('Logout failed:', err);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (bookings.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.noBookingsText}>No bookings found for dealer ID: {dealerId}</Text>
          <Text style={styles.noBookingsSubtext}>Please check with administrator if this is unexpected.</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchBookings}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView 
        contentContainerStyle={styles.container}
        style={{ flex: 1 }}
      >
        {bookings.map((booking) => {
          const serviceBookingId = booking.service_booking_id;
          const isSubmitting = submitting[serviceBookingId] || false;
          const hasSelectedItems = selections[serviceBookingId] 
            ? Object.values(selections[serviceBookingId]).some(qty => qty)
            : false;

          return (
            <View key={serviceBookingId} style={styles.bookingCard}>
              <Text style={styles.customerName}>{booking.customer_name}</Text>
              <View style={styles.bookingDetailsContainer}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={16} color="#666" />
                  <Text style={styles.bookingDetail}> {formatDate(booking.event_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="local-offer" size={16} color="#666" />
                  <Text style={styles.bookingDetail}> {booking.service_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="people" size={16} color="#666" />
                  <Text style={styles.bookingDetail}> {booking.number_of_people} people</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="payment" size={16} color="#666" />
                  <Text style={[
                    styles.bookingDetail,
                    booking.payment_status === 'paid' ? styles.paidStatus : styles.pendingStatus
                  ]}> {booking.payment_status}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Available Items:</Text>
              
              {booking.available_items?.map((item) => {
                const isSelected = !!selections[serviceBookingId]?.[item.store_item_id];
                return (
                  <View key={item.store_item_id} style={styles.itemContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => toggleItemSelection(serviceBookingId, item.store_item_id)}
                    >
                      <View style={[
                        styles.checkboxInner,
                        isSelected && styles.checkboxSelected
                      ]}>
                        {isSelected && <MaterialIcons name="check" size={14} color="#fff" />}
                      </View>
                      <Text style={styles.itemName}>{item.item_name}</Text>
                      <Text style={styles.itemPrice}>Kshs {item.item_cost_per_person}</Text>
                    </TouchableOpacity>
                    
                    {isSelected && (
                      <View style={styles.quantityContainer}>
                        <Text style={styles.quantityLabel}>Quantity:</Text>
                        <TextInput
                          style={styles.quantityInput}
                          keyboardType="numeric"
                          value={selections[serviceBookingId][item.store_item_id]?.toString() || '1'}
                          onChangeText={(text) => handleQuantityChange(serviceBookingId, item.store_item_id, text)}
                          min="1"
                        />
                        <Text style={styles.itemCost}>
                          Kshs {calculateItemTotal(serviceBookingId, item.store_item_id, item.item_cost_per_person)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Booking Total:</Text>
                <Text style={styles.totalAmount}>Kshs {calculateBookingTotal(serviceBookingId, booking.available_items)}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isSubmitting || !hasSelectedItems) && styles.submitButtonDisabled
                ]}
                onPress={() => handleSubmit(booking)}
                disabled={isSubmitting || !hasSelectedItems}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Quotation</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Dealer Menu</Text>
          <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.sidebarMenu}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => { 
              router.push(`/dealer-dashboard/${dealerId}`); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="home" size={20} color="#4A90E2" />
            <Text style={styles.navItem}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => { 
              router.push(`/dealer-profile/${dealerId}`); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="person" size={20} color="#4A90E2" />
            <Text style={styles.navItem}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => { 
              router.push(`/dealer-complete/${dealerId}`); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="check-circle" size={20} color="#4A90E2" />
            <Text style={styles.navItem}>Complete Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={async () => { 
              await handleLogout();
              toggleSidebar();
            }}
          >
            <MaterialIcons name="logout" size={20} color="#4A90E2" />
            <Text style={styles.navItem}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar}>
            <MaterialIcons name="menu" size={28} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Bookings</Text>
          <View style={{ width: 28 }} />
        </View>
        
        <Text style={styles.dealerId}>Dealer ID: {dealerId}</Text>
        
        {renderContent()}
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 20,
    color: '#4A90E2',
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  noBookingsText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  noBookingsSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  dealerId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: '#eaf2ff',
    padding: 8,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginHorizontal: 20,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  bookingDetailsContainer: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bookingDetail: {
    fontSize: 14,
    color: '#555',
  },
  paidStatus: {
    color: '#27ae60',
    fontWeight: '500',
  },
  pendingStatus: {
    color: '#e67e22',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 12,
    color: '#2c3e50',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  itemContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 12,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  itemName: {
    fontSize: 15,
    flex: 1,
    color: '#333',
  },
  itemPrice: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 34,
    marginTop: 8,
  },
  quantityLabel: {
    marginRight: 10,
    fontSize: 14,
    color: '#666',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    width: 60,
    marginRight: 15,
    backgroundColor: '#f9f9f9',
  },
  itemCost: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a0b8d8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    width: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    width: 120,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  // Sidebar styles
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#2c3e50',
    zIndex: 100,
    paddingTop: 50,
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
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  sidebarMenu: {
    paddingTop: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  navItem: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
});

export default DealerDashboard;