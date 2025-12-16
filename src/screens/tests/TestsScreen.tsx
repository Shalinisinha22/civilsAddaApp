import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import type { AppNavigationParamList } from '@navigation/types';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList, 'Tests'>;

type TestSummary = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  price: number;
  category?: string;
  isPurchased?: boolean;
};

const TestsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.tests.getAll();
        if (res.success && res.data) {
          const mapped: TestSummary[] = (res.data as any[]).map((test) => ({
            id: test.id || test._id,
            title: test.title,
            description: test.description || '',
            durationMinutes: test.durationMinutes,
            totalQuestions: test.totalQuestions ?? test.questions?.length ?? 0,
            price: test.price,
            category: test.category
              ? test.category.charAt(0).toUpperCase() +
                test.category.slice(1).replace('-', ' ')
              : undefined,
            isPurchased: !!test.isPurchased,
          }));
          setTests(mapped);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load tests');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAddToCart = (test: TestSummary) => {
    addToCart({
      id: test.id,
      title: test.title,
      description: test.description,
      price: test.price,
      durationMinutes: test.durationMinutes,
      totalQuestions: test.totalQuestions,
    });
    addToast(`${test.title} added to cart!`, 'success');
  };

  const renderItem = ({ item }: { item: TestSummary }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          {item.category ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          ) : null}
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <View
          style={[
            styles.priceBadge,
            item.price === 0 && styles.priceBadgeFreeContainer,
          ]}
        >
          <Text
            style={[
              styles.priceBadgeText,
              item.price === 0 && styles.priceBadgeFreeText,
            ]}
          >
            {item.price === 0 ? 'Free' : `₹${item.price}`}
          </Text>
        </View>
      </View>

      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          📝 {item.totalQuestions} Q • ⏱️ {item.durationMinutes} min
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.viewButton]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('TestDetail', { testId: item.id })}
        >
          <Text style={styles.viewButtonText}>{t('view') || 'View'}</Text>
        </TouchableOpacity>

        {item.isPurchased ? (
          <View style={[styles.button, styles.purchasedButton]}>
            <Text style={styles.purchasedText}>
              ✓ {t('purchased') || 'Purchased'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.addToCartButton]}
            activeOpacity={0.9}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addToCartText}>
              {t('addToCart') || 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingLabel}>Loading tests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorLabel}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.screenTitle}>Trending Tests</Text>
      <FlatList
        data={tests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.gray50,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.gray100,
    alignSelf: 'flex-start',
  },
  priceBadgeFreeContainer: {
    backgroundColor: '#dcfce7',
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray800,
  },
  priceBadgeFreeText: {
    color: '#15803d',
  },
  description: {
    fontSize: 13,
    color: colors.gray600,
    marginBottom: 8,
    marginTop: 4,
  },
  metaRow: {
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray500,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: colors.gray100,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  purchasedButton: {
    backgroundColor: colors.success,
  },
  purchasedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  loadingLabel: {
    marginTop: 8,
    color: colors.gray600,
  },
  errorLabel: {
    color: colors.danger,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
});

export default TestsScreen;


