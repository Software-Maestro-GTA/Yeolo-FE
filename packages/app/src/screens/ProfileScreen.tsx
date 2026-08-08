/**
 * @file ProfileScreen.tsx
 * @description User profile screen component for managing account preferences, updating nickname, terms viewing, customer support, and executing auth mutations (logout API-FB-11, withdrawal API-USER-2).
 * @domain DOM-3
 */
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@yeolo/common';
import { AuthContext } from '../context';
import { palette } from '../theme/colors';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { clearLocalSession, openCustomerSupportMail } from '../services';
import { WithdrawModal } from '../components/profile/WithdrawModal';
import { ProfileEditModal } from '../components/profile/ProfileEditModal';
import { TermsModal } from '../components/profile/TermsModal';
import {
  useWithdrawMutation,
  useLogoutMutation,
} from '../hooks/queries/useAuthMutations';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface ProfileScreenProps {
  onNavigateToTasteProfile?: () => void;
  onReanalyzeTaste?: () => void;
  onEditProfile?: () => void;
  onNavigateToLogin?: () => void;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
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

  const [displayName, setDisplayName] = useState<string>(
    user?.displayName || '김선규',
  );
  const email = user?.email || 'ksk85628781@gmail.com';
  const avatarUrl = (user as any)?.photoUrl || DEFAULT_AVATAR;

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] =
    useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [termsModalType, setTermsModalType] = useState<'service' | 'privacy'>(
    'service',
  );

  const withdrawMutation = useWithdrawMutation();
  const logoutMutation = useLogoutMutation();

  const clearSessionAndRedirect = async () => {
    await clearLocalSession();
    if (isMounted.current) {
      setIsWithdrawModalOpen(false);
      setShowTermsModal(false);
    }
    onNavigateToLogin?.();
  };

  const handleLogout = () => {
    trackButtonClick('btn_profile_logout', 'Logout Click');
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
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
        },
      },
    ]);
  };

  const handleConfirmWithdraw = async () => {
    trackButtonClick('btn_confirm_withdraw', 'Confirm Account Withdraw');
    try {
      await withdrawMutation.mutateAsync('사용자 요청 회원 탈퇴');
    } catch (err) {
      logger.error('Withdraw mutation failed:', err);
    } finally {
      if (auth?.logout) {
        await auth.logout();
      }
      await clearSessionAndRedirect();
    }
  };

  const handleSaveNickname = (newName: string) => {
    trackButtonClick('btn_save_nickname', 'Save Nickname', {
      nickname: newName,
    });
    setDisplayName(newName);
    Alert.alert('프로필 수정', '닉네임이 성공적으로 변경되었습니다.');
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
              '고객 지원 문의',
              `메일 앱을 열 수 없습니다.\n아래 이메일로 직접 문의해주세요.\n\n문의처: ${supportEmail}`,
              [{ text: '확인' }],
            );
          }
        } catch (linkErr) {
          logger.error('Direct mailto opening failed:', linkErr);
          Alert.alert(
            '고객 지원 문의',
            `메일 앱을 열 수 없습니다.\n아래 이메일로 직접 문의해주세요.\n\n문의처: ${supportEmail}`,
            [{ text: '확인' }],
          );
        }
      }
    }
  };

  return (
    <View style={styles.container} testID='profile-screen'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Card */}
        <View style={styles.profileCard} testID='profile-card'>
          <View style={styles.avatarAndMeta}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            <View style={styles.metaTextStack}>
              <Text style={styles.userNameText} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userEmailText} numberOfLines={1}>
                {email}
              </Text>
            </View>
            <TouchableOpacity
              testID='btn-edit-profile'
              style={styles.editBtn}
              activeOpacity={0.8}
              onPress={() => {
                trackButtonClick('btn_profile_edit', 'Edit Profile Click');
                if (onEditProfile) {
                  onEditProfile();
                } else {
                  setIsEditModalOpen(true);
                }
              }}>
              <Text style={styles.editBtnText}>
                {UI_STRINGS.PROFILE.EDIT_BUTTON}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Travel Taste Card */}
        <LinearGradient
          colors={[palette.primary, palette.accent]} // #2D7DD2 -> #00C9A7
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiTasteCard}
          testID='ai-taste-card'>
          <View style={styles.tasteTitleStack}>
            <View style={styles.tasteBadgeRow}>
              <Ionicons name='sparkles' size={16} color='#FFFFFF' />
              <Text style={styles.tasteBadgeTitle}>
                {UI_STRINGS.PROFILE.AI_TASTE_TITLE}
              </Text>
            </View>
            <Text style={styles.tasteSubDesc}>
              {UI_STRINGS.PROFILE.AI_TASTE_DESC}
            </Text>
          </View>

          <View style={styles.tasteActionsRow}>
            {/* 1. 나의 취향 보기 */}
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

            {/* 2. 취향 재분석 */}
            <TouchableOpacity
              testID='btn-reanalyze-taste'
              style={styles.btnTasteSecondary}
              activeOpacity={0.85}
              onPress={() => {
                trackButtonClick(
                  'btn_profile_reanalyze_taste',
                  'Reanalyze Taste Click',
                );
                onReanalyzeTaste?.();
              }}>
              <Text style={styles.btnTasteSecondaryText}>
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
              <Ionicons name='chevron-forward' size={16} color='#9CA3AF' />
            </TouchableOpacity>

            {/* 개인정보 처리방침 */}
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => handleOpenTerms('privacy')}>
              <Text style={styles.settingLabelText}>
                {UI_STRINGS.PROFILE.PRIVACY_LABEL}
              </Text>
              <Ionicons name='chevron-forward' size={16} color='#9CA3AF' />
            </TouchableOpacity>

            {/* 고객 지원 */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => handleOpenTerms('support')}>
              <Text style={styles.settingLabelText}>
                {UI_STRINGS.PROFILE.SUPPORT_LABEL}
              </Text>
              <Ionicons name='chevron-forward' size={16} color='#9CA3AF' />
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

          <TouchableOpacity
            onPress={() => setIsWithdrawModalOpen(true)}
            testID='btn-withdraw'>
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

      {/* Profile Edit Modal */}
      <ProfileEditModal
        visible={isEditModalOpen}
        currentName={displayName}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveNickname}
      />

      {/* Account Withdrawal Confirm Modal */}
      <WithdrawModal
        visible={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onConfirmWithdraw={handleConfirmWithdraw}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.softMint, // #F5FAF8
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 76,
    gap: 20,
  },
  profileCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#E0F7F1',
  },
  metaTextStack: {
    flex: 1,
    gap: 4,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy, // #0D2137
  },
  userEmailText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#4B5563',
  },
  editBtn: {
    backgroundColor: '#E0F7F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.accent, // #00C9A7
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
    color: 'rgba(255, 255, 255, 0.9)',
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
    color: palette.primary, // #2D7DD2
  },
  btnTasteSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
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
  settingsSection: {
    gap: 6,
  },
  settingsHeaderTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  settingsListCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  dividerLine: {
    width: 1,
    height: 10,
    backgroundColor: '#9CA3AF',
  },
});
