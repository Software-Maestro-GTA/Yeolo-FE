/**
 * @file ProfileScreen.tsx
 * @description User profile screen component for managing account preferences, logout (API-AUTH-11), withdrawal (API-USER-2), and viewing AI travel taste profile (API-PREF-4).
 * @domain DOM-3
 */
import React, { useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@yeolo/common';
import { AuthContext, useBackground } from '../context';
import { palette, theme, hexToRgba } from '../theme/colors';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { clearLocalSession, openCustomerSupportMail } from '../services';
import { TermsModal, ProfileConfirmModal } from '../components/profile';
import {
  useWithdrawMutation,
  useLogoutMutation,
} from '../hooks/queries/useAuthMutations';
import { useTasteProfileQuery } from '../hooks/queries/useTasteProfileQuery';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface ProfileScreenProps {
  hasTasteProfile?: boolean;
  onNavigateToTasteProfile?: () => void;
  onReanalyzeTaste?: () => void;
  onEditProfile?: () => void;
  onNavigateToLogin?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  hasTasteProfile: hasTasteProfileProp,
  onNavigateToTasteProfile,
  onReanalyzeTaste,
  onEditProfile,
  onNavigateToLogin,
}) => {
  useGA4ScreenTracking('ProfileScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const auth = useContext(AuthContext);
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

  const { data: tasteProfile, isError: isTasteError } = useTasteProfileQuery();
  const hasTasteProfile =
    hasTasteProfileProp !== undefined
      ? hasTasteProfileProp
      : !!tasteProfile && !isTasteError;

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
      trackButtonClick('btn_profile_terms', 'Open Terms Modal');
      setTermsModalType('service');
      setShowTermsModal(true);
    } else if (type === 'privacy') {
      trackButtonClick(
        'btn_profile_privacy_notion',
        'Open Privacy Policy Notion URL',
      );
      try {
        await Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL);
      } catch (err) {
        logger.error('Failed to open privacy policy notion url:', err);
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

  return (
    <View style={styles.container} testID='profile-screen'>
      {/* Top Header Row (Left-aligned Title) */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{UI_STRINGS.PROFILE.MAIN_TITLE}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Card */}
        <View style={styles.profileCard} testID='profile-card'>
          <View style={styles.avatarAndMeta}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View
                style={[styles.avatarImage, styles.defaultAvatarPlaceholder]}>
                <Ionicons name='person' size={32} color={palette.gray400} />
              </View>
            )}
            <View style={styles.metaTextStack}>
              {!!displayName && (
                <Text style={styles.userNameText} numberOfLines={1}>
                  {displayName}
                </Text>
              )}
              {!!email && (
                <Text style={styles.userEmailText} numberOfLines={1}>
                  {email}
                </Text>
              )}
            </View>
            <TouchableOpacity
              testID='btn-edit-profile'
              style={styles.editBtn}
              activeOpacity={0.8}
              onPress={() => {
                trackButtonClick('btn_profile_edit', 'Edit Profile Click');
                onEditProfile?.();
              }}>
              <Text style={styles.editBtnText}>
                {UI_STRINGS.PROFILE.EDIT_BUTTON}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Travel Taste Card */}
        <LinearGradient
          colors={[palette.primary, palette.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiTasteCard}
          testID='ai-taste-card'>
          <View style={styles.tasteTitleStack}>
            <View style={styles.tasteBadgeRow}>
              <Ionicons name='sparkles' size={16} color={palette.white} />
              <Text style={styles.tasteBadgeTitle}>
                {UI_STRINGS.PROFILE.AI_TASTE_TITLE}
              </Text>
            </View>
            <Text style={styles.tasteSubDesc}>
              {UI_STRINGS.PROFILE.AI_TASTE_DESC}
            </Text>
          </View>

          <View style={styles.tasteActionsRow}>
            {/* 1. 나의 취향 보기 (취향 정보가 존재할 경우에만 노출) */}
            {hasTasteProfile && (
              <TouchableOpacity
                testID='btn-view-taste'
                style={styles.btnTastePrimary}
                activeOpacity={0.85}
                onPress={() => {
                  trackButtonClick(
                    'btn_profile_view_taste',
                    'View Taste Profile Click',
                  );
                  onNavigateToTasteProfile?.();
                }}>
                <Text style={styles.btnTastePrimaryText}>
                  {UI_STRINGS.PROFILE.VIEW_TASTE_BUTTON}
                </Text>
              </TouchableOpacity>
            )}

            {/* 2. 취향 재분석 */}
            <TouchableOpacity
              testID='btn-reanalyze-taste'
              style={
                hasTasteProfile
                  ? styles.btnTasteSecondary
                  : styles.btnTastePrimaryFull
              }
              activeOpacity={0.85}
              onPress={() => {
                trackButtonClick(
                  'btn_profile_reanalyze_taste',
                  'Reanalyze Taste Click',
                );
                onReanalyzeTaste?.();
              }}>
              <Text
                style={
                  hasTasteProfile
                    ? styles.btnTasteSecondaryText
                    : styles.btnTastePrimaryFullText
                }>
                {UI_STRINGS.PROFILE.REANALYZE_BUTTON}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Settings Section */}
        <View style={styles.settingsSection} testID='settings-section'>
          <Text style={styles.settingsHeaderTitle}>
            {UI_STRINGS.PROFILE.SETTINGS_HEADER}
          </Text>

          <View style={styles.settingsListCard}>
            {/* 이용약관 */}
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => handleOpenTerms('terms')}>
              <Text style={styles.settingLabelText}>
                {UI_STRINGS.PROFILE.TERMS_LABEL}
              </Text>
              <Ionicons
                name='chevron-forward'
                size={16}
                color={palette.mutedText}
              />
            </TouchableOpacity>

            {/* 개인정보 처리방침 */}
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => handleOpenTerms('privacy')}>
              <Text style={styles.settingLabelText}>
                {UI_STRINGS.PROFILE.PRIVACY_LABEL}
              </Text>
              <Ionicons
                name='chevron-forward'
                size={16}
                color={palette.mutedText}
              />
            </TouchableOpacity>

            {/* 고객 지원 */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => handleOpenTerms('support')}>
              <Text style={styles.settingLabelText}>
                {UI_STRINGS.PROFILE.SUPPORT_LABEL}
              </Text>
              <Ionicons
                name='chevron-forward'
                size={16}
                color={palette.mutedText}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Links */}
        <View style={styles.accountLinksRow}>
          <TouchableOpacity onPress={handleLogout} testID='btn-logout'>
            <Text style={styles.accountLinkText}>
              {UI_STRINGS.PROFILE.LOGOUT_LINK}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          <TouchableOpacity onPress={handleWithdraw} testID='btn-withdraw'>
            <Text style={styles.accountLinkText}>
              {UI_STRINGS.PROFILE.WITHDRAW_LINK}
            </Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.deepNavy,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 76,
    gap: 20,
  },
  profileCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 20,
    padding: 18,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarAndMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.lightTeal,
  },
  defaultAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gray100,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  metaTextStack: {
    flex: 1,
    gap: 4,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  userEmailText: {
    fontSize: 13,
    fontWeight: '400',
    color: palette.subText,
  },
  editBtn: {
    backgroundColor: palette.lightTeal,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.accent,
  },
  aiTasteCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tasteTitleStack: {
    gap: 6,
  },
  tasteBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tasteBadgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
  },
  tasteSubDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: hexToRgba(palette.white, 0.9),
    lineHeight: 18,
  },
  tasteActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnTastePrimary: {
    flex: 1,
    backgroundColor: palette.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTastePrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.primary,
  },
  btnTasteSecondary: {
    flex: 1,
    backgroundColor: hexToRgba(palette.white, 0.13),
    borderWidth: 1,
    borderColor: palette.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTasteSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.white,
  },
  btnTastePrimaryFull: {
    flex: 1,
    backgroundColor: palette.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTastePrimaryFullText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.primary,
  },
  settingsSection: {
    gap: 6,
  },
  settingsHeaderTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.mutedText,
  },
  settingsListCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
  },
  settingLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.deepNavy,
  },
  accountLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  accountLinkText: {
    fontSize: 12,
    fontWeight: '400',
    color: palette.mutedText,
    textDecorationLine: 'underline',
  },
  dividerLine: {
    width: 1,
    height: 10,
    backgroundColor: palette.mutedText,
  },
});
