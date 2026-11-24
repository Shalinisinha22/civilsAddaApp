import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import { useTranslation } from 'react-i18next';

const LoginScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, googleSignIn, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigation.replace('App');
    }
  }, [isAuthenticated, authLoading, navigation]);

  const handleNameChange = (text: string) => {
    setName(text.replace(/[^a-zA-Z\s]/g, ''));
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text.replace(/\D/g, '').slice(0, 10));
  };

  const handleSubmit = async () => {
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      addToast('Phone number is required', 'error');
      return;
    }
    const phoneNum = Number(trimmedPhone);
    if (!/^\d{10}$/.test(trimmedPhone) || phoneNum < 6000000000 || phoneNum > 9999900000) {
      addToast('Mobile number must be between 6000000000 and 9999900000', 'error');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(phoneNumber.trim(), password);
        addToast(t('loginSuccess') || 'Login successful! Redirecting...', 'success');
      } else {
        const trimmedName = name.trim();
        if (!trimmedName) {
          addToast('Name is required', 'error');
          setLoading(false);
          return;
        }
        if (!/^[a-zA-Z\s]+$/.test(trimmedName) || trimmedName.replace(/\s+/g, '').length < 3) {
          addToast('Name must contain only alphabets and at least 3 characters', 'error');
          setLoading(false);
          return;
        }
        await register(trimmedName, phoneNumber.trim(), password, email.trim() || undefined);
        addToast(
          t('registrationSuccess') || 'Registration successful! Redirecting...',
          'success',
        );
      }
      setTimeout(() => {
        navigation.replace('App');
      }, 500);
    } catch (error: any) {
      addToast(error.message || t('authFailed') || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    const demoPhone = '9999999999';
    const demoPassword = 'demo123';
    const demoName = 'Demo User';

    try {
      try {
        await login(demoPhone, demoPassword);
        addToast('Demo login successful! Redirecting...', 'success');
      } catch (loginError) {
        await register(demoName, demoPhone, demoPassword);
        addToast('Demo account created! Redirecting...', 'success');
      }
      setTimeout(() => {
        navigation.replace('App');
      }, 500);
    } catch (error: any) {
      addToast(error.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await googleSignIn();
      addToast('Google Sign-In successful! Redirecting...', 'success');
      setTimeout(() => {
        navigation.replace('App');
      }, 500);
    } catch (error: any) {
      console.error('[LoginScreen] Google Sign-In error:', error);
      console.error('[LoginScreen] Error code:', error?.code);
      console.error('[LoginScreen] Error message:', error?.message);
      addToast(error.message || 'Google Sign-In failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {t('redirecting') || 'Redirecting...'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isLogin ? t('welcomeBack') || 'Welcome Back' : t('createAccount') || 'Create Account'}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin
                  ? t('loginSubtitle') || 'Sign in to access your dashboard'
                  : t('registerSubtitle') || 'Start your journey with Civils Adda'}
              </Text>
            </View>

            {/* Toggle Login/Register */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text
                  style={[styles.toggleText, isLogin && styles.toggleTextActive]}
                >
                  {t('login')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text
                  style={[styles.toggleText, !isLogin && styles.toggleTextActive]}
                >
                  {t('register')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('fullName') || 'Full Name'}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={handleNameChange}
                  placeholder={t('enterYourName') || 'Enter your name'}
                  placeholderTextColor={colors.gray400}
                  autoCapitalize="words"
                />
                <Text style={styles.helperText}>
                  Only alphabets allowed, minimum 3 characters
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('phoneNumber') || 'Mobile Number'}</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder={t('phonePlaceholder') || 'Enter your mobile number'}
                placeholderTextColor={colors.gray400}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('emailAddress') || 'Email (optional)'}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('emailPlaceholder') || 'your.email@example.com'}
                  placeholderTextColor={colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('password') || 'Password'}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('passwordPlaceholder') || '••••••••'}
                placeholderTextColor={colors.gray400}
                secureTextEntry
              />
              {!isLogin && (
                <Text style={styles.helperText}>
                    {t('passwordHint') || 'Password must be at least 6 characters'}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading
                  ? t('pleaseWait') || 'Please wait...'
                  : isLogin
                  ? t('signIn') || 'Sign In'
                  : t('createAccount') || 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>
                {loading
                  ? t('signingIn') || 'Signing in...'
                  : t('continueWithGoogle') || 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {/* Demo Login Section */}
            {/* <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View> */}


            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Why create an account?</Text>
              <View style={styles.infoList}>
                <Text style={styles.infoItem}>• Access your purchased mock tests</Text>
                <Text style={styles.infoItem}>• Track your performance and scores</Text>
                <Text style={styles.infoItem}>• Save your test attempts</Text>
                <Text style={styles.infoItem}>• Get personalized recommendations</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    gap: 12,
  },
  loadingText: {
    color: colors.gray600,
    fontSize: 14,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray600,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    padding: 3,
    borderRadius: 8,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
  },
  toggleTextActive: {
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.gray900,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  helperText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 10,
    minHeight: 48,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: colors.gray700,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    paddingHorizontal: 14,
    color: colors.gray500,
    fontSize: 13,
  },
  demoContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  demoCredentials: {
    gap: 6,
    marginBottom: 10,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray600,
  },
  demoValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1E3A8A',
  },
  demoHint: {
    fontSize: 11,
    textAlign: 'center',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  demoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  demoButtonText: {
    color: '#1E3A8A',
    fontSize: 15,
    fontWeight: '600',
  },
  demoSubtext: {
    fontSize: 11,
    textAlign: 'center',
    color: colors.gray500,
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 14,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 6,
  },
  infoList: {
    gap: 3,
  },
  infoItem: {
    fontSize: 13,
    color: '#1E3A8A',
  },
});

export default LoginScreen;
