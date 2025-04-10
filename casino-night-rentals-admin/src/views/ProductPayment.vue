<template>
  <div class="payment-container">
    <h1>Product Payment Reports</h1>
    
    <!-- Payment Method Filter -->
    <div class="payment-method-filter">
      <button 
        v-for="method in paymentMethods" 
        :key="method.value"
        @click="activeMethod = method.value"
        :class="{ active: activeMethod === method.value }"
      >
        {{ method.label }}
        <span class="count-badge">{{ getPaymentCount(method.value) }}</span>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon blue">
          <i>💰</i>
        </div>
        <div class="card-content">
          <h3>Total Revenue</h3>
          <p>Ksh {{ filteredPayments.reduce((sum, p) => sum + parseFloat(p.total_amount), 0).toLocaleString() }}</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon green">
          <i>🧾</i>
        </div>
        <div class="card-content">
          <h3>Total Transactions</h3>
          <p>{{ filteredPayments.length }}</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon orange">
          <i>👥</i>
        </div>
        <div class="card-content">
          <h3>Unique Customers</h3>
          <p>{{ uniqueCustomers }}</p>
        </div>
      </div>
    </div>

    <!-- Payment Details Table -->
    <div class="payment-table-container">
      <table class="payment-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Reference</th>
            <th>Product</th>
            <th>Payment Method</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(payment, index) in filteredPayments" :key="payment.reference_code">
            <td>{{ index + 1 }}</td>
            <td>{{ payment.first_name }} {{ payment.last_name }}</td>
            <td>{{ payment.reference_code }}</td>
            <td>{{ payment.product_name }}</td>
            <td>
              <span class="payment-method-badge" :class="payment.payment_method.toLowerCase()">
                {{ formatPaymentMethod(payment.payment_method) }}
              </span>
            </td>
            <td>Ksh {{ parseFloat(payment.total_amount).toLocaleString() }}</td>
            <td>
              <span class="status-badge" :class="payment.status.toLowerCase()">
                {{ payment.status }}
              </span>
            </td>
            <td>{{ formatDate(payment.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      payments: [],
      loading: true,
      error: null,
      activeMethod: 'all',
      paymentMethods: [
        { value: 'all', label: 'All Payments' },
        { value: 'mpesa', label: 'M-Pesa' },
        { value: 'bank', label: 'Bank Transfer' }
      ]
    };
  },
  computed: {
    filteredPayments() {
      if (this.activeMethod === 'all') return this.payments;
      return this.payments.filter(p => 
        p.payment_method.toLowerCase().includes(this.activeMethod)
      );
    },
    uniqueCustomers() {
      const unique = new Set();
      this.filteredPayments.forEach(p => {
        unique.add(`${p.first_name} ${p.last_name}`);
      });
      return unique.size;
    }
  },
  created() {
    this.fetchPaymentDetails();
  },
  methods: {
    async fetchPaymentDetails() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/admin/payment-details');
        this.payments = response.data;
      } catch (error) {
        console.error('Error fetching payment details:', error);
        this.error = 'Failed to load payment details. Please try again later.';
      } finally {
        this.loading = false;
      }
    },
    formatPaymentMethod(method) {
      const methods = {
        mpesa: 'M-Pesa',
        bank: 'Bank Transfer'
      };
      return methods[method.toLowerCase()] || method;
    },
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },
    getPaymentCount(method) {
      if (method === 'all') return this.payments.length;
      return this.payments.filter(p => 
        p.payment_method.toLowerCase().includes(method)
      ).length;
    }
  }
};
</script>

<style scoped>
.payment-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.payment-method-filter {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.payment-method-filter button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background-color: #f5f5f5;
  color: #333;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.payment-method-filter button:hover {
  background-color: #e0e0e0;
}

.payment-method-filter button.active {
  background-color: #1a2a6c;
  color: white;
}

.count-badge {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.5rem;
  font-size: 1.5rem;
}

.card-icon.blue {
  background: #e3f2fd;
  color: #1976d2;
}

.card-icon.green {
  background: #e8f5e9;
  color: #388e3c;
}

.card-icon.orange {
  background: #fff3e0;
  color: #f57c00;
}

.card-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #555;
}

.card-content p {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.payment-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1rem;
}

.payment-table {
  width: 100%;
  border-collapse: collapse;
}

.payment-table th {
  background-color: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #555;
}

.payment-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.payment-table tr:last-child td {
  border-bottom: none;
}

.payment-table tr:hover {
  background-color: #f9f9f9;
}

.payment-method-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-block;
}

.payment-method-badge.mpesa {
  background-color: #e1f5fe;
  color: #0288d1;
}

.payment-method-badge.bank {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-block;
}

.status-badge.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.pending {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-badge.failed {
  background-color: #ffebee;
  color: #d32f2f;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .payment-table th,
  .payment-table td {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
  
  .payment-method-filter button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>