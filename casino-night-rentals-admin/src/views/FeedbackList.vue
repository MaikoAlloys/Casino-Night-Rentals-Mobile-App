<template>
  <div class="feedback-container">
    <div class="header-section">
      <h1>Feedback Management</h1>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search feedback..."
          @input="filterFeedback"
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div class="feedback-list">
      <div v-if="loading" class="loading-state">
        Loading feedback...
      </div>
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>
      <div v-else-if="filteredFeedback.length === 0" class="empty-state">
        No feedback found
      </div>
      <div v-else>
        <div v-for="(item, index) in filteredFeedback" :key="index" class="feedback-card">
          <div class="feedback-header">
            <div class="sender-info">
              <span class="sender-name">{{ item.sender_name }}</span>
              <span class="sender-role" :class="item.sender_role">{{ formatRole(item.sender_role) }}</span>
              <span v-if="item.sender_username" class="sender-username">@{{ item.sender_username }}</span>
            </div>
            <div class="feedback-meta">
              <span class="feedback-date">{{ formatDate(item.created_at) }}</span>
              <span class="feedback-status" :class="item.status">{{ item.status }}</span>
              <span v-if="item.rating" class="feedback-rating">Rating: {{ item.rating }}/5</span>
            </div>
          </div>
          
          <div class="feedback-message">
            {{ item.message }}
          </div>
          
          <div v-if="item.reply" class="feedback-reply">
            <div class="reply-header">
              <span class="reply-label">Admin Reply</span>
              <span v-if="item.reply_time" class="reply-date">{{ formatDate(item.reply_time) }}</span>
              <span v-if="item.reply_by" class="reply-by">by {{ item.reply_by }}</span>
            </div>
            <div class="reply-message">
              {{ item.reply }}
            </div>
          </div>
          
          <div v-else class="no-reply">
            No reply yet
          </div>
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
      feedback: [],
      searchQuery: '',
      loading: false,
      error: null
    };
  },
  computed: {
    filteredFeedback() {
      const query = this.searchQuery.toLowerCase();
      return this.feedback.filter(item => {
        return (
          item.message.toLowerCase().includes(query) ||
          (item.sender_name && item.sender_name.toLowerCase().includes(query)) ||
          (item.sender_username && item.sender_username.toLowerCase().includes(query)) ||
          (item.reply && item.reply.toLowerCase().includes(query)) ||
          (item.reply_by && item.reply_by.toLowerCase().includes(query))
        );
      });
    }
  },
  created() {
    this.fetchFeedback();
  },
  methods: {
    async fetchFeedback() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/admin/feedback');
        this.feedback = response.data;
      } catch (error) {
        console.error('Error fetching feedback:', error);
        this.error = 'Failed to load feedback. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    filterFeedback() {
      // Computed property handles the filtering
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    formatRole(role) {
      return role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
};
</script>

<style scoped>
.feedback-container {
  padding: 2rem;
  max-width: 1200px;
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

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feedback-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sender-name {
  font-weight: 600;
  color: #2c3e50;
}

.sender-username {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.sender-role {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.sender-role.customer {
  background-color: #e3f2fd;
  color: #1976d2;
}

.sender-role.dealer {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.sender-role.service_manager {
  background-color: #fff3e0;
  color: #e65100;
}

.sender-role.finance {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.sender-role.event_manager {
  background-color: #e0f7fa;
  color: #00838f;
}

.feedback-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: #7f8c8d;
}

.feedback-date {
  white-space: nowrap;
}

.feedback-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  text-transform: capitalize;
}

.feedback-status.pending {
  background-color: #fff3e0;
  color: #e65100;
}

.feedback-status.resolved {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.feedback-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.feedback-message {
  padding: 1rem 0;
  line-height: 1.6;
  color: #34495e;
  border-bottom: 1px solid #eee;
  margin-bottom: 1rem;
}

.feedback-reply {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.reply-label {
  font-weight: 600;
  color: #2c3e50;
}

.reply-date {
  color: #7f8c8d;
}

.reply-by {
  color: #7f8c8d;
}

.reply-message {
  line-height: 1.6;
  color: #34495e;
}

.no-reply {
  color: #7f8c8d;
  font-style: italic;
  padding: 1rem 0;
}

.loading-state,
.error-state,
.empty-state {
  padding: 2rem;
  text-align: center;
  color: #7f8c8d;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.error-state {
  color: #e74c3c;
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-box {
    width: 100%;
  }
  
  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>