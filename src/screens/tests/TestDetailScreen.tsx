import React, { useEffect, useMemo, useState } from 'react';
import HTMLDescription from '../../components/HTMLDescription';
import {
  ActivityIndicator,
  Image,
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
import { resolveImageUrl } from '@config/env';

type TestDetailRouteProp = RouteProp<AppNavigationParamList, 'TestDetail'>;
type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type Question = { id: string; text: string; options: string[] };

type Highlight = { icon?: string; title: string; description: string };

type PackageSummary = {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string | null;
};

type TestDetail = {
  test: {
    id: string;
    title: string;
    description: string;
    category?: string;
    durationMinutes: number;
    totalQuestions: number;
    positiveMarks: number;
    negativeMarks: number;
    unattemptedMarks: number;
    price: number;
    isPurchased?: boolean;
    isDemo?: boolean;
    highlights: Highlight[];
    instructions: string[];
    packages: PackageSummary[];
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
  const [existingAttempt, setExistingAttempt] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const [testResponse, attemptsResponse] = await Promise.allSettled([
          api.tests.getById(testId),
          api.attempts.getUserAttempts(),
        ]);
        if (!mounted) return;

        if (testResponse.status === 'fulfilled' && testResponse.value.success && testResponse.value.data) {
          const testData = testResponse.value.data as any;
          setData({
            test: {
              id: testData.test.id,
              title: testData.test.title,
              description: testData.test.description || '',
              category: testData.test.category,
              durationMinutes: testData.test.durationMinutes,
              totalQuestions: testData.test.totalQuestions,
              positiveMarks: testData.test.positiveMarks ?? 1,
              negativeMarks: testData.test.negativeMarks ?? 0,
              unattemptedMarks: testData.test.unattemptedMarks ?? 0,
              price: testData.test.price,
              isPurchased: testData.test.isPurchased,
              isDemo: testData.test.isDemo,
              highlights: testData.test.highlights || [],
              instructions: testData.test.instructions || [],
              packages: testData.test.packages || [],
            },
            questions: (testData.questions || []).map((q: any, index: number) => ({
              id: q.id || String(index),
              text: q.text,
              options: q.options,
            })),
          });

          if (attemptsResponse.status === 'fulfilled' && attemptsResponse.value.success && attemptsResponse.value.data) {
            const userAttempts = attemptsResponse.value.data as any[];
            const testAttempts = userAttempts.filter((a: any) => a.testId === testId);
            testAttempts.sort(
              (a: any, b: any) =>
                new Date(b.createdAt || b.startedAt || 0).getTime() -
                new Date(a.createdAt || a.startedAt || 0).getTime()
            );
            if (testAttempts.length > 0) {
              setExistingAttempt(testAttempts[0]);
            }
          }
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

  const attemptStatus: 'submitted' | 'in_progress' | 'none' = (() => {
    if (!existingAttempt) return 'none';
    if (existingAttempt.submittedAt) return 'submitted';
    if (existingAttempt.startedAt) return 'in_progress';
    return 'none';
  })();

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

    if (!data.test.isDemo && !data.test.isPurchased) {
      addToast('Please purchase this test before attempting', 'error');
      return;
    }

    if (attemptStatus === 'submitted') {
      navigation.navigate('TestAttempt', {
        testId: data.test.id,
        attemptId: existingAttempt.id || existingAttempt._id,
      });
      return;
    }

    if (attemptStatus === 'in_progress') {
      navigation.navigate('TestAttempt', {
        testId: data.test.id,
        attemptId: existingAttempt.id || existingAttempt._id,
      });
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
              <HTMLDescription html={test.description} style={styles.description} />
            ) : null}
          </View>
        </View>

        {/* Stats grid: 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{test.totalQuestions}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{test.durationMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              +{test.positiveMarks} / {test.negativeMarks} / {test.unattemptedMarks}
            </Text>
            <Text style={styles.statLabel}>Marking (C/W/U)</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.typePill, test.isDemo ? styles.typeDemo : test.price === 0 ? styles.typePackage : styles.typePaid]}>
              <Text style={[styles.typePillText, test.isDemo ? styles.typeDemoText : test.price === 0 ? styles.typePackageText : styles.typePaidText]}>
                {test.isDemo ? 'Demo' : test.price === 0 ? 'Package' : 'Premium'}
              </Text>
            </View>
            <Text style={styles.statLabel}>Type</Text>
          </View>
        </View>

        {/* Available in Package badge */}
        {test.price === 0 && !test.isDemo ? (
          <View style={styles.packageBadgeRow}>
            <View style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>Available in Package</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Highlights */}
      {test.highlights.length > 0 && (
        <View style={styles.card}>
          {test.highlights.map((h, index) => (
            <View
              key={`${h.title}-${index}`}
              style={[
                styles.highlightItem,
                { backgroundColor: highlightColors[index % highlightColors.length] },
              ]}
            >
              {h.icon ? <Text style={styles.highlightIcon}>{h.icon}</Text> : <Icons.Star size={18} color="#f59e0b" />}
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                <HTMLDescription html={h.description} style={styles.highlightDescription} />
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
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.instructionText}>{inst}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Action card */}
      <View style={styles.card}>
        {test.price === 0 && !test.isDemo && test.packages.length > 0 ? (
          <>
            {test.packages.map((pkg, i) => (
              <View key={pkg.id || i} style={[styles.pkgRow, i > 0 ? { marginTop: 6 } : null]}>
                {pkg.image ? (
                  <Image source={{ uri: resolveImageUrl(pkg.image) }} style={styles.pkgImage} />
                ) : (
                  <View style={styles.pkgImagePlaceholder}>
                    <Text style={styles.pkgImagePlaceholderText}>📦</Text>
                  </View>
                )}
                <View style={styles.pkgInfo}>
                  <Text style={styles.pkgName} numberOfLines={1}>{pkg.name}</Text>
                  <Text style={styles.pkgPrice}>₹{pkg.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.pkgViewButton}
                  onPress={() => navigation.navigate('Tests')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pkgViewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
            {test.isPurchased ? (
              <TouchableOpacity
                style={[styles.startButton, starting ? styles.disabledButton : null]}
                onPress={handleStartAttempt}
                disabled={starting}
                activeOpacity={0.9}
              >
                {starting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.startButtonText}>
                    {attemptStatus === 'submitted' ? 'View Results' : attemptStatus === 'in_progress' ? 'Continue Test' : 'Start Test'}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.purchaseHint}>
                Purchase the package to access this test
              </Text>
            )}
          </>
        ) : test.isDemo ? (
          <>
            <Text style={styles.priceText}>Free Demo</Text>
            <TouchableOpacity
              style={[styles.startButton, starting ? styles.disabledButton : null]}
              onPress={handleStartAttempt}
              disabled={starting}
              activeOpacity={0.9}
            >
              {starting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.startButtonText}>
                  {attemptStatus === 'submitted'
                    ? 'View Results'
                    : attemptStatus === 'in_progress'
                    ? 'Continue Demo Test'
                    : isAuthenticated
                    ? 'Start Demo Test'
                    : 'Login to Start'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.priceText}>₹{test.price}</Text>
            <Text style={styles.priceSubText}>One-time purchase</Text>
            {!test.isPurchased ? (
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
                styles.startButton,
                (!test.isPurchased && !test.isDemo && attemptStatus === 'none') || starting ? styles.disabledButton : null,
              ]}
              onPress={handleStartAttempt}
              disabled={(!test.isPurchased && !test.isDemo && attemptStatus === 'none') || starting}
              activeOpacity={0.9}
            >
              {starting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.startButtonText}>
                  {attemptStatus === 'submitted'
                    ? 'View Results'
                    : attemptStatus === 'in_progress'
                    ? 'Continue Test'
                    : test.isPurchased
                    ? isAuthenticated ? 'Start Test' : 'Login to Start'
                    : 'Purchase Test'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
    padding: 12,
    paddingBottom: 32,
    gap: 10,
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  headerTop: {
    marginBottom: 12,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    marginBottom: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: colors.gray700,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statBox: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  statLabel: {
    fontSize: 10,
    color: colors.gray500,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 2,
  },
  typeDemo: {
    backgroundColor: '#fef3c7',
  },
  typeDemoText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
  },
  typePackage: {
    backgroundColor: '#dcfce7',
  },
  typePackageText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  typePaid: {
    backgroundColor: '#f3e8ff',
  },
  typePaidText: {
    color: '#6b21a8',
    fontSize: 12,
    fontWeight: '700',
  },
  packageBadgeRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  packageBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  packageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 8,
  },
  highlightIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 2,
  },
  highlightDescription: {
    fontSize: 12,
    color: colors.gray700,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  instructionIndex: {
    fontWeight: '700',
    fontSize: 12,
    marginRight: 8,
    marginTop: 1,
    minWidth: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray800,
    lineHeight: 18,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 2,
  },
  priceSubText: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: colors.gray300,
  },
  purchaseHint: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: 8,
  },
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.gray50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 10,
  },
  pkgImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  pkgImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgImagePlaceholderText: {
    fontSize: 20,
  },
  pkgInfo: {
    flex: 1,
  },
  pkgName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
  },
  pkgPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gray900,
    marginTop: 1,
  },
  pkgViewButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  pkgViewButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray800,
  },
  secondaryButton: {
    marginTop: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TestDetailScreen;
