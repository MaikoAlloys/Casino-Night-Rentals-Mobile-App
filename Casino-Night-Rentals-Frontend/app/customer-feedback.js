import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const CustomerFeedback = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(3);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userType, setUserType] = useState('customer');
  const [customerId, setCustomerId] = useState(null);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);
  const [feedbackReplies, setFeedbackReplies] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const customerToken = await AsyncStorage.getItem('customerToken');
        
        if (!customerToken) {
          Alert.alert('Error', 'No token provided. Please log in again.');
          router.push('/customer-login');
          return;
        }

        const response = await api.get('/feedback/users', {
          headers: {
            Authorization: `Bearer ${customerToken}`,
          }
        });

        const data = response.data;
        const transformedUsers = data.users.flatMap(user => {
          if (user.customer_name) {
            return { name: user.customer_name, type: 'customer' };
          } else if (user.dealer_name) {
            return { name: user.dealer_name, type: 'dealer' };
          } else if (user.service_manager_name) {
            return { name: user.service_manager_name, type: 'service_manager' };
          } else if (user.finance_name) {
            return { name: user.finance_name, type: 'finance' };
          } else if (user.event_manager_name) {
            return { name: user.event_manager_name, type: 'event_manager' };
          }
          return [];
        });

        setUsers(transformedUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users');
        setLoading(false);
      }
    };

    const getCustomerData = async () => {
      try {
        const customerToken = await AsyncStorage.getItem('customerToken');
        const customerId = await AsyncStorage.getItem('customerId');
        if (customerToken && customerId) {
          setCustomerId(customerId);
          fetchFeedbackReplies(customerToken);
        } else {
          router.push('/customer-login');
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
      }
    };

    fetchUsers();
    getCustomerData();
  }, []);

  const fetchFeedbackReplies = async (token) => {
    try {
      const response = await api.get('/customer/customer-feedback-replies', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFeedbackReplies(response.data);
    } catch (error) {
    //   console.error('Error fetching feedback replies:', error);
      Alert.alert('Error', 'Failed to load feedback replies');
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser || !feedback) {
      Alert.alert('Error', 'Please select a user and provide feedback');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const customerToken = await AsyncStorage.getItem('customerToken');
      
      if (!customerToken) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        router.push('/customer-login');
        return;
      }

      const response = await api.post(
        '/feedback/submit-feedback',
        {
          userName: selectedUser,
          message: feedback,
          rating: rating
        },
        {
          headers: {
            Authorization: `Bearer ${customerToken}`,
          }
        }
      );

      // Add to local state
      const newFeedback = {
        id: Date.now(),
        recipient: selectedUser,
        recipientType: userType,
        message: feedback,
        rating: rating,
        timestamp: new Date().toISOString()
      };
      
      setSubmittedFeedbacks(prev => [newFeedback, ...prev]);
      Alert.alert('Success', 'Feedback submitted successfully!');
      
      // Reset form
      setSelectedUser('');
      setFeedback('');
      setRating(3);
      
      // Refresh replies
      fetchFeedbackReplies(customerToken);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      let errorMessage = 'Failed to submit feedback';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          router.push('/customer-login');
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Customer Feedback Form</Text>
      
      {/* Feedback Form */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select User:</Text>
          <Picker
            selectedValue={selectedUser}
            style={styles.picker}
            onValueChange={(itemValue, itemIndex) => {
              setSelectedUser(itemValue);
              const selected = users.find(user => user.name === itemValue);
              if (selected) {
                setUserType(selected.type);
              }
            }}
          >
            <Picker.Item label="Select a user..." value="" />
            {users.map((user, index) => (
              <Picker.Item key={index} label={user.name} value={user.name} />
            ))}
          </Picker>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>User Type:</Text>
          <Text style={styles.userType}>
            {selectedUser ? userType : 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rating (1-5):</Text>
          <Picker
            selectedValue={rating}
            style={styles.picker}
            onValueChange={(itemValue) => setRating(itemValue)}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <Picker.Item key={num} label={num.toString()} value={num} />
            ))}
          </Picker>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Feedback:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="Enter your feedback here..."
            value={feedback}
            onChangeText={setFeedback}
          />
        </View>
        
        <Button
          title={submitting ? "Submitting..." : "Submit Feedback"}
          onPress={handleSubmit}
          disabled={!selectedUser || !feedback || submitting}
        />
      </View>

      {/* Submitted Feedback History */}
      {(submittedFeedbacks.length > 0 || feedbackReplies.length > 0) && (
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Your Feedback History</Text>
          
          {/* Local state feedbacks (not yet in backend) */}
          {submittedFeedbacks.map(feedback => (
            <View key={feedback.id} style={styles.feedbackCard}>
              <Text style={styles.feedbackHeader}>
                To: {feedback.recipient} ({feedback.recipientType})
              </Text>
              <Text style={styles.feedbackRating}>Rating: {feedback.rating}/5</Text>
              <Text style={styles.feedbackMessage}>{feedback.message}</Text>
              <Text style={styles.feedbackTime}>
                Sent: {new Date(feedback.timestamp).toLocaleString()}
              </Text>
              <Text style={styles.statusText}>Status: Pending response</Text>
            </View>
          ))}
          
          {/* Feedback replies from backend */}
          {feedbackReplies.map(feedback => (
            <View key={feedback.feedback_id} style={styles.feedbackCard}>
              <Text style={styles.feedbackHeader}>
                To: {feedback.dealer_name || 'Dealer'}
              </Text>
              <Text style={styles.feedbackMessage}>{feedback.feedback_message}</Text>
              <Text style={styles.feedbackTime}>
                Sent: {new Date(feedback.created_at).toLocaleString()}
              </Text>
              
              {feedback.dealer_reply ? (
                <>
                  <Text style={styles.replyHeader}>Dealer's Reply:</Text>
                  <Text style={styles.replyText}>{feedback.dealer_reply}</Text>
                  <Text style={styles.replyTime}>
                    Replied on: {new Date(feedback.reply_time).toLocaleString()} by {feedback.reply_by}
                  </Text>
                  <Text style={styles.statusText}>Status: {feedback.status}</Text>
                </>
              ) : (
                <Text style={styles.statusText}>Status: Waiting for reply</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    marginBottom: 20,
  },
  historyContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  textInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  userType: {
    fontSize: 16,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  feedbackCard: {
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
  feedbackHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  feedbackRating: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  feedbackMessage: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  feedbackTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  replyHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#4A90E2',
  },
  replyText: {
    fontSize: 15,
    marginVertical: 5,
    color: '#333',
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 5,
  },
  replyTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
});

export default CustomerFeedback;