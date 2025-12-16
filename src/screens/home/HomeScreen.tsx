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
import { colors } from '@theme/colors';
import { api } from '@api/api';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import type { AppNavigationParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.tests.getAll();
        if (res.success && res.data) {
          const mapped: TestSummary[] = (res.data as any[]).map((test) => ({
            id: test.id || test._id,
            title: test.title,
            description: test.description || '',
            durationMinutes: test.durationMinutes,
            totalQuestions:
              test.totalQuestions ?? (test.questions ? test.questions.length : 0),
            price: test.price,
            category: test.category
              ? test.category.charAt(0).toUpperCase() +
                test.category.slice(1).replace('-', ' ')
              : undefined,
            isPurchased: !!test.isPurchased,
          }));
          setTests(mapped);
        }
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

  const trending = tests.slice(0, 4);

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
                <Text style={styles.categoryEmoji}>📘</Text>
                <Text style={styles.categoryName}>{name}</Text>
              </View>
            ),
          )}
        </View>
      </View>

      {/* Featured / Trending tests */}
      <View style={styles.trendingHeaderRow}>
        <Text style={styles.trendingTitle}>Trending Tests</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Tests')}>
          <Text style={styles.trendingLink}>View all →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading tests...</Text>
        </View>
      ) : (
        <View style={styles.trendingGrid}>
          {trending.map((test) => (
            <View key={test.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  {test.category ? (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>{test.category}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.cardTitle}>{test.title}</Text>
                </View>
                <View
                  style={[
                    styles.priceBadge,
                    test.price === 0 && styles.priceBadgeFreeContainer,
                  ]}
                >
                  <Text
                    style={[
                      styles.priceBadgeText,
                      test.price === 0 && styles.priceBadgeFreeText,
                    ]}
                  >
                    {test.price === 0 ? 'Free' : `₹${test.price}`}
                  </Text>
                </View>
              </View>
              {test.description ? (
                <Text style={styles.description} numberOfLines={3}>
                  {test.description}
                </Text>
              ) : null}
              <Text style={styles.metaText}>
                📝 {test.totalQuestions} Q • ⏱️ {test.durationMinutes} min
              </Text>

              <View style={styles.cardButtonsRow}>
                <TouchableOpacity
                  style={[styles.cardButton, styles.viewButton]}
                  onPress={() =>
                    navigation.navigate('TestDetail', { testId: test.id })
                  }
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
                {test.isPurchased ? (
                  <View
                    style={[styles.cardButton, styles.purchasedButton]}
                  >
                    <Text style={styles.purchasedText}>✓ Purchased</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.cardButton, styles.addToCartButton]}
                    onPress={() => handleAddToCart(test)}
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
            Browse our test collection, add tests to your cart, and complete checkout.
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
    backgroundColor: colors.gray50,
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 32,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 20,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPrimaryButton: {
    backgroundColor: colors.white,
  },
  heroPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  heroSecondaryButton: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: 'transparent',
  },
  heroSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  trendingHeaderRow: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
  },
  trendingLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingBox: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: colors.gray600,
  },
  trendingGrid: {
    paddingHorizontal: 16,
    marginTop: 4,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.gray100,
  },
  priceBadgeFreeContainer: {
    backgroundColor: '#dcfce7',
  },
  priceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray800,
  },
  priceBadgeFreeText: {
    color: '#15803d',
  },
  description: {
    fontSize: 13,
    color: colors.gray600,
    marginBottom: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.gray500,
  },
  cardButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cardButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    backgroundColor: colors.gray100,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
  },
  addToCartText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  purchasedButton: {
    backgroundColor: colors.success,
  },
  purchasedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  statsRow: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gray900,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray600,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.gray600,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    flexBasis: '31%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray800,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stepCard: {
    flexBasis: '47%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
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
    gap: 10,
    marginTop: 8,
  },
  partnerCard: {
    flexBasis: '30%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  partnerLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  partnerLabel: {
    fontSize: 11,
    color: colors.gray700,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginTop: 8,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 12,
    color: colors.gray600,
  },
  bottomCta: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.gray200,
  },
  bottomCtaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 10,
  },
  bottomCtaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bottomButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPrimary: {
    backgroundColor: colors.primary,
  },
  bottomPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  bottomSecondary: {
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  bottomSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
  },
});

export default HomeScreen;


