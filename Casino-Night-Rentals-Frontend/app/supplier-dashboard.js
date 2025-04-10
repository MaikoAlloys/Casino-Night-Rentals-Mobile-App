import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  FlatList,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import api from './api';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SupplierDashboard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const supplierId = params.id;
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const [approving, setApproving] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? -width * 0.7 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (supplierId) {
      fetchTenders();
    } else {
      setError('No supplier ID found in URL');
      setLoading(false);
    }
  }, [supplierId]);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get(`/suppliers/items/${supplierId}`);

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }

      setTenders(res.data.items || []);
    } catch (error) {
      console.error('Error fetching tenders:', error);
      setError(error.message || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleApproveItems = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item to approve');
      return;
    }

    try {
      setApproving(true);
      
      const response = await api.post('/suppliers/items/approve', {
        supplierId,
        itemIds: selectedItems
      });

      if (response.data?.success) {
        Alert.alert('Success', 'Items approved successfully');
        fetchTenders(); // Refresh the list
        setSelectedItems([]);
      } else {
        throw new Error(response.data?.message || 'Approval failed');
      }
    } catch (error) {
      console.error('Approval error:', error);
      Alert.alert('Error', error.message || 'Failed to approve items');
    } finally {
      setApproving(false);
    }
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
          onPress={fetchTenders}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar}>
          <MaterialIcons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Dashboard</Text>
        <View style={{ width: 28 }} /> {/* Spacer for alignment */}
      </View>

      {/* Sidebar Navigation */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Supplier Portal</Text>
          <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.sidebarMenu}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => { 
              router.push(`/supplier-dashboard?id=${supplierId}`); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="dashboard" size={20} color="#3498db" />
            <Text style={styles.navItem}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => { 
              router.push(`/supplier?id=${supplierId}`); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="person" size={20} color="#3498db" />
            <Text style={styles.navItem}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => { 
              router.push(`/supplier-payments?id=${supplierId}`); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="payment" size={20} color="#3498db" />
            <Text style={styles.navItem}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => { 
              router.push('/'); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="logout" size={20} color="#3498db" />
            <Text style={styles.navItem}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Pending Tenders</Text>
        
        {tenders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No pending tenders found</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={tenders}
              keyExtractor={(item) => `${item.item_id}-${item.item_type}`}
              renderItem={({ item }) => (
                <View style={[
                  styles.tenderCard,
                  selectedItems.includes(item.item_id) && styles.selectedCard
                ]}>
                  <TouchableOpacity 
                    style={styles.tenderContent}
                    onPress={() => toggleItemSelection(item.item_id)}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.item_name}</Text>
                      <Text style={styles.itemType}>{item.item_type}</Text>
                    </View>
                    <View style={styles.itemDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantity:</Text>
                        <Text style={styles.detailValue}>{item.quantity}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Unit Cost:</Text>
                        <Text style={styles.detailValue}>
                          Kshs {(item.total_cost / item.quantity).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Cost:</Text>
                        <Text style={styles.detailValue}>
                          Kshs {item.total_cost.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Request Date:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Grand Total:</Text>
              <Text style={styles.totalAmount}>
                Kshs {tenders.reduce((sum, item) => sum + item.total_cost, 0).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.approveButton,
                selectedItems.length === 0 && styles.disabledButton
              ]}
              onPress={handleApproveItems}
              disabled={selectedItems.length === 0 || approving}
            >
              {approving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.approveButtonText}>
                  Approve Selected ({selectedItems.length})
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#2c3e50',
    zIndex: 100,
  },
  sidebarHeader: {
    padding: 20,
    backgroundColor: '#1a252f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  sidebarMenu: {
    paddingVertical: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  navItem: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
  },
  content: {
    padding: 15,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 15,
    color: '#888',
    fontSize: 16,
  },
  tenderCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  tenderContent: {
    padding: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  itemType: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 10,
  },
  itemDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
  },
  detailValue: {
    fontWeight: '500',
    fontSize: 14,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  approveButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SupplierDashboard;