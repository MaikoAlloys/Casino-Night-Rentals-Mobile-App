<template>
  <div class="admin-dashboard">
    <!-- Sidebar Navigation -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Casino Night Rentals</h2>
        <p>Admin Panel</p>
      </div>
      
      <nav class="sidebar-nav">
        <div class="user-profile">
          <div class="avatar">
            <span>{{ userInitials }}</span>
          </div>
          <div class="user-info">
            <p class="username">{{ currentUser }}</p>
            <p class="role">Administrator</p>
          </div>
        </div>
        
        <ul>
          <li>
            <router-link to="/dashboard" class="nav-item" active-class="active">
              <i class="icon">📊</i>
              <span>Dashboard</span>
            </router-link>
          </li>
          <li>
            <router-link to="/customers" class="nav-item" active-class="active">
              <i class="icon">👥</i>
              <span>Customers</span>
            </router-link>
          </li>
          <li>
            <router-link to="/products" class="nav-item" active-class="active">
              <i class="icon">🎰</i>
              <span>Products</span>
            </router-link>
          </li>
          <li>
            <router-link to="/services" class="nav-item" active-class="active">
              <i class="icon">🛎️</i>
              <span>Services</span>
            </router-link>
          </li>
          <li>
            <router-link to="/users" class="nav-item" active-class="active">
              <i class="icon">👤</i>
              <span>Users</span>
            </router-link>
          </li>
          <li>
            <router-link to="/feedback" class="nav-item" active-class="active">
              <i class="icon">💬</i>
              <span>Feedback</span>
            </router-link>
          </li>
        </ul>
      </nav>
      
      <div class="sidebar-footer">
        <button @click="logout" class="logout-btn">
          <i class="icon">🚪</i>
          <span>Logout</span>
        </button>
      </div>
    </div>
    
    <!-- Main Content Area -->
    <div class="main-content">
      <div class="top-bar">
        <div class="breadcrumbs">
          <span>Admin Dashboard</span>
        </div>
        <div class="user-menu">
          <span class="welcome">Welcome, {{ currentUser }}</span>
          <div class="notifications">
            <i class="icon">🔔</i>
            <span class="badge">3</span>
          </div>
        </div>
      </div>
      
      <div class="content">
        <h1>Welcome to the Admin Dashboard</h1>
        <div class="stats-cards">
          <router-link to="/product-payment" class="card-link">
            <div class="card">
              <div class="card-icon blue">
                <i></i>
              </div>
              <div class="card-content">
                <h3>Rental Payment</h3>
                <p></p>
              </div>
            </div>
          </router-link>
          
          <router-link to="/service-booking" class="card-link">
            <div class="card">
              <div class="card-icon green">
                <i></i>
              </div>
              <div class="card-content">
                <h3>Service Bookings</h3>
                <p></p>
              </div>
            </div>
          </router-link>
          
          <router-link to="/service-payments" class="card-link">
            <div class="card">
              <div class="card-icon orange">
                <i></i>
              </div>
              <div class="card-content">
                <h3>Service Payments</h3>
                <p></p>
              </div>
            </div>
          </router-link>
          
          <router-link to="/supplier-management" class="card-link">
            <div class="card">
              <div class="card-icon red">
                <i>💬</i>
              </div>
              <div class="card-content">
                <h3>Supplier Management</h3>
                <p></p>
              </div>
            </div>
          </router-link>
        </div>
        
        <div class="recent-activity">
          <h2>Recent Activity</h2>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon">
                <i>🔄</i>
              </div>
              <div class="activity-details">
                <p>New customer registration</p>
                <small>10 minutes ago</small>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <i>🎰</i>
              </div>
              <div class="activity-details">
                <p>Blackjack table added to inventory</p>
                <small>1 hour ago</small>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <i>💵</i>
              </div>
              <div class="activity-details">
                <p>Payment received from Customer</p>
                <small>3 hours ago</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  data() {
    return {
      currentUser: localStorage.getItem('adminUsername') || 'Admin'
    };
  },
  computed: {
    userInitials() {
      return this.currentUser.split(' ').map(name => name[0]).join('').toUpperCase();
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
      this.$router.push('/admin-login');
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Sidebar Styles */
.sidebar {
  width: 250px;
  background: #1a2a6c;
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: white;
}

.sidebar-header p {
  margin: 5px 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.user-profile {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 40px;
  height: 40px;
  background: #fdbb2d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-weight: bold;
  color: #1a2a6c;
}

.user-info .username {
  margin: 0;
  font-weight: 600;
}

.user-info .role {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-left: 3px solid #fdbb2d;
}

.nav-item .icon {
  margin-right: 10px;
  font-size: 1.1rem;
}

.sidebar-footer {
  margin-top: auto;
  padding: 15px;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logout-btn .icon {
  margin-right: 8px;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  background: #f5f7fa;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.breadcrumbs {
  font-size: 0.9rem;
  color: #666;
}

.user-menu {
  display: flex;
  align-items: center;
}

.welcome {
  margin-right: 20px;
  font-weight: 500;
}

.notifications {
  position: relative;
  cursor: pointer;
}

.notifications .badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  padding: 25px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.card-link {
  text-decoration: none;
  color: inherit;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 1.3rem;
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

.card-icon.red {
  background: #ffebee;
  color: #d32f2f;
}

.card-content h3 {
  margin: 0 0 5px;
  font-size: 1rem;
  color: #555;
}

.card-content p {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.recent-activity {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.recent-activity h2 {
  margin-top: 0;
  font-size: 1.2rem;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.activity-list {
  margin-top: 15px;
}

.activity-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 30px;
  height: 30px;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 0.9rem;
}

.activity-details p {
  margin: 0 0 3px;
  font-size: 0.95rem;
}

.activity-details small {
  color: #888;
  font-size: 0.8rem;
}
</style>