import React, { useEffect, useState } from 'react';
import HTMLDescription from '../../components/HTMLDescription';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '@theme/colors';
import { api } from '@api/api';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import type { AppNavigationParamList } from '@navigation/types';
import { Icons, Icon } from '@components/Icons';
import BannerCarousel from '@components/BannerCarousel';
import { resolveImageUrl } from '@config/env';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type PackageSummary = {
  id: string;
  name: string;
  description: string;
  totalTests: number;
  price: number;
  image?: string | null;
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
            image: pkg.image || null,
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

  const openWhatsApp = () => {
    const url = 'https://wa.me/917009595611';
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.wrapper}>
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
              <TouchableOpacity
                onPress={() => navigation.navigate('PackageDetail', { packageId: pkg.id, packageName: pkg.name })}
                activeOpacity={0.9}
              >
                {pkg.image ? (
                  <Image source={{ uri: resolveImageUrl(pkg.image) }} style={styles.cardImage} />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Text style={styles.cardImagePlaceholderIcon}>📦</Text>
                    <Text style={styles.cardImagePlaceholderText}>{pkg.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{pkg.name}</Text>
                  <Text style={styles.cardSubtitle}>{pkg.totalTests} test{pkg.totalTests !== 1 ? 's' : ''}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.cardActions}>
                <Text style={styles.cardPrice}>{pkg.price === 0 ? 'Free' : `₹${pkg.price}`}</Text>
                <View style={styles.cardActionsRight}>
                  <TouchableOpacity
                    style={styles.cardViewBtn}
                    onPress={() => navigation.navigate('PackageDetail', { packageId: pkg.id, packageName: pkg.name })}
                  >
                    <Text style={styles.cardViewBtnText}>View Details</Text>
                  </TouchableOpacity>
                  {pkg.price === 0 ? null : pkg.isPurchased ? (
                    <TouchableOpacity
                      style={styles.cardOpenBtn}
                      onPress={() => navigation.navigate('PackageDetail', { packageId: pkg.id, packageName: pkg.name })}
                    >
                      <Text style={styles.cardOpenBtnText}>Open</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.cardCartBtn}
                      onPress={() => handleAddToCart(pkg)}
                    >
                      <Text style={styles.cardCartBtnText}>Add to Cart</Text>
                    </TouchableOpacity>
                  )}
                </View>
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

      <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp} activeOpacity={0.8}>
        <Icon name="whatsapp" size={28} color="#fff" library="materialCommunity" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
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
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'contain',
    backgroundColor: colors.white,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  cardImagePlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardTitle: {
    ...typography.titleSmall,
    color: '#ffffff',
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.gray900,
  },
  cardActionsRight: {
    flexDirection: 'row',
    gap: 6,
  },
  cardViewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  cardViewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray700,
  },
  cardOpenBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  cardOpenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardCartBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  cardCartBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
  whatsappButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
});

export default HomeScreen;


