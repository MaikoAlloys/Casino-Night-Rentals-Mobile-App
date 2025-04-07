import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Animated,
  RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const StorekeeperDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? 0 : -300,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [sidebarVisible]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, storeItemsRes] = await Promise.all([
        api.get('/storekeeper/products'),
        api.get('/storekeeper/store-items')
      ]);

      if (productsRes.data.success) setProducts(productsRes.data.products);
      if (storeItemsRes.data.success) setStoreItems(storeItemsRes.data.storeItems);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("storekeeperToken");
    router.push("/");
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductItem = ({ item }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Available:</Text>
          <Text style={styles.infoValue}>{item.quantity}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Price:</Text>
          <Text style={styles.priceText}>Ksh {item.rental_price}</Text>
        </View>
      </View>
    </View>
  );

  const renderServiceGroup = ({ item }) => (
    <View style={styles.serviceGroup}>
      <Text style={styles.serviceName}>{item.service_name}</Text>
      {item.items.map(storeItem => (
        <View key={storeItem.id} style={styles.storeItem}>
          <Text style={styles.itemName}>{storeItem.name}</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemQuantity}>{storeItem.quantity} available</Text>
            <Text style={styles.itemCost}>Ksh {storeItem.cost}</Text>
          </View>
        </View>
      ))}
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
      {/* Sidebar Navigation */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Storekeeper</Text>
          <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.sidebarMenu}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => { 
              router.push("/storekeeper-dashboard"); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="dashboard" size={20} color="#3498db" />
            <Text style={styles.navItem}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => { 
              router.push("/storekeeper-profile"); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="person" size={20} color="#3498db" />
            <Text style={styles.navItem}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => { 
              router.push("/storekeeper-service-material-requests"); 
              toggleSidebar(); 
            }}
          >
            <MaterialIcons name="inventory" size={20} color="#3498db" />
            <Text style={styles.navItem}>Service Material Requests</Text>
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
          <Text style={styles.title}>Inventory Management</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              Products
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
              Service Items
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search inventory..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#95a5a6"
        />

        {activeTab === 'products' ? (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchData();
                }}
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No products found</Text>
            }
          />
        ) : (
          <FlatList
            data={storeItems}
            renderItem={renderServiceGroup}
            keyExtractor={item => item.service_id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchData();
                }}
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No service items found</Text>
            }
          />
        )}
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#3498db',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productDetails: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
  },
  priceText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  serviceGroup: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storeItem: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  itemCost: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StorekeeperDashboard;