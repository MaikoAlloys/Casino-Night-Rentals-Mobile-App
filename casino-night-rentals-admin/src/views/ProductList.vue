<template>
  <div class="products-container">
    <div class="products-header">
      <h1>Our Rental Products</h1>
      <div class="search-controls">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products..."
            @input="filterProducts"
          />
          <span class="search-icon">🔍</span>
        </div>
        <select v-model="sortOption" @change="sortProducts" class="sort-select">
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="price_asc">Price (Low-High)</option>
          <option value="price_desc">Price (High-Low)</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      <p>No products match your search criteria</p>
    </div>

    <div v-else class="products-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <div class="product-image-container">
          <img 
            :src="product.image_url" 
            :alt="product.name"
            class="product-image"
            @error="handleImageError"
          />
          <div v-if="product.quantity <= 0" class="out-of-stock">Out of Stock</div>
          <div v-else class="in-stock">Available ({{ product.quantity }})</div>
        </div>
        <div class="product-details">
          <h3 class="product-name">{{ product.name }}</h3>
          <div class="price-section">
            <span class="rental-price">Kshs {{ product.rental_price }}/day</span>
            <span v-if="product.total_cost" class="total-price">Kshs {{ product.total_cost }} Buying price</span>
          </div>
          <button class="rent-btn" :disabled="product.quantity <= 0">
            {{ product.quantity > 0 ? 'Available' : 'Unavailable' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      products: [],
      filteredProducts: [],
      loading: true,
      error: null,
      searchQuery: '',
      sortOption: 'name_asc'
    };
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/admin/products');
        this.products = response.data;
        this.filteredProducts = [...this.products];
        this.sortProducts();
      } catch (error) {
        console.error('Error fetching products:', error);
        this.error = 'Failed to load products. Please try again later.';
      } finally {
        this.loading = false;
      }
    },
    filterProducts() {
      const query = this.searchQuery.toLowerCase();
      this.filteredProducts = this.products.filter(product => 
        product.name.toLowerCase().includes(query)
      );
      this.sortProducts();
    },
    sortProducts() {
      const [field, direction] = this.sortOption.split('_');
      this.filteredProducts.sort((a, b) => {
        let compareA = a[field === 'price' ? 'rental_price' : field];
        let compareB = b[field === 'price' ? 'rental_price' : field];
        
        // Convert to numbers if sorting by price
        if (field === 'price') {
          compareA = parseFloat(compareA);
          compareB = parseFloat(compareB);
        }
        
        return direction === 'asc' 
          ? compareA > compareB ? 1 : -1
          : compareA < compareB ? 1 : -1;
      });
    },
    handleImageError(event) {
      // Fallback to a generic placeholder if image fails to load
      event.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
    }
  }
};
</script>

<style scoped>
.products-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.products-header {
  margin-bottom: 2rem;
  text-align: center;
}

.products-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.search-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
}

.sort-select {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  padding: 1rem 0;
}

.product-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.product-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.out-of-stock, .in-stock {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.out-of-stock {
  background-color: #ffebee;
  color: #d32f2f;
}

.in-stock {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.product-details {
  padding: 1.25rem;
}

.product-name {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  color: #333;
  font-weight: 600;
}

.price-section {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rental-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a2a6c;
}

.total-price {
  font-size: 0.9rem;
  color: #666;
}

.rent-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #1a2a6c;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.rent-btn:hover:not(:disabled) {
  background-color: #0f1a4a;
}

.rent-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(26, 42, 108, 0.2);
  border-radius: 50%;
  border-top-color: #1a2a6c;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  color: #d32f2f;
  padding: 2rem;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  
  .search-controls {
    flex-direction: column;
    align-items: center;
  }
  
  .search-box, .sort-select {
    width: 100%;
    max-width: 300px;
  }
}
</style>