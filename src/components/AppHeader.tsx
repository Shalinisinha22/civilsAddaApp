import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { colors } from '@theme/colors';
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 24,
    color: colors.gray900,
  },
  menuButton: {
    marginRight: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  menuIcon: {
    fontSize: 20,
    color: colors.gray900,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  logoText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
  },
});

export default AppHeader;



