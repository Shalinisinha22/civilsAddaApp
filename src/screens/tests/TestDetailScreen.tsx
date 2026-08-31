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

const formatMarkingValue = (value: number | string | undefined) => {
  const num = Number(value);
  if (!Number.isFinite(num) || Math.abs(num) < 1e-6) return '0';
  const sign = num < 0 ? '-' : '';
  const absValue = Math.abs(num);
  const rounded = Math.round(absValue);
  if (Math.abs(absValue - rounded) < 1e-6) return `${sign}${rounded}`;
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestError = Number.POSITIVE_INFINITY;
  const gcd = (a: number, b: number): number => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const temp = y;
      y = x % y;
      x = temp;
    }
    return x || 1;
  };
  for (let denominator = 1; denominator <= 100; denominator += 1) {
    const numerator = Math.round(absValue * denominator);
    const error = Math.abs(absValue - numerator / denominator);
    if (error < bestError - 1e-6) {
      bestError = error;
      bestNumerator = numerator;
      bestDenominator = denominator;
    }
  }
  const divisor = gcd(bestNumerator, bestDenominator);
  return Math.abs(absValue - (bestNumerator / divisor) / (bestDenominator / divisor)) <= 0.0005
    ? `${sign}${bestNumerator / divisor}/${bestDenominator / divisor}`
    : `${sign}${absValue.toFixed(2).replace(/\.?0+$/, '')}`;
};

const formatTestDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const datePart = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timePart = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} at ${timePart}`;
};

type TestDetailRouteProp = RouteProp<AppNavigationParamList, 'TestDetail'>;
type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type Highlight = { icon?: string; title: string; description: string };
type SubjectInfo = { name: string; questionCount: number };

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
    isSubmitted?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    highlights: Highlight[];
    instructions: string[];
    packages: PackageSummary[];
    subjects: SubjectInfo[];
  };
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
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const testResponse = await api.tests.getById(testId);
        if (!mounted) return;

        if (testResponse.success && testResponse.data) {
          const testData = testResponse.data as any;
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
              isSubmitted: testData.test.isSubmitted,
              startDate: testData.test.startDate || null,
              endDate: testData.test.endDate || null,
              highlights: testData.test.highlights || [],
              instructions: testData.test.instructions || [],
              packages: testData.test.packages || [],
              subjects: testData.test.subjects || [],
            },
          });

          const testIdVal = testData.test.id;
          const isInProgress = testData.test.isInProgress;
          const inProgressAttemptId = testData.test.inProgressAttemptId;
          const isSubmitted = testData.test.isSubmitted;
          const lastSubmittedAttemptId = testData.test.lastSubmittedAttemptId;

          if (isInProgress && inProgressAttemptId) {
            setExistingAttempt({ attemptId: inProgressAttemptId, startedAt: new Date().toISOString(), submittedAt: null, testId: testIdVal });
          } else if (isSubmitted && lastSubmittedAttemptId) {
            setExistingAttempt({ attemptId: lastSubmittedAttemptId, submittedAt: new Date().toISOString(), testId: testIdVal });
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
    if (existingAttempt.submittedAt) {
      if (data?.test.isSubmitted === false) return 'none';
      return 'submitted';
    }
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

    if (existingAttempt && existingAttempt.submittedAt && data?.test.isSubmitted !== false) {
      navigation.navigate('TestAttempt', {
        testId: data.test.id,
        attemptId: existingAttempt.attemptId,
      });
      return;
    }

    if (existingAttempt && existingAttempt.startedAt && !existingAttempt.submittedAt) {
      navigation.navigate('TestAttempt', {
        testId: data.test.id,
        attemptId: existingAttempt.attemptId,
      });
      return;
    }

    if (!data.test.isDemo && !data.test.isPurchased) {
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

  const startTimestamp = test.startDate ? new Date(test.startDate).getTime() : null;
  const isUpcoming = !!startTimestamp && now < startTimestamp;
  const remainingMs = startTimestamp ? Math.max(0, startTimestamp - now) : 0;
  const countdown = isUpcoming
    ? {
        days: Math.floor(remainingMs / 86400000),
        hours: Math.floor((remainingMs % 86400000) / 3600000),
        minutes: Math.floor((remainingMs % 3600000) / 60000),
        seconds: Math.floor((remainingMs % 60000) / 1000),
      }
    : null;

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
              +{formatMarkingValue(test.positiveMarks)} / {formatMarkingValue(test.negativeMarks)} / {formatMarkingValue(test.unattemptedMarks)}
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

        {(test.startDate || test.endDate) && (
          <View style={styles.dateRangeContainer}>
            {countdown && (
              <View style={styles.countdownCard}>
                <Text style={styles.countdownTitle}>Test Starts In</Text>
                <View style={styles.countdownRow}>
                  {[
                    { label: 'Days', value: countdown.days },
                    { label: 'Hours', value: countdown.hours },
                    { label: 'Mins', value: countdown.minutes },
                    { label: 'Secs', value: countdown.seconds },
                  ].map((unit) => (
                    <View key={unit.label} style={styles.countdownBox}>
                      <Text style={styles.countdownValue}>{String(unit.value).padStart(2, '0')}</Text>
                      <Text style={styles.countdownLabel}>{unit.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.countdownStart}>{formatTestDateTime(test.startDate)}</Text>
              </View>
            )}
            {test.startDate && (
              <View style={[styles.dateBadge, isUpcoming && styles.dateBadgeUpcoming]}>
                <Text style={[styles.dateBadgeLabel, isUpcoming && styles.dateBadgeLabelUpcoming]}>Test Starts</Text>
                <Text style={[styles.dateBadgeValue, isUpcoming && styles.dateBadgeValueUpcoming]}>{formatTestDateTime(test.startDate)}</Text>
              </View>
            )}
            {test.endDate && (
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeLabel}>Test Ends</Text>
                <Text style={styles.dateBadgeValue}>{formatTestDateTime(test.endDate)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Available in Package badge */}
        {test.price === 0 && !test.isDemo ? (
          <View style={styles.packageBadgeRow}>
            <View style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>Available in Package</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Subjects */}
      {test.subjects.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subjects in this Test</Text>
          <View style={styles.subjectRow}>
            {test.subjects.map((subject, index) => (
              <View key={`${subject.name}-${index}`} style={styles.subjectChip}>
                <Text style={styles.subjectChipName}>{subject.name}</Text>
                <Text style={styles.subjectChipCount}>{subject.questionCount} Q</Text>
              </View>
            ))}
          </View>
        </View>
      )}

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
      {(() => {
        const now = new Date();
        const isBeforeStart = test.startDate && now < new Date(test.startDate);
        const isAfterEnd = test.endDate && now > new Date(test.endDate);
        const isDateRestricted = isBeforeStart || isAfterEnd;
        return (
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
              <>
              {isDateRestricted ? (
                <View style={[styles.startButton, styles.disabledButton]}>
                  <Text style={styles.startButtonText}>{isBeforeStart ? 'Test Not Started Yet' : 'Test Date Passed'}</Text>
                </View>
              ) : (
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
              )}
              </>
            ) : (
              <Text style={styles.purchaseHint}>
                Purchase the package to access this test
              </Text>
            )}
          </>
        ) : test.isDemo ? (
          <>
            <Text style={styles.priceText}>Free Demo</Text>
            {isDateRestricted ? (
              <View style={[styles.startButton, styles.disabledButton]}>
                <Text style={styles.startButtonText}>{isBeforeStart ? 'Test Not Started Yet' : 'Test Date Passed'}</Text>
              </View>
            ) : (
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
            )}
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
            {isDateRestricted ? (
              <View style={[styles.startButton, styles.disabledButton]}>
                <Text style={styles.startButtonText}>{isBeforeStart ? 'Test Not Started Yet' : 'Test Date Passed'}</Text>
              </View>
            ) : (
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
            )}
          </>
        )}
      </View>
        );
      })()}
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
  dateRangeContainer: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 10,
  },
  countdownCard: {
    alignItems: 'center',
    backgroundColor: colors.primary + '0d',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 14,
  },
  countdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countdownBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 56,
  },
  countdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  countdownStart: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 10,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateBadgeUpcoming: {
    backgroundColor: colors.primary + '14',
    borderColor: colors.primary,
  },
  dateBadgeLabel: {
    fontSize: 10,
    color: colors.gray500,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateBadgeLabelUpcoming: {
    color: colors.primary,
  },
  dateBadgeValue: {
    fontSize: 12,
    color: colors.gray800,
    fontWeight: '600',
  },
  dateBadgeValueUpcoming: {
    color: colors.primary,
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
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subjectChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  subjectChipCount: {
    fontSize: 11,
    color: colors.gray500,
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
    resizeMode: 'contain',
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
