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
                Update Profile
              </Text>
            )}
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

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icons.Logout size={20} color={colors.danger} />
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
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
  section: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 14,
  },
  formGroup: {
    marginBottom: 14,
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    minHeight: 48,
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  languageButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  languageButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  languageButtonText: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: colors.white,
  },
});

export default SettingsScreen;
