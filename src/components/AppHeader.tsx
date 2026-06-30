import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { colors, elevation, typography, spacing } from '@theme/colors';
import { useTranslation } from 'react-i18next';

type AppHeaderProps = {
  routeName: string | null;
};

const AppHeader: React.FC<AppHeaderProps> = ({ routeName }) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  // Safely check if can go back
  let canGoBack = false;
  try {
    canGoBack = navigation.canGoBack();
  } catch {
    canGoBack = false;
  }

  const isAuth = routeName === 'Login';

  // Open drawer using DrawerActions
  const handleOpenDrawer = () => {
    try {
      // Use DrawerActions to open drawer - this works from anywhere in the navigation tree
      navigation.dispatch(DrawerActions.openDrawer());
    } catch (error) {
      console.error('Error opening drawer:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {canGoBack && !isAuth ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{'‹'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleOpenDrawer}
            style={styles.menuButton}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        )}
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>CA</Text>
        </View>
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
    paddingVertical: spacing.sm + 2,
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
  backText: {
    fontSize: 28,
    color: colors.onSurface,
    fontWeight: '300',
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
  menuIcon: {
    fontSize: 24,
    color: colors.onSurface,
    fontWeight: '300',
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...elevation[2],
  },
  logoText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  title: {
    marginLeft: spacing.sm,
    ...typography.titleLarge,
    color: colors.onSurface,
    flex: 1,
  },
});

export default AppHeader;



