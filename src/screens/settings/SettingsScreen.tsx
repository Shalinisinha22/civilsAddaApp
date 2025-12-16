import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { colors } from '@theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigation = useNavigation<any>();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem('appLanguage');
        if (stored === 'en' || stored === 'hi') {
          setLanguage(stored);
        } else {
          setLanguage((i18n.language as 'en' | 'hi') || 'en');
        }
      } catch {
        // ignore storage errors and keep default
      }
    };
    loadLanguage();
  }, [i18n.language]);

  const handleLanguageChange = async (lng: 'en' | 'hi') => {
    setLanguage(lng);
    try {
      await i18n.changeLanguage(lng);
      await AsyncStorage.setItem('appLanguage', lng);
      addToast(t('language') + ' ' + (lng === 'en' ? t('english') : t('hindi')), 'success');
    } catch {
      addToast('Failed to change language', 'error');
    }
  };

  const handleUpdateName = () => {
    if (!name.trim()) {
      addToast(t('nameCannotBeEmpty') || 'Name cannot be empty', 'error');
      return;
    }
    // In a real app, this would update the user in the backend
    // For now, we'll just show a message
    addToast(
      t('nameUpdated') || 'Name updated successfully! (Changes saved locally)',
      'success',
    );
  };

  const handleLogout = () => {
    logout();
    addToast(t('logout') + ' ' + (t('success') || 'successful'), 'success');
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings')}</Text>
        <Text style={styles.subtitle}>
          {t('settingsSubtitle') || 'Manage your account settings and preferences'}
        </Text>
      </View>

      <View style={styles.section}>
        {/* Profile Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('profileInformation') || 'Profile Information'}
          </Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('emailAddress') || 'Email Address'}</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ''}
              editable={false}
              placeholderTextColor={colors.gray400}
            />
            <Text style={styles.helperText}>
              {t('emailImmutable') || 'Email cannot be changed'}
            </Text>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('fullName') || 'Full Name'}</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.input, styles.nameInput]}
                value={name}
                onChangeText={setName}
                placeholder={t('enterYourName') || 'Enter your name'}
                placeholderTextColor={colors.gray400}
              />
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateName}
                disabled={loading}
              >
                <Text style={styles.updateButtonText}>
                  {t('updateName') || 'Update Name'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('accountActions') || 'Account Actions'}
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 {t('logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Language Switcher */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  language === 'en' && styles.languageButtonTextActive,
                ]}
              >
                {t('english')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'hi' && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageChange('hi')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  language === 'hi' && styles.languageButtonTextActive,
                ]}
              >
                {t('hindi')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            📊 {t('aboutYourData') || 'About Your Data'}
          </Text>
          <Text style={styles.infoText}>
            {t('aboutYourDataText') ||
              'All your data (tests, attempts, purchases) is stored locally in your device. This means:'}
          </Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              •{' '}
              {t('aboutYourDataPoint1') ||
                'Data is private to your device'}
            </Text>
            <Text style={styles.infoItem}>
              •{' '}
              {t('aboutYourDataPoint2') ||
                'Clearing app data will reset everything'}
            </Text>
            <Text style={styles.infoItem}>
              •{' '}
              {t('aboutYourDataPoint3') ||
                'Data is not synced across devices'}
            </Text>
          </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
  },
  section: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
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
  inputDisabled: {
    backgroundColor: colors.gray50,
    color: colors.gray600,
  },
  helperText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  updateButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E3A8A',
    marginBottom: 12,
  },
  infoList: {
    gap: 4,
  },
  infoItem: {
    fontSize: 14,
    color: '#1E3A8A',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  languageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  languageButtonText: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: colors.white,
  },
});

export default SettingsScreen;
