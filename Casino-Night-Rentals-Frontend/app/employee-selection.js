import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmployeeSelection() {
  return (
    <View style={styles.container}>
      <Text>Employee Selection Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
