import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../api';

const DealerFeedback = () => {
  const { dealerId } = useLocalSearchParams();
  const [feedbackData, setFeedbackData] = useState([]);
  const [replyMessages, setReplyMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (!dealerId) return;

      try {
        const response = await api.get(`/dealers/feedback/${dealerId}`);
        const data = response.data;
        
        if (data.success) {
          setFeedbackData(data.feedback || []);
        } else {
          Alert.alert('Error', data.message || 'Failed to load feedback');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        Alert.alert('Error', 'Failed to load feedback');
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, [dealerId]);

  const handleReplySubmit = async (feedbackId) => {
    const replyMessage = replyMessages[feedbackId];
    
    if (!replyMessage) {
      Alert.alert('Error', 'Please provide a reply message');
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        feedbackId,
        dealerId,
        reply: replyMessage
      };

      const response = await api.post('/dealers/reply', data);
      
      if (response.data.success) {
        Alert.alert('Success', 'Reply submitted successfully');
        
        // Update local state to show the reply
        setFeedbackData(prev => prev.map(item => 
          item.feedback_id === feedbackId 
            ? { 
                ...item, 
                reply: replyMessage, 
                reply_by: `Dealer ${dealerId}`,
                status: 'resolved',
                reply_time: new Date().toISOString()
              } 
            : item
        ));
        
        // Clear the reply input
        setReplyMessages(prev => ({ ...prev, [feedbackId]: '' }));
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      Alert.alert('Error', 'Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading feedback...</Text>
      </View>
    );
  }

  if (feedbackData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noFeedbackText}>No feedback found for this dealer</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Feedback</Text>
      
      {feedbackData.map((feedback) => (
        <View key={feedback.feedback_id} style={styles.feedbackItem}>
          {/* Added customer name display */}
          <Text style={styles.customerName}>
            From: {feedback.customer_name || 'Customer'}
          </Text>
          <Text style={styles.feedbackText}>Rating: {feedback.rating}/5</Text>
          <Text style={styles.feedbackText}>Message: {feedback.message}</Text>
          <Text style={styles.feedbackText}>
            Date: {new Date(feedback.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.feedbackText}>Status: {feedback.status}</Text>
          
          {feedback.reply ? (
            <>
              <Text style={styles.replyLabel}>Your Reply:</Text>
              <Text style={styles.replyText}>{feedback.reply}</Text>
              <Text style={styles.replyInfo}>
                Replied on: {new Date(feedback.reply_time).toLocaleString()}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Your Reply:</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                placeholder="Enter your reply..."
                value={replyMessages[feedback.feedback_id] || ''}
                onChangeText={(text) => 
                  setReplyMessages(prev => ({ ...prev, [feedback.feedback_id]: text }))
                }
              />
              <Button
                title={submitting ? "Submitting..." : "Submit Reply"}
                onPress={() => handleReplySubmit(feedback.feedback_id)}
                disabled={!replyMessages[feedback.feedback_id] || submitting}
              />
            </>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  noFeedbackText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  feedbackItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '600',
  },
  replyLabel: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '600',
    color: '#4A90E2',
  },
  feedbackText: {
    fontSize: 16,
    marginBottom: 5,
  },
  replyText: {
    fontSize: 16,
    marginBottom: 5,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
  },
  replyInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  textInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'white',
    textAlignVertical: 'top',
    marginBottom: 10,
  },
});

export default DealerFeedback;