<template>
  <div class="customers-container">
    <div class="header-section">
      <h1>Customer Management</h1>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search customers..."
          @input="debounceFilterCustomers"
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- Pending Customers Section -->
    <div class="customer-section">
      <div class="section-header">
        <h2>New Registrations <span class="badge">{{ pendingCustomers.length }} pending</span></h2>
      </div>
      <div v-if="filteredPendingCustomers.length === 0" class="empty-state">
        <p>No pending customers found</p>
      </div>
      <div v-else class="table-responsive">
        <table class="customer-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in filteredPendingCustomers" :key="customer.id">
              <td>{{ customer.id }}</td>
              <td>{{ customer.username }}</td>
              <td>{{ customer.full_name }}</td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.phone_number || 'N/A' }}</td>
              <td>
                <button 
                  @click="approveCustomer(customer.id)" 
                  class="approve-btn"
                  :disabled="approvingId === customer.id"
                >
                  <span v-if="approvingId !== customer.id">Approve</span>
                  <span v-else class="spinner"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Approved Customers Section -->
    <div class="customer-section">
      <div class="section-header">
        <h2>Approved Customers <span class="badge approved">{{ approvedCustomers.length }} approved</span></h2>
      </div>
      <div v-if="filteredApprovedCustomers.length === 0" class="empty-state">
        <p>No approved customers found</p>
      </div>
      <div v-else class="table-responsive">
        <table class="customer-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in filteredApprovedCustomers" :key="customer.id">
              <td>{{ customer.id }}</td>
              <td>{{ customer.username }}</td>
              <td>{{ customer.full_name }}</td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.phone_number || 'N/A' }}</td>
              <td>
                <span class="status-badge approved">Approved</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      allCustomers: [],
      searchQuery: '',
      filteredPendingCustomers: [],
      filteredApprovedCustomers: [],
      approvingId: null,
      error: null,
      debounceTimeout: null,
      isLoading: false
    };
  },
  computed: {
    pendingCustomers() {
      return this.allCustomers.filter(c => c.is_approved === 0);
    },
    approvedCustomers() {
      return this.allCustomers.filter(c => c.is_approved === 1);
    }
  },
  created() {
    this.fetchCustomers();
  },
  methods: {
    async fetchCustomers() {
      this.isLoading = true;
      try {
        const response = await api.get('/admin/customers');
        this.allCustomers = response.data;
        this.filterCustomers();
      } catch (error) {
        console.error('Error fetching customers:', error);
        this.error = 'Failed to load customers. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },

    debounceFilterCustomers() {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.filterCustomers();
      }, 300);
    },

    filterCustomers() {
      const query = this.searchQuery.toLowerCase();
      this.filteredPendingCustomers = this.pendingCustomers.filter(customer => {
        return Object.values(customer).some(val => {
          return val && val.toString().toLowerCase().includes(query);
        });
      });
      this.filteredApprovedCustomers = this.approvedCustomers.filter(customer => {
        return Object.values(customer).some(val => {
          return val && val.toString().toLowerCase().includes(query);
        });
      });
    },

    async approveCustomer(customerId) {
      this.approvingId = customerId;
      try {
        await api.patch(`/admin/customers/${customerId}/status`, { is_approved: 1 });
        
        // Update the local state immediately for better UX
        const customerIndex = this.allCustomers.findIndex(c => c.id === customerId);
        if (customerIndex !== -1) {
          this.allCustomers[customerIndex].is_approved = 1;
          this.filterCustomers(); // Re-filter after update
        }
        
        this.$toast.success('Customer approved successfully!');
      } catch (error) {
        console.error('Error approving customer:', error);
        this.$toast.error('Failed to approve customer. Please try again.');
      } finally {
        this.approvingId = null;
      }
    }
  }
};
</script>

<style scoped>
.customers-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
}

.customer-section {
  margin-bottom: 2.5rem;
  background: #fff;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  color: #34495e;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge {
  background: #ff9800;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.approved {
  background: #4CAF50;
}

.table-responsive {
  overflow-x: auto;
}

.customer-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.customer-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  padding: 1rem;
}

.customer-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  color: #333;
}

.customer-table tr:last-child td {
  border-bottom: none;
}

.customer-table tr:hover {
  background-color: #f9f9f9;
}

.approve-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  min-width: 90px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
}

.approve-btn:hover:not(:disabled) {
  background-color: #3e8e41;
  transform: translateY(-1px);
}

.approve-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.status-badge {
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.status-badge.approved {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  color: #777;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 1rem;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>