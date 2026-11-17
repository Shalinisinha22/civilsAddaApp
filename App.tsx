import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator, BackHandler, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { disableSystemFontScaling } from '@utils/fontScaling';

disableSystemFontScaling();
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
import {
  initNotifications,
  setTestNavigator,
  getPendingTestId,
  clearPendingTestId,
} from '@services/notificationService';

const AppContent: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [routeName, setRouteName] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleHardwareBack = () => {
      // 1. If navigation stack can go back, navigate back!
      if (navigationRef.current?.canGoBack()) {
        navigationRef.current.goBack();
        return true;
      }

      // 2. If the user is on a tab or subscreen other than Home, navigate back to Home
      const currentRoute = navigationRef.current?.getCurrentRoute();
      const currentRouteName = currentRoute?.name;

      if (currentRouteName && currentRouteName !== 'Home' && currentRouteName !== 'Login') {
        try {
          navigationRef.current?.navigate('HomeTabs', { screen: 'Home' });
          return true;
        } catch {
          // continue to exit dialog if navigate fails
        }
      }

      // 3. User is on the root screen (Home) -> Show exit confirmation dialog!
      Alert.alert(
        t('exitAppTitle', { defaultValue: 'Exit Civils Adda' }),
        t('exitAppMessage', { defaultValue: 'Are you sure you want to exit the app?' }),
        [
          {
            text: t('cancel', { defaultValue: 'Cancel' }),
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: t('exit', { defaultValue: 'Exit' }),
            style: 'destructive',
            onPress: () => BackHandler.exitApp(),
          },
        ],
        { cancelable: true }
      );

      return true; // Prevents the app from closing immediately
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBack
    );

    return () => backHandler.remove();
  }, [t]);

  useEffect(() => {
    initNotifications();
  }, []);

  useEffect(() => {
    setTestNavigator((testId) => {
      navigationRef.current?.navigate('TestDetail', { testId });
    });
    return () => setTestNavigator(null);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const pendingTestId = getPendingTestId();
      if (pendingTestId) {
        clearPendingTestId();
        navigationRef.current?.navigate('TestDetail', { testId: pendingTestId });
      }
    }
  }, [isAuthenticated]);

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
        {routeName && routeName !== 'Login' && <AppHeader routeName={routeName} navigationRef={navigationRef} />}

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
