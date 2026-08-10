/**
 * @file CourseShareScreen.tsx
 * @description Screen component for viewing shared travel itineraries, supporting authenticated course saving and guest login prompt bottom sheet (API-SHARE-2, API-SHARE-3).
 */
import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import {
  useShareLinkDetailQuery,
  useAcceptShareLinkMutation,
} from '../hooks/queries';
import {
  getDestinationImageUrl,
  signInWithGoogle,
  signInWithApple,
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
  const { trackButtonClick } = useGA4ButtonClick();

  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated;

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
        '공유 링크 오류',
        '만료되었거나 유효하지 않은 공유 링크입니다.',
        [
          {
            text: '확인',
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

  const coverImage = getDestinationImageUrl(
    course?.destinationCountry || '',
    course?.destinationCity || '',
  );

  const handleSaveCourse = () => {
    trackButtonClick('btn_save_shared_course', 'Save Shared Course Click');

    if (shareToken) {
      acceptShareLinkMutation.mutate(shareToken, {
        onSuccess: (res) => {
          Alert.alert(
            UI_STRINGS.COURSE_SHARE.SAVE_SUCCESS_TITLE,
            UI_STRINGS.COURSE_SHARE.SAVE_SUCCESS_MESSAGE,
          );
          onSaveSuccess?.(res.courseId || courseId);
        },
        onError: (err: any) => {
          if (err?.status === 400) {
            Alert.alert('안내', '이미 저장된 코스입니다.', [
              {
                text: '확인',
                onPress: () => onSaveSuccess?.(courseId),
              },
            ]);
          } else {
            Alert.alert(
              '저장 실패',
              err?.message || '코스 저장에 실패했습니다.',
            );
          }
        },
      });
    } else {
      if (onSaveSuccess) {
        onSaveSuccess(courseId);
      }
      Alert.alert(
        UI_STRINGS.COURSE_SHARE.SAVE_SUCCESS_TITLE,
        UI_STRINGS.COURSE_SHARE.SAVE_SUCCESS_MESSAGE,
      );
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
      <SafeAreaView style={[styles.container, styles.centerContainer]}>
        <Text style={styles.loadingText}>공유된 코스를 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      testID='course-share-screen'
      edges={['top', 'bottom']}>
      {/* Background Glow */}
      <View style={styles.bgGlow} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Centered Main Content */}
        <View style={styles.centeredContent}>
          {/* Header Title */}
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>
              {UI_STRINGS.COURSE_SHARE.HEADER_TITLE}
            </Text>
          </View>

          {/* Inviter Card */}
          <View style={styles.inviterCard} testID='inviter-card'>
            {activeInviterAvatar ? (
              <Image
                source={{ uri: activeInviterAvatar }}
                style={styles.inviterAvatar}
              />
            ) : (
              <View
                style={[styles.inviterAvatar, styles.defaultAvatarPlaceholder]}
                testID='default-avatar-placeholder'>
                <Ionicons name='person' size={32} color={palette.gray400} />
              </View>
            )}
            <Text style={styles.inviterText} numberOfLines={1}>
              {activeInviterName
                ? `${activeInviterName}${UI_STRINGS.COURSE_SHARE.INVITER_SHARED_SUFFIX}`
                : '여행 코스를 공유했습니다'}
            </Text>
          </View>

          {/* Course Preview Card */}
          <View style={styles.courseCard} testID='course-card'>
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
            <View style={styles.cardBody}>
              {activeCourseTitle ? (
                <Text style={styles.courseTitleText} numberOfLines={1}>
                  {activeCourseTitle}
                </Text>
              ) : null}
              {activeDestination ? (
                <Text style={styles.metaLocationText}>{activeDestination}</Text>
              ) : null}
              {(activeStartDate || activeDuration) && (
                <>
                  <View style={styles.cardDivider} />
                  <View style={styles.dateRow}>
                    <Ionicons
                      name='calendar-outline'
                      size={14}
                      color={palette.subText}
                    />
                    <Text style={styles.dateText}>
                      {[activeStartDate, activeDuration]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            testID='btn-save-course'
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleSaveCourse}>
            <Text style={styles.primaryButtonText}>
              {UI_STRINGS.COURSE_SHARE.SAVE_BUTTON}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='btn-decline-course'
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={handleDecline}>
            <Text style={styles.secondaryButtonText}>
              {UI_STRINGS.COURSE_SHARE.DECLINE_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Guest Login Required Bottom Sheet & Dim Overlay */}
      {!isAuthenticated && (
        <>
          <View style={styles.dimOverlay} testID='dim-overlay' />
          <View style={styles.bottomSheet} testID='login-bottom-sheet'>
            <View style={styles.handleBar} />

            <View style={styles.bannerCard}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name='lock-closed'
                  size={20}
                  color={palette.primary}
                />
              </View>
              <Text style={styles.bannerTitle}>
                {UI_STRINGS.COURSE_SHARE.LOGIN_REQUIRED_TITLE}
              </Text>
              <Text style={styles.bannerSubDesc}>
                {UI_STRINGS.COURSE_SHARE.LOGIN_REQUIRED_DESC}
              </Text>
            </View>

            <View style={styles.authActions}>
              {/* Google Login Button */}
              <TouchableOpacity
                testID='btn-google-login'
                style={[styles.googleBtn, isLoggingIn && styles.disabledButton]}
                activeOpacity={0.85}
                disabled={isLoggingIn}
                onPress={() => handleSocialLogin('google')}>
                <Ionicons
                  name='logo-google'
                  size={18}
                  color='#4285F4'
                  style={styles.socialIcon}
                />
                <Text style={styles.googleBtnText}>
                  {UI_STRINGS.COURSE_SHARE.GOOGLE_LOGIN_BUTTON}
                </Text>
              </TouchableOpacity>

              {/* Apple Login Button */}
              {isAppleAvailable && (
                <TouchableOpacity
                  testID='btn-apple-login'
                  style={[
                    styles.appleBtn,
                    isLoggingIn && styles.disabledButton,
                  ]}
                  activeOpacity={0.85}
                  disabled={isLoggingIn}
                  onPress={() => handleSocialLogin('apple')}>
                  <Ionicons
                    name='logo-apple'
                    size={20}
                    color={palette.white}
                    style={styles.socialIcon}
                  />
                  <Text style={styles.appleBtnText}>
                    {UI_STRINGS.COURSE_SHARE.APPLE_LOGIN_BUTTON}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: palette.subText,
  },
  bgGlow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(224, 247, 241, 0.7)',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  centeredContent: {
    gap: 24,
  },
  headerBox: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  inviterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  inviterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.lightTeal,
  },
  defaultAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviterText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.deepNavy,
    flex: 1,
  },
  courseCard: {
    backgroundColor: palette.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.gray200,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: 20,
    gap: 8,
  },
  courseTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  metaLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.subText,
  },
  cardDivider: {
    height: 1,
    backgroundColor: palette.gray200,
    marginVertical: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '400',
    color: palette.mutedText,
  },
  bottomActions: {
    width: '100%',
    gap: 12,
    marginTop: 32,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 54,
    backgroundColor: palette.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.mutedText,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13, 33, 55, 0.55)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 20,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.gray400,
    alignSelf: 'center',
    marginBottom: 8,
  },
  bannerCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  bannerSubDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: palette.subText,
    textAlign: 'center',
  },
  authActions: {
    gap: 12,
    width: '100%',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 16,
    gap: 10,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: palette.deepNavy,
    borderRadius: 16,
    gap: 10,
  },
  appleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.white,
  },
  socialIcon: {
    marginRight: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
