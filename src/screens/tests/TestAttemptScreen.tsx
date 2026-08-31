import React, { useEffect, useState, useCallback, useRef } from 'react';
import HTMLDescription from '../../components/HTMLDescription';
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
  Image,
  useWindowDimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@theme/colors';
import { resolveImageUrl } from '@config/env';
import { api } from '@api/api';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import type { AppNavigationParamList } from '@navigation/types';
import { Icons } from '@components/Icons';

type TestAttemptRouteProp = RouteProp<AppNavigationParamList, 'TestAttempt'>;
type NavigationProp = NativeStackNavigationProp<AppNavigationParamList>;

type Question = {
  id: string;
  text: string;
  textHindi?: string | null;
  options: string[];
  optionsHindi?: string[] | null;
  selectedAnswer?: number | null;
  correctAnswer?: number;
  description?: string | null;
  descriptionHindi?: string | null;
  diagram?: string | null;
  fontSize?: number;
  isBold?: boolean;
};

type TestDetail = {
  test: {
    id: string;
    title: string;
    durationMinutes: number;
  };
  questions: Question[];
  subjects?: SubjectScore[];
};

type SubjectScore = {
  name: string;
  questionIds?: string[];
  totalQuestions: number;
  totalMarks: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  unattemptedAnswers?: number;
  notAttemptedAnswers?: number;
  score?: number;
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
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  const [detail, setDetail] = useState<TestDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState<{
    score: number;
    totalQuestions: number;
    totalMarks?: number;
    percentage: number;
    correctAnswers?: number;
    incorrectAnswers?: number;
    unattemptedAnswers?: number;
    notAttemptedAnswers?: number;
    rank?: number;
    totalParticipants?: number;
    subjectScores?: SubjectScore[];
  } | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');
  const [activeSubject, setActiveSubject] = useState<string>('__all__');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all');
  const [loading, setLoading] = useState(true);
  const [visibleReviewCount, setVisibleReviewCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [testInstructions, setTestInstructions] = useState<string[]>([]);
  const [testStarted, setTestStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resuming, setResuming] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const durationSecondsRef = useRef<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState ?? 'active');
  const testStartedRef = useRef(false);
  const submittedRef = useRef<any>(null);
  const submittingRef = useRef(false);
  const timerInitializedRef = useRef(false);
  const attemptIdRef = useRef(attemptId);
  const pausedRef = useRef(false);
  const manualPausedRef = useRef(false);

  const isBackgroundState = (state?: AppStateStatus | null) =>
    state === 'inactive' || state === 'background';

  // Keep refs in sync with state
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { testStartedRef.current = testStarted; }, [testStarted]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);
  useEffect(() => { manualPausedRef.current = paused; }, [paused]);

  // Scroll to top of the question when navigating to another question
  useEffect(() => {
    if (!submitted && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [currentQuestionIndex, submitted]);

  // Prevent back navigation during test
  useEffect(() => {
    if (!testStarted || submitted) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        t('testInProgress'),
        t('cannotGoBackWarning'),
        [{ text: 'OK' }]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [testStarted, submitted, t]);

  // Load the submitted attempt's result from the server (score + answers for review)
  const loadSubmittedResult = useCallback(async (attemptIdToLoad: string) => {
    try {
      const refreshed = await api.attempts.getById(attemptIdToLoad);
      if (refreshed.success && refreshed.data) {
        const refreshedData = refreshed.data;
        const attempt = refreshedData.attempt;
        setDetail({
          test: {
            id: attempt.testId,
            title: attempt.testTitle,
            durationMinutes: attempt.durationMinutes || 60,
          },
          questions: refreshedData.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            textHindi: q.textHindi || null,
            options: q.options,
            optionsHindi: q.optionsHindi && q.optionsHindi.length > 0 ? q.optionsHindi : null,
            selectedAnswer: q.selectedAnswer,
            correctAnswer: q.correctAnswer,
            description: q.description || null,
            descriptionHindi: q.descriptionHindi || null,
            diagram: q.diagram || null,
            fontSize: q.fontSize || 18,
            isBold: q.isBold || false,
          })),
          subjects: refreshedData.subjects || undefined,
        });
        setSubmitted({
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          totalMarks: attempt.totalMarks,
          percentage: attempt.percentage,
          correctAnswers: attempt.correctAnswers,
          incorrectAnswers: attempt.incorrectAnswers,
          unattemptedAnswers: attempt.unattemptedAnswers,
          notAttemptedAnswers: attempt.notAttemptedAnswers,
          rank: attempt.rank,
          totalParticipants: attempt.totalParticipants,
          subjectScores: attempt.subjectScores || [],
        });
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load test result', 'error');
    }
  }, [addToast]);

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
        // Re-fetch attempt to get correct answers for review
        await loadSubmittedResult(attemptId);
        addToast(t('timeUpAutoSubmitted'), 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to auto-submit test', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [submitted, submitting, attemptId, detail, loadSubmittedResult, addToast, t]);

  // Pause timer when app is minimized/backgrounded, resume when foregrounded
  useEffect(() => {
    if (!testStarted) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // Skip if test is not active
      if (!testStartedRef.current || submittedRef.current || submittingRef.current || manualPausedRef.current) {
        return;
      }

      // User LEFT the app (active -> background): pause the timer
      if (previousState === 'active' && isBackgroundState(nextAppState)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Tell the server to stop the test clock while the app is minimized
        if (!pausedRef.current && attemptIdRef.current) {
          pausedRef.current = true;
          api.attempts.pause(attemptIdRef.current)
            .then(() => {
              // A late pause response can land after resume (network ordering),
              // leaving the clock frozen server-side. If we're already back in
              // the foreground, undo it and re-sync the remaining time.
              if (!isBackgroundState(appStateRef.current)) {
                api.attempts.resume(attemptIdRef.current)
                  .then((res) => {
                    if (
                      res.success &&
                      res.data &&
                      !res.data.submitted &&
                      typeof res.data.remainingSeconds === 'number'
                    ) {
                      setTimeRemaining(res.data.remainingSeconds);
                    }
                  })
                  .catch(() => {});
              }
            })
            .catch(() => {});
        }
      }

      // User RETURNED to the app (background/inactive -> active): resume the timer
      if (isBackgroundState(previousState) && nextAppState === 'active') {
        if (!submittedRef.current && !submittingRef.current && testStartedRef.current) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          (async () => {
            try {
              const res = await api.attempts.resume(attemptIdRef.current);
              if (res.success && res.data) {
                if (res.data.submitted) {
                  // Server already submitted (remaining time had run out)
                  submittedRef.current = true;
                  await loadSubmittedResult(attemptIdRef.current);
                  return;
                }
                if (typeof res.data.remainingSeconds === 'number') {
                  setTimeRemaining(res.data.remainingSeconds);
                }
              }
            } catch {
              // Resume failed (offline) — continue from last known value
            } finally {
              pausedRef.current = false;
              if (!submittedRef.current && !submittingRef.current && testStartedRef.current) {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                intervalRef.current = setInterval(() => {
                  setTimeRemaining((prev) => {
                    if (prev <= 1) {
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                      }
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
              }
            }
          })();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  // Only depend on testStarted + stable callbacks — refs handle everything else
  }, [testStarted, loadSubmittedResult]);

  // Auto-submit when time reaches 0
  useEffect(() => {
    if (
      detail &&
      timerInitializedRef.current &&
      !submitted &&
      !submitting &&
      timeRemaining === 0 &&
      attemptId &&
      testStarted
    ) {
      handleAutoSubmit();
    }
  }, [timeRemaining, submitted, submitting, detail, attemptId, testStarted, handleAutoSubmit]);

  // Timer countdown — pauses when app goes to background or test is manually paused, resumes otherwise
  useEffect(() => {
    if (detail && !submitted && testStarted && !paused && !isBackgroundState(appStateRef.current)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
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
  }, [detail, submitted, testStarted, paused]);

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
      timerInitializedRef.current = false;
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
            textHindi: q.textHindi || null,
            options: q.options,
            optionsHindi: q.optionsHindi && q.optionsHindi.length > 0 ? q.optionsHindi : null,
            selectedAnswer: q.selectedAnswer,
            correctAnswer: q.correctAnswer,
            description: q.description || null,
            descriptionHindi: q.descriptionHindi || null,
            diagram: q.diagram || null,
            fontSize: q.fontSize || 18,
            isBold: q.isBold || false,
          })),
          subjects: attemptData.subjects || undefined,
        });

        // Check if test has been started
        const hasStarted = !!attemptData.attempt.startedAt;
        setTestStarted(hasStarted);

        // Load test instructions from API (dynamic, not static)
        if (attemptData.test?.instructions?.length) {
          setTestInstructions(attemptData.test.instructions);
        }

        // Show instructions if test hasn't started
        if (!hasStarted && !attemptData.attempt.submittedAt) {
          setShowInstructions(true);
        }

        // Calculate remaining time (prefer server-synced value; fall back to local calc)
        if (hasStarted && !attemptData.attempt.submittedAt) {
          const durationSeconds = (attemptData.attempt.durationMinutes || 60) * 60;
          let remaining;
          if (typeof attemptData.attempt.remainingSeconds === 'number') {
            remaining = attemptData.attempt.remainingSeconds;
          } else {
            const startedAt = new Date(attemptData.attempt.startedAt);
            const now = new Date();
            const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
            remaining = Math.max(0, durationSeconds - elapsedSeconds);
          }
          setTimeRemaining(remaining);
          startTimeRef.current = new Date(attemptData.attempt.startedAt);
          durationSecondsRef.current = durationSeconds;
          timerInitializedRef.current = true;
        } else if (!attemptData.attempt.submittedAt) {
          const durationSeconds = (attemptData.attempt.durationMinutes || 60) * 60;
          setTimeRemaining(durationSeconds);
          timerInitializedRef.current = true;
        }

        // If already submitted, show results
        if (attemptData.attempt.submittedAt) {
          setSubmitted({
            score: attemptData.attempt.score || 0,
            totalQuestions: attemptData.attempt.totalQuestions,
            totalMarks: attemptData.attempt.totalMarks,
            percentage: attemptData.attempt.percentage || 0,
            correctAnswers: attemptData.attempt.correctAnswers,
            incorrectAnswers: attemptData.attempt.incorrectAnswers,
            unattemptedAnswers: attemptData.attempt.unattemptedAnswers,
            notAttemptedAnswers: attemptData.attempt.notAttemptedAnswers,
            rank: attemptData.attempt.rank,
            totalParticipants: attemptData.attempt.totalParticipants,
            subjectScores: attemptData.subjects || undefined,
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
    if (index >= 0 && index < (visibleQuestions?.length || 0)) {
      setCurrentQuestionIndex(index);

      // Save to backend
      if (attemptId && !submitted) {
        try {
          await api.attempts.update(attemptId, { currentQuestionIndex: globalIndexFor(index) });
        } catch (err: any) {
          console.error('Failed to save current question index', err);
        }
      }
    }
  };

  const goToNext = async () => {
    if (detail && currentQuestionIndex < visibleQuestions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);

      if (attemptId && !submitted) {
        try {
          await api.attempts.update(attemptId, { currentQuestionIndex: globalIndexFor(newIndex) });
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
          await api.attempts.update(attemptId, { currentQuestionIndex: globalIndexFor(newIndex) });
        } catch (err: any) {
          console.error('Failed to save current question index', err);
        }
      }
    }
  };

  const saveAnswer = async () => {
    if (!attemptId || !detail || submitted || submitting) return;
    try {
      await api.attempts.update(attemptId, {
        answers,
        currentQuestionIndex: globalIndexFor(currentQuestionIndex),
      });
      addToast(t('answerSaved'), 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save answer', 'error');
    }
  };

  const clearAnswer = async () => {
    if (!currentQuestion || !attemptId || submitted) return;
    if (!(currentQuestion.id in answers)) {
      addToast(t('noAnswerToClear'), 'info');
      return;
    }
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
    try {
      await api.attempts.update(attemptId, { answers: newAnswers });
      addToast(t('answerCleared'), 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to clear answer', 'error');
    }
  };

  const onSubmit = async () => {
    if (!attemptId || !detail || submitting || submitted) return;

    setShowSubmitModal(false);
    setSubmitting(true);
    try {
      const response = await api.attempts.submit(attemptId);

      if (response.success && response.data) {
        // Re-fetch attempt to get correct answers for review
        await loadSubmittedResult(attemptId);
        addToast(t('testSubmittedSuccess'), 'success');
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
        durationSecondsRef.current = durationSeconds;
        timerInitializedRef.current = true;
        addToast(t('testStartedTimer'), 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to start test', 'error');
    } finally {
      setStarting(false);
    }
  };

  const pauseTest = async () => {
    if (!attemptId || !testStarted || submitted || paused || resuming) return;

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const response = await api.attempts.pause(attemptId);
      if (response.success && response.data?.submitted) {
        await loadSubmittedResult(attemptId);
        return;
      }
      setPaused(true);
      addToast(t('testPaused'), 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to pause test', 'error');
    }
  };

  const resumeTest = async () => {
    if (!attemptId || !testStarted || submitted || resuming) return;

    try {
      setResuming(true);
      const response = await api.attempts.resume(attemptId);

      if (response.success && response.data) {
        if (response.data.submitted) {
          await loadSubmittedResult(attemptId);
          return;
        }
        if (typeof response.data.remainingSeconds === 'number') {
          setTimeRemaining(response.data.remainingSeconds);
        }
      }
      setPaused(false);
      addToast(t('testResumed'), 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to resume test', 'error');
    } finally {
      setResuming(false);
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

  const getQuestionStatus = (question: Question): QuestionStatus => {
    return {
      answered: question.id in answers,
      marked: markedQuestions.has(question.id),
      visited: question.id === currentQuestion?.id || question.id in answers || markedQuestions.has(question.id),
    };
  };

  const getReviewStatus = (question: Question): 'correct' | 'wrong' | 'skipped' => {
    const userAnswer = question.selectedAnswer;
    const correctAnswer = question.correctAnswer;
    const notAttemptedTexts = ['Not Attempted', 'प्रयास नहीं किया गया'];
    const isNotAttempted =
      userAnswer === -1 ||
      (userAnswer !== null &&
        userAnswer !== undefined &&
        (notAttemptedTexts.includes(question.options[userAnswer]) ||
          (question.optionsHindi ? notAttemptedTexts.includes(question.optionsHindi[userAnswer]) : false)));
    if (isNotAttempted || userAnswer === null || userAnswer === undefined) {
      return 'skipped';
    }
    if (userAnswer === correctAnswer) {
      return 'correct';
    }
    return 'wrong';
  };

  const getQuestionStats = () => {
    if (!detail) return { answered: 0, unanswered: 0, marked: 0, notVisited: 0 };

    let answered = 0;
    let unanswered = 0;
    let marked = 0;
    let notVisited = 0;

    detail.questions.forEach((q) => {
      const status = getQuestionStatus(q);
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
        <Text style={styles.loadingText}>{t('loadingTest')}</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{t('testNotFound')}</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('TestDetail', { testId })}
        >
          <Text style={styles.secondaryButtonText}>{t('goBackBtn')}</Text>
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
            <Icons.Assignment size={18} color="#1d4ed8" />
            <Text style={styles.instructionsBadgeText}> {t('testInstructions')}</Text>
          </View>
          <Text style={styles.instructionsTitle}>{detail.test.title}</Text>
          <View style={styles.instructionsMeta}>
            <View style={styles.instructionsMetaItem}>
              <Icons.Clock size={20} color={colors.onSurface} />
              <Text style={styles.instructionsMetaText}>{t('minutesDuration', { count: detail.test.durationMinutes })}</Text>
            </View>
            <View style={styles.instructionsMetaItem}>
              <Icons.Question size={20} color={colors.onSurface} />
              <Text style={styles.instructionsMetaText}>{t('questionsCount', { count: detail.questions.length })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionsCard}>
          <View style={styles.instructionsTitleRow}>
            <Icons.Document size={24} color={colors.onSurface} />
            <Text style={styles.instructionsCardTitle}> {t('importantInstructions')}</Text>
          </View>

          {testInstructions.map((instruction, idx) => (
            <View key={idx} style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}

          {detail.questions.some(q => q.textHindi || (q.optionsHindi?.length)) && (
            <View style={styles.languageSelector}>
              <Icons.Language size={20} color={colors.primary} />
              <Text style={styles.languageLabel}>{t('selectLanguage')}</Text>
              <View style={styles.languageOptions}>
                <TouchableOpacity
                  style={[styles.languageOption, selectedLanguage === 'en' && styles.languageOptionActive]}
                  onPress={() => setSelectedLanguage('en')}
                >
                  <Text style={[styles.languageOptionText, selectedLanguage === 'en' && styles.languageOptionTextActive]}>{t('english')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, selectedLanguage === 'hi' && styles.languageOptionActive]}
                  onPress={() => setSelectedLanguage('hi')}
                >
                  <Text style={[styles.languageOptionText, selectedLanguage === 'hi' && styles.languageOptionTextActive]}>{t('hindi')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.warningBox}>
            <Icons.Warning size={24} color="#92400e" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>{t('pleaseNote')}</Text>
              <Text style={styles.warningText}>{t('timerStartWarning')}</Text>
              <Text style={styles.warningText}>{t('noPauseWarning')}</Text>
              <Text style={styles.warningText}>{t('stableInternetWarning')}</Text>
              <Text style={styles.warningText}>{t('noCloseWarning')}</Text>
            </View>
          </View>

          <View style={styles.instructionsButtons}>
            <TouchableOpacity
              style={styles.instructionsBackButton}
              onPress={() => navigation.navigate('TestDetail', { testId })}
            >
              <Text style={styles.instructionsBackButtonText}>{t('goBack')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.instructionsStartButton, starting && styles.instructionsStartButtonDisabled]}
              onPress={startTest}
              disabled={starting}
            >
              {starting ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.white} style={styles.buttonSpinner} />
                  <Text style={styles.instructionsStartButtonText}>{t('starting')}</Text>
                </View>
              ) : (
                <Text style={styles.instructionsStartButtonText}>{t('startTest')} →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const subjectList = detail.subjects && detail.subjects.length > 0 ? detail.subjects : [];
  const subjectByQuestionId = (() => {
    const map: Record<string, string> = {};
    subjectList.forEach((s) => {
      (s.questionIds || []).forEach((qid) => {
        map[qid] = s.name;
      });
    });
    return map;
  })();
  const getQuestionSubject = (question: Question): string => subjectByQuestionId[question.id] || 'General';

  const visibleQuestions = activeSubject === '__all__'
    ? detail.questions
    : detail.questions.filter((q) => getQuestionSubject(q) === activeSubject);

  // Convert an index in the visible (filtered) list to the global question index
  const globalIndexFor = (visibleIdx: number): number => {
    const q = visibleQuestions[visibleIdx];
    if (!q) return visibleIdx;
    const gi = detail.questions.findIndex((x) => x.id === q.id);
    return gi >= 0 ? gi : visibleIdx;
  };

  const switchSubject = (subject: string) => {
    const currentGlobalId = currentQuestion?.id;
    setActiveSubject(subject);
    setVisibleReviewCount(10);
    if (subject === '__all__') {
      const pos = currentGlobalId ? detail.questions.findIndex((q) => q.id === currentGlobalId) : 0;
      setCurrentQuestionIndex(pos >= 0 ? pos : 0);
    } else {
      const newList = detail.questions.filter((q) => getQuestionSubject(q) === subject);
      const pos = currentGlobalId ? newList.findIndex((q) => q.id === currentGlobalId) : 0;
      setCurrentQuestionIndex(pos >= 0 ? pos : 0);
    }
  };

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const stats = getQuestionStats();

  const filteredReviewQuestions = visibleQuestions.filter((q) =>
    reviewFilter === 'all' ? true : getReviewStatus(q) === reviewFilter
  );
  const reviewCounts = {
    all: visibleQuestions.length,
    correct: visibleQuestions.filter((q) => getReviewStatus(q) === 'correct').length,
    wrong: visibleQuestions.filter((q) => getReviewStatus(q) === 'wrong').length,
    skipped: visibleQuestions.filter((q) => getReviewStatus(q) === 'skipped').length,
  };

  return (
    <View style={styles.container}>
      {/* Warning Banner */}
      {testStarted && !submitted && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>
            <View style={styles.warningBannerRow}>
              <Icons.Warning size={14} color={colors.white} />
              <Text style={styles.warningBannerText}>
                {' '}{t('examInProgress')}
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
            {t('questionOf', { current: currentQuestionIndex + 1, total: visibleQuestions.length })}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {detail.questions.some(q => q.textHindi || (q.optionsHindi?.length)) && (
            <TouchableOpacity
              style={styles.langToggle}
              onPress={() => setSelectedLanguage(prev => prev === 'en' ? 'hi' : 'en')}
            >
              <Text style={styles.langToggleText}>{selectedLanguage === 'en' ? 'EN' : 'हि'}</Text>
            </TouchableOpacity>
          )}
          <View
            style={[
              styles.timer,
              timeRemaining < 300 && styles.timerDanger,
              timeRemaining >= 300 && timeRemaining < 600 && styles.timerWarning,
            ]}
          >
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
          {testStarted && !submitted && (
            <TouchableOpacity
              style={[styles.pauseButton, paused && styles.pauseButtonActive]}
              onPress={pauseTest}
              disabled={submitting}
            >
              <Text style={[styles.pauseButtonText, paused && styles.pauseButtonTextActive]}>
                {t('pause')}
              </Text>
            </TouchableOpacity>
          )}
          {!submitted && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowSubmitModal(true)}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>{t('submit')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Subject Tabs */}
        {subjectList.length > 1 && (
          <View style={styles.subjectTabsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectTabsRow}
            >
              <TouchableOpacity
                style={[styles.subjectTab, activeSubject === '__all__' && styles.subjectTabActive]}
                onPress={() => switchSubject('__all__')}
              >
                <Text style={[styles.subjectTabText, activeSubject === '__all__' && styles.subjectTabTextActive]}>
                  All ({detail.questions.length})
                </Text>
              </TouchableOpacity>
              {subjectList.map((s) => (
                <TouchableOpacity
                  key={s.name}
                  style={[styles.subjectTab, activeSubject === s.name && styles.subjectTabActive]}
                  onPress={() => switchSubject(s.name)}
                >
                  <Text style={[styles.subjectTabText, activeSubject === s.name && styles.subjectTabTextActive]}>
                    {s.name} ({s.totalQuestions})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {submitted ? (
          <View>
            {/* Results Summary */}
            <View style={styles.resultsContainer}>
              <Icons.Celebration size={64} color={colors.primary} />
              <Text style={styles.resultsTitle}>{t('testSubmitted')}</Text>
              <Text style={styles.resultsSubtitle}>{t('resultsSubtitle')}</Text>

              <View style={styles.resultsGrid}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultCardLabel}>{t('score')}</Text>
                  <Text style={styles.resultCardValue}>
                    {Number(submitted.score).toFixed(2)}/{submitted.totalMarks ?? submitted.totalQuestions}
                  </Text>
                </View>
                <View style={[styles.resultCard, styles.resultCardGreen]}>
                  <Text style={styles.resultCardLabel}>{t('percentage')}</Text>
                  <Text style={styles.resultCardValue}>{submitted.percentage}%</Text>
                </View>
                <View style={[styles.resultCard, styles.resultCardPurple]}>
                  <Text style={styles.resultCardLabel}>{t('rank')}</Text>
                  <Text style={styles.resultCardValue}>#{submitted.rank || '—'}{submitted.totalParticipants ? ` / ${submitted.totalParticipants}` : ''}</Text>
                </View>
                <View style={[styles.resultCard, styles.resultCardOrange]}>
                  <Text style={styles.resultCardLabel}>{t('performance')}</Text>
                  <Text style={styles.resultCardValue}>
                    {submitted.percentage >= 80
                      ? t('excellent')
                      : submitted.percentage >= 60
                      ? t('good')
                      : submitted.percentage >= 40
                      ? t('average')
                      : t('needsImprovement')}
                  </Text>
                </View>
              </View>

              {(submitted.correctAnswers !== undefined) && (
                <View style={styles.resultsGrid}>
                  <View style={[styles.resultCard, styles.resultCardGreen]}>
                    <Text style={styles.resultCardLabel}>{t('correct')}</Text>
                    <Text style={styles.resultCardValue}>{submitted.correctAnswers}</Text>
                  </View>
                  <View style={[styles.resultCard, styles.resultCardRed]}>
                    <Text style={styles.resultCardLabel}>{t('incorrect')}</Text>
                    <Text style={styles.resultCardValue}>{submitted.incorrectAnswers}</Text>
                  </View>
                  <View style={[styles.resultCard, styles.resultCardOrange]}>
                    <Text style={styles.resultCardLabel}>{t('skipped')}</Text>
                    <Text style={styles.resultCardValue}>{submitted.unattemptedAnswers}</Text>
                  </View>
                  <View style={[styles.resultCard, styles.resultCardYellow]}>
                    <Text style={styles.resultCardLabel}>{t('notAttempted')}</Text>
                    <Text style={styles.resultCardValue}>{submitted.notAttemptedAnswers}</Text>
                  </View>
                </View>
              )}

              <View style={styles.resultsButtons}>
                <TouchableOpacity
                  style={styles.resultsButton}
                  onPress={() => navigation.navigate('Attempts')}
                >
                  <Text style={styles.resultsButtonText}>{t('viewAllAttempts')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resultsButton, styles.resultsButtonSecondary]}
                  onPress={() => navigation.navigate('Dashboard')}
                >
                  <Text style={[styles.resultsButtonText, styles.resultsButtonTextSecondary]}>
                    {t('backToDashboard')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Subject-wise Performance */}
            {submitted.subjectScores && submitted.subjectScores.length > 0 && (
              <View style={styles.subjectResultsCard}>
                <View style={styles.subjectResultsHeader}>
                  <Text style={styles.subjectResultsTitle}>{t('subjectWisePerformance')}</Text>
                  <Text style={styles.subjectResultsCount}>{t('subjectsColon')} {submitted.subjectScores.length}</Text>
                </View>
                {submitted.subjectScores.map((s) => (
                  <View key={s.name} style={styles.subjectResultRow}>
                    <Text style={styles.subjectResultName} numberOfLines={1}>{s.name}</Text>
                    <Text style={styles.subjectResultScore}>{Number(s.score ?? 0).toFixed(2)}/{s.totalMarks}</Text>
                    <View style={styles.subjectResultBreakdown}>
                      <Text style={[styles.subjectResultStat, styles.subjectResultStatCorrect]}>{t('correct')}: {s.correctAnswers ?? 0}</Text>
                      <Text style={[styles.subjectResultStat, styles.subjectResultStatWrong]}>{t('incorrect')}: {s.incorrectAnswers ?? 0}</Text>
                      <Text style={[styles.subjectResultStat, styles.subjectResultStatSkipped]}>{t('skipped')}: {s.unattemptedAnswers ?? 0}</Text>
                      <Text style={[styles.subjectResultStat, styles.subjectResultStatUnanswered]}>{t('notAttempted')}: {s.notAttemptedAnswers ?? 0}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Question Review */}
            <View style={styles.reviewSection}>
              {/* Review Filter */}
              <View style={styles.reviewFilterRow}>
                <Text style={styles.reviewFilterLabel}>{t('filterColon')}</Text>
                {(['all', 'correct', 'wrong', 'skipped'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.reviewFilterChip, reviewFilter === f && styles.reviewFilterChipActive]}
                    onPress={() => {
                      setReviewFilter(f);
                      setVisibleReviewCount(10);
                    }}
                  >
                    <Text style={[styles.reviewFilterChipText, reviewFilter === f && styles.reviewFilterChipTextActive]}>
                      {f === 'all' ? t('all') : f === 'correct' ? t('correct') : f === 'wrong' ? t('incorrect') : t('skipped')} ({reviewCounts[f]})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredReviewQuestions.slice(0, visibleReviewCount).map((question, index) => {
                const userAnswer = question.selectedAnswer;
                const correctAnswer = question.correctAnswer;
                const reviewOptions = selectedLanguage === 'hi' && question.optionsHindi ? question.optionsHindi : question.options;
                const isNotAttempted = userAnswer === -1 || (userAnswer !== null && userAnswer !== undefined && ['Not Attempted', 'प्रयास नहीं किया गया'].includes(reviewOptions[userAnswer]));
                const isCorrect = !isNotAttempted && userAnswer === correctAnswer;
                const isAnswered = !isNotAttempted && userAnswer !== null && userAnswer !== undefined;
                return (
                  <View key={question.id} style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <View style={[styles.reviewBadge, isCorrect ? styles.reviewBadgeCorrect : isAnswered ? styles.reviewBadgeWrong : isNotAttempted ? styles.reviewBadgeUnanswered : styles.reviewBadgeUnanswered]}>
                        <Text style={styles.reviewBadgeText}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.reviewStatus, isCorrect ? styles.reviewStatusCorrect : isAnswered ? styles.reviewStatusWrong : isNotAttempted ? styles.reviewStatusUnanswered : styles.reviewStatusUnanswered]}>
                        {isCorrect ? t('correct') : isAnswered ? t('incorrect') : isNotAttempted ? t('notAttempted') : t('notAnswered')}
                      </Text>
                    </View>

                    <HTMLDescription
                      html={selectedLanguage === 'hi' && question.textHindi ? question.textHindi : question.text}
                      style={styles.reviewQuestionText}
                      contentWidth={screenWidth - 96}
                    />

                    {question.diagram && (
                      <View style={styles.diagramContainer}>
                        <Image
                          source={{ uri: resolveImageUrl(question.diagram) }}
                          style={styles.diagramImage}
                          resizeMode="contain"
                          onError={() => {}}
                        />
                      </View>
                    )}

                    <View style={styles.reviewOptionsContainer}>
                      {(selectedLanguage === 'hi' && question.optionsHindi ? question.optionsHindi : question.options).map((option, optIdx) => {
                        const isUserAns = userAnswer === optIdx;
                        const isCorrectOpt = correctAnswer === optIdx;
                        const optionLabel = String.fromCharCode(65 + optIdx);
                        return (
                          <View
                            key={optIdx}
                            style={[styles.reviewOption, isCorrectOpt ? styles.reviewOptionCorrect : isUserAns && !isCorrect ? styles.reviewOptionWrong : styles.reviewOptionNeutral]}
                          >
                            <View style={styles.reviewOptionRow}>
                              <View style={[styles.reviewOptionIcon, isCorrectOpt ? styles.reviewOptionIconCorrect : isUserAns && !isCorrect ? styles.reviewOptionIconWrong : styles.reviewOptionIconNeutral]}>
                                <Text style={[styles.reviewOptionIconText, (isCorrectOpt || (isUserAns && !isCorrect)) && styles.reviewOptionIconTextActive]}>
                                  {isCorrectOpt ? '✓' : isUserAns && !isCorrect ? '✗' : optionLabel}
                                </Text>
                              </View>
                              <Text style={[styles.reviewOptionText, (isCorrectOpt || (isUserAns && !isCorrect)) && styles.reviewOptionTextActive]}>
                                {option}
                              </Text>
                              {isCorrectOpt && <Text style={styles.reviewCorrectLabel}>{t('correct')}</Text>}
                              {isUserAns && !isCorrect && <Text style={styles.reviewWrongLabel}>{t('yourAnswer')}</Text>}
                              {isUserAns && isCorrect && <Text style={styles.reviewCorrectLabel}>{t('yourAnswer')}</Text>}
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {correctAnswer !== undefined && (
                      <View style={styles.reviewCorrectAnswerBox}>
                        <Text style={styles.reviewCorrectAnswerIcon}>✓</Text>
                        <View>
                          <Text style={styles.reviewCorrectAnswerTitle}>{t('correctAnswer')}</Text>
                          <Text style={styles.reviewCorrectAnswerText}>
                            {t('option')} {String.fromCharCode(65 + correctAnswer)}: {(selectedLanguage === 'hi' && question.optionsHindi ? question.optionsHindi : question.options)[correctAnswer]}
                          </Text>
                        </View>
                      </View>
                    )}

                    {(selectedLanguage === 'hi' && question.descriptionHindi) || question.description ? (
                      <View style={styles.reviewExplanationBox}>
                        <View style={styles.reviewExplanationHeader}>
                          <Text style={styles.reviewExplanationIcon}>💡</Text>
                          <Text style={styles.reviewExplanationTitle}>{t('explanation')}</Text>
                        </View>
                        <HTMLDescription html={selectedLanguage === 'hi' && question.descriptionHindi ? question.descriptionHindi : question.description} style={styles.reviewExplanationText} contentWidth={screenWidth - 96} />
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {visibleReviewCount < filteredReviewQuestions.length && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => setVisibleReviewCount(prev => prev + 20)}
                >
                  <Text style={styles.loadMoreButtonText}>
                    {t('loadMore', { defaultValue: 'Load More Questions' })} ({filteredReviewQuestions.length - visibleReviewCount} {t('remaining', { defaultValue: 'remaining' })})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.questionContainer}>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={styles.questionHeaderLeft}>
                <View style={styles.questionNumberBadge}>
                  <Text style={styles.questionNumberText}>{t('questionLabel', { number: currentQuestionIndex + 1 })}</Text>
                </View>
                {markedQuestions.has(currentQuestion.id) && (
                  <View style={styles.markedBadge}>
                    <View style={styles.markedBadgeRow}>
                      <Icons.Star size={12} color="#92400e" />
                      <Text style={styles.markedBadgeText}> {t('markedForReview')}</Text>
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
                      {markedQuestions.has(currentQuestion.id) ? ' ' + t('marked') : t('markForReview')}
                    </Text>
                  </View>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Question Text */}
            <HTMLDescription html={selectedLanguage === 'hi' && currentQuestion.textHindi ? currentQuestion.textHindi : currentQuestion.text} style={styles.questionText} contentWidth={screenWidth - 64} />

            {/* Diagram */}
            {currentQuestion.diagram && (
              <View style={styles.diagramContainer}>
                <Image
                  source={{ uri: resolveImageUrl(currentQuestion.diagram) }}
                  style={styles.diagramImage}
                  resizeMode="contain"
                  onError={() => {}}
                />
              </View>
            )}

            {/* Options */}
            <View style={styles.optionsContainer}>
              {(selectedLanguage === 'hi' && currentQuestion.optionsHindi ? currentQuestion.optionsHindi : currentQuestion.options).map((option, optIdx) => (
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

            {/* Answer Stats */}
            <View style={styles.navigationButtons}>
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {t('answeredStats', { answered: stats.answered, unanswered: stats.unanswered, marked: stats.marked })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Question Palette */}
        {!submitted && (
          <View style={styles.paletteContainer}>
            <Text style={styles.paletteTitle}>{t('questionPalette')}</Text>

            {/* Statistics */}
            <View style={styles.paletteStats}>
              <View style={styles.paletteStat}>
                <Text style={styles.paletteStatValue}>{stats.answered}</Text>
                <Text style={styles.paletteStatLabel}>{t('answered')}</Text>
              </View>
              <View style={[styles.paletteStat, styles.paletteStatRed]}>
                <Text style={[styles.paletteStatValue, styles.paletteStatValueRed]}>
                  {stats.unanswered}
                </Text>
                <Text style={styles.paletteStatLabel}>{t('unanswered')}</Text>
              </View>
              <View style={[styles.paletteStat, styles.paletteStatYellow]}>
                <Text style={[styles.paletteStatValue, styles.paletteStatValueYellow]}>
                  {stats.marked}
                </Text>
                <Text style={styles.paletteStatLabel}>{t('marked')}</Text>
              </View>
              <View style={[styles.paletteStat, styles.paletteStatGray]}>
                <Text style={[styles.paletteStatValue, styles.paletteStatValueGray]}>
                  {stats.notVisited}
                </Text>
                <Text style={styles.paletteStatLabel}>{t('notVisited')}</Text>
              </View>
            </View>

            {/* Question Grid */}
            <View style={styles.paletteGrid}>
              {visibleQuestions.map((q, idx) => {
                const status = getQuestionStatus(q);
                const isCurrent = q.id === currentQuestion.id;
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

      {/* Fixed Footer Navigation Bar */}
      {testStarted && !submitted && (
        <View style={styles.footerNavRow}>
          <TouchableOpacity
            style={[styles.footerNavButton, styles.footerNavButtonPrev, currentQuestionIndex === 0 && styles.footerNavButtonDisabled]}
            onPress={goToPrevious}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={[styles.footerNavButtonText, styles.footerNavButtonTextPrev, currentQuestionIndex === 0 && styles.footerNavButtonTextDisabled]}>
              {t('previous')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerNavButton, styles.footerNavButtonClear, !(currentQuestion.id in answers) && styles.footerNavButtonDisabled]}
            onPress={clearAnswer}
            disabled={!(currentQuestion.id in answers)}
          >
            <Text style={[styles.footerNavButtonText, styles.footerNavButtonTextClear, !(currentQuestion.id in answers) && styles.footerNavButtonTextDisabled]}>
              {t('clear')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerNavButton, styles.footerNavButtonSave]} onPress={saveAnswer}>
            <Text style={[styles.footerNavButtonText, styles.footerNavButtonTextPrimary]}>{t('save')}</Text>
          </TouchableOpacity>
          {currentQuestionIndex < visibleQuestions.length - 1 ? (
            <TouchableOpacity style={[styles.footerNavButton, styles.footerNavButtonNext]} onPress={goToNext}>
              <Text style={[styles.footerNavButtonText, styles.footerNavButtonTextPrimary]}>{t('next')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.footerNavButton, styles.footerNavButtonSubmit]} onPress={() => setShowSubmitModal(true)}>
              <Text style={[styles.footerNavButtonText, styles.footerNavButtonTextPrimary]}>{t('submit')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('confirmSubmission')}</Text>
            <Text style={styles.modalText}>{t('areYouSureSubmit')}</Text>

            <View style={styles.modalWarning}>
              <Text style={styles.modalWarningText}>
                <Text style={styles.modalWarningBold}>{t('noteColon')}</Text> {t('onceSubmittedCannotChange')}
              </Text>
            </View>

            <View style={styles.modalStats}>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>{t('answeredColon')}</Text>
                <Text style={styles.modalStatValue}>{stats.answered}</Text>
              </View>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>{t('unansweredColon')}</Text>
                <Text style={[styles.modalStatValue, styles.modalStatValueRed]}>
                  {stats.unanswered}
                </Text>
              </View>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>{t('markedColon')}</Text>
                <Text style={[styles.modalStatValue, styles.modalStatValueYellow]}>
                  {stats.marked}
                </Text>
              </View>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>{t('notVisitedColon')}</Text>
                <Text style={styles.modalStatValue}>{stats.notVisited}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSubmit}
                onPress={onSubmit}
                disabled={submitting}
              >
                <Text style={styles.modalButtonSubmitText}>
                  {submitting ? t('submitting') : t('submitTest')}
      </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pause Overlay */}
      <Modal
        visible={paused}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Icons.Pause size={56} color={colors.primary} />
            <Text style={styles.pauseTitle}>{t('testPaused')}</Text>
            <Text style={styles.pauseMessage}>{t('pausedMessage')}</Text>
            <TouchableOpacity
              style={[styles.pauseResumeButton, resuming && styles.pauseResumeButtonDisabled]}
              onPress={resumeTest}
              disabled={resuming}
            >
              {resuming ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.white} style={styles.buttonSpinner} />
                  <Text style={styles.pauseResumeButtonText}>{t('resuming', { defaultValue: 'Resuming...' })}</Text>
                </View>
              ) : (
                <Text style={styles.pauseResumeButtonText}>{t('resume')}</Text>
              )}
            </TouchableOpacity>
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
  headerNavRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerNavButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNavButtonPrimary: {
    backgroundColor: colors.primary,
  },
  headerNavButtonSubmit: {
    backgroundColor: colors.success,
  },
  headerNavButtonDisabled: {
    opacity: 0.4,
  },
  headerNavButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
  },
  headerNavButtonTextPrimary: {
    color: colors.white,
  },
  headerNavButtonTextDisabled: {
    color: colors.gray400,
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
  pauseButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  pauseButtonActive: {
    backgroundColor: colors.primary,
  },
  pauseButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  pauseButtonTextActive: {
    color: colors.white,
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pauseCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  pauseTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray900,
    marginTop: 12,
  },
  pauseMessage: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  pauseResumeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  pauseResumeButtonDisabled: {
    opacity: 0.6,
  },
  pauseResumeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  subjectTabsWrap: {
    marginBottom: 12,
  },
  subjectTabsRow: {
    gap: 8,
    paddingRight: 8,
  },
  subjectTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  subjectTabActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  subjectTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray700,
  },
  subjectTabTextActive: {
    color: colors.white,
  },
  subjectResultsCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  subjectResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectResultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
  },
  subjectResultsCount: {
    fontSize: 11,
    color: colors.gray500,
  },
  subjectResultRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  subjectResultName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 2,
  },
  subjectResultScore: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  subjectResultBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectResultStat: {
    fontSize: 11,
    fontWeight: '600',
  },
  subjectResultStatCorrect: {
    color: '#16a34a',
  },
  subjectResultStatWrong: {
    color: '#dc2626',
  },
  subjectResultStatSkipped: {
    color: '#d97706',
  },
  subjectResultStatUnanswered: {
    color: '#ea580c',
  },
  questionContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    marginRight: 8,
  },
  clearButtonDisabled: {
    backgroundColor: colors.gray100,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  clearButtonTextDisabled: {
    color: colors.gray400,
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
    color: colors.gray900,
    marginBottom: 20,
  },
  diagramContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  diagramImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
  optionNotAttempted: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  optionRadioNotAttempted: {
    borderColor: '#f97316',
  },
  optionRadioInnerNotAttempted: {
    backgroundColor: '#f97316',
  },
  optionTextNotAttempted: {
    color: '#9a3412',
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
  navButtonTextPrev: {
    color: colors.gray900,
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
  footerNavRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  footerNavButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNavButtonPrev: {
    backgroundColor: colors.gray100,
  },
  footerNavButtonClear: {
    backgroundColor: '#fee2e2',
  },
  footerNavButtonSave: {
    backgroundColor: '#1d4ed8',
  },
  footerNavButtonNext: {
    backgroundColor: colors.primary,
  },
  footerNavButtonSubmit: {
    backgroundColor: colors.success,
  },
  footerNavButtonDisabled: {
    opacity: 0.4,
  },
  footerNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  footerNavButtonTextPrev: {
    color: colors.gray900,
  },
  footerNavButtonTextClear: {
    color: colors.danger,
  },
  footerNavButtonTextPrimary: {
    color: colors.white,
  },
  footerNavButtonTextDisabled: {
    color: colors.gray400,
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    width: '100%',
  },
  resultCard: {
    width: '48%',
    padding: 12,
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
  resultCardOrange: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  resultCardRed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  resultCardYellow: {
    backgroundColor: '#fefce8',
    borderColor: '#facc15',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginRight: 8,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  languageOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  languageOptionTextActive: {
    color: colors.white,
  },
  langToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginRight: 4,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
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
  reviewSection: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  reviewFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reviewFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray600,
    marginRight: 2,
  },
  reviewFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  reviewFilterChipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  reviewFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray700,
  },
  reviewFilterChipTextActive: {
    color: colors.white,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reviewBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewBadgeCorrect: {
    backgroundColor: '#dcfce7',
  },
  reviewBadgeWrong: {
    backgroundColor: '#fee2e2',
  },
  reviewBadgeUnanswered: {
    backgroundColor: colors.gray200,
  },
  reviewBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray900,
  },
  reviewStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewStatusCorrect: {
    color: '#15803d',
  },
  reviewStatusWrong: {
    color: colors.danger,
  },
  reviewStatusUnanswered: {
    color: colors.gray500,
  },
  reviewQuestionText: {
    fontSize: 15,
    color: colors.gray800,
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewOptionsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  reviewOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewOptionCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  reviewOptionWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  reviewOptionNeutral: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray200,
  },
  reviewOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewOptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewOptionIconCorrect: {
    backgroundColor: '#22c55e',
  },
  reviewOptionIconWrong: {
    backgroundColor: '#ef4444',
  },
  reviewOptionIconNeutral: {
    backgroundColor: colors.gray300,
  },
  reviewOptionIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray600,
  },
  reviewOptionIconTextActive: {
    color: colors.white,
  },
  reviewOptionText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray700,
  },
  reviewOptionTextActive: {
    color: colors.gray900,
    fontWeight: '600',
  },
  reviewCorrectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  reviewWrongLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  reviewCorrectAnswerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    marginBottom: 8,
  },
  reviewCorrectAnswerIcon: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: '700',
  },
  reviewCorrectAnswerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 2,
  },
  reviewCorrectAnswerText: {
    fontSize: 14,
    color: '#166534',
  },
  reviewExplanationBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  reviewExplanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reviewExplanationIcon: {
    fontSize: 16,
  },
  reviewExplanationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  reviewExplanationText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 22,
    textAlign: 'justify',
  },
  loadMoreButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  loadMoreButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d4ed8',
  },
});

export default TestAttemptScreen;
