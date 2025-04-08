import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from './api';

const StorekeeperSupplyMaterialReceive = () => {
  const router = useRouter();
  const [approvedItems, setApprovedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiving, setReceiving] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchApprovedItems();
  }, []);

  const fetchApprovedItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/storekeeper/approved-items');
      
      if (response.data?.success) {
        setApprovedItems(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch approved items');
      }
    } catch (error) {
      console.error('Error fetching approved items:', error);
      setError(error.message || 'Failed to load approved items');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReceived = async (itemId) => {
    try {
      setReceiving(true);
      setSelectedItem(itemId);
      
      const response = await api.put(`/storekeeper/mark-received/${itemId}`);
      
      if (response.data?.success) {
        Alert.alert('Success', 'Item marked as received successfully');
        fetchApprovedItems(); // Refresh the list
      } else {
        throw new Error(response.data?.message || 'Failed to mark item as received');
      }
    } catch (error) {
      console.error('Error marking item as received:', error);
      Alert.alert('Error', error.message || 'Failed to update item status');
    } finally {
      setReceiving(false);
      setSelectedItem(null);
    }
  };

  const calculateGrandTotal = () => {
    return approvedItems.reduce((sum, item) => sum + item.grand_total, 0);
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
          onPress={fetchApprovedItems}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Received Materials</Text>
      <Text style={styles.subHeader}>Items approved by suppliers</Text>
      
      {approvedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inventory" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No approved items to receive</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={approvedItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={styles.itemType}>{item.item_type}</Text>
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Supplier:</Text>
                    <Text style={styles.detailValue}>{item.supplier_name}</Text>
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
                    <Text style={styles.detailLabel}>Total Cost:</Text>
                    <Text style={styles.detailValue}>Kshs {item.grand_total.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Approved On:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.receiveButton}
                  onPress={() => handleMarkAsReceived(item.id)}
                  disabled={receiving && selectedItem === item.id}
                >
                  {receiving && selectedItem === item.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={20} color="#fff" />
                      <Text style={styles.receiveButtonText}>Mark as Received</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Pending Receipts:</Text>
            <Text style={styles.totalAmount}>
              Kshs {calculateGrandTotal().toFixed(2)}
            </Text>
          </View>
        </>
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
  itemType: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
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
  receiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  receiveButtonText: {
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
});

export default StorekeeperSupplyMaterialReceive;