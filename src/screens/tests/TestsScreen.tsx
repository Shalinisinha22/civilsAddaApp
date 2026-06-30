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
import { useTranslation } from 'react-i18next';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import type { AppNavigationParamList } from '@navigation/types';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import { Icons } from '@components/Icons';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList, 'Tests'>;

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

const TestsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
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

  const stats = useMemo(() => {
    const totalTests = packages.reduce((c, p) => c + p.totalTests, 0);
    const totalValue = packages.reduce((c, p) => c + (p.price || 0), 0);
    const owned = packages.filter((p) => p.isPurchased).length;
    return { count: packages.length, totalTests, totalValue, owned };
  }, [packages]);

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

  const renderItem = ({ item: pkg, index }: { item: Package; index: number }) => {
    const gradient = gradients[index % gradients.length];
    const isAdding = addingToCartId === pkg.id;

    return (
      <View style={styles.card}>
        <View style={[styles.cardHeader, { backgroundColor: gradient[0] }]}>
          <View>
            <Text style={styles.cardTitle}>{pkg.name}</Text>
            {pkg.description ? (
              <Text style={styles.cardDescription} numberOfLines={2}>{pkg.description}</Text>
            ) : null}
            <View style={styles.cardTags}>
              <View style={styles.tag}><Text style={styles.tagText}>📦 {pkg.totalTests} tests</Text></View>
              {pkg.isFeatured ? (
                <View style={[styles.tag, styles.featuredTag]}><Text style={styles.featuredTagText}>⭐ Featured</Text></View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.priceRow}>
            {pkg.price > 0 ? (
              <><Text style={styles.priceValue}>₹{pkg.price}</Text><Text style={styles.priceLabel}> one-time</Text></>
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
              <View style={styles.testTagMore}><Text style={styles.testTagMoreText}>+{pkg.tests.length - 3} more</Text></View>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.viewButton} onPress={() => setSelectedPackage(pkg)}>
              <Text style={styles.viewButtonText}>View Tests</Text>
            </TouchableOpacity>
            {pkg.isPurchased ? (
              <View style={styles.purchasedBadge}>
                <Icons.Check size={16} color={colors.white} />
                <Text style={styles.purchasedBadgeText}> Purchased</Text>
              </View>
            ) : pkg.price > 0 ? (
              <TouchableOpacity
                style={[styles.addToCartButton, isAdding && { opacity: 0.6 }]}
                onPress={() => handleAddPackageToCart(pkg)}
                disabled={isAdding}
              >
                <Text style={styles.addToCartButtonText}>{isAdding ? 'Adding...' : 'Add to Cart'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.freeButton} onPress={() => setSelectedPackage(pkg)}>
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
      <Text style={styles.screenTitle}>
        {t('tests') || 'Test Packages'}
        <Text style={styles.screenTitleCount}> ({stats.count})</Text>
      </Text>
      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
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
                        <View style={styles.purchasedPill}><Text style={styles.purchasedPillText}>✓ Purchased</Text></View>
                      ) : selectedPackage.price > 0 ? (
                        <TouchableOpacity
                          style={styles.addPill}
                          onPress={() => { handleAddPackageToCart(selectedPackage); setSelectedPackage(null); }}
                        >
                          <Text style={styles.addPillText}>Add Package to Cart</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {selectedPackage.description ? (
                      <Text style={styles.modalHeaderDesc}>{selectedPackage.description}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedPackage(null)}>
                    <Text style={styles.modalCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.testList}>
                  {selectedPackage.tests.map((test, idx) => (
                    <View key={test.id} style={styles.testItem}>
                      <View style={styles.testItemLeft}>
                        <View style={styles.testIndex}><Text style={styles.testIndexText}>{idx + 1}</Text></View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.testTitleRow}>
                            <Text style={styles.testTitle}>{test.title}</Text>
                            {selectedPackage.isPurchased ? (
                              <View style={styles.includedPill}><Text style={styles.includedPillText}>Included</Text></View>
                            ) : null}
                          </View>
                          <Text style={styles.testMeta}>
                            {test.durationMinutes ? `${test.durationMinutes} min` : ''}
                            {test.totalQuestions ? ` • ${test.totalQuestions} Q` : ''}
                          </Text>
                        </View>
                      </View>
                      {(selectedPackage.isPurchased || test.isPurchased) && (
                        <TouchableOpacity
                          style={styles.startBtn}
                          onPress={async () => {
                            try {
                              const res = await api.attempts.create(test.id);
                              if (res.success && res.data) {
                                navigation.navigate('TestAttempt', { testId: test.id, attemptId: (res.data as any).attemptId });
                              }
                            } catch (e: any) {
                              addToast(e?.message || 'Failed to start test', 'error');
                            }
                            setSelectedPackage(null);
                          }}
                        >
                          <Text style={styles.startBtnText}>Start</Text>
                        </TouchableOpacity>
                      )}
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
  root: { flex: 1, backgroundColor: colors.gray50, paddingHorizontal: 16, paddingTop: 12 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray50, padding: 24 },
  loadingLabel: { marginTop: 8, color: colors.gray600 },
  errorLabel: { color: colors.danger, textAlign: 'center', marginBottom: 12 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.gray200 },
  retryButtonText: { color: colors.gray700, fontWeight: '600' },
  screenTitle: { fontSize: 22, fontWeight: '800', color: colors.gray900, marginBottom: 12 },
  screenTitleCount: { fontSize: 14, fontWeight: '400', color: colors.gray500 },
  listContent: { paddingBottom: 16, gap: 12 },
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, marginBottom: 12 },
  cardHeader: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: 4 },
  cardDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  cardTags: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)' },
  tagText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  featuredTag: { backgroundColor: 'rgba(251,191,36,0.2)' },
  featuredTagText: { color: '#fcd34d' },
  cardBody: { padding: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  priceValue: { fontSize: 24, fontWeight: '800', color: colors.gray900 },
  priceLabel: { fontSize: 12, color: colors.gray500 },
  freePrice: { fontSize: 24, fontWeight: '800', color: colors.success },
  testTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  testTag: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, backgroundColor: colors.gray100 },
  testTagText: { fontSize: 10, color: colors.gray600 },
  testTagMore: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, backgroundColor: colors.gray50 },
  testTagMoreText: { fontSize: 10, color: colors.gray400 },
  actionRow: { flexDirection: 'row', gap: 8 },
  viewButton: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: colors.gray300 },
  viewButtonText: { fontSize: 13, fontWeight: '600', color: colors.gray700 },
  addToCartButton: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', backgroundColor: colors.primary },
  addToCartButtonText: { fontSize: 13, fontWeight: '600', color: colors.white },
  purchasedBadge: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: colors.success },
  purchasedBadgeText: { fontSize: 13, fontWeight: '600', color: colors.white },
  freeButton: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', backgroundColor: colors.success },
  freeButtonText: { fontSize: 13, fontWeight: '600', color: colors.white },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', minHeight: '40%' },
  modalHeader: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  modalHeaderLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1, marginBottom: 4 },
  modalHeaderTitle: { fontSize: 20, fontWeight: '700', color: colors.gray900, marginBottom: 8 },
  modalHeaderMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  modalHeaderMetaText: { fontSize: 13, color: colors.gray600 },
  purchasedPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#dcfce7' },
  purchasedPillText: { fontSize: 12, fontWeight: '600', color: '#15803d' },
  addPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.primary },
  addPillText: { fontSize: 12, fontWeight: '600', color: colors.white },
  modalHeaderDesc: { fontSize: 13, color: colors.gray600, marginTop: 8 },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gray100, justifyContent: 'center', alignItems: 'center' },
  modalCloseBtnText: { fontSize: 14, color: colors.gray500, fontWeight: '600' },
  testList: { padding: 16 },
  testItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.gray100, marginBottom: 8, backgroundColor: colors.gray50 },
  testItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  testIndex: { width: 22, height: 22, borderRadius: 6, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  testIndexText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  testTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  testTitle: { fontSize: 13, fontWeight: '600', color: colors.gray900, flexShrink: 1 },
  includedPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#dcfce7' },
  includedPillText: { fontSize: 10, fontWeight: '600', color: '#15803d' },
  testMeta: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  startBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.success, marginLeft: 8 },
  startBtnText: { fontSize: 12, fontWeight: '600', color: colors.white },
});

export default TestsScreen;
