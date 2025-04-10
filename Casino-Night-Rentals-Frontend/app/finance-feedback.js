import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from './api';

const FinanceFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/finance/finance-feedback');
      
      if (response.data?.success) {
        setFeedbackList(response.data.feedback || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError(error.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (feedbackId) => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply message');
      return;
    }

    try {
      setSubmittingReply(true);
      
      const response = await api.post('/finance/reply', {
        feedbackId,
        reply: replyText.trim()
      });

      if (response.data?.success) {
        Alert.alert('Success', 'Reply submitted successfully');
        // Update the local state with the new reply
        setFeedbackList(prevList =>
          prevList.map(item =>
            item.feedback_id === feedbackId
              ? {
                  ...item,
                  status: 'resolved',
                  reply: replyText.trim(),
                  reply_by: 'Finance',
                  reply_time: new Date().toISOString()
                }
              : item
          )
        );
        // Reset reply state
        setReplyingTo(null);
        setReplyText('');
      } else {
        throw new Error(response.data?.message || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      Alert.alert('Error', error.message || 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderFeedbackItem = ({ item }) => (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <Text style={styles.customerName}>From: {item.customer_name}</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>Rating: {item.rating}/5</Text>
        </View>
      </View>
      
      <Text style={styles.feedbackMessage}>Message: {item.message}</Text>
      
      <Text style={styles.feedbackDate}>
        Date: {new Date(item.created_at).toLocaleDateString()}
      </Text>
      
      <Text style={styles.feedbackStatus}>
        Status: {item.status === 'resolved' ? 'resolved' : 'pending'}
      </Text>
      
      {item.status === 'resolved' && item.reply && (
        <View style={styles.replyContainer}>
          <Text style={styles.replyLabel}>Your Reply:</Text>
          <Text style={styles.replyText}>{item.reply}</Text>
          <Text style={styles.replyDate}>
            Replied on: {new Date(item.reply_time).toLocaleString()}
          </Text>
        </View>
      )}
      
      {item.status !== 'resolved' && (
        <>
          {replyingTo === item.feedback_id ? (
            <View style={styles.replyForm}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your reply here..."
                multiline
                value={replyText}
                onChangeText={setReplyText}
              />
              <View style={styles.replyFormButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => handleReplySubmit(item.feedback_id)}
                  disabled={submittingReply}
                >
                  {submittingReply ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setReplyingTo(item.feedback_id)}
            >
              <Icon name="reply" size={18} color="#fff" />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchFeedback}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Customer Feedback</Text>
      <Text style={styles.subHeader}>Review and respond to customer feedback</Text>
      
      {feedbackList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="feedback" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No feedback available</Text>
          <Text style={styles.emptySubText}>Customer feedback will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={feedbackList}
          renderItem={renderFeedbackItem}
          keyExtractor={(item) => item.feedback_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchFeedback}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  feedbackMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  feedbackDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  feedbackStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  replyContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  replyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  replyDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  replyForm: {
    marginTop: 12,
  },
  replyInput: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  replyFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 10,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FinanceFeedback;