import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import type { AppNavigationParamList } from '@navigation/types';
import { useCart } from '@contexts/CartContext';
import { useToast } from '@contexts/ToastContext';
import { resolveImageUrl } from '@config/env';

type NavProp = NativeStackNavigationProp<AppNavigationParamList>;

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
  isActive: boolean;
  isFeatured?: boolean;
  totalTests: number;
  price: number;
  purchasedTests: number;
  isPurchased: boolean;
  tests: PackageTest[];
};

const PackagesScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.packages.getAll();
      if (response.success && response.data) {
        setPackages((response.data as any[]).map((pkg) => ({
          ...pkg,
          image: pkg.image || null,
        })) as Package[]);
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

  const renderPackageCard = ({ item: pkg }: { item: Package }) => {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Packages</Text>
        <Text style={styles.headerSubtitle}>Curated test packages designed by experts</Text>
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderPackageCard}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    padding: 24,
  },
  loadingLabel: {
    marginTop: 12,
    color: colors.gray600,
    fontSize: 14,
  },
  errorLabel: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  retryButtonText: {
    color: colors.gray700,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gray500,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'contain',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlaceholderIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  cardPlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray500,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
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
});

export default PackagesScreen;
