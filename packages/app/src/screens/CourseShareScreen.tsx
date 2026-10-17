/**
 * @file CourseShareScreen.tsx
 * @description UI v3의 색상·타이포·카드와 모달 규칙으로 공유 코스 미리보기 및 저장 시 로그인을 제공합니다.
 */
import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { Text } from '../components/common/Typography';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { CachedImage } from '../components/common/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FigmaAsset } from '../components/common/FigmaAsset';
import { useSheetEntrance } from '../hooks/useSheetEntrance';
import { useBackground } from '../context/BackgroundContext';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import {
  useShareLinkDetailQuery,
  useAcceptShareLinkMutation,
} from '../hooks/queries';
import {
  signInWithGoogle,
  signInWithApple,
  signOutGoogle,
  isAppleAuthAvailable,
} from '../services';
import { showAuthErrorAlert } from '../utils/errorUtils';

export interface CourseShareScreenProps {
  shareToken?: string;
  courseId?: string;
  onSaveSuccess?: (acceptedCourseId?: string) => void;
  onDecline?: () => void;
  onNavigateToLogin?: () => void;
}

export const CourseShareScreen: React.FC<CourseShareScreenProps> = ({
  shareToken,
  courseId,
  onSaveSuccess,
  onDecline,
  onNavigateToLogin,
}) => {
  useGA4ScreenTracking('CourseShareScreen');
  const insets = useSafeAreaInsets();
  const safeAreaStyles = StyleSheet.create({
    header: { paddingTop: insets.top },
    content: { paddingBottom: insets.bottom + 16 },
    loginActions: { paddingBottom: Math.max(insets.bottom, 20) + 12 },
  });
  const { trackButtonClick } = useGA4ButtonClick();
  const { setBackground, resetBackground } = useBackground();
  useEffect(() => {
    setBackground({
      noTopEdges: true,
      backgroundColor: palette.white,
    });
    return resetBackground;
  }, [setBackground, resetBackground]);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated;
  useEffect(() => {
    if (isAuthenticated) setShowLogin(false);
  }, [isAuthenticated]);

  const loginEntrance = useSheetEntrance(showLogin && !isAuthenticated);

  const [isLocalLoggingIn, setIsLocalLoggingIn] = useState<boolean>(false);
  const isLoggingIn = auth?.isLoading || isLocalLoggingIn;

  const [isAppleAvailable, setIsAppleAvailable] = useState<boolean>(
    Platform.OS === 'ios',
  );

  useEffect(() => {
    if (Platform.OS === 'ios') {
      isAppleAuthAvailable()
        .then(setIsAppleAvailable)
        .catch(() => setIsAppleAvailable(false));
    }
  }, []);

  const {
    data: shareData,
    isLoading: isLoadingShare,
    error: shareError,
  } = useShareLinkDetailQuery({
    shareToken,
  });

  useEffect(() => {
    if (shareError) {
      Alert.alert(
        UI_STRINGS.COURSE_SHARE.ERROR_TITLE,
        UI_STRINGS.COURSE_SHARE.INVALID_LINK_MESSAGE,
        [
          {
            text: UI_STRINGS.COMMON.CONFIRM,
            onPress: () => {
              if (isAuthenticated) {
                onDecline?.();
              } else {
                onNavigateToLogin?.();
              }
            },
          },
        ],
      );
    }
  }, [shareError, isAuthenticated, onDecline, onNavigateToLogin]);

  const acceptShareLinkMutation = useAcceptShareLinkMutation();

  const inviter = shareData?.inviter;
  const course = shareData?.course;

  const activeInviterName = inviter?.displayName || '';
  const activeInviterAvatar = inviter?.profileImageUrl || null;
  const activeCourseTitle = course?.title || '';
  const activeDestination = course
    ? [course.destinationCountry, course.destinationCity]
        .filter(Boolean)
        .join(' · ')
    : '';
  const activeStartDate = course?.startDate || '';
  const activeDuration = course?.totalDays ? `${course.totalDays}일` : '';

  const coverImage = course?.coverImageUrl?.trim() || '';

  const handleSaveCourse = () => {
    trackButtonClick('btn_save_shared_course', 'Save Shared Course Click');
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    if (shareToken) {
      acceptShareLinkMutation.mutate(shareToken, {
        onSuccess: (res) => {
          onSaveSuccess?.(res.courseId || courseId);
        },
        onError: (err: any) => {
          if (err?.status === 400) {
            Alert.alert(
              UI_STRINGS.COURSE_SHARE.ALREADY_SAVED_TITLE,
              UI_STRINGS.COURSE_SHARE.ALREADY_SAVED_MESSAGE,
              [
                {
                  text: UI_STRINGS.COMMON.CONFIRM,
                  onPress: () => onSaveSuccess?.(courseId),
                },
              ],
            );
          } else {
            Alert.alert(
              UI_STRINGS.COURSE_SHARE.SAVE_FAILED_TITLE,
              err?.message ||
                UI_STRINGS.COURSE_SHARE.SAVE_FAILED_DEFAULT_MESSAGE,
            );
          }
        },
      });
    } else {
      if (onSaveSuccess) {
        onSaveSuccess(courseId);
      }
    }
  };

  const handleDecline = () => {
    trackButtonClick(
      'btn_decline_shared_course',
      'Decline Shared Course Click',
    );
    if (onDecline) {
      onDecline();
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    trackButtonClick(
      `btn_share_login_${provider}`,
      `Share Login ${provider} Click`,
    );
    if (isLoggingIn) return;
    setIsLocalLoggingIn(true);

    try {
      if (provider === 'google') {
        const code = await signInWithGoogle();
        if (auth?.loginWithGoogle) {
          await auth.loginWithGoogle(code);
        }
      } else {
        const { code, idToken } = await signInWithApple();
        if (auth?.loginWithApple) {
          await auth.loginWithApple({ code, idToken });
        }
      }
    } catch (err: any) {
      if (
        err?.code === 'ERR_REQUEST_CANCELED' ||
        err?.code === 'SIGN_IN_CANCELLED'
      ) {
        return;
      }
      if (provider === 'google') {
        await signOutGoogle();
      }
      showAuthErrorAlert(
        err,
        provider === 'google'
          ? UI_STRINGS.AUTH.GOOGLE_LOGIN_FAIL_DEFAULT
          : UI_STRINGS.AUTH.APPLE_LOGIN_FAIL_DEFAULT,
      );
    } finally {
      setIsLocalLoggingIn(false);
    }
  };

  if (isLoadingShare) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.loadingText}>
          {UI_STRINGS.COURSE_SHARE.LOADING_TEXT}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID='course-share-screen'>
      <View style={safeAreaStyles.header} testID='share-safe-header'>
        <View style={styles.header}>
          <Pressable
            accessibilityRole='button'
            accessibilityLabel={UI_STRINGS.COMMON.BACK}
            style={styles.backButton}
            onPress={handleDecline}>
            <FigmaAsset
              source={require('../../assets/images/figma-course/back.svg')}
              width={24}
              height={24}
            />
          </Pressable>
          <Text style={styles.headerTitle}>
            {UI_STRINGS.COURSE_SHARE.HEADER_TITLE}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, safeAreaStyles.content]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.preview}>
          <View style={styles.intro}>
            <Text style={styles.introTitle}>
              {UI_STRINGS.COURSE_SHARE.PREVIEW_TITLE}
            </Text>
            <Text style={styles.introDescription}>
              {UI_STRINGS.COURSE_SHARE.PREVIEW_DESCRIPTION}
            </Text>
          </View>
          <View style={styles.inviterCard} testID='inviter-card'>
            {activeInviterAvatar ? (
              <CachedImage
                source={{ uri: activeInviterAvatar }}
                style={styles.inviterAvatar}
              />
            ) : (
              <View
                style={[styles.inviterAvatar, styles.defaultAvatarPlaceholder]}
                testID='default-avatar-placeholder'>
                <Ionicons name='person' size={20} color={palette.mutedText} />
              </View>
            )}
            <Text style={styles.inviterText} numberOfLines={2}>
              {activeInviterName
                ? `${activeInviterName}${UI_STRINGS.COURSE_SHARE.INVITER_SHARED_SUFFIX}`
                : UI_STRINGS.COURSE_SHARE.DEFAULT_INVITER_SHARED}
            </Text>
          </View>
          <View style={styles.courseCard} testID='course-card'>
            <View style={styles.coverImage} testID='share-cover'>
              {!!coverImage && failedCover !== coverImage && (
                <CachedImage
                  testID='share-cover-image'
                  source={{ uri: coverImage }}
                  style={StyleSheet.absoluteFill}
                  contentFit='cover'
                  onError={() => setFailedCover(coverImage)}
                />
              )}
              <LinearGradient
                colors={[
                  hexToRgba(palette.black, 0),
                  hexToRgba(palette.black, 0.64),
                ]}
                locations={[0.2, 1]}
                style={StyleSheet.absoluteFill}
              />
              {activeDuration ? (
                <View style={styles.durationPill}>
                  <Text style={styles.durationText}>{activeDuration}</Text>
                </View>
              ) : null}
              <Text style={styles.courseTitleText} numberOfLines={3}>
                {activeCourseTitle}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.metaLocationText}>{activeDestination}</Text>
              <Text style={styles.dateText}>
                {[activeStartDate, activeDuration].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomActions}>
          {!isAuthenticated && (
            <Text style={styles.saveHint}>
              {UI_STRINGS.COURSE_SHARE.GUEST_SAVE_HINT}
            </Text>
          )}
          <TouchableOpacity
            testID='btn-save-course'
            accessibilityRole='button'
            disabled={acceptShareLinkMutation.isPending || !shareData}
            accessibilityState={{
              disabled: acceptShareLinkMutation.isPending || !shareData,
              busy: acceptShareLinkMutation.isPending,
            }}
            style={[
              styles.primaryButton,
              (acceptShareLinkMutation.isPending || !shareData) &&
                styles.disabledButton,
            ]}
            activeOpacity={0.85}
            onPress={handleSaveCourse}>
            <Text style={styles.primaryButtonText}>
              {UI_STRINGS.COURSE_SHARE.SAVE_BUTTON}
            </Text>
          </TouchableOpacity>
          <OnboardingButton
            testID='btn-decline-course'
            label={UI_STRINGS.COURSE_SHARE.DECLINE_BUTTON}
            secondary
            onPress={handleDecline}
          />
        </View>
      </ScrollView>
      <Modal
        visible={showLogin && !isAuthenticated}
        transparent
        animationType='fade'
        onRequestClose={() => setShowLogin(false)}>
        <View style={styles.loginOverlay}>
          <Pressable
            testID='dim-overlay'
            accessible={false}
            style={StyleSheet.absoluteFill}
            onPress={() => setShowLogin(false)}
          />
          <Animated.View
            style={[styles.loginSheet, loginEntrance]}
            testID='login-bottom-sheet'
            accessibilityViewIsModal>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <View style={styles.loginHero}>
                <Text style={styles.bannerTitle}>
                  {UI_STRINGS.COURSE_SHARE.LOGIN_REQUIRED_TITLE}
                </Text>
                <Text style={styles.bannerSubDesc}>
                  {UI_STRINGS.COURSE_SHARE.LOGIN_REQUIRED_DESC}
                </Text>
                <View style={styles.loginIllustration} accessible={false} />
              </View>
              <Pressable
                testID='close-share-login'
                accessibilityRole='button'
                accessibilityLabel={UI_STRINGS.COMMON.CLOSE}
                style={styles.loginClose}
                onPress={() => setShowLogin(false)}>
                <Ionicons name='close' size={24} color={palette.white} />
              </Pressable>
              <View style={[styles.authActions, safeAreaStyles.loginActions]}>
                <TouchableOpacity
                  accessibilityRole='button'
                  testID='btn-google-login'
                  style={[
                    styles.googleLoginButton,
                    isLoggingIn && styles.disabledButton,
                  ]}
                  disabled={isLoggingIn}
                  onPress={() => handleSocialLogin('google')}>
                  <CachedImage
                    source={require('../../assets/figma/share/google.png')}
                    style={styles.logoImage}
                    contentFit='contain'
                  />
                  <Text style={styles.googleButtonText}>
                    {UI_STRINGS.AUTH.GOOGLE_BUTTON_TEXT}
                  </Text>
                </TouchableOpacity>
                {isAppleAvailable && (
                  <TouchableOpacity
                    accessibilityRole='button'
                    testID='btn-apple-login'
                    style={[
                      styles.appleLoginButton,
                      isLoggingIn && styles.disabledButton,
                    ]}
                    disabled={isLoggingIn}
                    onPress={() => handleSocialLogin('apple')}>
                    <FigmaAsset
                      source={require('../../assets/figma/share/apple.svg')}
                      width={20}
                      height={20}
                    />
                    <Text style={styles.appleButtonText}>
                      {UI_STRINGS.AUTH.APPLE_BUTTON_TEXT}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.white },
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: palette.subText },
  header: {
    height: 56,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -0.6,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 22, flexGrow: 1 },
  preview: { gap: 16 },
  intro: { gap: 10, marginBottom: 12 },
  introTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -1,
    color: palette.deepNavy,
  },
  introDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.subText,
    letterSpacing: -0.6,
  },
  inviterCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inviterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.gray100,
  },
  defaultAvatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  inviterText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: palette.subText,
    letterSpacing: -0.5,
  },
  courseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: palette.gray100,
  },
  coverImage: {
    height: 200,
    padding: 20,
    justifyContent: 'flex-end',
    backgroundColor: palette.accent,
  },
  courseTitleText: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '600',
    color: palette.white,
    letterSpacing: -0.8,
  },
  durationPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: palette.primary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  durationText: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  cardBody: { paddingHorizontal: 20, paddingVertical: 16, gap: 6 },
  metaLocationText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
    color: palette.deepNavy,
    letterSpacing: -0.8,
  },
  dateText: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.subText,
    letterSpacing: -0.4,
  },
  bottomActions: { paddingTop: 28, marginTop: 'auto', gap: 8 },
  saveHint: {
    textAlign: 'center',
    color: palette.mutedText,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  primaryButton: {
    minHeight: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    padding: 12,
  },
  primaryButtonText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: -0.6,
    color: palette.white,
  },
  loginOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: hexToRgba(palette.black, 0.55),
  },
  loginSheet: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  loginHero: {
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 40,
    minHeight: 284,
  },
  loginIllustration: {
    width: 160,
    height: 130,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  loginClose: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    color: palette.white,
    letterSpacing: -1,
  },
  bannerSubDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.white,
    letterSpacing: -0.4,
    marginTop: 10,
  },
  authActions: {
    gap: 16,
    padding: 20,
    paddingTop: 28,
    marginTop: -24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: palette.white,
  },
  googleLoginButton: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 120,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray300,
  },
  appleLoginButton: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 120,
    backgroundColor: palette.black,
  },
  logoImage: { width: 20, height: 20 },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.deepNavy,
  },
  appleButtonText: { fontSize: 15, fontWeight: '500', color: palette.white },
  disabledButton: { opacity: 0.6 },
});
