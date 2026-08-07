/**
 * @file CourseShareScreen.tsx
 * @description Screen component for viewing shared travel itineraries, supporting authenticated course saving and guest login prompt bottom sheet.
 */
import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface CourseShareScreenProps {
  courseId?: string;
  inviterName?: string;
  inviterAvatar?: string;
  destination?: string;
  startDate?: string;
  duration?: string;
  courseTitle?: string;
  coverImage?: string;
  onSaveSuccess?: () => void;
  onDecline?: () => void;
  onNavigateToLogin?: () => void;
}

const DEFAULT_INVITER_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80';

export const CourseShareScreen: React.FC<CourseShareScreenProps> = ({
  inviterName = '김선규',
  inviterAvatar = DEFAULT_INVITER_AVATAR,
  destination = '대한민국 · 서울',
  startDate = '2026-08-19',
  duration = '3일',
  courseTitle = '예술과 야경을 즐기는 여정',
  coverImage = DEFAULT_COVER_IMAGE,
  onSaveSuccess,
  onDecline,
  onNavigateToLogin,
}) => {
  useGA4ScreenTracking('CourseShareScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated;

  const handleSaveCourse = () => {
    trackButtonClick('btn_save_shared_course', 'Save Shared Course Click');
    if (onSaveSuccess) {
      onSaveSuccess();
    }
    Alert.alert(
      UI_STRINGS.COURSE_SHARE.SAVE_SUCCESS_TITLE,
      UI_STRINGS.COURSE_SHARE.SAVE_SUCCESS_MESSAGE
    );
  };

  const handleDecline = () => {
    trackButtonClick('btn_decline_shared_course', 'Decline Shared Course Click');
    if (onDecline) {
      onDecline();
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    trackButtonClick(`btn_share_login_${provider}`, `Share Login ${provider} Click`);
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="course-share-screen" edges={['top', 'bottom']}>
      {/* Background Glow */}
      <View style={styles.bgGlow} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Centered Main Content */}
        <View style={styles.centeredContent}>
          {/* Header Title */}
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>{UI_STRINGS.COURSE_SHARE.HEADER_TITLE}</Text>
          </View>

          {/* Inviter Card */}
          <View style={styles.inviterCard} testID="inviter-card">
            <Image source={{ uri: inviterAvatar }} style={styles.inviterAvatar} />
            <Text style={styles.inviterText} numberOfLines={1}>
              {`${inviterName}${UI_STRINGS.COURSE_SHARE.INVITER_SHARED_SUFFIX}`}
            </Text>
          </View>

          {/* Course Preview Card */}
          <View style={styles.courseCard} testID="course-card">
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
            <View style={styles.cardBody}>
              <Text style={styles.courseTitleText} numberOfLines={1}>
                {courseTitle}
              </Text>
              <Text style={styles.metaLocationText}>{destination}</Text>
              <View style={styles.cardDivider} />
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={palette.subText} />
                <Text style={styles.dateText}>{`${startDate} · ${duration}`}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            testID="btn-save-course"
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleSaveCourse}
          >
            <Text style={styles.primaryButtonText}>{UI_STRINGS.COURSE_SHARE.SAVE_BUTTON}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-decline-course"
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={handleDecline}
          >
            <Text style={styles.secondaryButtonText}>{UI_STRINGS.COURSE_SHARE.DECLINE_BUTTON}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Guest Login Required Bottom Sheet & Dim Overlay */}
      {!isAuthenticated && (
        <>
          <View style={styles.dimOverlay} testID="dim-overlay" />
          <View style={styles.bottomSheet} testID="login-bottom-sheet">
            <View style={styles.handleBar} />

            <View style={styles.bannerCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed" size={20} color={palette.primary} />
              </View>
              <Text style={styles.bannerTitle}>{UI_STRINGS.COURSE_SHARE.LOGIN_REQUIRED_TITLE}</Text>
              <Text style={styles.bannerSubDesc}>{UI_STRINGS.COURSE_SHARE.LOGIN_REQUIRED_DESC}</Text>
            </View>

            <View style={styles.authActions}>
              {/* Google Login Button */}
              <TouchableOpacity
                testID="btn-google-login"
                style={styles.googleBtn}
                activeOpacity={0.85}
                onPress={() => handleSocialLogin('google')}
              >
                <Ionicons name="logo-google" size={18} color="#4285F4" style={styles.socialIcon} />
                <Text style={styles.googleBtnText}>{UI_STRINGS.COURSE_SHARE.GOOGLE_LOGIN_BUTTON}</Text>
              </TouchableOpacity>

              {/* Apple Login Button */}
              <TouchableOpacity
                testID="btn-apple-login"
                style={styles.appleBtn}
                activeOpacity={0.85}
                onPress={() => handleSocialLogin('apple')}
              >
                <Ionicons name="logo-apple" size={20} color={palette.white} style={styles.socialIcon} />
                <Text style={styles.appleBtnText}>{UI_STRINGS.COURSE_SHARE.APPLE_LOGIN_BUTTON}</Text>
              </TouchableOpacity>
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
    backgroundColor: palette.softMint, // #F5FAF8
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
    color: palette.deepNavy, // #0D2137
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
    backgroundColor: palette.primary, // #2D7DD2
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

  /* Guest Login Bottom Sheet Styles */
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
});
