import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import api from './api';

const ServiceManagerProfile = () => {
  const [serviceManager, setServiceManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/servicemanager/service-manager');
        
        if (response.data?.success) {
          setServiceManager(response.data.serviceManager);
        } else {
          throw new Error(response.data?.message || 'Profile data not available');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!serviceManager) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No profile information available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Manager Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileItem}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{serviceManager.username}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.profileItem}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{serviceManager.first_name} {serviceManager.last_name}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.profileItem}>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.value}>{serviceManager.email}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.profileItem}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{serviceManager.phone_number || 'Not provided'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileItem: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 4,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  noDataText: {
    color: '#95a5a6',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ServiceManagerProfile;