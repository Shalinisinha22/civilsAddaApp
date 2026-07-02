import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '@theme/colors';
import { api } from '@api/api';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import type { AppNavigationParamList } from '@navigation/types';
import { Icons } from '@components/Icons';
import BannerCarousel from '@components/BannerCarousel';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type PackageSummary = {
  id: string;
  name: string;
  description: string;
  totalTests: number;
  price: number;
  isPurchased?: boolean;
};

type Series = {
  id: string;
  name: string;
  description: string;
  packages: { id: string; name: string; price: number; totalTests: number }[];
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [pkgRes, seriesRes] = await Promise.allSettled([
          api.packages.getAll(),
          api.series.getAll(),
        ]);
        if (pkgRes.status === 'fulfilled' && pkgRes.value.success && pkgRes.value.data) {
          const mapped: PackageSummary[] = (pkgRes.value.data as any[]).map((pkg) => ({
            id: pkg.id || pkg._id,
            name: pkg.name,
            description: pkg.description || '',
            totalTests: pkg.totalTests || 0,
            price: pkg.price || 0,
            isPurchased: !!pkg.isPurchased,
          }));
          setPackages(mapped);
        }
        if (seriesRes.status === 'fulfilled' && seriesRes.value.success && seriesRes.value.data) {
          setSeriesList(seriesRes.value.data as Series[]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAddToCart = (pkg: PackageSummary) => {
    addToCart({
      id: pkg.id,
      title: pkg.name,
      description: pkg.description,
      price: pkg.price,
      durationMinutes: 0,
      totalQuestions: 0,
      kind: 'package',
      totalTests: pkg.totalTests,
    });
    addToast(`${pkg.name} added to cart!`, 'success');
  };

  const trending = packages.slice(0, 4);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Banner carousel */}
      <BannerCarousel />

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1000+</Text>
          <Text style={styles.statLabel}>Questions Practiced</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>50+</Text>
          <Text style={styles.statLabel}>Mock Tests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>95%</Text>
          <Text style={styles.statLabel}>Positive Feedback</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>24/7</Text>
          <Text style={styles.statLabel}>Support</Text>
        </View>
      </View>

      {/* Series */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Series</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your exam and access curated test packages designed for your preparation.
        </Text>
        <View style={styles.categoryGrid}>
          {seriesList.length === 0 ? (
            <Text style={styles.emptySeriesText}>Loading exams...</Text>
          ) : (
            seriesList.map((series) => (
              <TouchableOpacity
                key={series.id}
                style={styles.seriesCard}
                onPress={() => navigation.navigate('Tests', { seriesId: series.id, seriesName: series.name })}
                activeOpacity={0.7}
              >
                <View style={styles.seriesIconWrap}>
                  <Icons.Bookmark size={22} color={colors.primary} />
                </View>
                <Text style={styles.categoryName}>{series.name}</Text>
                <Text style={styles.seriesPkgCount}>
                  {series.packages.length} package{series.packages.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Featured / Trending Packages */}
      <View style={styles.trendingHeaderRow}>
        <Text style={styles.trendingTitle}>Trending Packages</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Tests')}>
          <Text style={styles.trendingLink}>View all →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading packages...</Text>
        </View>
      ) : (
        <View style={styles.trendingGrid}>
          {trending.map((pkg) => (
            <View key={pkg.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{pkg.name}</Text>
                  <View style={styles.packageTag}>
                    <Text style={styles.packageTagText}>{pkg.totalTests} tests</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.priceBadge,
                    pkg.price === 0 && styles.priceBadgeFreeContainer,
                  ]}
                >
                  <Text
                    style={[
                      styles.priceBadgeText,
                      pkg.price === 0 && styles.priceBadgeFreeText,
                    ]}
                  >
                    {pkg.price === 0 ? 'Free' : `₹${pkg.price}`}
                  </Text>
                </View>
              </View>
              {pkg.description ? (
                <Text style={styles.description} numberOfLines={3}>
                  {pkg.description}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                <Icons.Document size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.metaText}>
                  {' '}{pkg.totalTests} test{pkg.totalTests !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.cardButtonsRow}>
                <TouchableOpacity
                  style={[styles.cardButton, styles.viewButton]}
                  onPress={() =>
                    navigation.navigate('PackageDetail', { packageId: pkg.id, packageName: pkg.name })
                  }
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                {pkg.isPurchased ? (
                  <TouchableOpacity
                    style={[styles.cardButton, styles.openButton]}
                    onPress={() =>
                      navigation.navigate('PackageDetail', { packageId: pkg.id, packageName: pkg.name })
                    }
                  >
                    <Text style={styles.openButtonText}>Open</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.cardButton, styles.addToCartButton]}
                    onPress={() => handleAddToCart(pkg)}
                  >
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* How it Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it Works</Text>
        <Text style={styles.sectionSubtitle}>
          Get started in four simple steps and begin your journey to success.
        </Text>
        <View style={styles.stepsRow}>
          {[
            { step: '1', title: 'Choose a Test' },
            { step: '2', title: 'Attempt & Submit' },
            { step: '3', title: 'Get Results' },
            { step: '4', title: 'Improve & Track' },
          ].map((s) => (
            <View key={s.step} style={styles.stepCard}>
              <Text style={styles.stepBadge}>{s.step}</Text>
              <Text style={styles.stepTitle}>{s.title}</Text>
            </View>
          ))}
        </View>
      </View>


      {/* FAQs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FAQs</Text>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>Are the tests timed?</Text>
          <Text style={styles.faqAnswer}>
            Yes, each test has a set duration shown on the details page.
          </Text>
        </View>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>Do you provide solutions?</Text>
          <Text style={styles.faqAnswer}>
            Solutions and explanations are provided after submission.
          </Text>
        </View>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How do I purchase tests?</Text>
          <Text style={styles.faqAnswer}>
            Browse our test packages, add a package to your cart, and complete checkout via Razorpay.
          </Text>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <Text style={styles.bottomCtaTitle}>Ready to start your preparation?</Text>
        <View style={styles.bottomCtaRow}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.bottomPrimary]}
            onPress={() => navigation.navigate('Tests')}
          >
            <Text style={styles.bottomPrimaryText}>Browse Tests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomButton, styles.bottomSecondary]}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.bottomSecondaryText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },

  trendingHeaderRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
    fontWeight: '600',
  },
  trendingLink: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingBox: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  trendingGrid: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
    marginBottom: spacing.xs,
  },
  categoryText: {
    ...typography.labelSmall,
    color: colors.onPrimaryContainer,
    fontWeight: '600',
  },
  cardTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    fontWeight: '600',
  },
  packageTag: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  packageTagText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  priceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
  },
  priceBadgeFreeContainer: {
    backgroundColor: colors.successLight + '30',
  },
  priceBadgeText: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  priceBadgeFreeText: {
    color: colors.successDark,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm - 2,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  cardButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cardButton: {
    flex: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  viewButton: {
    backgroundColor: colors.surfaceVariant,
  },
  viewButtonText: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  addToCartText: {
    ...typography.labelMedium,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  openButton: {
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.successDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    ...typography.labelMedium,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  statsRow: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 4,
    paddingHorizontal: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  statNumber: {
    ...typography.titleLarge,
    color: colors.onSurface,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md - 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  seriesCard: {
    flexBasis: '47%',
    backgroundColor: colors.primary + '12',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  seriesIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  seriesPkgCount: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  emptySeriesText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    paddingVertical: spacing.md,
  },
  categoryCard: {
    flexBasis: '31%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryName: {
    ...typography.labelMedium,
    color: colors.onSurface,
    fontWeight: '600',
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  stepCard: {
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md - 4,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  stepBadge: {
    ...typography.labelMedium,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  stepTitle: {
    ...typography.titleSmall,
    fontWeight: '600',
    color: colors.onSurface,
  },
  appButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  appButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  partnerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  partnerCard: {
    flexBasis: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  partnerLetter: {
    ...typography.titleMedium,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  partnerLabel: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md - 4,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  faqQuestion: {
    ...typography.titleSmall,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  bottomCta: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  bottomCtaTitle: {
    ...typography.titleSmall,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.sm + 2,
  },
  bottomCtaRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  bottomButton: {
    flex: 1,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  bottomPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  bottomPrimaryText: {
    ...typography.labelLarge,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  bottomSecondary: {
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  bottomSecondaryText: {
    ...typography.labelLarge,
    fontWeight: '600',
    color: colors.onSurface,
  },
});

export default HomeScreen;


