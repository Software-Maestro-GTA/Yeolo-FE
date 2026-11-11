/**
 * @file ProfileScreen.tsx
 * @description UI v3 profile, support and official social links with existing account logout and withdrawal actions.
 * @domain DOM-3
 */
import ChevronSvg from '../../assets/figma/profile/chevron.svg';
import BackSvg from '../../assets/images/figma-course/back.svg';
import AvatarSvg from '../../assets/figma/profile/avatar.svg';
import PersonSvg from '../../assets/figma/profile/person.svg';
import { Text } from '../components/common/Typography';
import React, { useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '@yeolo/common';
import { AuthContext, useBackground } from '../context';
import { palette, theme } from '../theme/colors';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { clearLocalSession, openCustomerSupportMail } from '../services';
import { TermsModal, ProfileConfirmModal } from '../components/profile';
import {
  useWithdrawMutation,
  useLogoutMutation,
} from '../hooks/queries/useAuthMutations';
import { HOME_PROFILE_UI as S } from '../constants/homeProfileUiStrings';
import { FigmaAsset } from '../components/common/FigmaAsset';
import { CachedImage } from '../components/common/CachedImage';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface ProfileScreenProps {
  onBack?: () => void;
  hasTasteProfile?: boolean;
  onNavigateToTasteProfile?: () => void;
  onReanalyzeTaste?: () => void;
  onEditProfile?: () => void;
  onNavigateToLogin?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onEditProfile,
  onNavigateToLogin,
}) => {
  useGA4ScreenTracking('ProfileScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const { setBackground, resetBackground } = useBackground();
  useEffect(() => {
    setBackground({ backgroundColor: palette.gray100 });
    return resetBackground;
  }, [setBackground, resetBackground]);

  const auth = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const user = auth?.user;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const displayName = user?.displayName || '';
  const email = user?.email || '';
  const avatarUrl =
    (user as any)?.photoUrl || (user as any)?.profileImageUrl || undefined;

  const [showTermsModal, setShowTermsModal] = React.useState<boolean>(false);
  const [termsModalType, setTermsModalType] = React.useState<
    'service' | 'privacy'
  >('service');

  const [confirmModalConfig, setConfirmModalConfig] = React.useState<{
    visible: boolean;
    title: string;
    description?: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: () => {},
  });

  const withdrawMutation = useWithdrawMutation();
  const logoutMutation = useLogoutMutation();

  const clearSessionAndRedirect = async () => {
    await clearLocalSession();
    if (isMounted.current) {
      setShowTermsModal(false);
      setConfirmModalConfig((prev) => ({ ...prev, visible: false }));
    }
    onNavigateToLogin?.();
  };

  const executeLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      logger.error('Logout mutation failed:', err);
    } finally {
      if (auth?.logout) {
        await auth.logout();
      }
      await clearSessionAndRedirect();
    }
  };

  const handleLogout = () => {
    trackButtonClick('btn_profile_logout', 'Logout Click');
    setConfirmModalConfig({
      visible: true,
      title: UI_STRINGS.PROFILE.LOGOUT,
      description: UI_STRINGS.PROFILE.LOGOUT_CONFIRM,
      confirmText: UI_STRINGS.PROFILE.LOGOUT_CONFIRM_BTN,
      onConfirm: executeLogout,
    });
  };

  const handleConfirmWithdraw = async () => {
    trackButtonClick('btn_confirm_withdraw', 'Confirm Account Withdraw');
    try {
      await withdrawMutation.mutateAsync(
        UI_STRINGS.PROFILE.WITHDRAW_REASON_DEFAULT,
      );
    } catch (err) {
      logger.error('Withdraw mutation failed:', err);
    } finally {
      if (auth?.resetAuthState) {
        await auth.resetAuthState();
      } else if (auth?.logout) {
        await auth.logout();
      }
      await clearSessionAndRedirect();
    }
  };

  const handleWithdraw = () => {
    trackButtonClick('btn_profile_withdraw', 'Withdraw Click');
    setConfirmModalConfig({
      visible: true,
      title: UI_STRINGS.PROFILE.WITHDRAW_HEADER,
      description: UI_STRINGS.PROFILE.WITHDRAW_ALERT_DESC,
      confirmText: UI_STRINGS.PROFILE.WITHDRAW_ACTION_BTN,
      onConfirm: handleConfirmWithdraw,
    });
  };

  const handleOpenTerms = async (type: 'terms' | 'privacy' | 'support') => {
    if (type === 'terms') {
      trackButtonClick('btn_profile_terms', 'Open Terms Web URL');
      try {
        await Linking.openURL(APP_CONFIG.TERMS_OF_SERVICE_URL);
      } catch (err) {
        logger.error('Failed to open terms of service web url:', err);
        setTermsModalType('service');
        setShowTermsModal(true);
      }
    } else if (type === 'privacy') {
      trackButtonClick('btn_profile_privacy', 'Open Privacy Policy Web URL');
      try {
        await Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL);
      } catch (err) {
        logger.error('Failed to open privacy policy web url:', err);
        setTermsModalType('privacy');
        setShowTermsModal(true);
      }
    } else if (type === 'support') {
      trackButtonClick(
        'btn_profile_support_mailto',
        'Open Customer Support Mailto',
      );
      const supportEmail = APP_CONFIG.DEFAULT_SUPPORT_EMAIL;
      const mailtoUrl = `mailto:${supportEmail}`;

      try {
        await openCustomerSupportMail();
      } catch (err) {
        logger.warn(
          'MailComposer/mailto failed, checking fallback canOpenURL:',
          err,
        );
        try {
          const canOpen = await Linking.canOpenURL(mailtoUrl);
          if (canOpen) {
            await Linking.openURL(mailtoUrl);
          } else {
            Alert.alert(
              UI_STRINGS.PROFILE.SUPPORT_ALERT_TITLE,
              UI_STRINGS.PROFILE.SUPPORT_ALERT_MESSAGE(supportEmail),
              [{ text: UI_STRINGS.PROFILE.CONFIRM_OK }],
            );
          }
        } catch (linkErr) {
          logger.error('Direct mailto opening failed:', linkErr);
          Alert.alert(
            UI_STRINGS.PROFILE.SUPPORT_ALERT_TITLE,
            UI_STRINGS.PROFILE.SUPPORT_ALERT_MESSAGE(supportEmail),
            [{ text: UI_STRINGS.PROFILE.CONFIRM_OK }],
          );
        }
      }
    }
  };

  const openInstagram = async () => {
    try {
      await Linking.openURL(APP_CONFIG.INSTAGRAM_URL);
    } catch {
      Alert.alert(S.instagram, S.instagramError);
    }
  };
  const contentInset = StyleSheet.create({
    scroll: { paddingBottom: Math.max(insets.bottom, 24) },
  });
  const row = (label: string, testID: string, onPress: () => void) => (
    <TouchableOpacity
      key={testID}
      accessibilityRole='button'
      style={styles.settingRow}
      testID={testID}
      onPress={onPress}>
      <Text style={styles.settingLabelText}>{label}</Text>
      <FigmaAsset
        source={ChevronSvg}
        width={18}
        height={18}
        style={styles.forward}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID='profile-screen'>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel={S.back}
          testID='profile-back'
          onPress={onBack}
          style={styles.back}>
          <FigmaAsset source={BackSvg} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.profile}</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, contentInset.scroll]}>
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel={S.editProfile}
          style={styles.profileCard}
          testID='btn-edit-profile'
          onPress={onEditProfile}>
          {avatarUrl ? (
            <CachedImage
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.defaultAvatarPlaceholder}>
              <FigmaAsset
                source={AvatarSvg}
                width={56}
                height={56}
                style={styles.avatarBackground}
              />
              <FigmaAsset source={PersonSvg} width={19.4689} height={22} />
            </View>
          )}
          <View style={styles.metaTextStack}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {displayName || S.guest}
            </Text>
            <Text style={styles.userEmailText} numberOfLines={1}>
              {email}
            </Text>
          </View>
          <FigmaAsset
            source={BackSvg}
            width={24}
            height={24}
            style={styles.forward}
          />
        </TouchableOpacity>
        <View style={styles.settingsCard} testID='settings-section'>
          <Text style={styles.settingsHeaderTitle}>{S.settings}</Text>
          {row(UI_STRINGS.PROFILE.TERMS_LABEL, 'btn-terms', () =>
            handleOpenTerms('terms'),
          )}
          {row(UI_STRINGS.PROFILE.PRIVACY_LABEL, 'btn-privacy', () =>
            handleOpenTerms('privacy'),
          )}
          {row(UI_STRINGS.PROFILE.SUPPORT_LABEL, 'btn-support', () =>
            handleOpenTerms('support'),
          )}
        </View>
        <View style={styles.settingsCard} testID='usage-section'>
          <Text style={styles.settingsHeaderTitle}>{S.usage}</Text>
          {row(S.inquiry, 'btn-inquiry', () => handleOpenTerms('support'))}
          {row(S.instagram, 'btn-instagram', openInstagram)}
        </View>
        <View style={styles.settingsCard} testID='app-info-section'>
          <Text style={styles.settingsHeaderTitle}>{S.appInfo}</Text>
          {row(UI_STRINGS.PROFILE.LOGOUT, 'btn-logout', handleLogout)}
          {row(S.withdraw, 'btn-withdraw', handleWithdraw)}
        </View>
      </ScrollView>

      {/* Terms Modal */}
      <TermsModal
        visible={showTermsModal}
        type={termsModalType}
        onClose={() => setShowTermsModal(false)}
      />

      {/* Confirmation Bottom Sheet Modal */}
      <ProfileConfirmModal
        visible={confirmModalConfig.visible}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        confirmText={confirmModalConfig.confirmText}
        onClose={() =>
          setConfirmModalConfig((prev) => ({ ...prev, visible: false }))
        }
        onConfirm={() => {
          confirmModalConfig.onConfirm();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.gray100 },
  headerContainer: {
    height: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 37,
    letterSpacing: -1,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 13, gap: 16 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    minHeight: 56,
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  defaultAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBackground: { position: 'absolute', top: 0, left: 0 },
  metaTextStack: { flex: 1, gap: 8 },
  userNameText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -1,
    color: theme.colors.text.primary,
  },
  userEmailText: {
    fontSize: 16,
    letterSpacing: -1,
    color: palette.gray500,
    fontWeight: '500',
  },
  forward: { transform: [{ rotate: '180deg' }] },
  settingsCard: {
    borderRadius: 20,
    backgroundColor: theme.colors.bg.card,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 12,
  },
  settingsHeaderTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -1,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  settingRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  settingLabelText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -1,
    color: theme.colors.text.primary,
  },
});

export default ProfileScreen;
