import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import type { AppNavigationParamList } from '@navigation/types';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import { Icons } from '@components/Icons';

type NavProp = NativeStackNavigationProp<AppNavigationParamList>;

type PackageTest = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  isPurchased?: boolean;
};

type Package = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isFeatured?: boolean;
  totalTests: number;
  price: number;
  purchasedTests: number;
  isPurchased: boolean;
  tests: PackageTest[];
};

const gradients = [
  ['#2563eb', '#1d4ed8'],
  ['#059669', '#047857'],
  ['#7c3aed', '#6d28d9'],
  ['#dc2626', '#b91c1c'],
  ['#d97706', '#b45309'],
  ['#0891b2', '#0e7490'],
];

const PackagesScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.packages.getAll();
      if (response.success && response.data) {
        setPackages(response.data as Package[]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load packages');
      addToast(e?.message || 'Failed to load packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleAddPackageToCart = (pkg: Package) => {
    setAddingToCartId(pkg.id);
    addToCart({
      id: pkg.id,
      title: pkg.name,
      description: pkg.description || '',
      price: pkg.price || 0,
      durationMinutes: 0,
      totalQuestions: 0,
      kind: 'package',
      totalTests: pkg.totalTests,
    });
    addToast(`${pkg.name} added to cart!`, 'success');
    setTimeout(() => setAddingToCartId(null), 600);
  };

  const renderPackageCard = ({ item: pkg, index }: { item: Package; index: number }) => {
    const gradient = gradients[index % gradients.length];
    const isAdding = addingToCartId === pkg.id;

    return (
      <View style={styles.card}>
        <View style={[styles.cardHeader, { backgroundColor: gradient[0] }]}>
          <View style={styles.cardHeaderOverlay} />
          <View style={styles.cardHeaderContent}>
            <Text style={styles.cardTitle}>{pkg.name}</Text>
            {pkg.description ? (
              <Text style={styles.cardDescription} numberOfLines={2}>
                {pkg.description}
              </Text>
            ) : null}
            <View style={styles.cardTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>📦 {pkg.totalTests} tests</Text>
              </View>
              {pkg.isFeatured ? (
                <View style={[styles.tag, styles.featuredTag]}>
                  <Text style={styles.featuredTagText}>⭐ Featured</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.priceRow}>
            {pkg.price > 0 ? (
              <>
                <Text style={styles.priceValue}>₹{pkg.price}</Text>
                <Text style={styles.priceLabel}>one-time</Text>
              </>
            ) : (
              <Text style={styles.freePrice}>Free</Text>
            )}
          </View>

          <View style={styles.testTags}>
            {pkg.tests.slice(0, 3).map((test) => (
              <View key={test.id} style={styles.testTag}>
                <Text style={styles.testTagText} numberOfLines={1}>
                  {test.title.length > 18 ? test.title.slice(0, 18) + '...' : test.title}
                </Text>
              </View>
            ))}
            {pkg.tests.length > 3 ? (
              <View style={styles.testTagMore}>
                <Text style={styles.testTagMoreText}>+{pkg.tests.length - 3} more</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => setSelectedPackage(pkg)}
            >
              <Text style={styles.viewButtonText}>View Tests</Text>
            </TouchableOpacity>

            {pkg.isPurchased ? (
              <View style={styles.purchasedBadge}>
                <Icons.Check size={16} color={colors.white} />
                <Text style={styles.purchasedBadgeText}> Purchased</Text>
              </View>
            ) : pkg.price > 0 ? (
              <TouchableOpacity
                style={[styles.addToCartButton, isAdding && styles.addToCartButtonDisabled]}
                onPress={() => handleAddPackageToCart(pkg)}
                disabled={isAdding}
              >
                <Text style={styles.addToCartButtonText}>
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.freeButton}
                onPress={() => setSelectedPackage(pkg)}
              >
                <Text style={styles.freeButtonText}>Start Free</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingLabel}>Loading packages...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorLabel}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPackages}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerBadge}>Mock Test Packages</Text>
        <Text style={styles.headerTitle}>Choose Your Package</Text>
        <Text style={styles.headerSubtitle}>
          Curated test packages designed by experts to help you crack competitive examinations.
        </Text>
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderPackageCard}
      />

      <Modal
        visible={!!selectedPackage}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPackage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPackage ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalHeaderLabel}>PACKAGE</Text>
                    <Text style={styles.modalHeaderTitle}>{selectedPackage.name}</Text>
                    <View style={styles.modalHeaderMeta}>
                      <Text style={styles.modalHeaderMetaText}>
                        {selectedPackage.totalTests} test{selectedPackage.totalTests !== 1 ? 's' : ''}
                        {selectedPackage.price > 0 ? ` • ₹${selectedPackage.price}` : ' • Free'}
                      </Text>
                      {selectedPackage.isPurchased ? (
                        <View style={styles.modalPurchasedBadge}>
                          <Text style={styles.modalPurchasedBadgeText}>✓ Purchased</Text>
                        </View>
                      ) : selectedPackage.price > 0 ? (
                        <TouchableOpacity
                          style={styles.modalAddButton}
                          onPress={() => {
                            handleAddPackageToCart(selectedPackage);
                            setSelectedPackage(null);
                          }}
                        >
                          <Text style={styles.modalAddButtonText}>Add Package to Cart</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {selectedPackage.description ? (
                      <Text style={styles.modalHeaderDesc}>{selectedPackage.description}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedPackage(null)}
                  >
                    <Icons.Document size={20} color={colors.gray500} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.testList}>
                  {selectedPackage.tests.map((test, idx) => (
                    <View key={test.id} style={styles.testItem}>
                      <View style={styles.testItemContent}>
                        <View style={styles.testItemIndex}>
                          <Text style={styles.testItemIndexText}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.testItemTitleRow}>
                            <Text style={styles.testItemTitle}>{test.title}</Text>
                            {selectedPackage.isPurchased && (
                              <View style={styles.includedBadge}>
                                <Text style={styles.includedBadgeText}>Included</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.testItemMeta}>
                            {test.durationMinutes ? (
                              <Text style={styles.testItemMetaText}>
                                <Icons.Clock size={12} color={colors.gray500} /> {test.durationMinutes} min
                              </Text>
                            ) : null}
                            {test.totalQuestions ? (
                              <Text style={styles.testItemMetaText}>
                                {' '}<Icons.Questions size={12} color={colors.gray500} /> {test.totalQuestions} Q
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                      <View style={styles.testItemActions}>
                        {(selectedPackage.isPurchased || test.isPurchased) && (
                          <TouchableOpacity
                            style={styles.startTestButton}
                            onPress={async () => {
                              try {
                                const res = await api.attempts.create(test.id);
                                if (res.success && res.data) {
                                  navigation.navigate('TestAttempt', {
                                    testId: test.id,
                                    attemptId: (res.data as any).attemptId,
                                  });
                                }
                              } catch (e: any) {
                                addToast(e?.message || 'Failed to start test', 'error');
                              }
                              setSelectedPackage(null);
                            }}
                          >
                            <Text style={styles.startTestButtonText}>Start</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  loadingLabel: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 14,
  },
  errorLabel: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  retryButtonText: {
    color: '#f87171',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  cardHeader: {
    padding: 20,
    position: 'relative',
  },
  cardHeaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardHeaderContent: {
    position: 'relative',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  featuredTag: {
    backgroundColor: 'rgba(251,191,36,0.2)',
  },
  featuredTagText: {
    color: '#fcd34d',
  },
  cardBody: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  priceLabel: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
  },
  freePrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4ade80',
  },
  testTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  testTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  testTagText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  testTagMore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  testTagMoreText: {
    fontSize: 11,
    color: '#64748b',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  addToCartButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  addToCartButtonDisabled: {
    opacity: 0.6,
  },
  addToCartButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  purchasedBadge: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#059669',
  },
  purchasedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  freeButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#059669',
  },
  freeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60a5fa',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
  },
  modalHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  modalHeaderMetaText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  modalPurchasedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(5,150,105,0.2)',
  },
  modalPurchasedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34d399',
  },
  modalAddButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  modalAddButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  modalHeaderDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 18,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testList: {
    padding: 16,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  testItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  testItemIndex: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(37,99,235,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testItemIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
  },
  testItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    flexShrink: 1,
  },
  includedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(5,150,105,0.15)',
  },
  includedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34d399',
  },
  testItemMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  testItemMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  testItemActions: {
    marginLeft: 8,
  },
  startTestButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  startTestButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
});

export default PackagesScreen;
