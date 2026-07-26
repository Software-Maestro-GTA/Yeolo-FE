/**
 * @file ProfileScreen.tsx
 * @description Screen component for displaying user profile header, AI taste analysis card, settings, terms, logout API-FB-11, and account withdrawal API-FB-12.
 * @requirements REQ-11, REQ-12
 * @functional FUN-4
 * @api API-FB-11, API-FB-12
 * @domain DOM-3
 * @author Antigravity Agent
 */
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  logoutApi,
  withdrawApi,
  DEFAULT_API_URL,
} from '@yeolo/common';
import type { User } from '@yeolo/common';
import { AuthContext } from '../context';
import { clearLocalSession } from '../services';
import {
  ProfileHeader,
  TasteAnalysisCard,
  SettingsSection,
  TermsModal,
  ConfirmModal,
} from '../components/profile';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';

export interface ProfileScreenProps {
  user?: Partial<User> | null;
  onNavigateToAnalysis?: () => void;
  onNavigateToLogin?: () => void;
  logoutFetcher?: typeof logoutApi;
  withdrawFetcher?: typeof withdrawApi;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onNavigateToAnalysis,
  onNavigateToLogin,
  logoutFetcher = logoutApi,
  withdrawFetcher = withdrawApi,
}) => {
  const auth = useContext(AuthContext);
  const currentUser = user || auth?.user;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [confirmModalType, setConfirmModalType] = useState<'logout' | 'withdraw' | null>(null);
  const [isModalActionLoading, setIsModalActionLoading] = useState<boolean>(false);

  const clearSessionAndRedirect = async () => {
    // Delegate local session clearance to authService
    await clearLocalSession();
    auth?.logout?.();
    if (isMounted.current) {
      setConfirmModalType(null);
    }
    onNavigateToLogin?.();
  };

  const handleLogout = async () => {
    setIsModalActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

      await logoutFetcher(apiUrl, token || undefined, {
        refreshToken: refreshToken || undefined,
      });

      await clearSessionAndRedirect();
    } catch (err: unknown) {
      console.error('Logout failed:', err);
      await clearSessionAndRedirect();
    } finally {
      if (isMounted.current) {
        setIsModalActionLoading(false);
      }
    }
  };

  const handleWithdraw = async () => {
    setIsModalActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

      await withdrawFetcher(apiUrl, token || undefined, {
        reason: UI_STRINGS.PROFILE.WITHDRAW_REASON_DEFAULT,
      });

      await clearSessionAndRedirect();
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Withdraw failed:', err);
      Alert.alert(UI_STRINGS.PROFILE.WITHDRAW_ERROR_TITLE, error?.message || UI_STRINGS.PROFILE.WITHDRAW_ERROR_DEFAULT);
    } finally {
      if (isMounted.current) {
        setIsModalActionLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ProfileHeader user={currentUser} />

        {/* AI Taste Analysis Card */}
        <TasteAnalysisCard onNavigateToAnalysis={onNavigateToAnalysis} />

        {/* Settings List Section */}
        <SettingsSection
          onPressTerms={() => setShowTermsModal(true)}
          onPressLogout={() => setConfirmModalType('logout')}
          onPressWithdraw={() => setConfirmModalType('withdraw')}
        />
      </ScrollView>

      {/* Terms of Service Modal */}
      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      {/* Re-confirmation Modal for Logout & Withdrawal */}
      <ConfirmModal
        visible={confirmModalType !== null}
        type={confirmModalType || 'logout'}
        isLoading={isModalActionLoading}
        onConfirm={() => {
          if (confirmModalType === 'logout') {
            handleLogout();
          } else if (confirmModalType === 'withdraw') {
            handleWithdraw();
          }
        }}
        onCancel={() => setConfirmModalType(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
  },
  contentContainer: {
    paddingBottom: 40,
  },
});
