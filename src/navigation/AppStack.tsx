import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppDrawer from './AppDrawer';
import TestDetailScreen from '@screens/tests/TestDetailScreen';
import TestAttemptScreen from '@screens/tests/TestAttemptScreen';
import { StackParamList } from './types';

const Stack = createNativeStackNavigator<StackParamList & { MainDrawer: undefined }>();

const AppStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainDrawer" component={AppDrawer} />
      <Stack.Screen name="TestDetail" component={TestDetailScreen} />
      <Stack.Screen name="TestAttempt" component={TestAttemptScreen} />
    </Stack.Navigator>
  );
};

export default AppStack;

