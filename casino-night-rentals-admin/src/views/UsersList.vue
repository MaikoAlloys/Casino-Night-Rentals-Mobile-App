<template>
  <div class="users-container">
    <div class="header-section">
      <h1>User Management</h1>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
          @input="filterUsers"
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- Users by Role Sections -->
    <div v-for="(users, role) in filteredUsers" :key="role" class="user-section">
      <div class="section-header">
        <h2>{{ formatRoleName(role) }} <span class="badge">{{ users.length }}</span></h2>
      </div>
      <div v-if="users.length === 0" class="empty-state">
        <p>No {{ formatRoleName(role) }} users found</p>
      </div>
      <div v-else class="table-responsive">
        <table class="user-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="user.id">
              <td>{{ index + 1 }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.first_name }} {{ user.last_name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone_number || 'N/A' }}</td>
              <td>
                <span class="role-badge" :class="role">{{ formatRoleName(role) }}</span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
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
      allUsers: {},
      searchQuery: '',
      loading: false,
      error: null
    };
  },
  computed: {
    filteredUsers() {
      const query = this.searchQuery.toLowerCase();
      const filtered = {};
      
      for (const [role, users] of Object.entries(this.allUsers)) {
        filtered[role] = users.filter(user => {
          return Object.values(user).some(val => 
            val && val.toString().toLowerCase().includes(query)
          );
        });
      }
      
      return filtered;
    }
  },
  created() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/admin/all-users');
        this.allUsers = response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
        this.error = 'Failed to load users. Please try again.';
        alert('Failed to load users. Please try again.');
      } finally {
        this.loading = false;
      }
    },
    filterUsers() {
      // Computed property handles the filtering
    },
    formatRoleName(role) {
      return role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.users-container {
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

.user-section {
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
  background: #4CAF50;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.table-responsive {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.user-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  padding: 1rem;
  text-align: left;
}

.user-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  color: #333;
}

.user-table tr:last-child td {
  border-bottom: none;
}

.user-table tr:hover {
  background-color: #f9f9f9;
}

.role-badge {
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
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

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-box {
    width: 100%;
  }
}
</style>