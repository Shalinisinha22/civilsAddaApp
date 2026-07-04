import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { resolveImageUrl } from '@config/env';

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
  image?: string;
  series?: string;
  isActive: boolean;
  isFeatured?: boolean;
  totalTests: number;
  price: number;
  purchasedTests: number;
  isPurchased: boolean;
  tests: PackageTest[];
};

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
  const [seriesList, setSeriesList] = useState<{ id: string; name: string }[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | undefined>(seriesId);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

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

  const renderItem = ({ item: pkg }: { item: Package }) => {
    const isAdding = addingToCartId === pkg.id;
    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PackageDetail', { packageId: pkg.id, packageName: pkg.name })}
          activeOpacity={0.9}
        >
          {pkg.image ? (
            <Image source={{ uri: resolveImageUrl(pkg.image) }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.cardPlaceholderIcon}>📦</Text>
              <Text style={styles.cardPlaceholderText}>{pkg.name.slice(0, 2).toUpperCase()}</Text>
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
                style={[styles.cardCartBtn, isAdding && { opacity: 0.6 }]}
                onPress={() => handleAddPackageToCart(pkg)}
                disabled={isAdding}
              >
                <Text style={styles.cardCartBtnText}>{isAdding ? 'Adding...' : 'Add to Cart'}</Text>
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
  cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: 160, backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center' },
  cardPlaceholderIcon: { fontSize: 36, marginBottom: 4 },
  cardPlaceholderText: { fontSize: 16, fontWeight: '700', color: colors.gray500 },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.5)' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.gray100 },
  cardPrice: { fontSize: 17, fontWeight: '800', color: colors.gray900 },
  cardActionsRight: { flexDirection: 'row', gap: 6 },
  cardViewBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: colors.gray300 },
  cardViewBtnText: { fontSize: 12, fontWeight: '600', color: colors.gray700 },
  cardOpenBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#059669' },
  cardOpenBtnText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  cardCartBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.primary },
  cardCartBtnText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
});

export default TestsScreen;
