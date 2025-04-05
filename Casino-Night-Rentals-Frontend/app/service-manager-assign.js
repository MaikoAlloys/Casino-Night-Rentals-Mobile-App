import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from './api';
import { useRouter, useLocalSearchParams } from 'expo-router';

const ServiceManagerAssign = () => {
  const { bookingId } = useLocalSearchParams();
  const [dealers, setDealers] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch booking details from the approved endpoint
        const approvedResponse = await api.get('/servicemanager/approved');
        const booking = approvedResponse.data.approvedBookings.find(b => b.id === parseInt(bookingId));
        
        if (!booking) {
          throw new Error('Booking not found');
        }
        
        setBookingDetails(booking);

        // Fetch all dealers
        const dealersResponse = await api.get('/servicemanager/dealers');
        setDealers(dealersResponse.data.dealers);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  const handleAssignDealer = async () => {
    try {
      await api.post('/servicemanager/dealer-assignments', {
        serviceBookingId: bookingId,
        dealerId: selectedDealer,
        serviceId: bookingDetails.service_id,
        numberOfCustomers: bookingDetails.number_of_people
      });
      
      Alert.alert('Success', 'Dealer assigned successfully!');
      router.back();
    } catch (error) {
      console.error('Error assigning dealer:', error);
      Alert.alert('Error', 'Failed to assign dealer. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!bookingDetails) {
    return (
      <View style={styles.container}>
        <Text>Booking details not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Assign Dealer to Booking</Text>
      
      <View style={styles.section}>
  <Text style={styles.sectionTitle}>Booking Details</Text>
  <Text style={styles.detailText}>Customer: {bookingDetails.first_name} {bookingDetails.last_name}</Text>
  <Text style={styles.detailText}>Service: {bookingDetails.service_name}</Text>
  <Text style={styles.detailText}>Event Date: {new Date(bookingDetails.event_date).toLocaleDateString()}</Text>
  <Text style={styles.detailText}>Service ID: {bookingDetails.service_id}</Text>
  <Text style={styles.detailText}>Number of People: {bookingDetails.number_of_people}</Text>
</View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Dealer</Text>
        <Picker
          selectedValue={selectedDealer}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedDealer(itemValue)}>
          <Picker.Item label="Select a dealer" value="" />
          {dealers.map((dealer) => (
            <Picker.Item 
              key={dealer.id} 
              label={`${dealer.first_name} ${dealer.last_name} (${dealer.username})`} 
              value={dealer.id} 
            />
          ))}
        </Picker>
      </View>

      <Button
        title="Assign Dealer"
        onPress={handleAssignDealer}
        disabled={!selectedDealer}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#fff',
  },
});

export default ServiceManagerAssign;