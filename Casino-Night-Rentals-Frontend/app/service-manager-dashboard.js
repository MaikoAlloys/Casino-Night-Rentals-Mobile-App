import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { useRouter } from 'expo-router';

const ServiceManagerDashboard = () => {
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-300)).current;
  const router = useRouter();

  useEffect(() => {
    const fetchApprovedBookings = async () => {
      try {
        const response = await api.get('/servicemanager/approved');
        setApprovedBookings(response.data.approvedBookings);
      } catch (error) {
        console.error('Error fetching approved bookings', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedBookings();
  }, []);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? 0 : -300,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [sidebarVisible]);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleAssignDealer = (bookingId) => {
    router.push({
      pathname: '/service-manager-assign',
      params: { bookingId }
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("serviceManagerToken");
    router.push("/");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Service Manager</Text>
          <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.sidebarMenu}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => { 
              router.push("/service-manager-dashboard"); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="dashboard" size={20} color="#3498db" />
            <Text style={styles.navItem}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => { 
              router.push("/service-manager-profile"); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="person" size={20} color="#3498db" />
            <Text style={styles.navItem}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#3498db" />
            <Text style={styles.navItem}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar}>
            <MaterialIcons name="menu" size={28} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.title}>Approved Service Bookings</Text>
          <View style={{ width: 28 }} /> {/* Spacer */}
        </View>

        <ScrollView style={styles.scrollContainer}>
          {approvedBookings.length > 0 ? (
            approvedBookings.map((booking) => (
              <View key={booking.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.customerName}>
                    {booking.first_name} {booking.last_name}
                  </Text>
                  <Text style={styles.bookingStatus}>{booking.status}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={18} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Event Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(booking.event_date).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="people" size={18} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Number of People:</Text>
                  <Text style={styles.detailValue}>{booking.number_of_people}</Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="attach-money" size={18} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Booking Fee:</Text>
                  <Text style={styles.detailValue}>{booking.booking_fee}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.assignButton}
                  onPress={() => handleAssignDealer(booking.id)}
                >
                  <Text style={styles.assignButtonText}>Assign Dealer</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt" size={48} color="#bdc3c7" />
              <Text style={styles.emptyText}>No approved bookings found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 280,
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
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  scrollContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  bookingStatus: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#7f8c8d',
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
  },
  assignButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#bdc3c7',
    fontSize: 16,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#7f8c8d',
  },
});

export default ServiceManagerDashboard;