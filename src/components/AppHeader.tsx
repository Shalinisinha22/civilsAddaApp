import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useNavigation, DrawerActions, NavigationContainerRef } from '@react-navigation/native';
import { colors, elevation, typography, spacing } from '@theme/colors';
import { useTranslation } from 'react-i18next';
import { Icons } from '@components/Icons';

type AppHeaderProps = {
  routeName: string | null;
  navigationRef?: React.RefObject<NavigationContainerRef<any>>;
};

const detailScreens = [
  'TestDetail',
  'PackageDetail',
  'CategoryTests',
  'Checkout',
  'PaymentSuccess',
  'PaymentFailure',
  'TestAttempt',
  'Settings',
];

const AppHeader: React.FC<AppHeaderProps> = ({ routeName, navigationRef }) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const isAuth = routeName === 'Login';
  const isDetailScreen = detailScreens.includes(routeName || '');
  const isRootScreen = routeName === 'Home' || routeName === 'HomeTabs' || routeName === 'Login';

  const canGoBack = isDetailScreen || (!isRootScreen && Boolean(navigationRef?.current?.canGoBack() || navigation.canGoBack()));

  // Open drawer using DrawerActions
  const handleOpenDrawer = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch (error) {
      console.error('Error opening drawer:', error);
    }
  };

  const handleGoBack = () => {
    if (navigationRef?.current?.canGoBack()) {
      navigationRef.current.goBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: navigate to Home
      try {
        navigation.navigate('HomeTabs', { screen: 'Home' });
      } catch {
        navigation.navigate('Home');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {canGoBack && !isAuth ? (
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton} activeOpacity={0.7}>
            <Icons.ArrowBack size={24} color={colors.gray800} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleOpenDrawer}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Icons.Menu size={24} color={colors.gray800} />
          </TouchableOpacity>
        )}
        <Image source={require('../assets/logo.jpg')} style={styles.logoImage} />
        <Text style={styles.title}>{t('appName')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    ...(Platform.OS === 'android' ? elevation[2] : {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    }),
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
    minHeight: 52,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  title: {
    marginLeft: spacing.sm,
    ...typography.titleMedium,
    color: colors.onSurface,
    flex: 1,
    fontWeight: '700',
  },
});

export default AppHeader;
