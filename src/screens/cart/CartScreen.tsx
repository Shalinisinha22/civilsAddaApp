import React from 'react';
import HTMLDescription from '../../components/HTMLDescription';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import { useCart } from '@contexts/CartContext';
import type { AppNavigationParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

const CartScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { items, removeFromCart, clearCart, getTotal } = useCart();

  const total = getTotal();

  if (items.length === 0) {
    return (
      <View style={styles.emptyRoot}>
        <Icons.Cart size={48} color={colors.gray400} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>
          Add some tests or packages to your cart to begin checkout.
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Tests')}
        >
          <Text style={styles.emptyButtonText}>Browse Packages →</Text>
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
                  {item.kind === 'package' ? 'Package' : 'Test'}
                </Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.description ? (
                  <HTMLDescription html={item.description} style={styles.itemDescription} />
                ) : null}
              </View>
              <Text style={styles.itemPrice}>
                {item.price === 0 ? 'Free' : `₹${item.price}`}
              </Text>
            </View>
            {item.kind === 'package' && item.totalTests ? (
              <Text style={styles.itemMeta}>
                {item.totalTests} tests included
              </Text>
            ) : (
              <View style={styles.itemMetaRow}>
                <Icons.Questions size={14} color={colors.gray600} />
                <Text style={styles.itemMeta}>
                  {' '}{item.totalQuestions} Q •{' '}
                </Text>
                <Icons.Clock size={14} color={colors.gray600} />
                <Text style={styles.itemMeta}>
                  {' '}{item.durationMinutes} min
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFromCart(item.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total}</Text>
        </View>
        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => navigation.navigate('Checkout')}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 96,
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
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMeta: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  removeButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: colors.gray500,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
  },
  checkoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  checkoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
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
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 12,
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

export default CartScreen;




