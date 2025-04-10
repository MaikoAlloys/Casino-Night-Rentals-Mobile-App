<template>
  <div class="service-booking-container">
    <h2>Service Booking Details</h2>
    
    <div class="filter-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search bookings..." 
          @input="filterBookings"
          class="search-input"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <div class="payment-filter">
        <button 
          v-for="method in paymentMethods" 
          :key="method.value"
          @click="filterByPayment(method.value)"
          :class="{ active: activePaymentMethod === method.value }"
          class="payment-btn"
        >
          {{ method.label }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i> Loading bookings...
    </div>
    
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
      <button @click="fetchServiceBookings" class="retry-btn">Retry</button>
    </div>
    
    <div class="table-responsive">
      <table class="booking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer Name</th>
            <th>Service</th>
            <th>Event Date</th>
            <th>People</th>
            <th>Booking Fee</th>
            <th>Payment Method</th>
            <th>Reference</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(booking, index) in paginatedBookings" :key="booking.reference_code">
            <td>{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
            <td>{{ booking.customer_first_name }} {{ booking.customer_last_name }}</td>
            <td>{{ booking.service_name }}</td>
            <td>{{ formatDate(booking.event_date) }}</td>
            <td>{{ booking.number_of_people }}</td>
            <td>{{ formatCurrency(booking.booking_fee) }}</td>
            <td>
              <span :class="getPaymentMethodClass(booking.payment_method)">
                {{ booking.payment_method }}
              </span>
            </td>
            <td>{{ booking.reference_code }}</td>
            <td>
              <span :class="getStatusClass(booking.status)">
                {{ booking.status }}
              </span>
            </td>
            <td>{{ formatDateTime(booking.created_at) }}</td>
          </tr>
          <tr v-if="!loading && paginatedBookings.length === 0">
            <td colspan="10" class="no-results">No bookings found</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1"
        class="page-btn"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'ServiceBookingDetails',
  data() {
    return {
      bookings: [],
      filteredBookings: [],
      searchQuery: '',
      activePaymentMethod: 'all',
      paymentMethods: [
        { value: 'all', label: 'All' },
        { value: 'Mpesa', label: 'Mpesa' },
        { value: 'Bank', label: 'Bank' },
        { value: 'Cash', label: 'Cash' }
      ],
      loading: false,
      error: null,
      currentPage: 1,
      itemsPerPage: 10
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredBookings.length / this.itemsPerPage);
    },
    paginatedBookings() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredBookings.slice(start, end);
    }
  },
  created() {
    this.fetchServiceBookings();
  },
  methods: {
    async fetchServiceBookings() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/admin/service-booking-details');
        this.bookings = response.data;
        this.filteredBookings = [...this.bookings];
        this.currentPage = 1;
      } catch (err) {
        console.error('Error fetching service bookings:', err);
        this.error = err.response?.data?.error || 'Failed to load service bookings';
      } finally {
        this.loading = false;
      }
    },
    filterBookings() {
      const query = this.searchQuery.toLowerCase();
      this.filteredBookings = this.bookings.filter(booking => {
        const matchesSearch = 
          (booking.customer_first_name?.toLowerCase().includes(query) || '') ||
          (booking.customer_last_name?.toLowerCase().includes(query) || '') ||
          (booking.service_name?.toLowerCase().includes(query) || '') ||
          (booking.reference_code?.toLowerCase().includes(query) || '');
        
        const matchesPayment = 
          this.activePaymentMethod === 'all' || 
          booking.payment_method?.toLowerCase() === this.activePaymentMethod.toLowerCase();
        
        return matchesSearch && matchesPayment;
      });
      this.currentPage = 1;
    },
    filterByPayment(method) {
      this.activePaymentMethod = method;
      this.filterBookings();
    },
    formatDate(dateString) {
      if (!dateString) return '-';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '-';
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateTimeString).toLocaleDateString(undefined, options);
    },
    formatCurrency(amount) {
      if (amount === null || amount === undefined) return '-';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES'
      }).format(amount);
    },
    getPaymentMethodClass(method) {
      if (!method) return { 'payment-method': true, 'unknown': true };
      return {
        'payment-method': true,
        'mpesa': method.toLowerCase() === 'mpesa',
        'bank': method.toLowerCase() === 'bank',
        'cash': method.toLowerCase() === 'cash',
        'other': !['mpesa', 'bank', 'cash'].includes(method.toLowerCase())
      };
    },
    getStatusClass(status) {
      if (!status) return { 'status': true, 'unknown': true };
      return {
        'status': true,
        'confirmed': status.toLowerCase() === 'confirmed',
        'pending': status.toLowerCase() === 'pending',
        'cancelled': status.toLowerCase() === 'cancelled',
        'unknown': !['confirmed', 'pending', 'cancelled'].includes(status.toLowerCase())
      };
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    }
  }
};
</script>

