import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import type { AppNavigationParamList } from '@navigation/types';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import { Icons } from '@components/Icons';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList, 'Tests'>;
type TestsRouteProp = RouteProp<AppNavigationParamList, 'Tests'>;

type PackageTest = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  isPurchased?: boolean;
  isDemo?: boolean;
};

type Package = {
  id: string;
  name: string;
  description?: string;
  series?: string;
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
  const route = useRoute<TestsRouteProp>();
  const seriesId = route.params?.seriesId;
  const seriesName = route.params?.seriesName;
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [seriesList, setSeriesList] = useState<{ id: string; name: string }[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | undefined>(seriesId);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pkgRes, seriesRes] = await Promise.allSettled([
        api.packages.getAll(seriesId),
        api.series.getAll(),
      ]);
      if (pkgRes.status === 'fulfilled' && pkgRes.value.success && pkgRes.value.data) {
        setPackages(pkgRes.value.data as Package[]);
      }
      if (seriesRes.status === 'fulfilled' && seriesRes.value.success && seriesRes.value.data) {
        setSeriesList(seriesRes.value.data.map((s: any) => ({ id: s.id, name: s.name })));
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load packages');
      addToast(e?.message || 'Failed to load packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setSelectedSeriesId(seriesId);
      loadPackages();
    }, [seriesId])
  );

  const filteredPackages = useMemo(() => {
    if (!selectedSeriesId) return packages;
    return packages.filter((p) => p.series === selectedSeriesId);
  }, [packages, selectedSeriesId]);

  const stats = useMemo(() => {
    const totalTests = filteredPackages.reduce((c, p) => c + p.totalTests, 0);
    const totalValue = filteredPackages.reduce((c, p) => c + (p.price || 0), 0);
    const owned = filteredPackages.filter((p) => p.isPurchased).length;
    return { count: filteredPackages.length, totalTests, totalValue, owned };
  }, [filteredPackages]);

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
              <View style={styles.tag}><Text style={styles.tagText}>{pkg.totalTests} tests</Text></View>
              {pkg.isFeatured ? (
                <View style={[styles.tag, styles.featuredTag]}><Text style={styles.featuredTagText}>Featured</Text></View>
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
            <TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('PackageDetail', { packageId: pkg.id, packageName: pkg.name })}>
              <Text style={styles.viewButtonText}>View Tests</Text>
            </TouchableOpacity>
            {pkg.isPurchased ? (
              <TouchableOpacity style={styles.openBtn} onPress={() => navigation.navigate('PackageDetail', { packageId: pkg.id, packageName: pkg.name })}>
                <Text style={styles.openBtnText}>Open</Text>
              </TouchableOpacity>
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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>
            {seriesName || 'Packages'}
            <Text style={styles.screenTitleCount}> ({stats.count})</Text>
          </Text>
          {seriesName ? (
            <Text style={styles.screenSubtitle}>Test packages for {seriesName}</Text>
          ) : null}
        </View>
        {seriesName && (
          <TouchableOpacity onPress={() => { setSelectedSeriesId(undefined); navigation.navigate('Tests', {}); }}>
            <Text style={styles.clearFilter}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      {seriesList.length > 0 && (
        <View style={styles.seriesFilterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seriesFilterScroll}>
            <TouchableOpacity
              style={[styles.seriesFilterChip, !selectedSeriesId && styles.seriesFilterChipActive]}
              onPress={() => { setSelectedSeriesId(undefined); navigation.navigate('Tests', {}); }}
            >
              <Text style={[styles.seriesFilterChipText, !selectedSeriesId && styles.seriesFilterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {seriesList.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.seriesFilterChip, selectedSeriesId === s.id && styles.seriesFilterChipActive]}
                onPress={() => { setSelectedSeriesId(s.id); navigation.navigate('Tests', { seriesId: s.id, seriesName: s.name }); }}
              >
                <Text style={[styles.seriesFilterChipText, selectedSeriesId === s.id && styles.seriesFilterChipTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <FlatList
        data={filteredPackages}
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
                        <TouchableOpacity style={styles.openPill} onPress={() => { setSelectedPackage(null); navigation.navigate('PackageDetail', { packageId: selectedPackage.id, packageName: selectedPackage.name }); }}>
                          <Text style={styles.openPillText}>Open</Text>
                        </TouchableOpacity>
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
                    <Icons.Close size={20} color={colors.gray600} />
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
                      {(selectedPackage.isPurchased || test.isPurchased || test.isDemo) && (
                        <TouchableOpacity
                          style={styles.startBtn}
                          onPress={() => {
                            setSelectedPackage(null);
                            navigation.navigate('TestDetail', { testId: test.id });
                          }}
                        >
                          <Text style={styles.startBtnText}>Open</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  screenSubtitle: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  clearFilter: { fontSize: 14, fontWeight: '600', color: colors.primary, paddingTop: 6 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray50, padding: 24 },
  loadingLabel: { marginTop: 8, color: colors.gray600 },
  errorLabel: { color: colors.danger, textAlign: 'center', marginBottom: 12 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.gray200 },
  retryButtonText: { color: colors.gray700, fontWeight: '600' },
  screenTitle: { fontSize: 22, fontWeight: '800', color: colors.gray900, marginBottom: 12 },
  screenTitleCount: { fontSize: 14, fontWeight: '400', color: colors.gray500 },
  seriesFilterRow: { marginBottom: 12 },
  seriesFilterScroll: { gap: 8, paddingVertical: 4 },
  seriesFilterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray300 },
  seriesFilterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  seriesFilterChipText: { fontSize: 13, fontWeight: '600', color: colors.gray700 },
  seriesFilterChipTextActive: { color: colors.white },
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
  openBtn: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success },
  openBtnText: { fontSize: 13, fontWeight: '600', color: colors.white },
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
  openPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#059669' },
  openPillText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
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
