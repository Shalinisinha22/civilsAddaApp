import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@theme/colors';
import { api } from '@api/api';
import { useCart } from '@contexts/CartContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import type { AppNavigationParamList } from '@navigation/types';
import { CategoryIcon, Icons } from '@components/Icons';

type TestDetailRouteProp = RouteProp<AppNavigationParamList, 'TestDetail'>;
type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type Question = { id: string; text: string; options: string[] };

type Highlight = { icon?: string; title: string; description: string };

type TestDetail = {
  test: {
    id: string;
    title: string;
    description: string;
    category?: string;
    durationMinutes: number;
    totalQuestions: number;
    price: number;
    isPurchased?: boolean;
    highlights: Highlight[];
    instructions: string[];
  };
  questions: Question[];
};

const TestDetailScreen: React.FC = () => {
  const route = useRoute<TestDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { testId } = route.params;
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [data, setData] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.tests.getById(testId);
        if (!mounted) return;

        if (response.success && response.data) {
          const testData = response.data as any;
          setData({
            test: {
              id: testData.test.id,
              title: testData.test.title,
              description: testData.test.description || '',
              category: testData.test.category,
              durationMinutes: testData.test.durationMinutes,
              totalQuestions: testData.test.totalQuestions,
              price: testData.test.price,
              isPurchased: testData.test.isPurchased,
              highlights: testData.test.highlights || [],
              instructions: testData.test.instructions || [],
            },
            questions: (testData.questions || []).map((q: any, index: number) => ({
              id: q.id || String(index),
              text: q.text,
              options: q.options,
            })),
          });
        } else {
          setError('Test not found');
        }
      } catch (e: any) {
        if (!mounted) return;
        const message = e?.message || 'Failed to load test';
        setError(message);
        addToast(message, 'error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTest();
    return () => {
      mounted = false;
    };
  }, [testId, isAuthenticated, addToast]);

  const formatCategory = (category?: string) => {
    if (!category) return '';
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  };

  const getCategoryIcon = (category?: string) => {
    return <CategoryIcon category={category} size={14} color="#1d4ed8" />;
  };

  const highlightColors = useMemo(
    () => ['#eff6ff', '#ecfdf3', '#f5f3ff', '#fff7ed', '#fdf2f8'],
    [],
  );

  const instructionPalettes = useMemo(
    () => [
      { bg: '#eff6ff', badge: '#3b82f6' },
      { bg: '#ecfdf3', badge: '#22c55e' },
      { bg: '#f5f3ff', badge: '#8b5cf6' },
      { bg: '#fff7ed', badge: '#f97316' },
      { bg: '#fef2f2', badge: '#ef4444' },
    ],
    [],
  );

  const handleAddToCart = () => {
    if (!data) return;
    addToCart({
      id: data.test.id,
      title: data.test.title,
      description: data.test.description || '',
      price: data.test.price || 0,
      durationMinutes: data.test.durationMinutes,
      totalQuestions: data.test.totalQuestions,
      kind: 'test',
    });
    addToast(`${data.test.title} added to cart`, 'success');
    navigation.navigate('Tests');
  };

  const handleStartAttempt = async () => {
    if (!data || starting) return;

    if (!isAuthenticated || !user?.id) {
      addToast('Please login to start a test', 'error');
      navigation.navigate('Login');
      return;
    }

    if (data.test.price > 0 && !data.test.isPurchased) {
      addToast('Please purchase this test before attempting', 'error');
      return;
    }

    try {
      setStarting(true);
      const response = await api.attempts.create(data.test.id);
      if (response.success && response.data) {
        const payload = response.data as any;
        navigation.navigate('TestAttempt', {
          testId: data.test.id,
          attemptId: payload.attemptId,
        });
      }
    } catch (e: any) {
      addToast(e?.message || 'Failed to start test', 'error');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading test details...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorTitle}>Error loading test</Text>
        <Text style={styles.errorText}>{error || 'Test not found'}</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Tests')}
        >
          <Text style={styles.secondaryButtonText}>Back to Tests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { test } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header card */}
      <View style={styles.card}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            {test.category ? (
              <View style={styles.categoryPill}>
                {getCategoryIcon(test.category)}
                <Text style={styles.categoryText}>{formatCategory(test.category)}</Text>
              </View>
            ) : null}
            <Text style={styles.title}>{test.title}</Text>
            {test.description ? (
              <Text style={styles.description}>{test.description}</Text>
            ) : null}
          </View>
          {test.price === 0 ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Icons.Questions size={20} color={colors.onSurface} />
            <Text style={styles.statValue}>{test.totalQuestions}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statBox}>
            <Icons.Clock size={20} color={colors.onSurface} />
            <Text style={styles.statValue}>{test.durationMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statBox}>
            <Icons.Money size={20} color={colors.onSurface} />
            <Text style={styles.statValue}>
              {test.price === 0 ? 'Free' : `₹${test.price}`}
            </Text>
            <Text style={styles.statLabel}>Price</Text>
          </View>
          <View style={styles.statBox}>
            <Icons.Target size={20} color={colors.onSurface} />
            <Text style={styles.statValue}>
              {test.price === 0 ? 'Yes' : 'Paid'}
            </Text>
            <Text style={styles.statLabel}>Access</Text>
          </View>
        </View>
      </View>

      {/* What you'll get */}
      {test.highlights.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>
          {test.highlights.map((h, index) => (
            <View
              key={`${h.title}-${index}`}
              style={[
                styles.highlightItem,
                { backgroundColor: highlightColors[index % highlightColors.length] },
              ]}
            >
              <Text style={styles.highlightIcon}>{h.icon || '✨'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                <Text style={styles.highlightDescription}>{h.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Instructions */}
      {test.instructions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {test.instructions.map((inst, index) => {
            const palette = instructionPalettes[index % instructionPalettes.length];
            return (
              <View
                key={`${index}-${inst.slice(0, 10)}`}
                style={[styles.instructionItem, { backgroundColor: palette.bg }]}
              >
                <Text style={[styles.instructionIndex, { color: palette.badge }]}>
                  {index + 1}.
                </Text>
                <Text style={styles.instructionText}>{inst}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Action / purchase card */}
      <View style={styles.card}>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>
            {test.price === 0 ? 'FREE' : `₹${test.price}`}
          </Text>
          {test.price > 0 && <Text style={styles.priceSubText}>One-time purchase</Text>}
        </View>

        <View style={styles.actionsColumn}>
          {test.price > 0 && test.isPurchased ? (
            <View style={[styles.primaryButton, styles.primaryButtonDisabled]}>
              <View style={styles.purchasedRow}>
                <Icons.Check size={16} color={colors.white} />
                <Text style={styles.primaryButtonText}> Purchased</Text>
              </View>
            </View>
          ) : null}

          {test.price > 0 && !test.isPurchased ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddToCart}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[
              styles.secondaryWideButton,
              (test.price > 0 && !test.isPurchased) || starting
                ? styles.secondaryButtonDisabled
                : null,
            ]}
            disabled={(test.price > 0 && !test.isPurchased) || starting}
            onPress={handleStartAttempt}
            activeOpacity={0.9}
          >
            {starting ? (
              <View style={styles.buttonLoadingContainer}>
                <ActivityIndicator size="small" color={colors.white} style={styles.buttonSpinner} />
                <Text style={styles.secondaryWideButtonText}>Starting...</Text>
              </View>
            ) : (
              <Text style={styles.secondaryWideButtonText}>
                {test.price > 0 && !test.isPurchased
                  ? 'Purchase to Start'
                  : isAuthenticated
                  ? 'Start Test Now'
                  : 'Login to Start'}
              </Text>
            )}
          </TouchableOpacity>

          {test.price === 0 && (
            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={handleAddToCart}
              activeOpacity={0.9}
            >
              <Text style={styles.tertiaryButtonText}>Add to Cart Anyway</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Includes:</Text>
          <Text style={styles.benefitItem}>• Instant access after purchase</Text>
          <Text style={styles.benefitItem}>• Unlimited attempts</Text>
          <Text style={styles.benefitItem}>• Detailed solutions included</Text>
          <Text style={styles.benefitItem}>• Performance analytics</Text>
        </View>
      </View>

      {/* Overview & help */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Test Overview</Text>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Category</Text>
          <Text style={styles.overviewValue}>{formatCategory(test.category)}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Questions</Text>
          <Text style={styles.overviewValue}>{test.totalQuestions}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Duration</Text>
          <Text style={styles.overviewValue}>{test.durationMinutes} min</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Type</Text>
          <Text style={styles.overviewValue}>
            {test.price === 0 ? 'Free' : 'Premium'}
          </Text>
        </View>
      </View>

      <View style={styles.helpCard}>
        <Icons.Lightbulb size={22} color="#92400e" />
        <View style={{ flex: 1 }}>
          <Text style={styles.helpTitle}>Need help?</Text>
          <Text style={styles.helpText}>
            Having trouble accessing the test or have questions? Visit your dashboard
            to review purchases and attempts.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.helpLinkButton}
          >
            <Text style={styles.helpLinkText}>Go to Dashboard →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.gray600,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.gray700,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.gray700,
  },
  freeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  highlightIcon: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
  },
  highlightDescription: {
    fontSize: 13,
    color: colors.gray700,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  instructionIndex: {
    fontWeight: '700',
    marginRight: 8,
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray800,
  },
  priceRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray900,
  },
  priceSubText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  actionsColumn: {
    gap: 10,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#22c55e',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryWideButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
  },
  secondaryButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  secondaryWideButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  tertiaryButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  tertiaryButtonText: {
    color: colors.gray800,
    fontSize: 14,
    fontWeight: '600',
  },
  benefits: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 12,
    marginTop: 4,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 4,
  },
  benefitItem: {
    fontSize: 13,
    color: colors.gray600,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  overviewLabel: {
    fontSize: 13,
    color: colors.gray600,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
  },
  helpCard: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 10,
    alignItems: 'flex-start',
  },
  helpIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 8,
  },
  helpLinkButton: {
    alignSelf: 'flex-start',
  },
  helpLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  secondaryButton: {
    marginTop: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  purchasedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TestDetailScreen;
