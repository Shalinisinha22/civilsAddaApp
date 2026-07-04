import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import MainTabs from '@navigation/MainTabs';
import TestsScreen from '@screens/tests/TestsScreen';
import PerformanceScreen from '@screens/dashboard/PerformanceScreen';
import SettingsScreen from '@screens/settings/SettingsScreen';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useAuth } from '@contexts/AuthContext';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import { useTranslation } from 'react-i18next';
import type { DrawerParamList } from '@navigation/types';

const Drawer = createDrawerNavigator<DrawerParamList>();

const menuItems = [
  { route: 'HomeTabs', label: 'Overview', icon: Icons.Dashboard },
  { route: 'MyTests', label: 'Packages', icon: Icons.Book },
  { route: 'Performance', label: 'Performance', icon: Icons.Statistics },
  { route: 'Settings', label: 'Settings', icon: Icons.Settings },
];

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

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Image source={require('../assets/logo.jpg')} style={styles.logoImage} />
            <Text style={styles.appName}>{t('appName')}</Text>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.closeDrawer())} style={styles.closeBtn}>
              <Icons.Close size={18} color={colors.gray500} />
            </TouchableOpacity>
          </View>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{user?.email || ''}</Text>
            </View>
          </View>
        </View>
      </View>

      <DrawerContentScrollView {...props} style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const isFocused = props.state.index === index;
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.route}
                activeOpacity={0.7}
                onPress={() => {
                  if (props.state.index !== index || props.state.routeNames[index] !== item.route) {
                    props.navigation.navigate(item.route);
                  } else {
                    navigation.dispatch(DrawerActions.closeDrawer());
                  }
                }}
                style={[
                  styles.menuItem,
                  isFocused && styles.menuItemActive,
                ]}
              >
                <View style={[styles.menuIconWrap, isFocused && styles.menuIconWrapActive]}>
                  <IconComp size={22} color={isFocused ? colors.white : colors.gray600} />
                </View>
                <Text style={[styles.menuLabel, isFocused && styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {isFocused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.logoutIconWrap}>
            <Icons.Logout size={20} color={colors.danger} />
          </View>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
};

const AppDrawer: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.white,
          width: 300,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      {menuItems.map((item) => (
        <Drawer.Screen
          key={item.route}
          name={item.route as keyof DrawerParamList}
          component={
            item.route === 'HomeTabs' ? MainTabs :
            item.route === 'MyTests' ? TestsScreen :
            item.route === 'Performance' ? PerformanceScreen :
            SettingsScreen
          }
        />
      ))}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerBg: {
    display: 'none',
  },
  headerContent: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  appName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.gray900,
    marginLeft: 10,
    flex: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight || '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  userEmail: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuSection: {
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    borderRadius: 12,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#E3F2FD',
  },
  menuIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
  },
  menuIconWrapActive: {
    backgroundColor: colors.primary,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray700,
    marginLeft: 12,
    flex: 1,
  },
  menuLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
  },
  logoutIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  versionText: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 10,
  },
});

export default AppDrawer;
