import React, { useRef, useState } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import RootNavigator from '@navigation/RootNavigator';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { ToastProvider } from '@contexts/ToastContext';
import { CartProvider } from '@contexts/CartContext';
import AppHeader from '@components/AppHeader';
import './src/i18n';
import { colors } from '@theme/colors';

const AppContent: React.FC = () => {
  const { loading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [routeName, setRouteName] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        setRouteName(currentRoute?.name || null);
      }}
      onStateChange={() => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        setRouteName(currentRoute?.name || null);
      }}
    >
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        {routeName && routeName !== 'Login' && <AppHeader routeName={routeName} />}

        <SafeAreaView style={styles.content} edges={['bottom', 'left', 'right']}>
          <RootNavigator />
        </SafeAreaView>
      </SafeAreaView>
    </NavigationContainer>
  );
};

function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <CartProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </CartProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
});

export default App;
