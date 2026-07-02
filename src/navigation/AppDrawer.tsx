import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import MainTabs from '@navigation/MainTabs';
import MyTestsScreen from '@screens/dashboard/MyTestsScreen';
import PerformanceScreen from '@screens/dashboard/PerformanceScreen';
import SettingsScreen from '@screens/settings/SettingsScreen';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@contexts/AuthContext';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import { useTranslation } from 'react-i18next';
import type { DrawerParamList } from '@navigation/types';

const Drawer = createDrawerNavigator<DrawerParamList>();

// Custom Drawer Content
const CustomDrawerContent = (props: any) => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Image source={require('../assets/logo.jpg')} style={styles.logoImage} />
        <Text style={styles.drawerTitle}>{t('appName')}</Text>
        {user && (
          <Text style={styles.userName}>{user.name || user.email}</Text>
        )}
      </View>
      <DrawerItemList {...props} />
      <View style={styles.drawerFooter}>
        <DrawerItem
          label={t('logout')}
          onPress={handleLogout}
          labelStyle={styles.logoutLabel}
          style={styles.logoutItem}
        />
      </View>
    </DrawerContentScrollView>
  );
};

const AppDrawer: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.gray600,
        drawerStyle: {
          backgroundColor: colors.white,
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        drawerType: 'front',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        drawerHideStatusBarOnOpen: false,
      }}
    >
      <Drawer.Screen
        name="HomeTabs"
        component={MainTabs}
        options={{
          title: 'Overview',
          drawerIcon: ({ color }) => <Icons.Dashboard size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="MyTests"
        component={MyTestsScreen}
        options={{
          title: 'My Tests',
          drawerIcon: ({ color }) => <Icons.Book size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Performance"
        component={PerformanceScreen}
        options={{
          title: 'Performance',
          drawerIcon: ({ color }) => <Icons.Statistics size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color }) => <Icons.Settings size={20} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  drawerFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 8,
  },
  logoutLabel: {
    color: colors.danger,
    fontWeight: '600',
  },
  logoutItem: {
    marginHorizontal: 0,
  },
});

export default AppDrawer;



