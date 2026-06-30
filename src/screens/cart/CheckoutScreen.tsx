import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RazorpayCheckout from 'react-native-razorpay';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import { useCart } from '@contexts/CartContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { api } from '@api/api';
import { RAZORPAY_KEY_ID } from '@config/env';
import type { AppNavigationParamList } from '@navigation/types';

type NavProp = NativeStackNavigationProp<AppNavigationParamList>;

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const subtotal = getTotal();
  const tax = Number((subtotal * 0.18).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const handleCheckout = async () => {
    if (!user?.id) {
      addToast('Please login to continue', 'error');
      navigation.navigate('Login');
      return;
    }

    setLoading(true);

    try {
      const packageIds = items.map((item) => item.id);

      if (subtotal === 0) {
        const response = await api.purchases.createPaymentOrder(packageIds);
        if (!response.success) {
          throw new Error(response.message || 'Failed to complete checkout');
        }
        clearCart();
        addToast(`Successfully purchased ${items.length} item${items.length > 1 ? 's' : ''}!`, 'success');
        navigation.navigate('Dashboard');
        return;
      }

      const receipt = `rcpt_${Date.now()}_${items.length}`;
      const response = await api.purchases.createPaymentOrder(packageIds, {
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create payment order');
      }

      var options = {
        description: `Purchase of ${items.length} item${items.length > 1 ? 's' : ''}`,
        image: undefined,
        currency: response.data.currency || 'INR',
        key: RAZORPAY_KEY_ID,
        amount: response.data.amount,
        name: 'Civils Adda',
        order_id: response.data.order_id,
        prefill: {
          email: user.email || '',
          contact: '',
          name: user.name || '',
        },
        theme: { color: '#2196F3' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            addToast('Payment was cancelled', 'error');
          },
        },
      };

      const paymentData = await RazorpayCheckout.open(options);

      const verificationResponse = await api.purchases.verifyPayment({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      if (!verificationResponse.success) {
        throw new Error(verificationResponse.message || 'Payment verification failed');
      }

      clearCart();
      addToast('Payment successful! Your purchase is complete.', 'success');
      navigation.navigate('PaymentSuccess', {
        order_id: paymentData.razorpay_order_id,
      });
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'PAYMENT_CANCELLED' || error.code === 'NETWORK_ERROR' || error.description) {
        navigation.navigate('PaymentFailure');
      } else {
        addToast(error.message || 'Failed to complete checkout', 'error');
      }
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyRoot}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.emptyButtonText}>Go to Cart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemKind}>
                  {item.kind === 'package' ? '📦 Package' : '📝 Test'}
                </Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.itemPrice}>
                {item.price === 0 ? 'Free' : `₹${item.price}`}
              </Text>
            </View>
            {item.kind === 'package' && item.totalTests ? (
              <Text style={styles.itemMeta}>{item.totalTests} tests included</Text>
            ) : null}
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>₹{subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST (18%):</Text>
            <Text style={styles.summaryValue}>₹{tax}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.checkoutButtonText}> Processing...</Text>
            </View>
          ) : (
            <Text style={styles.checkoutButtonText}>
              Complete Purchase (₹{total})
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  listContent: {
    padding: 16,
    paddingBottom: 220,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemKind: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
  },
  itemDescription: {
    fontSize: 13,
    color: colors.gray600,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 8,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.gray800,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gray900,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});

export default CheckoutScreen;
