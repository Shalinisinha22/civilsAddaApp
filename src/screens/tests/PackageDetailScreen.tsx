import React, { useEffect, useState } from 'react';
import HTMLDescription from '../../components/HTMLDescription';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import type { AppNavigationParamList } from '@navigation/types';
import type { PackageCategorySummary, TestSummary } from '@types/models';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import { Icons, CategoryIcon } from '@components/Icons';
import { resolveImageUrl } from '@config/env';

type NavProp = NativeStackNavigationProp<AppNavigationParamList, 'PackageDetail'>;
type RoutePropType = RouteProp<AppNavigationParamList, 'PackageDetail'>;

const categoryColors: Record<string, string> = {
  history: '#e91e63',
  geography: '#4caf50',
  polity: '#3f51b5',
  economy: '#ff9800',
  science: '#9c27b0',
  'current-affairs': '#00bcd4',
  'previous-year-papers': '#795548',
  uncategorized: '#9e9e9e',
};

const PackageDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const { packageId } = route.params;
  const [pkg, setPkg] = useState<PackageCategorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadPackage();
  }, [packageId]);

  const loadPackage = async () => {
    try {
      setLoading(true);
      const res = await api.packages.getById(packageId);
      if (res.success && res.data) {
        const data = res.data as PackageCategorySummary;
        setPkg(data);
        // Auto-expand first category
        if (data.categories && data.categories.length > 0) {
          setExpandedCats(new Set([data.categories[0].id]));
        }
      }
    } catch (e: any) {
      addToast(e?.message || 'Failed to load package', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!pkg) return;
    setAddingToCart(true);
    addToCart({
      id: packageId,
      title: pkg.name,
      description: pkg.description || '',
      price: pkg.price || 0,
      durationMinutes: 0,
      totalQuestions: 0,
      kind: 'package',
      totalTests: pkg.totalTests,
    });
    addToast(`${pkg.name} added to cart!`, 'success');
    setTimeout(() => setAddingToCart(false), 600);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingLabel}>Loading package...</Text>
      </View>
    );
  }

  if (!pkg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorLabel}>Package not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPackage}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pkg.name}</Text>
      </View>

      {pkg.image ? (
        <Image source={{ uri: resolveImageUrl(pkg.image) }} style={styles.packageImage} />
      ) : null}

      <View style={styles.packageInfo}>
        <Text style={styles.packageName}>{pkg.name}</Text>
        {pkg.description ? <HTMLDescription html={pkg.description} style={styles.packageDesc} /> : null}
        <View style={styles.packageMeta}>
          <Text style={styles.packageMetaText}>
            {pkg.totalTests} test{pkg.totalTests !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.packageMetaDot}>•</Text>
          <Text style={styles.packageMetaText}>
            {(pkg.categories || []).length} categor{(pkg.categories || []).length !== 1 ? 'ies' : 'y'}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>₹{pkg.price}</Text>
          {pkg.price > 0 ? <Text style={styles.priceLabel}> one-time</Text> : null}
        </View>

        {!pkg.isPurchased ? (
          <TouchableOpacity
            style={[styles.addToCartBtn, addingToCart && { opacity: 0.6 }]}
            onPress={handleAddToCart}
            disabled={addingToCart}
          >
            <Text style={styles.addToCartBtnText}>
              {addingToCart ? 'Adding...' : pkg.price > 0 ? 'Add to Cart' : 'Get Free'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.purchasedBadge}>
            <Icons.Check size={18} color={colors.white} />
            <Text style={styles.purchasedBadgeText}> Purchased</Text>
          </View>
        )}
      </View>

      <View style={styles.categoriesSection}>
        {(pkg.categories || []).map((cat) => {
          const isExpanded = expandedCats.has(cat.id);
          const catColor = categoryColors[cat.id] || colors.gray500;
          return (
            <View key={cat.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(cat.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.catIconWrap, { backgroundColor: catColor + '18' }]}>
                  <CategoryIcon category={cat.id} size={20} color={catColor} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catCount}>{cat.tests.length} test{cat.tests.length !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.testList}>
                  {cat.tests.map((test) => (
                    <View key={test.id} style={styles.testItem}>
                      <View style={styles.testInfo}>
                        <View style={styles.testTitleRow}>
                          <Text style={styles.testTitle}>{test.title}</Text>

                        </View>
                        <Text style={styles.testMeta}>
                          {test.durationMinutes ? `${test.durationMinutes} min` : ''}
                          {test.totalQuestions ? ` • ${test.totalQuestions} Q` : ''}
                        </Text>
                      </View>
        {pkg.isPurchased || test.isPurchased || test.isDemo ? (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => navigation.navigate('TestDetail', { testId: test.id })}
          >
            <Text style={styles.startBtnText}>Open</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={() => navigation.navigate('TestDetail', { testId: test.id })}
          >
            <Text style={styles.viewDetailsBtnText}>View</Text>
          </TouchableOpacity>
        )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray50, padding: 24 },
  loadingLabel: { marginTop: 8, color: colors.gray600 },
  errorLabel: { color: colors.danger, textAlign: 'center', marginBottom: 12 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.gray200 },
  retryButtonText: { color: colors.gray700, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  backBtn: { marginRight: 12, padding: 4 },
  backBtnText: { fontSize: 24, color: colors.gray700, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.gray900, flex: 1 },
  packageInfo: { padding: 20, backgroundColor: colors.white, marginBottom: 12 },
  packageName: { fontSize: 22, fontWeight: '800', color: colors.gray900, marginBottom: 6 },
  packageDesc: { fontSize: 13, color: colors.gray600, lineHeight: 19, marginBottom: 12 },
  packageMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  packageMetaText: { fontSize: 13, color: colors.gray500 },
  packageMetaDot: { fontSize: 13, color: colors.gray300, marginHorizontal: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  priceValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  priceLabel: { fontSize: 14, color: colors.gray500 },
  addToCartBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addToCartBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  packageImage: { width: '100%', height: 180, resizeMode: 'contain' },
  purchasedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: 12, paddingVertical: 14 },
  purchasedBadgeText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  categoriesSection: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  categoryCard: { backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.gray200 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  catIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catInfo: { flex: 1 },
  catName: { fontSize: 16, fontWeight: '700', color: colors.gray900 },
  catCount: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  expandIcon: { fontSize: 14, color: colors.gray400 },
  testList: { borderTopWidth: 1, borderTopColor: colors.gray100, paddingHorizontal: 14, paddingVertical: 4 },
  testItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  testInfo: { flex: 1, marginRight: 8 },
  testTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  testTitle: { fontSize: 13, fontWeight: '600', color: colors.gray800 },

  testMeta: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  startBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.success },
  startBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
  lockedBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  viewDetailsBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.gray300 },
  viewDetailsBtnText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
});

export default PackageDetailScreen;
