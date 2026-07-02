import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import HomeScreen from '@screens/home/HomeScreen';
import DashboardScreen from '@screens/dashboard/DashboardScreen';
import TestsScreen from '@screens/tests/TestsScreen';
import AttemptsScreen from '@screens/dashboard/AttemptsScreen';
import CartScreen from '@screens/cart/CartScreen';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import { useTranslation } from 'react-i18next';
import { TabParamList } from './types';
import { useCart } from '@contexts/CartContext';

const Tab = createBottomTabNavigator<TabParamList>();

// Icon component for tab bar
const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({
  name,
  focused,
  color,
}) => {
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return <Icons.Home size={24} color={color} />;
      case 'Tests':
        return <Icons.Inventory size={24} color={color} />;
      case 'Cart':
        return <Icons.Cart size={24} color={color} />;
      case 'Attempts':
        return <Icons.Attempts size={24} color={color} />;
      case 'Dashboard':
        return <Icons.Dashboard size={24} color={color} />;
      default:
        return <Icons.Book size={24} color={color} />;
    }
  };

  return <View style={styles.iconContainer}>{getIcon()}</View>;
};

const MainTabs: React.FC = () => {
  const { t } = useTranslation();
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray200,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarLabel: ({ color }) => (
          <Text style={{ color, fontSize: 11, fontWeight: '500' }}>
            {route.name === 'Home'
              ? 'Home'
              : route.name === 'Tests'
              ? 'Packages'
              : route.name === 'Cart'
              ? t('cart')
              : route.name === 'Attempts'
              ? t('attempts')
              : t('dashboard')}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tests" component={TestsScreen} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />
      <Tab.Screen name="Attempts" component={AttemptsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MainTabs;



