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

type AttemptSummary = {
  attemptId: string;
  testId: string;
  testTitle: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  totalQuestions: number;
};

const AttemptsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAttempts();
    }
  }, [user]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const response = await api.attempts.getUserAttempts();

      if (response.success && response.data) {
        const formattedAttempts = response.data.map((attempt: any) => ({
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
    } catch (error) {
      console.error('Failed to fetch attempts', error);
    } finally {
      setLoading(false);
    }
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

  const getScoreColor = (score: number | null, total: number) => {
    if (score === null) return colors.gray500;
    const percentage = (score / total) * 100;
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.primary;
    if (percentage >= 40) return colors.warning;
    return colors.danger;
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Test Attempts</Text>
        <Text style={styles.subtitle}>
          View and manage all your test attempts and performance
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : attempts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icons.Document size={48} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No attempts yet</Text>
          <Text style={styles.emptyText}>
            Start taking tests to see your performance here
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Tests')}
          >
            <Text style={styles.emptyButtonText}>Start Your First Test</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardList}>
          {attempts.map((attempt) => {
            const isCompleted =
              attempt.submittedAt !== null && attempt.score !== null;
            const percentage =
              isCompleted && attempt.totalQuestions > 0
                ? ((attempt.score || 0) / attempt.totalQuestions) * 100
                : 0;

            return (
              <TouchableOpacity
                key={attempt.attemptId}
                style={styles.attemptCard}
                onPress={() =>
                  navigation.navigate('TestAttempt', {
                    testId: attempt.testId,
                    attemptId: attempt.attemptId,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.attemptCardTop}>
                  <View style={styles.attemptCardInfo}>
                    <Text style={styles.attemptCardTitle} numberOfLines={2}>
                      {attempt.testTitle}
                    </Text>
                    <Text style={styles.attemptCardMeta}>
                      {attempt.totalQuestions} questions
                    </Text>
                  </View>
                  {isCompleted ? (
                    <View style={styles.scoreBadge}>
                      <Text
                        style={[
                          styles.scoreBadgeText,
                          { color: getScoreColor(attempt.score, attempt.totalQuestions) },
                        ]}
                      >
                        {percentage.toFixed(0)}%
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.inProgressBadge}>
                      <Text style={styles.inProgressBadgeText}>In Progress</Text>
                    </View>
                  )}
                </View>
                <View style={styles.attemptCardBottom}>
                  <Text style={styles.attemptCardDate}>
                    {formatDate(attempt.startedAt)}
                  </Text>
                  <Text style={styles.attemptCardAction}>
                    {isCompleted ? 'Review →' : 'Continue →'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray600,
  },
  centerContent: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.gray500,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  emptyText: {
    fontSize: 13,
    color: colors.gray600,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  cardList: {
    gap: 10,
  },
  attemptCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 14,
  },
  attemptCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  attemptCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  attemptCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
  },
  attemptCardMeta: {
    fontSize: 12,
    color: colors.gray500,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
  },
  scoreBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  inProgressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  inProgressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  attemptCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  attemptCardDate: {
    fontSize: 12,
    color: colors.gray500,
  },
  attemptCardAction: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AttemptsScreen;
