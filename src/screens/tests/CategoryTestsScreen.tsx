import React, { useEffect, useState } from 'react';
import HTMLDescription from '../../components/HTMLDescription';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import type { AppNavigationParamList } from '@navigation/types';
import type { PackageCategorySummary, TestSummary } from '@types/models';
import { useToast } from '@contexts/ToastContext';
import { Icons } from '@components/Icons';

type NavProp = NativeStackNavigationProp<AppNavigationParamList, 'CategoryTests'>;
type RoutePropType = RouteProp<AppNavigationParamList, 'CategoryTests'>;

const CategoryTestsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { addToast } = useToast();

  const { packageId, categoryName, packageName } = route.params;
  const [pkg, setPkg] = useState<PackageCategorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackage();
  }, [packageId]);

  const loadPackage = async () => {
    try {
      setLoading(true);
      const res = await api.packages.getById(packageId);
      if (res.success && res.data) {
        setPkg(res.data as PackageCategorySummary);
      }
    } catch (e: any) {
      addToast(e?.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const category = pkg?.categories.find((c) => c.name === categoryName);
  const tests = category?.tests || [];
  const isPurchased = pkg?.isPurchased || false;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{'←'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>
            {tests.length} test{tests.length !== 1 ? 's' : ''}
            {packageName ? ` in ${packageName}` : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={tests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: test }) => (
          <View style={styles.testCard}>
            <View style={styles.testInfo}>
              <View style={styles.testTitleRow}>
                <Text style={styles.testTitle}>{test.title}</Text>

              </View>
              {test.description ? (
                <HTMLDescription html={test.description} style={styles.testDesc} />
              ) : null}
              <View style={styles.testMeta}>
                {test.durationMinutes ? (
                  <View style={styles.metaItem}>
                    <Icons.Clock size={14} color={colors.gray500} />
                    <Text style={styles.metaText}> {test.durationMinutes} min</Text>
                  </View>
                ) : null}
                {test.totalQuestions ? (
                  <Text style={styles.metaText}>
                    {test.totalQuestions} question{test.totalQuestions !== 1 ? 's' : ''}
                  </Text>
                ) : null}
              </View>
            </View>
                    {(isPurchased || test.isPurchased || test.isDemo) ? (
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
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tests in this category</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  backBtn: { marginRight: 12, padding: 4 },
  backBtnText: { fontSize: 24, color: colors.gray700, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.gray900 },
  headerSubtitle: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  listContent: { padding: 16, gap: 10 },
  testCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.gray200 },
  testInfo: { flex: 1, marginRight: 8 },
  testTitle: { fontSize: 15, fontWeight: '700', color: colors.gray900, marginBottom: 4 },
  testTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  testDesc: { fontSize: 12, color: colors.gray600, lineHeight: 17, marginBottom: 6 },
  testMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: colors.gray500 },
  startBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, backgroundColor: colors.success },
  startBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  lockedBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  lockedBadgeText: { fontSize: 18 },
  viewDetailsBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.gray300 },
  viewDetailsBtnText: { fontSize: 12, fontWeight: '600', color: colors.gray600 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.gray500, fontSize: 15 },
});

export default CategoryTestsScreen;
