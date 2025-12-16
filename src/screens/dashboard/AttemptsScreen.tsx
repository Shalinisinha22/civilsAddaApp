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
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : attempts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📝</Text>
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
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Test</Text>
            <Text style={styles.tableHeaderText}>Started</Text>
            <Text style={styles.tableHeaderText}>Status</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderTextRight]}>
              Score
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderTextCenter]}>
              Actions
            </Text>
          </View>
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
                style={styles.tableRow}
                onPress={() =>
                  navigation.navigate('TestAttempt', {
                    testId: attempt.testId,
                    attemptId: attempt.attemptId,
                  })
                }
              >
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellTitle}>{attempt.testTitle}</Text>
                  <Text style={styles.tableCellSubtext}>
                    {attempt.totalQuestions} questions
                  </Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableCellText}>
                    {formatDate(attempt.startedAt)}
                  </Text>
                </View>
                <View style={styles.tableCell}>
                  {isCompleted ? (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeSuccess}>Completed</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeWarning}>In Progress</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.tableCell, styles.tableCellRight]}>
                  {isCompleted ? (
                    <View>
                      <Text
                        style={[
                          styles.scoreText,
                          { color: getScoreColor(attempt.score, attempt.totalQuestions) },
                        ]}
                      >
                        {attempt.score}/{attempt.totalQuestions}
                      </Text>
                      <Text style={styles.scorePercentage}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.scoreDash}>-</Text>
                  )}
                </View>
                <View style={[styles.tableCell, styles.tableCellCenter]}>
                  <Text style={styles.actionLink}>
                    {isCompleted ? 'Review' : 'Continue'}
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
  table: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray700,
  },
  tableHeaderTextRight: {
    textAlign: 'right',
  },
  tableHeaderTextCenter: {
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
  },
  tableCellRight: {
    alignItems: 'flex-end',
  },
  tableCellCenter: {
    alignItems: 'center',
  },
  tableCellTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray900,
  },
  tableCellSubtext: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 4,
  },
  tableCellText: {
    fontSize: 12,
    color: colors.gray600,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    fontSize: 11,
    color: colors.success,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
  },
  badgeWarning: {
    fontSize: 11,
    color: colors.warning,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scorePercentage: {
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  scoreDash: {
    fontSize: 14,
    color: colors.gray400,
  },
  actionLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AttemptsScreen;
