import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';

const DealerProfile = () => {
  const { dealerId } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (dealerId) fetchDealerProfile();
  }, [dealerId]);

  const fetchDealerProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/dealers/profile/${dealerId}`);
      if (response.data.success) {
        setProfile(response.data.dealer);
      } else {
        setError('Profile not found');
      }
    } catch (error) {
      console.error('Error fetching dealer profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error || 'Dealer profile not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchDealerProfile}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-circle" size={80} color="#3498db" />
        <Text style={styles.title}>Dealer Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.detailRow}>
          <MaterialIcons name="person" size={20} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Username:</Text>
          <Text style={styles.detailValue}>{profile.username}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="badge" size={20} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Full Name:</Text>
          <Text style={styles.detailValue}>{profile.full_name}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="email" size={20} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{profile.email}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={20} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{profile.phone_number}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={20} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Member Since:</Text>
          <Text style={styles.detailValue}>
            {new Date(profile.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    color: '#7f8c8d',
    marginLeft: 8,
    marginRight: 4,
    fontSize: 16,
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default DealerProfile;