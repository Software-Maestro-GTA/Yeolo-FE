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
import { AuthContext } from '../context';
import { clearLocalSession } from '../services';
import { useLogoutMutation, useWithdrawMutation } from '../hooks/queries';
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
  onNavigateToAnalysis?: () => void;
  onNavigateToTasteProfile?: () => void;
  onNavigateToLogin?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateToAnalysis,
  onNavigateToTasteProfile,
  onNavigateToLogin,
}) => {
  const auth = useContext(AuthContext);
  const currentUser = auth?.user;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [confirmModalType, setConfirmModalType] = useState<'logout' | 'withdraw' | null>(null);

  const logoutMutation = useLogoutMutation();
  const withdrawMutation = useWithdrawMutation();

  const isModalActionLoading = logoutMutation.isPending || withdrawMutation.isPending;

  const clearSessionAndRedirect = async () => {
    await clearLocalSession();
    auth?.logout?.();
    if (isMounted.current) {
      setConfirmModalType(null);
    }
    onNavigateToLogin?.();
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await clearSessionAndRedirect();
      },
      onError: async (err) => {
        console.error('Logout failed:', err);
        await clearSessionAndRedirect();
      },
    });
  };

  const handleWithdraw = () => {
    withdrawMutation.mutate(undefined, {
      onSuccess: async () => {
        await clearSessionAndRedirect();
      },
      onError: (err) => {
        console.error('Withdraw failed:', err);
        Alert.alert(
          UI_STRINGS.PROFILE.WITHDRAW_ERROR_TITLE,
          err.message || UI_STRINGS.PROFILE.WITHDRAW_ERROR_DEFAULT
        );
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ProfileHeader user={currentUser} />

        {/* AI Taste Analysis Card */}
        <TasteAnalysisCard
          onNavigateToAnalysis={onNavigateToAnalysis}
          onNavigateToTasteProfile={onNavigateToTasteProfile}
        />

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
