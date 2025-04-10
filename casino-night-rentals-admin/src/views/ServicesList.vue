<template>
  <div class="services-container">
    <div class="header-section">
      <h1>Service Management</h1>
      <div class="controls">
        <button class="add-service-btn" @click="showAddModal = true">
          + Add New Service
        </button>
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search services..."
            @input="filterServices"
          />
          <span class="search-icon">🔍</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="filteredServices.length === 0" class="empty-state">
      <p>No services found</p>
      <button class="add-service-btn" @click="showAddModal = true">
        + Add Your First Service
      </button>
    </div>

    <div v-else class="services-table-container">
      <table class="services-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Service Name</th>
            <th>Service Fee</th>
            <th>Booking Fee</th>
            <th>Total Fee</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in filteredServices" :key="service.id">
            <td>{{ service.id }}</td>
            <td>{{ service.name }}</td>
            <td>Kshs{{ service.service_fee }}</td>
            <td>Kshs{{ service.booking_fee }}</td>
            <td>Kshs{{ parseFloat(service.service_fee) + parseFloat(service.booking_fee) }}</td>

            <td class="actions">
              <button class="edit-btn" @click="editService(service)">
                Edit
              </button>
              <button class="delete-btn" @click="confirmDelete(service)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Service Modal -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ editingService ? 'Edit Service' : 'Add New Service' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Service Name</label>
            <input v-model="formData.name" required />
          </div>
          <div class="form-group">
            <label>Service Fee ($)</label>
            <input v-model="formData.service_fee" type="number" step="0.01" required />
          </div>
          <div class="form-group">
            <label>Booking Fee ($)</label>
            <input v-model="formData.booking_fee" type="number" step="0.01" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              {{ editingService ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content delete-modal">
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete "{{ serviceToDelete?.name }}"?</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showDeleteModal = false">
            Cancel
          </button>
          <button class="delete-btn" @click="deleteService">
            Delete
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
      services: [],
      filteredServices: [],
      loading: true,
      error: null,
      searchQuery: '',
      showAddModal: false,
      showDeleteModal: false,
      editingService: null,
      serviceToDelete: null,
      formData: {
        name: '',
        service_fee: '',
        booking_fee: ''
      }
    };
  },
  created() {
    this.fetchServices();
  },
  methods: {
    async fetchServices() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/admin/services');
        this.services = response.data;
        this.filteredServices = [...this.services];
      } catch (error) {
        console.error('Error fetching services:', error);
        this.error = 'Failed to load services. Please try again later.';
      } finally {
        this.loading = false;
      }
    },
    filterServices() {
      const query = this.searchQuery.toLowerCase();
      this.filteredServices = this.services.filter(service =>
        service.name.toLowerCase().includes(query)
      );
    },
    editService(service) {
      this.editingService = service;
      this.formData = {
        name: service.name,
        service_fee: service.service_fee,
        booking_fee: service.booking_fee
      };
      this.showAddModal = true;
    },
    confirmDelete(service) {
      this.serviceToDelete = service;
      this.showDeleteModal = true;
    },
    async deleteService() {
      try {
        await api.delete(`/admin/services/${this.serviceToDelete.id}`);
        this.$notify({
          title: 'Success',
          message: 'Service deleted successfully',
          type: 'success'
        });
        this.fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        this.$notify({
          title: 'Error',
          message: 'Failed to delete service',
          type: 'error'
        });
      } finally {
        this.showDeleteModal = false;
      }
    },
    async handleSubmit() {
      try {
        if (this.editingService) {
          await api.put(`/admin/services/${this.editingService.id}`, this.formData);
          this.$notify({
            title: 'Success',
            message: 'Service updated successfully',
            type: 'success'
          });
        } else {
          await api.post('/admin/services', this.formData);
          this.$notify({
            title: 'Success',
            message: 'Service added successfully',
            type: 'success'
          });
        }
        this.closeModal();
        this.fetchServices();
      } catch (error) {
        console.error('Error saving service:', error);
        this.$notify({
          title: 'Error',
          message: 'Failed to save service',
          type: 'error'
        });
      }
    },
    closeModal() {
      this.showAddModal = false;
      this.editingService = null;
      this.formData = {
        name: '',
        service_fee: '',
        booking_fee: ''
      };
    }
  }
};
</script>

<style scoped>
.services-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
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
  font-size: 1.8rem;
  margin: 0;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 0.5rem 1rem 0.5rem 2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 250px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
}

.add-service-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.add-service-btn:hover {
  background-color: #3e8e41;
}

.services-table-container {
  overflow-x: auto;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.services-table th,
.services-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.services-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.services-table tr:hover {
  background-color: #f9f9f9;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn:hover {
  background-color: #0b7dda;
}

.delete-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.delete-modal {
  max-width: 400px;
  text-align: center;
}

.modal-content h2 {
  margin-top: 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background-color: #3e8e41;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(76, 175, 80, 0.2);
  border-radius: 50%;
  border-top-color: #4CAF50;
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
}

.empty-state p {
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .controls {
    width: 100%;
    flex-direction: column;
    gap: 1rem;
  }

  .search-box input {
    width: 100%;
  }

  .actions {
    flex-direction: column;
  }
}
</style>