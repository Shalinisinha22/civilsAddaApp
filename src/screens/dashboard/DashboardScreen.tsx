import React, { useEffect, useState } from 'react';
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
};

type AttemptSummary = {
  attemptId: string;
  testId: string;
  testTitle: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  totalQuestions: number;
};

type LeaderboardEntry = {
  rank: number;
  userId: string;
  userName: string;
  userEmail: string;
  totalAttempts: number;
  averagePercentage: number;
  bestPercentage: number;
  bestScore: number;
};

type LeaderboardData = {
  topPerformers: LeaderboardEntry[];
  userStats: {
    rank: number | null;
    userName: string;
    totalAttempts: number;
    averagePercentage: number;
    bestPercentage: number;
    bestScore: number;
  };
  totalUsers: number;
};

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [purchased, setPurchased] = useState<TestSummary[]>([]);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setError(null);

      // Fetch purchased tests from backend
      const purchasedResponse = await api.purchases.getPurchasedTests();
      if (purchasedResponse.success && purchasedResponse.data) {
        const formattedPurchased = purchasedResponse.data.map((test: any) => ({
          id: test.id,
          title: test.title,
          description: test.description || '',
          durationMinutes: test.durationMinutes,
          price: test.price,
          totalQuestions: test.totalQuestions,
        }));
        setPurchased(formattedPurchased);
      }

      // Fetch attempts from backend
      const attemptsResponse = await api.attempts.getUserAttempts();
      if (attemptsResponse.success && attemptsResponse.data) {
        const formattedAttempts = attemptsResponse.data.map((attempt: any) => ({
          attemptId: attempt.attemptId,
          testId: attempt.testId,
          testTitle: attempt.testTitle,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
        }));
        setAttempts(formattedAttempts);
      }

      // Fetch all available tests
      const testsResponse = await api.tests.getAll();
      if (testsResponse.success && testsResponse.data) {
        const formattedTests = testsResponse.data.map((test: any) => ({
          id: test.id,
          title: test.title,
          description: test.description || '',
          durationMinutes: test.durationMinutes,
          price: test.price,
          totalQuestions: test.totalQuestions,
        }));
        setTests(formattedTests);
      }

      // Fetch leaderboard
      const leaderboardResponse = await api.attempts.getLeaderboard(10);
      if (leaderboardResponse.success && leaderboardResponse.data) {
        setLeaderboard(leaderboardResponse.data);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    purchasedTests: purchased.length,
    completedAttempts: attempts.filter(
      (a) => a.submittedAt !== null && a.score !== null
    ).length,
    totalAttempts: attempts.length,
    averageScore:
      attempts.length > 0
        ? attempts
            .filter((a) => a.score !== null)
            .reduce((sum, a) => sum + (a.score || 0), 0) /
          attempts.filter((a) => a.score !== null).length
        : 0,
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Overview</Text>
        <Text style={styles.subtitle}>
          Welcome back{user?.name ? `, ${user.name}` : ''}! Here's a summary of
          your progress
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            <Text style={styles.errorLabel}>Error:</Text> {error}
          </Text>
        </View>
      )}

      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Purchased Tests</Text>
                        <Icons.School size={24} color={colors.onSurfaceVariant} />
          </View>
          <Text style={styles.statValue}>{stats.purchasedTests}</Text>
          <Text style={styles.statHint}>Tests available</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Completed Tests</Text>
            <Icons.Check size={20} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{stats.completedAttempts}</Text>
          <Text style={styles.statHint}>Tests finished</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Total Attempts</Text>
            <Icons.Statistics size={20} color={colors.secondary} />
          </View>
          <Text style={styles.statValue}>{stats.totalAttempts}</Text>
          <Text style={styles.statHint}>All attempts</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Average Score</Text>
            <Icons.Target size={20} color={colors.success} />
          </View>
          <Text style={styles.statValue}>
            {stats.averageScore > 0
              ? `${stats.averageScore.toFixed(2)}%`
              : 'N/A'}
          </Text>
          <Text style={styles.statHint}>Overall performance</Text>
        </View>
      </View>

      {/* Quick Access Cards */}
      <View style={styles.quickAccessRow}>
        {/* Recent Purchases */}
        <View style={styles.quickCard}>
          <View style={styles.quickCardHeader}>
            <Text style={styles.quickCardTitle}>Recent Purchases</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MyTests')}
            >
              <Text style={styles.quickCardLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.centerContent}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : purchased.length === 0 ? (
            <View style={styles.centerContent}>
              <Icons.Book size={40} color={colors.gray400} />
              <Text style={styles.emptyText}>No tests purchased yet</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Tests')}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Browse Tests →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {purchased.slice(0, 3).map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={styles.listItem}
                  onPress={() => navigation.navigate('TestDetail', { testId: test.id })}
                >
                  <Text style={styles.listItemTitle}>{test.title}</Text>
                  <Text style={styles.listItemSubtext}>
                    {test.totalQuestions} questions • {test.durationMinutes} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent Attempts */}
        <View style={styles.quickCard}>
          <View style={styles.quickCardHeader}>
            <Text style={styles.quickCardTitle}>Recent Attempts</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Attempts')}
            >
              <Text style={styles.quickCardLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.centerContent}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : attempts.length === 0 ? (
            <View style={styles.centerContent}>
              <Icons.Document size={40} color={colors.gray400} />
              <Text style={styles.emptyText}>No attempts yet</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Tests')}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Start Test →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {attempts.slice(0, 3).map((attempt) => {
                const isCompleted =
                  attempt.submittedAt !== null && attempt.score !== null;
                return (
                  <TouchableOpacity
                    key={attempt.attemptId}
                    style={styles.listItem}
                    onPress={() =>
                      navigation.navigate('TestAttempt', {
                        testId: attempt.testId,
                        attemptId: attempt.attemptId,
                      })
                    }
                  >
                    <View style={styles.attemptRow}>
                      <View style={styles.attemptInfo}>
                        <Text style={styles.listItemTitle}>
                          {attempt.testTitle}
                        </Text>
                        <Text style={styles.listItemSubtext}>
                          {formatDate(attempt.startedAt)}
                        </Text>
                      </View>
                      {isCompleted && (
                        <View style={styles.attemptScore}>
                          <Text style={styles.scoreText}>
                            {Number(attempt.score).toFixed(2)}/{attempt.totalQuestions}
                          </Text>
                        </View>
                      )}
                    </View>
                    {!isCompleted && (
                      <View style={styles.badgeContainer}>
                        <Text style={styles.badgeWarning}>In Progress</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Leaderboard Section */}
      <View style={styles.leaderboardCard}>
        <View style={styles.leaderboardHeader}>
          <View>
            <View style={styles.leaderboardTitleRow}>
              <Icons.Target size={20} color={colors.primary} />
              <Text style={styles.leaderboardTitle}> Leaderboard</Text>
            </View>
            <Text style={styles.leaderboardSubtitle}>
              Compare your performance with other users
            </Text>
          </View>
          {leaderboard && (
            <View style={styles.leaderboardStats}>
              <Text style={styles.leaderboardStatLabel}>Total Participants</Text>
              <Text style={styles.leaderboardStatValue}>
                {leaderboard.totalUsers}
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : leaderboard ? (
          <View style={styles.leaderboardContent}>
            {/* User's Position Card */}
            {leaderboard.userStats.rank !== null ? (
              <View style={styles.userRankCard}>
                <View style={styles.userRankRow}>
                  <View style={styles.userRankLeft}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankNumber}>
                        #{leaderboard.userStats.rank}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userRankTitle}>Your Rank</Text>
                      <Text style={styles.userRankName}>
                        {leaderboard.userStats.userName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userRankRight}>
                    <Text style={styles.userRankLabel}>Best Score</Text>
                    <Text style={styles.userRankScore}>
                      {leaderboard.userStats.bestPercentage}%
                    </Text>
                    <Text style={styles.userRankSubtext}>
                      Avg: {leaderboard.userStats.averagePercentage}% •{' '}
                      {leaderboard.userStats.totalAttempts} attempts
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.userRankCardInactive}>
                <View style={styles.userRankRow}>
                  <Icons.Statistics size={18} color={colors.primary} />
                  <View style={styles.userRankInfo}>
                    <Text style={styles.userRankTitleInactive}>
                      Complete at least one test to appear on the leaderboard
                    </Text>
                    <Text style={styles.userRankSubtextInactive}>
                      Your stats: {leaderboard.userStats.totalAttempts} attempts,
                      Best: {leaderboard.userStats.bestPercentage}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Top Performers */}
            <View style={styles.topPerformers}>
              <Text style={styles.topPerformersTitle}>Top Performers</Text>
              <View style={styles.topPerformersList}>
                {leaderboard.topPerformers.map((entry) => {
                  const isCurrentUser = entry.userId === user?.id;
                  const getMedal = () => {
                    if (entry.rank === 1) return <Icons.MedalGold size={20} color="#FFD700" />;
                    if (entry.rank === 2) return <Icons.MedalSilver size={20} color="#C0C0C0" />;
                    if (entry.rank === 3) return <Icons.MedalBronze size={20} color="#CD7F32" />;
                    return <Text style={styles.leaderboardRankText}>#{entry.rank}</Text>;
                  };

                  return (
                    <View
                      key={entry.userId}
                      style={[
                        styles.leaderboardEntry,
                        isCurrentUser && styles.leaderboardEntryCurrent,
                        entry.rank <= 3 && styles.leaderboardEntryTop,
                      ]}
                    >
                      <View style={styles.leaderboardEntryLeft}>
                        <View
                          style={[
                            styles.leaderboardRankBadge,
                            entry.rank === 1 && styles.rankBadgeGold,
                            entry.rank === 2 && styles.rankBadgeSilver,
                            entry.rank === 3 && styles.rankBadgeBronze,
                          ]}
                        >
                          {getMedal()}
                        </View>
                        <View style={styles.leaderboardEntryInfo}>
                          <View style={styles.leaderboardEntryNameRow}>
                            <Text style={styles.leaderboardEntryName}>
                              {entry.userName}
                            </Text>
                            {isCurrentUser && (
                              <View style={styles.currentUserBadge}>
                                <Text style={styles.currentUserBadgeText}>
                                  You
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.leaderboardEntrySubtext}>
                            {entry.totalAttempts} attempts • Avg:{' '}
                            {entry.averagePercentage}%
                          </Text>
                        </View>
                      </View>
                      <View style={styles.leaderboardEntryRight}>
                        <Text style={styles.leaderboardEntryLabel}>
                          Best Score
                        </Text>
                        <Text
                          style={[
                            styles.leaderboardEntryScore,
                            entry.rank === 1 && styles.scoreGold,
                            entry.rank === 2 && styles.scoreSilver,
                            entry.rank === 3 && styles.scoreBronze,
                          ]}
                        >
                          {entry.bestPercentage}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <Icons.Trophy size={40} color={colors.gray400} />
            <Text style={styles.emptyText}>
              No leaderboard data available yet
            </Text>
            <Text style={styles.emptySubtext}>
              Complete some tests to see rankings
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsCard}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Tests')}
          >
            <Icons.Tests size={20} color={colors.primary} />
            <Text style={styles.quickActionTitle}>Browse Tests</Text>
            <Text style={styles.quickActionHint}>
              Explore all available tests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Performance')}
          >
            <Icons.Statistics size={20} color={colors.secondary} />
            <Text style={styles.quickActionTitle}>View Performance</Text>
            <Text style={styles.quickActionHint}>Check analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icons.Settings size={20} color={colors.gray600} />
            <Text style={styles.quickActionTitle}>Settings</Text>
            <Text style={styles.quickActionHint}>Manage account</Text>
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
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray600,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
  },
  errorLabel: {
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray600,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray900,
  },
  statHint: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  quickAccessRow: {
    gap: 10,
    marginBottom: 16,
  },
  quickCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 14,
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  quickCardLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  centerContent: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: colors.gray500,
    fontSize: 13,
  },
  emptyText: {
    fontSize: 13,
    color: colors.gray600,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.gray500,
  },
  emptyButton: {
    marginTop: 4,
  },
  emptyButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    backgroundColor: colors.gray50,
  },
  listItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
  },
  listItemSubtext: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  attemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptInfo: {
    flex: 1,
  },
  attemptScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  badgeContainer: {
    marginTop: 6,
  },
  badgeWarning: {
    fontSize: 11,
    color: colors.warning,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  leaderboardCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 14,
    marginBottom: 16,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  leaderboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leaderboardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
  },
  leaderboardSubtitle: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 2,
  },
  leaderboardStats: {
    alignItems: 'flex-end',
  },
  leaderboardStatLabel: {
    fontSize: 11,
    color: colors.gray500,
  },
  leaderboardStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  leaderboardContent: {
    gap: 14,
  },
  userRankCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 14,
  },
  userRankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 44,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  userRankTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray900,
  },
  userRankName: {
    fontSize: 11,
    color: colors.gray600,
  },
  userRankRight: {
    alignItems: 'flex-end',
  },
  userRankLabel: {
    fontSize: 11,
    color: colors.gray600,
  },
  userRankScore: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  userRankSubtext: {
    fontSize: 10,
    color: colors.gray500,
    marginTop: 2,
  },
  userRankCardInactive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 14,
  },
  userRankInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userRankTitleInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
  },
  userRankSubtextInactive: {
    fontSize: 11,
    color: colors.gray600,
    marginTop: 2,
  },
  topPerformers: {
    gap: 10,
  },
  topPerformersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 8,
  },
  topPerformersList: {
    gap: 6,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.gray50,
  },
  leaderboardEntryCurrent: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  leaderboardEntryTop: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  leaderboardEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  leaderboardRankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeGold: {
    backgroundColor: '#FCD34D',
  },
  rankBadgeSilver: {
    backgroundColor: colors.gray300,
  },
  rankBadgeBronze: {
    backgroundColor: '#FDBA74',
  },
  leaderboardRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray800,
  },
  leaderboardEntryInfo: {
    flex: 1,
  },
  leaderboardEntryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leaderboardEntryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
  },
  currentUserBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  currentUserBadgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '600',
  },
  leaderboardEntrySubtext: {
    fontSize: 10,
    color: colors.gray500,
    marginTop: 2,
  },
  leaderboardEntryRight: {
    alignItems: 'flex-end',
  },
  leaderboardEntryLabel: {
    fontSize: 11,
    color: colors.gray600,
  },
  leaderboardEntryScore: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  scoreGold: {
    color: '#D97706',
  },
  scoreSilver: {
    color: colors.gray600,
  },
  scoreBronze: {
    color: '#EA580C',
  },
  quickActionsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 14,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 10,
  },
  quickActionsGrid: {
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    backgroundColor: colors.gray50,
    minHeight: 48,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
  },
  quickActionHint: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 1,
  },
});

export default DashboardScreen;
