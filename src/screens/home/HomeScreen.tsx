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
import { colors, elevation, typography, spacing, borderRadius } from '@theme/colors';
import { api } from '@api/api';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import type { AppNavigationParamList } from '@navigation/types';
import { Icons } from '@components/Icons';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type PackageSummary = {
  id: string;
  name: string;
  description: string;
  totalTests: number;
  price: number;
  isPurchased?: boolean;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.packages.getAll();
        if (res.success && res.data) {
          const mapped: PackageSummary[] = (res.data as any[]).map((pkg) => ({
            id: pkg.id || pkg._id,
            name: pkg.name,
            description: pkg.description || '',
            totalTests: pkg.totalTests || 0,
            price: pkg.price || 0,
            isPurchased: !!pkg.isPurchased,
          }));
          setPackages(mapped);
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
      {/* Hero section */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Mock Tests Platform</Text>
        </View>
        <Text style={styles.heroTitle}>Ace Your Competitive Exams</Text>
        <Text style={styles.heroSubtitle}>
          Practice with curated mock tests designed by experts. Track your
          progress and excel in your preparation.
        </Text>
        <View style={styles.heroButtonsRow}>
          <TouchableOpacity
            style={[styles.heroButton, styles.heroPrimaryButton]}
            onPress={() => navigation.navigate('Tests')}
          >
            <Text style={styles.heroPrimaryText}>Browse Tests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroButton, styles.heroSecondaryButton]}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.heroSecondaryText}>View Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Explore by Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore by Category</Text>
        <Text style={styles.sectionSubtitle}>
          Choose from a wide range of subjects and topics to focus your preparation.
        </Text>
        <View style={styles.categoryGrid}>
          {['Polity', 'History', 'Economy', 'Geography', 'Science', 'Reasoning'].map(
            (name) => (
              <View key={name} style={styles.categoryCard}>
                <Icons.Book size={22} color={colors.primary} />
                <Text style={styles.categoryName}>{name}</Text>
              </View>
            ),
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
                    <Text style={styles.packageTagText}>📦 {pkg.totalTests} tests</Text>
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
                    navigation.navigate('Tests')
                  }
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                {pkg.isPurchased ? (
                  <View style={[styles.cardButton, styles.purchasedButton]}>
                    <View style={styles.purchasedRow}>
                    <Icons.Check size={14} color={colors.white} />
                    <Text style={styles.purchasedText}> Purchased</Text>
                  </View>
                  </View>
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


      {/* Trusted by learners from */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trusted by learners from</Text>
        <Text style={styles.sectionSubtitle}>
          Join thousands of aspirants preparing for competitive exams.
        </Text>
        <View style={styles.partnerRow}>
          {['A', 'B', 'C', 'D', 'E'].map((p) => (
            <View key={p} style={styles.partnerCard}>
              <Text style={styles.partnerLetter}>{p}</Text>
              <Text style={styles.partnerLabel}>Partner {p}</Text>
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
  hero: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing.sm + 2,
  },
  heroBadgeText: {
    ...typography.labelSmall,
    color: colors.onPrimary,
    opacity: 0.9,
  },
  heroTitle: {
    ...typography.headlineMedium,
    color: colors.onPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  heroSubtitle: {
    ...typography.bodyMedium,
    color: colors.onPrimary,
    marginBottom: spacing.lg,
    opacity: 0.9,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  heroPrimaryButton: {
    backgroundColor: colors.onPrimary,
    ...elevation[2],
  },
  heroPrimaryText: {
    ...typography.labelLarge,
    color: colors.primary,
    fontWeight: '600',
  },
  heroSecondaryButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'transparent',
  },
  heroSecondaryText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontWeight: '600',
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
    ...elevation[1],
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
    ...elevation[2],
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
    ...elevation[2],
  },
  addToCartText: {
    ...typography.labelMedium,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  purchasedButton: {
    backgroundColor: colors.success,
    ...elevation[1],
  },
  purchasedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchasedText: {
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
    ...elevation[1],
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
  categoryCard: {
    flexBasis: '31%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 4,
    alignItems: 'center',
    ...elevation[1],
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
    ...elevation[1],
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
    ...elevation[1],
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
    ...elevation[1],
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
    ...elevation[2],
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


