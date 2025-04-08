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
  FlatList
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from './api';

const StorekeeperSupplyMaterialRequests = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersResponse, itemsResponse] = await Promise.all([
        api.get('/storekeeper/suppliers'),
        api.get('/storekeeper/items')
      ]);
      
      setSuppliers(suppliersResponse.data);
      setItems(itemsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item) => {
    setSelectedItems(prev => [
      ...prev,
      {
        ...item,
        quantity: 1,
        total: item.discounted_cost * 1
      }
    ]);
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleQuantityChange = (itemId, value) => {
    const quantity = parseInt(value) || 0;
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              quantity,
              total: quantity * item.discounted_cost
            } 
          : item
      )
    );
  };

  const calculateGrandTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      Alert.alert('Error', 'Please select a supplier');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    try {
      setSubmitting(true);
      
      // Submit each item separately
      for (const item of selectedItems) {
        await api.post('/storekeeper/selected-items', {
          item_id: item.id,
          item_type: item.item_type,
          supplier_id: selectedSupplier,
          quantity: item.quantity,
          total_cost: item.total
        });
      }

      Alert.alert('Success', 'Request submitted successfully!');
      setSelectedItems([]);
      setSelectedSupplier('');
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Material Request Form</Text>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Supplier Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Supplier</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSupplier}
              onValueChange={(itemValue) => setSelectedSupplier(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a supplier..." value="" />
              {suppliers.map(supplier => (
                <Picker.Item 
                  key={supplier.id} 
                  label={supplier.full_name} 
                  value={supplier.id} 
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Available Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Items</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.id}-${item.item_type}`}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemType}>{item.item_type}</Text>
                  <Text style={styles.itemPrice}>
                    Kshs {item.discounted_cost.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => handleAddItem(item)}
                >
                  <Icon name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
          />
        </View>

        {/* Selected Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Items</Text>
          {selectedItems.length === 0 ? (
            <Text style={styles.emptyText}>No items selected</Text>
          ) : (
            <>
              {selectedItems.map(item => (
                <View key={`${item.id}-${item.item_type}`} style={styles.selectedItemCard}>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>{item.name}</Text>
                    <Text style={styles.selectedItemType}>{item.item_type}</Text>
                  </View>
                  
                  <View style={styles.quantityContainer}>
                    <TextInput
                      style={styles.quantityInput}
                      keyboardType="numeric"
                      value={item.quantity.toString()}
                      onChangeText={(text) => handleQuantityChange(item.id, text)}
                    />
                    <Text style={styles.quantityLabel}>Qty</Text>
                  </View>
                  
                  <Text style={styles.itemTotal}>
                    Kshs {item.total.toFixed(2)}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                  >
                    <Icon name="delete" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Grand Total:</Text>
                <Text style={styles.totalAmount}>
                  Kshs {calculateGrandTotal().toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || selectedItems.length === 0 || !selectedSupplier}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </View>
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
  scrollContainer: {
    paddingBottom: 80,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#0066cc',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  selectedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedItemType: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityInput: {
    width: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 6,
    textAlign: 'center',
    marginRight: 6,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    width: 80,
    textAlign: 'right',
    fontWeight: '600',
    color: '#2e7d32',
  },
  removeButton: {
    marginLeft: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
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
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#99c2ff',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default StorekeeperSupplyMaterialRequests;