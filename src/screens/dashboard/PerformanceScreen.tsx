import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '@api/api';
import { colors } from '@theme/colors';

type AttemptSummary = {
  attemptId: string;
  testId: string;
  testTitle: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  totalQuestions: number;
};

const PerformanceScreen: React.FC = () => {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        // performance endpoint exists but we mainly reuse attempts list for now
        const res = await api.attempts.getUserAttempts();
        if (res.success && res.data) {
          setAttempts(
            res.data.map((a: any) => ({
              attemptId: a.attemptId,
              testId: a.testId,
              testTitle: a.testTitle,
              startedAt: a.startedAt,
              submittedAt: a.submittedAt,
              score: a.score,
              totalQuestions: a.totalQuestions,
            }))
          );
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load performance');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completed = attempts.filter(a => a.submittedAt && a.score !== null);
  const totalScore = completed.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalPossible = completed.reduce((sum, a) => sum + a.totalQuestions, 0);
  const averageScore = completed.length > 0 && totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
  const bestScore =
    completed.length > 0
      ? Math.max(...completed.map(a => (((a.score || 0) / a.totalQuestions) * 100)))
      : 0;

  const byTest: Record<
    string,
    { title: string; attempts: number; avg: number; best: number }
  > = {};

  completed.forEach(a => {
    if (!byTest[a.testId]) {
      byTest[a.testId] = { title: a.testTitle, attempts: 0, avg: 0, best: 0 };
    }
    const perf = byTest[a.testId];
    const percent = ((a.score || 0) / a.totalQuestions) * 100;
    perf.attempts += 1;
    perf.avg = ((perf.avg * (perf.attempts - 1)) + percent) / perf.attempts;
    perf.best = Math.max(perf.best, percent);
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Performance Analytics</Text>
      <Text style={styles.subheading}>
        Track your progress and identify areas to improve.
      </Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && completed.length === 0 && !error && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📈</Text>
          <Text style={styles.emptyTitle}>No performance data yet</Text>
          <Text style={styles.emptyText}>
            Complete at least one test to see analytics.
          </Text>
        </View>
      )}

      {!loading && completed.length > 0 && (
        <>
          <View style={styles.overallRow}>
            <View style={[styles.statCard, { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }]}>
              <Text style={styles.statLabel}>Overall Average</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {averageScore.toFixed(1)}%
              </Text>
              <Text style={styles.statHint}>{completed.length} completed tests</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.statLabel}>Best Score</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {bestScore.toFixed(1)}%
              </Text>
              <Text style={styles.statHint}>Your top performance</Text>
            </View>
          </View>

          <View style={styles.statCardFull}>
            <Text style={styles.sectionTitle}>Performance by Test</Text>
            {Object.keys(byTest).map(id => {
              const perf = byTest[id];
              return (
                <View key={id} style={styles.testRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testTitle}>{perf.title}</Text>
                    <Text style={styles.testMeta}>{perf.attempts} attempts</Text>
                  </View>
                  <View style={styles.testScores}>
                    <Text style={styles.testLabel}>Avg</Text>
                    <Text style={styles.testValue}>{perf.avg.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.testScores}>
                    <Text style={styles.testLabel}>Best</Text>
                    <Text style={[styles.testValue, { color: colors.success }]}>
                      {perf.best.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
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
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 16,
  },
  center: {
    paddingVertical: 20,
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
  },
  overallRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  statCardFull: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray600,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statHint: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
  },
  testMeta: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 2,
  },
  testScores: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  testLabel: {
    fontSize: 11,
    color: colors.gray500,
  },
  testValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default PerformanceScreen;




