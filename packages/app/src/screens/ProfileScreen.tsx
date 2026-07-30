/**
 * @file ProfileScreen.tsx
 * @description Screen component for displaying user profile header, AI taste analysis card, settings, terms, logout API-FB-11, and account withdrawal API-FB-12.
 * @requirements REQ-11, REQ-12, REQ-22
 * @functional FUN-4, FUN-GA4
 * @api API-FB-11, API-FB-12
 * @domain DOM-3
 * @author Antigravity Agent
 */
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { AuthContext } from '../context';
import { clearLocalSession, openCustomerSupportMail } from '../services';
import { useWithdrawMutation } from '../hooks/queries';
import {
  ProfileHeader,
  TasteAnalysisCard,
  SettingsSection,
  TermsModal,
  ConfirmModal,
} from '../components/profile';
import { theme } from '../theme';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface ProfileScreenProps {
  onNavigateToTasteProfile?: () => void;
  onNavigateToLogin?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateToTasteProfile,
  onNavigateToLogin,
}) => {
  useGA4ScreenTracking('ProfileScreen');
  const { trackButtonClick } = useGA4ButtonClick();

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
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const withdrawMutation = useWithdrawMutation();

  const isModalActionLoading = isLoggingOut || withdrawMutation.isPending;

  const clearSessionAndRedirect = async () => {
    await clearLocalSession();
    if (isMounted.current) {
      setConfirmModalType(null);
    }
    onNavigateToLogin?.();
  };

  const handleLogout = async () => {
    trackButtonClick('btn_profile_logout_confirm', 'Logout Confirm');
    setIsLoggingOut(true);
    try {
      if (auth?.logout) {
        await auth.logout();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
      await clearSessionAndRedirect();
    }
  };

  const handleWithdraw = () => {
    trackButtonClick('btn_profile_withdraw_confirm', 'Withdraw Confirm');
    withdrawMutation.mutate(undefined, {
      onSuccess: async () => {
        try {
          if (auth?.logout) {
            await auth.logout();
          }
        } catch (err) {
          console.error('Logout state cleanup on withdraw failed:', err);
        } finally {
          await clearSessionAndRedirect();
        }
      },
      onError: (err) => {
        console.error('Withdraw failed:', err);
        setConfirmModalType(null);
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ProfileHeader user={currentUser} />

        {/* AI Taste Analysis Card */}
        <TasteAnalysisCard
          onNavigateToTasteProfile={() => {
            trackButtonClick('btn_profile_taste_view', 'View Taste Profile');
            onNavigateToTasteProfile?.();
          }}
        />

        {/* Settings List Section */}
        <SettingsSection
          onPressTerms={() => {
            trackButtonClick('btn_profile_terms', 'Open Terms');
            setShowTermsModal(true);
          }}
          onPressSupport={async () => {
            trackButtonClick('btn_profile_support_mailto', 'Open Customer Support Mailto');
            try {
              await openCustomerSupportMail();
            } catch (err) {
              console.error('Failed to open customer support mail modal:', err);
            }
          }}
          onPressLogout={() => {
            trackButtonClick('btn_profile_logout', 'Open Logout Dialog');
            setConfirmModalType('logout');
          }}
          onPressWithdraw={() => {
            trackButtonClick('btn_profile_withdraw', 'Open Withdraw Dialog');
            setConfirmModalType('withdraw');
          }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 40,
  },
});
