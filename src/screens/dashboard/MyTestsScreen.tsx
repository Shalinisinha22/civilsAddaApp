import React, { useEffect, useState } from 'react';
import HTMLDescription from '../../components/HTMLDescription';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import { AppNavigationParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type TestSummary = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  price: number;
  isDemo?: boolean;
};

const MyTestsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [purchased, setPurchased] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchPurchasedTests();
    }
  }, [user]);

  const fetchPurchasedTests = async () => {
    try {
      setLoading(true);
      const purchasedRes = await api.purchases.getPurchasedTests();

      if (purchasedRes.success && purchasedRes.data) {
        const formattedTests = purchasedRes.data.map((test: any) => ({
          id: test.id,
          title: test.title,
          description: test.description || '',
          durationMinutes: test.durationMinutes,
          price: test.price,
          totalQuestions: test.totalQuestions,
        }));
        setPurchased(formattedTests);
      }
    } catch (error) {
      console.error('Failed to fetch purchased tests', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Purchased Tests</Text>
        <Text style={styles.subtitle}>
          Manage and access all your purchased mock tests
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : purchased.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icons.Inventory size={48} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No tests available yet</Text>
          <Text style={styles.emptyText}>
            Start exploring our collection of mock tests
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Tests')}
          >
            <Text style={styles.emptyButtonText}>Browse Tests</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.scrollContent}>
          {/* Purchased Tests Section */}
          {purchased.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>My Purchased Tests</Text>
              <View style={styles.grid}>
                {purchased.map((test) => (
                  <View key={test.id} style={styles.testCard}>
                    <View style={styles.testCardHeader}>
                      <Text style={styles.testTitle} numberOfLines={2}>
                        {test.title}
                      </Text>
                      <View style={styles.badgeContainer}>
                        <TouchableOpacity
                          style={styles.openBtn}
                          onPress={() => navigation.navigate('TestDetail', { testId: test.id })}>
                          <Text style={styles.openBtnText}>Open</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <HTMLDescription html={test.description} style={styles.testDescription} />
                    <View style={styles.testMeta}>
                      <View style={styles.testMetaRow}>
                        <Icons.Questions size={14} color={colors.gray600} />
                        <Text style={styles.testMetaText}>
                          {' '}{test.totalQuestions} Questions
                        </Text>
                      </View>
                      <View style={styles.testMetaRow}>
                        <Icons.Clock size={14} color={colors.gray600} />
                        <Text style={styles.testMetaText}>
                          {' '}{test.durationMinutes} min
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.startButton,
                        startingId === test.id && styles.startButtonDisabled,
                      ]}
                      onPress={async () => {
                        if (!isAuthenticated || !user?.id) {
                          addToast('Please login to start a test', 'error');
                          navigation.navigate('Login');
                          return;
                        }
                        try {
                          setStartingId(test.id);
                          const response = await api.attempts.create(test.id);
                          if (response.success && response.data) {
                            navigation.navigate('TestAttempt', {
                              testId: test.id,
                              attemptId: response.data.attemptId,
                            });
                          }
                        } catch (err: any) {
                          addToast(err.message || 'Failed to start test', 'error');
                        } finally {
                          setStartingId(null);
                        }
                      }}
                      disabled={startingId === test.id}
                    >
                      <Text style={styles.startButtonText}>
                        {startingId === test.id ? 'Starting...' : 'Start Test'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
  },
  centerContent: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.gray500,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  testCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    flex: 1,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  openBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  openBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  testDescription: {
    fontSize: 13,
    color: colors.gray600,
    marginBottom: 12,
    lineHeight: 18,
  },
  testMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  testMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testMetaText: {
    fontSize: 12,
    color: colors.gray500,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray800,
    marginBottom: 12,
  },
});

export default MyTestsScreen;
