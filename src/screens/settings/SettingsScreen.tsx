import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { colors } from '@theme/colors';
import { Icons } from '@components/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const SettingsScreen: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

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

  const handleSave = async () => {
    if (!name.trim()) {
      addToast(t('nameCannotBeEmpty') || 'Name cannot be empty', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      addToast(t('profileUpdated') || 'Profile updated successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
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
            <Text style={styles.label}>{t('fullName') || 'Full Name'}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('enterYourName') || 'Enter your name'}
              placeholderTextColor={colors.gray400}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('emailAddress') || 'Email Address'}</Text>
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
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('phoneNumber') || 'Mobile Number'}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('phonePlaceholder') || 'Enter your mobile number'}
              placeholderTextColor={colors.gray400}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {t('saveChanges') || 'Save Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t('accountActions') || 'Account Actions'}
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icons.Logout size={16} color={colors.danger} /><Text style={styles.logoutButtonText}> {t('logout')}</Text>
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
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
