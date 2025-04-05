import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import api from './api';

export default function DealerDashboard() {
  const { id } = useLocalSearchParams(); // this is the dealer ID passed during login
  const [tasks, setTasks] = useState([]);
  const [dealerName, setDealerName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get(`/dealers/tasks/${id}`); // Replace with your actual route
        setTasks(res.data.tasks || []);
        setDealerName(res.data.dealerName || '');
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTasks();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Dealer {dealerName}</Text>
      <Text style={styles.subheader}>Your Assigned Tasks:</Text>

      {tasks.length === 0 ? (
        <Text style={styles.noTasks}>No tasks assigned yet.</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <Text style={styles.taskText}>• {item}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  header: {
    fontSize: 22,
    marginBottom: 10,
    color: '#222',
  },
  subheader: {
    fontSize: 18,
    marginBottom: 15,
    color: '#666',
  },
  noTasks: {
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
  taskCard: {
    backgroundColor: '#eee',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
