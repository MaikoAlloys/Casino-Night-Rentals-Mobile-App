<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="logo">
        <h1>Casino Night Rentals</h1>
        <h2>Admin Portal</h2>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            v-model="username" 
            id="username" 
            required
            placeholder="Enter your username"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            v-model="password" 
            id="password" 
            required
            placeholder="Enter your password"
            class="form-input"
          />
        </div>
        
        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="!loading">Login</span>
          <span v-else class="spinner"></span>
        </button>
        
        <div v-if="errorMessage" class="alert error">
          <i class="alert-icon">!</i>
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="alert success">
          <i class="alert-icon">✓</i>
          {{ successMessage }}
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      successMessage: '',
      loading: false
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      try {
        const response = await api.post('/admin/login', {
          username: this.username,
          password: this.password,
        });

        if (response.data.success) {
          this.successMessage = 'Login successful! Redirecting...';
          setTimeout(() => {
            this.$router.push('/dashboard');
          }, 1500);
        } else {
          this.errorMessage = response.data.message || 'Invalid credentials';
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message;
        if (errorMsg) {
          this.errorMessage = errorMsg.includes('credentials') 
            ? 'Invalid username or password' 
            : errorMsg;
        } else {
          this.errorMessage = 'Network error. Please try again.';
        }
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.login-container {
  width: 380px;
  padding: 2.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.logo {
  margin-bottom: 2rem;
}

.logo h1 {
  color: #1a2a6c;
  font-size: 1.8rem;
  margin: 0;
  font-weight: 700;
}

.logo h2 {
  color: #555;
  font-size: 1.2rem;
  margin: 0.5rem 0 0;
  font-weight: 400;
}

.login-form {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #1a2a6c;
  box-shadow: 0 0 0 2px rgba(26, 42, 108, 0.2);
}

.login-btn {
  width: 100%;
  padding: 14px;
  background-color: #1a2a6c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 0.5rem;
}

.login-btn:hover {
  background-color: #0f1a4a;
}

.login-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert {
  padding: 12px;
  border-radius: 6px;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}

.alert-icon {
  margin-right: 8px;
  font-weight: bold;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}
</style>