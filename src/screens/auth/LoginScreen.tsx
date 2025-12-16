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
  Linking,
} from 'react-native';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useNavigation } from '@react-navigation/native';
import { api } from '@api/api';
import { colors } from '@theme/colors';
import { useTranslation } from 'react-i18next';

const LoginScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigation.replace('App');
    }
  }, [isAuthenticated, authLoading, navigation]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
        addToast(t('loginSuccess') || 'Login successful! Redirecting...', 'success');
      } else {
        await register(email.trim(), password, name);
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
    const demoEmail = 'demo@civilsadda.com';
    const demoPassword = 'demo123';
    const demoName = 'Demo User';

    try {
      // Try to login first
      try {
        await login(demoEmail, demoPassword);
        addToast(
          t('demoLoginSuccess') || 'Demo login successful! Redirecting...',
          'success',
        );
      } catch (loginError) {
        // If login fails, try to register the demo user
        await register(demoEmail, demoPassword, demoName);
        addToast(
          t('demoAccountCreated') || 'Demo account created! Redirecting...',
          'success',
        );
      }
      setTimeout(() => {
        navigation.replace('App');
      }, 500);
    } catch (error: any) {
      addToast(error.message || t('demoLoginFailed') || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const response = await api.auth.getGoogleAuthUrl();
      if (response.success && response.data?.authUrl) {
        // Open Google OAuth in browser
        const canOpen = await Linking.canOpenURL(response.data.authUrl);
        
        if (canOpen) {
          await Linking.openURL(response.data.authUrl);
          addToast(
            t('googleSigninOpening') || 'Opening Google Sign-In in browser...',
            'info',
          );
          // Note: To complete Google Sign-In, you need to:
          // 1. Set up deep linking in your app (configure URL scheme in app.json/android/ios)
          // 2. Handle the callback URL in your app (use Linking.addEventListener)
          // 3. Extract the token from the callback URL
          // 4. Send the token to your backend for verification
          // 5. Update auth state with the received token
        } else {
          addToast(
            t('googleSigninCannotOpen') || 'Cannot open browser for Google Sign-In',
            'error',
          );
        }
      } else {
        addToast(
          t('googleSigninFailed') || 'Failed to initiate Google Sign-In',
          'error',
        );
      }
    } catch (error: any) {
      addToast(
        error.message ||
          t('googleSigninFailed') ||
          'Failed to initiate Google Sign-In',
        'error',
      );
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
                  onChangeText={setName}
                  placeholder={t('enterYourName') || 'Enter your name'}
                  placeholderTextColor={colors.gray400}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t('emailAddress') || 'Email Address'}
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('emailPlaceholder') || 'your.email@example.com'}
                placeholderTextColor={colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('password') || 'Password'}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('passwordPlaceholder') || '••••••••'}
                placeholderTextColor={colors.gray400}
                secureTextEntry
                required
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
                  ? t('loading') || 'Loading...'
                  : t('continueWithGoogle') || 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {/* Demo Login Section */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>🔐 Demo Credentials</Text>
              <View style={styles.demoCredentials}>
                <View style={styles.demoRow}>
                  <Text style={styles.demoLabel}>Email:</Text>
                  <Text style={styles.demoValue}>demo@civilsadda.com</Text>
                </View>
                <View style={styles.demoRow}>
                  <Text style={styles.demoLabel}>Password:</Text>
                  <Text style={styles.demoValue}>demo123</Text>
                </View>
              </View>
              <Text style={styles.demoHint}>
                💡 You can also use these credentials to login manually
              </Text>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={handleDemoLogin}
                disabled={loading}
              >
                <Text style={styles.demoButtonText}>
                  {loading ? 'Loading...' : '🚀 Try Demo Login'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.demoSubtext}>
                Click above to automatically login with demo account
              </Text>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>✨ Why create an account?</Text>
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
  },
  loadingText: {
    marginTop: 16,
    color: colors.gray600,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    padding: 4,
    borderRadius: 8,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  helperText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: colors.gray700,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: colors.gray500,
    fontSize: 14,
  },
  demoContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  demoCredentials: {
    gap: 8,
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  demoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
  },
  demoValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1E3A8A',
  },
  demoHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  demoButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  demoButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '600',
  },
  demoSubtext: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.gray500,
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoList: {
    gap: 4,
  },
  infoItem: {
    fontSize: 14,
    color: '#1E3A8A',
  },
});

export default LoginScreen;