<style scoped>
.service-booking-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 24px;
  font-weight: 600;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 20px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
  max-width: 500px;
}

.search-input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  height: 40px;
}

.search-input:focus {
  outline: none;
  border-color: #4a6baf;
  box-shadow: 0 0 0 2px rgba(74, 107, 175, 0.2);
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
}

.payment-filter {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.payment-btn {
  padding: 10px 18px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  height: 40px;
  white-space: nowrap;
}

.payment-btn:hover {
  background: #e9ecef;
  border-color: #ced4da;
}

.payment-btn.active {
  background: #4a6baf;
  color: white;
  border-color: #4a6baf;
}

.loading-indicator {
  padding: 15px;
  text-align: center;
  color: #4a6baf;
  background: #f0f5ff;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 15px;
}

.loading-indicator i {
  margin-right: 8px;
}

.error-message {
  padding: 15px;
  text-align: center;
  color: #dc3545;
  background: #f8d7da;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 15px;
}

.error-message i {
  font-size: 18px;
}

.retry-btn {
  margin-left: 15px;
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 14px;
}

.retry-btn:hover {
  background: #c82333;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.booking-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.booking-table th, .booking-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.booking-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  position: sticky;
  top: 0;
}

.booking-table tr:hover {
  background-color: #f8f9fa;
}

.payment-method {
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
}

.payment-method.mpesa {
  background-color: #e3f2fd;
  color: #0d47a1;
}

.payment-method.bank {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.payment-method.cash {
  background-color: #fff3e0;
  color: #e65100;
}

.payment-method.other {
  background-color: #f3e5f5;
  color: #6a1b9a;
}

.payment-method.unknown {
  background-color: #eceff1;
  color: #546e7a;
}

.status {
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
}

.status.confirmed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status.pending {
  background-color: #fff8e1;
  color: #ff8f00;
}

.status.cancelled {
  background-color: #ffebee;
  color: #c62828;
}

.status.unknown {
  background-color: #eceff1;
  color: #546e7a;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-style: italic;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 25px;
}

.page-btn {
  padding: 8px 14px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.page-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #ced4da;
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #495057;
  font-weight: 500;
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .search-box {
    min-width: 100%;
    max-width: 100%;
  }
  
  .payment-filter {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 5px;
    justify-content: flex-start;
  }
  
  .payment-filter::-webkit-scrollbar {
    height: 5px;
  }
  
  .payment-filter::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 10px;
  }
  
  .booking-table th, .booking-table td {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .booking-table {
    font-size: 14px;
  }
  
  .payment-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .service-booking-container {
    padding: 15px;
  }
  
  h2 {
    font-size: 20px;
    margin-bottom: 20px;
  }
  
  .search-input {
    padding-left: 35px;
    font-size: 13px;
  }
  
  .search-icon {
    left: 12px;
  }
  
  .booking-table th, .booking-table td {
    padding: 8px 10px;
    font-size: 13px;
  }
  
  .payment-method, .status {
    font-size: 12px;
    padding: 4px 8px;
  }
  
  .page-btn {
    width: 36px;
    height: 36px;
    padding: 6px;
  }
  
  .page-info {
    font-size: 13px;
  }
}
</style>