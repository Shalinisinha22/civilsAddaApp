import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors } from '@theme/colors';

const TestAttemptScreen: React.FC = () => {
  const route = useRoute();
  const { testId, attemptId } = route.params as {
    testId: string;
    attemptId: string;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Attempt</Text>
      <Text style={styles.text}>Test ID: {testId}</Text>
      <Text style={styles.text}>Attempt ID: {attemptId}</Text>
      <Text style={styles.note}>
        This screen will show the test attempt interface. Implement as needed.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.gray50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: colors.gray700,
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: colors.gray500,
    fontStyle: 'italic',
  },
});

export default TestAttemptScreen;

