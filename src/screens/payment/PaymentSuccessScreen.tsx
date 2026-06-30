import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import type { AppNavigationParamList } from '@navigation/types';

type RouteType = RouteProp<AppNavigationParamList, 'PaymentSuccess'>;
type NavProp = NativeStackNavigationProp<AppNavigationParamList>;

const PaymentSuccessScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const { order_id } = route.params;

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Icons.Check size={48} color={colors.white} />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Your purchase is complete. You can now access your tests.
        </Text>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Order ID:</Text>
          <Text style={styles.orderValue}>{order_id}</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Tests')}
        >
          <Text style={styles.secondaryButtonText}>Browse Tests</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 24,
    width: '100%',
  },
  orderLabel: {
    fontSize: 13,
    color: colors.gray500,
    marginRight: 8,
  },
  orderValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray800,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  secondaryButtonText: {
    color: colors.gray700,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentSuccessScreen;
