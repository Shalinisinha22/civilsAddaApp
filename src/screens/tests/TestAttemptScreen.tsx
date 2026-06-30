import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@theme/colors';
import { api } from '@api/api';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import type { AppNavigationParamList } from '@navigation/types';
import { Icons } from '@components/Icons';

type TestAttemptRouteProp = RouteProp<AppNavigationParamList, 'TestAttempt'>;
type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type Question = {
  id: string;
  text: string;
  options: string[];
  selectedAnswer?: number | null;
};

type TestDetail = {
  test: {
    id: string;
    title: string;
    durationMinutes: number;
  };
  questions: Question[];
};

type QuestionStatus = {
  answered: boolean;
  marked: boolean;
  visited: boolean;
};

const TestAttemptScreen: React.FC = () => {
  const route = useRoute<TestAttemptRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { testId, attemptId } = route.params;
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [detail, setDetail] = useState<TestDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState<{
    score: number;
    totalQuestions: number;
    percentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [testInstructions, setTestInstructions] = useState<string[]>([]);
  const [testStarted, setTestStarted] = useState(false);
  const [starting, setStarting] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Prevent back navigation during test
  useEffect(() => {
    if (!testStarted || submitted) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Test in Progress',
        'You cannot go back during the test. Please submit the test first.',
        [{ text: 'OK' }]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [testStarted, submitted]);

  // Auto-submit handler
  const handleAutoSubmit = useCallback(async () => {
    if (submitted || submitting || !attemptId || !detail) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setSubmitting(true);
    try {
      const response = await api.attempts.submit(attemptId);

      if (response.success && response.data) {
        setSubmitted({
          score: response.data.score,
          totalQuestions: response.data.totalQuestions,
          percentage: response.data.percentage,
        });
        addToast("Time's up! Test auto-submitted.", 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to auto-submit test', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [submitted, submitting, attemptId, detail, addToast]);

  // Auto-submit when time reaches 0
  useEffect(() => {
    if (detail && !submitted && !submitting && timeRemaining === 0 && attemptId && testStarted) {
      handleAutoSubmit();
    }
  }, [timeRemaining, submitted, submitting, detail, attemptId, testStarted, handleAutoSubmit]);

  // Timer countdown
  useEffect(() => {
    if (detail && !submitted && timeRemaining > 0 && testStarted) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [detail, submitted, testStarted]);

  useEffect(() => {
    if (!isAuthenticated) {
      addToast('Please login to continue', 'error');
      navigation.navigate('Login');
      return;
    }

    if (!attemptId) {
      addToast('Attempt ID is required', 'error');
      navigation.navigate('TestDetail', { testId });
      return;
    }

    fetchAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, testId, isAuthenticated]);

  const fetchAttempt = async () => {
    try {
      setLoading(true);
      const response = await api.attempts.getById(attemptId);

      if (response.success && response.data) {
        const attemptData = response.data;

        // Load saved answers
        const savedAnswers: Record<string, number> = {};
        attemptData.questions.forEach((q: any) => {
          if (q.selectedAnswer !== null && q.selectedAnswer !== undefined) {
            savedAnswers[q.id] = q.selectedAnswer;
          }
        });

        setAnswers(savedAnswers);

        // Load marked questions and current question index
        const savedMarkedQuestions = attemptData.attempt.markedQuestions || [];
        setMarkedQuestions(new Set(savedMarkedQuestions));
        setCurrentQuestionIndex(attemptData.attempt.currentQuestionIndex || 0);

        setDetail({
          test: {
            id: attemptData.attempt.testId,
            title: attemptData.attempt.testTitle,
            durationMinutes: attemptData.attempt.durationMinutes || 60,
          },
          questions: attemptData.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            selectedAnswer: q.selectedAnswer,
          })),
        });

        // Check if test has been started
        const hasStarted = !!attemptData.attempt.startedAt;
        setTestStarted(hasStarted);

        // Load test instructions
        if (attemptData.test?.instructions) {
          setTestInstructions(attemptData.test.instructions);
        } else {
          setTestInstructions([
            'Read each question carefully before selecting your answer.',
            'You can navigate between questions using the Previous/Next buttons or the Question Palette.',
            'Mark questions for review if you want to revisit them later.',
            'The timer will start once you click "Start Test". Make sure you have a stable internet connection.',
            'You can change your answers before submitting the test.',
            'Once submitted, you cannot modify your answers.',
            'The test will auto-submit when the time runs out.',
            'Ensure you have answered all questions before submitting.',
          ]);
        }

        // Show instructions if test hasn't started
        if (!hasStarted && !attemptData.attempt.submittedAt) {
          setShowInstructions(true);
        }

        // Calculate remaining time
        if (hasStarted && !attemptData.attempt.submittedAt) {
          const durationSeconds = (attemptData.attempt.durationMinutes || 60) * 60;
          const startedAt = new Date(attemptData.attempt.startedAt);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
          const remaining = Math.max(0, durationSeconds - elapsedSeconds);
          setTimeRemaining(remaining);
          startTimeRef.current = startedAt;
        } else if (!attemptData.attempt.submittedAt) {
          const durationSeconds = (attemptData.attempt.durationMinutes || 60) * 60;
          setTimeRemaining(durationSeconds);
        }

        // If already submitted, show results
        if (attemptData.attempt.submittedAt) {
          setSubmitted({
            score: attemptData.attempt.score || 0,
            totalQuestions: attemptData.attempt.totalQuestions,
            percentage: attemptData.attempt.percentage || 0,
          });
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load attempt', 'error');
      navigation.navigate('TestDetail', { testId });
    } finally {
      setLoading(false);
    }
  };

  const onChange = async (qid: string, idx: number) => {
    const newAnswers = { ...answers, [qid]: idx };
    setAnswers(newAnswers);

    // Auto-save answers to backend
    if (attemptId && !submitted) {
      try {
        await api.attempts.update(attemptId, { answers: newAnswers });
      } catch (err: any) {
        console.error('Failed to save answer', err);
      }
    }
  };

  const toggleMarkQuestion = useCallback(async (qid: string) => {
    setMarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(qid)) {
        newSet.delete(qid);
      } else {
        newSet.add(qid);
      }

      // Save to backend
      if (attemptId && !submitted) {
        const markedArray = Array.from(newSet);
        api.attempts.update(attemptId, { markedQuestions: markedArray }).catch((err: any) => {
          console.error('Failed to save marked questions', err);
        });
      }

      return newSet;
    });
  }, [attemptId, submitted]);

  const navigateToQuestion = async (index: number) => {
    if (index >= 0 && index < (detail?.questions.length || 0)) {
      setCurrentQuestionIndex(index);

      // Save to backend
      if (attemptId && !submitted) {
        try {
          await api.attempts.update(attemptId, { currentQuestionIndex: index });
        } catch (err: any) {
          console.error('Failed to save current question index', err);
        }
      }
    }
  };

  const goToNext = async () => {
    if (detail && currentQuestionIndex < detail.questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);

      if (attemptId && !submitted) {
        try {
          await api.attempts.update(attemptId, { currentQuestionIndex: newIndex });
        } catch (err: any) {
          console.error('Failed to save current question index', err);
        }
      }
    }
  };

  const goToPrevious = async () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);

      if (attemptId && !submitted) {
        try {
          await api.attempts.update(attemptId, { currentQuestionIndex: newIndex });
        } catch (err: any) {
          console.error('Failed to save current question index', err);
        }
      }
    }
  };

  const onSubmit = async () => {
    if (!attemptId || !detail || submitting) return;

    setShowSubmitModal(false);
    setSubmitting(true);
    try {
      const response = await api.attempts.submit(attemptId);

      if (response.success && response.data) {
        setSubmitted({
          score: response.data.score,
          totalQuestions: response.data.totalQuestions,
          percentage: response.data.percentage,
        });
        addToast('Test submitted successfully!', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to submit test', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startTest = async () => {
    if (!attemptId || starting) return;

    try {
      setStarting(true);
      const response = await api.attempts.start(attemptId);

      if (response.success) {
        setShowInstructions(false);
        setTestStarted(true);
        const durationSeconds = (detail?.test.durationMinutes || 60) * 60;
        setTimeRemaining(durationSeconds);
        startTimeRef.current = new Date();
        addToast('Test started! Timer is now running.', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to start test', 'error');
    } finally {
      setStarting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number): QuestionStatus => {
    const question = detail?.questions[index];
    if (!question) return { answered: false, marked: false, visited: false };

    return {
      answered: question.id in answers,
      marked: markedQuestions.has(question.id),
      visited: index === currentQuestionIndex || question.id in answers || markedQuestions.has(question.id),
    };
  };

  const getQuestionStats = () => {
    if (!detail) return { answered: 0, unanswered: 0, marked: 0, notVisited: 0 };

    let answered = 0;
    let unanswered = 0;
    let marked = 0;
    let notVisited = 0;

    detail.questions.forEach((q, idx) => {
      const status = getQuestionStatus(idx);
      if (status.answered) answered++;
      else unanswered++;
      if (status.marked) marked++;
      if (!status.visited) notVisited++;
    });

    return { answered, unanswered, marked, notVisited };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading test...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Test not found</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('TestDetail', { testId })}
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show instructions screen if test hasn't started
  if (showInstructions && !testStarted) {
    return (
      <ScrollView style={styles.instructionsContainer} contentContainerStyle={styles.instructionsContent}>
        <View style={styles.instructionsHeader}>
          <View style={styles.instructionsBadge}>
            <Text style={styles.instructionsBadgeText}>📋 Test Instructions</Text>
          </View>
          <Text style={styles.instructionsTitle}>{detail.test.title}</Text>
          <View style={styles.instructionsMeta}>
            <View style={styles.instructionsMetaItem}>
              <Icons.Clock size={20} color={colors.onSurface} />
              <Text style={styles.instructionsMetaText}>{detail.test.durationMinutes} minutes</Text>
            </View>
            <View style={styles.instructionsMetaItem}>
              <Icons.Question size={20} color={colors.onSurface} />
              <Text style={styles.instructionsMetaText}>{detail.questions.length} questions</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionsCard}>
          <View style={styles.instructionsTitleRow}>
            <Icons.Document size={24} color={colors.onSurface} />
            <Text style={styles.instructionsCardTitle}> Important Instructions</Text>
          </View>

          {testInstructions.map((instruction, idx) => (
            <View key={idx} style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}

          <View style={styles.warningBox}>
            <Icons.Warning size={24} color="#92400e" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Please Note:</Text>
              <Text style={styles.warningText}>• The timer will start as soon as you click "Start Test"</Text>
              <Text style={styles.warningText}>• You cannot pause the test once started</Text>
              <Text style={styles.warningText}>• Make sure you have a stable internet connection</Text>
              <Text style={styles.warningText}>• Do not close the app during the test</Text>
            </View>
          </View>

          <View style={styles.instructionsButtons}>
            <TouchableOpacity
              style={styles.instructionsBackButton}
              onPress={() => navigation.navigate('TestDetail', { testId })}
            >
              <Text style={styles.instructionsBackButtonText}>← Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.instructionsStartButton, starting && styles.instructionsStartButtonDisabled]}
              onPress={startTest}
              disabled={starting}
            >
              {starting ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.white} style={styles.buttonSpinner} />
                  <Text style={styles.instructionsStartButtonText}>Starting...</Text>
                </View>
              ) : (
                <Text style={styles.instructionsStartButtonText}>Start Test →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const currentQuestion = detail.questions[currentQuestionIndex];
  const stats = getQuestionStats();

  return (
    <View style={styles.container}>
      {/* Warning Banner */}
      {testStarted && !submitted && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>
            <View style={styles.warningBannerRow}>
              <Icons.Warning size={14} color={colors.white} />
              <Text style={styles.warningBannerText}>
                {' '}Exam in Progress - Do not close this app. Your progress is being saved automatically.
              </Text>
            </View>
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {detail.test.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            Question {currentQuestionIndex + 1} of {detail.questions.length}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.timer,
              timeRemaining < 300 && styles.timerDanger,
              timeRemaining >= 300 && timeRemaining < 600 && styles.timerWarning,
            ]}
          >
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
          {!submitted && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowSubmitModal(true)}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {submitted ? (
          <View style={styles.resultsContainer}>
            <Icons.Celebration size={64} color={colors.primary} />
            <Text style={styles.resultsTitle}>Test Submitted Successfully!</Text>
            <Text style={styles.resultsSubtitle}>Your results are displayed below</Text>

            <View style={styles.resultsGrid}>
              <View style={styles.resultCard}>
                <Text style={styles.resultCardLabel}>Score</Text>
                <Text style={styles.resultCardValue}>
                  {submitted.score}/{submitted.totalQuestions}
                </Text>
              </View>
              <View style={[styles.resultCard, styles.resultCardGreen]}>
                <Text style={styles.resultCardLabel}>Percentage</Text>
                <Text style={styles.resultCardValue}>{submitted.percentage}%</Text>
              </View>
              <View style={[styles.resultCard, styles.resultCardPurple]}>
                <Text style={styles.resultCardLabel}>Performance</Text>
                <Text style={styles.resultCardValue}>
                  {submitted.percentage >= 80
                    ? 'Excellent'
                    : submitted.percentage >= 60
                    ? 'Good'
                    : submitted.percentage >= 40
                    ? 'Average'
                    : 'Needs Improvement'}
                </Text>
              </View>
            </View>

            <View style={styles.resultsButtons}>
              <TouchableOpacity
                style={styles.resultsButton}
                onPress={() => navigation.navigate('Attempts')}
              >
                <Text style={styles.resultsButtonText}>View All Attempts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resultsButton, styles.resultsButtonSecondary]}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={[styles.resultsButtonText, styles.resultsButtonTextSecondary]}>
                  Back to Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.questionContainer}>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={styles.questionHeaderLeft}>
                <View style={styles.questionNumberBadge}>
                  <Text style={styles.questionNumberText}>Question {currentQuestionIndex + 1}</Text>
                </View>
                {markedQuestions.has(currentQuestion.id) && (
                  <View style={styles.markedBadge}>
                    <View style={styles.markedBadgeRow}>
                      <Icons.Star size={12} color="#92400e" />
                      <Text style={styles.markedBadgeText}> Marked for Review</Text>
                    </View>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.markButton,
                  markedQuestions.has(currentQuestion.id) && styles.markButtonActive,
                ]}
                onPress={() => toggleMarkQuestion(currentQuestion.id)}
              >
                <Text
                  style={[
                    styles.markButtonText,
                    markedQuestions.has(currentQuestion.id) && styles.markButtonTextActive,
                  ]}
                >
                  <View style={styles.markButtonContent}>
                    {markedQuestions.has(currentQuestion.id) && (
                      <Icons.Check size={14} color={colors.white} />
                    )}
                    <Text
                      style={[
                        styles.markButtonText,
                        markedQuestions.has(currentQuestion.id) && styles.markButtonTextActive,
                      ]}
                    >
                      {markedQuestions.has(currentQuestion.id) ? ' Marked' : 'Mark for Review'}
                    </Text>
                  </View>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Question Text */}
            <Text style={styles.questionText}>{currentQuestion.text}</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, optIdx) => (
                <TouchableOpacity
                  key={optIdx}
                  style={[
                    styles.option,
                    answers[currentQuestion.id] === optIdx && styles.optionSelected,
                  ]}
                  onPress={() => onChange(currentQuestion.id, optIdx)}
                >
                  <View
                    style={[
                      styles.optionRadio,
                      answers[currentQuestion.id] === optIdx && styles.optionRadioSelected,
                    ]}
                  >
                    {answers[currentQuestion.id] === optIdx && <View style={styles.optionRadioInner} />}
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonPrev]}
                onPress={goToPrevious}
                disabled={currentQuestionIndex === 0}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    currentQuestionIndex === 0 && styles.navButtonTextDisabled,
                  ]}
                >
                  ← Previous
                </Text>
              </TouchableOpacity>

              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {stats.answered} answered • {stats.unanswered} unanswered • {stats.marked} marked
                </Text>
              </View>

              {currentQuestionIndex < detail.questions.length - 1 ? (
                <TouchableOpacity style={styles.navButton} onPress={goToNext}>
                  <Text style={styles.navButtonText}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonSubmit]}
                  onPress={() => setShowSubmitModal(true)}
                >
                  <Text style={styles.navButtonText}>Review & Submit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Question Palette */}
        {!submitted && (
          <View style={styles.paletteContainer}>
            <Text style={styles.paletteTitle}>Question Palette</Text>

            {/* Statistics */}
            <View style={styles.paletteStats}>
              <View style={styles.paletteStat}>
                <Text style={styles.paletteStatValue}>{stats.answered}</Text>
                <Text style={styles.paletteStatLabel}>Answered</Text>
              </View>
              <View style={[styles.paletteStat, styles.paletteStatRed]}>
                <Text style={[styles.paletteStatValue, styles.paletteStatValueRed]}>
                  {stats.unanswered}
                </Text>
                <Text style={styles.paletteStatLabel}>Unanswered</Text>
              </View>
              <View style={[styles.paletteStat, styles.paletteStatYellow]}>
                <Text style={[styles.paletteStatValue, styles.paletteStatValueYellow]}>
                  {stats.marked}
                </Text>
                <Text style={styles.paletteStatLabel}>Marked</Text>
              </View>
              <View style={[styles.paletteStat, styles.paletteStatGray]}>
                <Text style={[styles.paletteStatValue, styles.paletteStatValueGray]}>
                  {stats.notVisited}
                </Text>
                <Text style={styles.paletteStatLabel}>Not Visited</Text>
              </View>
            </View>

            {/* Question Grid */}
            <View style={styles.paletteGrid}>
              {detail.questions.map((q, idx) => {
                const status = getQuestionStatus(idx);
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = status.answered;
                const isMarked = status.marked;

                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.paletteItem,
                      isCurrent && styles.paletteItemCurrent,
                      isAnswered && isMarked && styles.paletteItemAnsweredMarked,
                      isAnswered && !isMarked && styles.paletteItemAnswered,
                      !isAnswered && isMarked && styles.paletteItemMarked,
                      !isAnswered && !isMarked && styles.paletteItemUnanswered,
                    ]}
                    onPress={() => navigateToQuestion(idx)}
                  >
                    <Text
                      style={[
                        styles.paletteItemText,
                        isCurrent && styles.paletteItemTextCurrent,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Confirmation Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Submission</Text>
            <Text style={styles.modalText}>Are you sure you want to submit the test?</Text>

            <View style={styles.modalWarning}>
              <Text style={styles.modalWarningText}>
                <Text style={styles.modalWarningBold}>Note:</Text> Once submitted, you cannot change
                your answers.
              </Text>
            </View>

            <View style={styles.modalStats}>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>Answered:</Text>
                <Text style={styles.modalStatValue}>{stats.answered}</Text>
              </View>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>Unanswered:</Text>
                <Text style={[styles.modalStatValue, styles.modalStatValueRed]}>
                  {stats.unanswered}
                </Text>
              </View>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>Marked:</Text>
                <Text style={[styles.modalStatValue, styles.modalStatValueYellow]}>
                  {stats.marked}
                </Text>
              </View>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>Not Visited:</Text>
                <Text style={styles.modalStatValue}>{stats.notVisited}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSubmit}
                onPress={onSubmit}
                disabled={submitting}
              >
                <Text style={styles.modalButtonSubmitText}>
                  {submitting ? 'Submitting...' : 'Submit Test'}
      </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.gray600,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray700,
    marginBottom: 16,
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  secondaryButtonText: {
    color: colors.gray800,
    fontSize: 14,
    fontWeight: '600',
  },
  warningBanner: {
    backgroundColor: colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  warningBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBannerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray600,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
  },
  timerWarning: {
    backgroundColor: '#fef3c7',
  },
  timerDanger: {
    backgroundColor: '#fee2e2',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803d',
    fontFamily: 'monospace',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.danger,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  questionContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  questionNumberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
  },
  questionNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  markedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fef3c7',
  },
  markedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  markButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  markButtonActive: {
    backgroundColor: '#fbbf24',
  },
  markButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray700,
  },
  markButtonTextActive: {
    color: colors.white,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#eff6ff',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray400,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: colors.primary,
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray800,
    lineHeight: 22,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  navButtonPrev: {
    backgroundColor: colors.gray100,
  },
  navButtonSubmit: {
    backgroundColor: colors.success,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  navButtonTextDisabled: {
    color: colors.gray400,
  },
  statsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: colors.gray600,
  },
  paletteContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  paletteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 12,
  },
  paletteStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  paletteStat: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
  },
  paletteStatRed: {
    backgroundColor: '#fee2e2',
  },
  paletteStatYellow: {
    backgroundColor: '#fef3c7',
  },
  paletteStatGray: {
    backgroundColor: colors.gray100,
  },
  paletteStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803d',
  },
  paletteStatValueRed: {
    color: colors.danger,
  },
  paletteStatValueYellow: {
    color: '#92400e',
  },
  paletteStatValueGray: {
    color: colors.gray700,
  },
  paletteStatLabel: {
    fontSize: 10,
    color: colors.gray600,
    marginTop: 2,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paletteItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteItemCurrent: {
    backgroundColor: colors.primary,
    borderColor: '#1e40af',
  },
  paletteItemAnswered: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  paletteItemAnsweredMarked: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  paletteItemMarked: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  paletteItemUnanswered: {
    backgroundColor: '#fee2e2',
    borderColor: colors.danger,
  },
  paletteItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
  },
  paletteItemTextCurrent: {
    color: colors.white,
  },
  resultsContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 24,
    textAlign: 'center',
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  resultCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
  },
  resultCardGreen: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  resultCardPurple: {
    backgroundColor: '#f3e8ff',
    borderColor: '#c4b5fd',
  },
  resultCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  resultCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
  },
  resultsButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resultsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  resultsButtonSecondary: {
    backgroundColor: colors.gray200,
  },
  resultsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  resultsButtonTextSecondary: {
    color: colors.gray800,
  },
  instructionsContainer: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  instructionsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  instructionsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    marginBottom: 16,
  },
  instructionsBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionsMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  instructionsMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionsMetaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  instructionsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  instructionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  instructionsCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray900,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray800,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fde68a',
    marginTop: 16,
    marginBottom: 24,
  },
  warningEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 4,
  },
  instructionsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  instructionsBackButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    alignItems: 'center',
  },
  instructionsBackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray700,
  },
  instructionsStartButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsStartButtonDisabled: {
    opacity: 0.6,
  },
  instructionsStartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: colors.gray700,
    marginBottom: 16,
  },
  modalWarning: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 16,
  },
  modalWarningText: {
    fontSize: 13,
    color: '#92400e',
  },
  modalWarningBold: {
    fontWeight: '700',
  },
  modalStats: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.gray50,
    marginBottom: 20,
  },
  modalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalStatLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  modalStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
  },
  modalStatValueRed: {
    color: colors.danger,
  },
  modalStatValueYellow: {
    color: '#92400e',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.gray200,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  modalButtonSubmit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  modalButtonSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});

export default TestAttemptScreen;
