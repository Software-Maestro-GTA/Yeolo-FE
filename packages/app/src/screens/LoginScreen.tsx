/**
 * @file LoginScreen.tsx
 * @description Platform-aware OAuth login with native provider labels, standalone logos and UI v3 safe-area actions.
 */
import { Text } from '../components/common/Typography';
import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@yeolo/common';
import { UI_STRINGS } from '../constants';
import { palette } from '../theme/colors';
import { ONBOARDING_UI_STRINGS } from '../constants/onboardingUiStrings';
import { AuthContext, useBackground } from '../context';
import {
  signInWithGoogle,
  signInWithApple,
  signOutGoogle,
  isAppleAuthAvailable,
  openCustomerSupportMail,
} from '../services';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { showAuthErrorAlert } from '../utils';

export interface LoginScreenProps {
  onLoginSuccess?: (doOnboarding: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  useGA4ScreenTracking('LoginScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const { setBackground, resetBackground } = useBackground();

  useEffect(() => {
    setBackground({ backgroundColor: palette.primary });
    return resetBackground;
  }, [setBackground, resetBackground]);

  const authContext = useContext(AuthContext);
  const loginWithGoogle = authContext?.loginWithGoogle;
  const loginWithApple = authContext?.loginWithApple;
  const [isLocalLoggingIn, setIsLocalLoggingIn] = useState<boolean>(false);
  const isLoggingIn = authContext?.isLoading || isLocalLoggingIn;

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

  const handleGoogleLogin = async () => {
    trackButtonClick('btn_google_login', 'Google OAuth Login Button');
    if (isLoggingIn) return;
    setIsLocalLoggingIn(true);
    try {
      const code = await signInWithGoogle();
      if (loginWithGoogle) {
        const result = await loginWithGoogle(code);
        onLoginSuccess?.(result.doOnboarding);
      }
    } catch (err: any) {
      if (
        err?.code === 'ERR_REQUEST_CANCELED' ||
        err?.code === 'SIGN_IN_CANCELLED'
      ) {
        return;
      }
      await signOutGoogle();
      showAuthErrorAlert(err, UI_STRINGS.AUTH.GOOGLE_LOGIN_FAIL_DEFAULT);
    } finally {
      setIsLocalLoggingIn(false);
    }
  };

  const handleAppleLogin = async () => {
    trackButtonClick('btn_apple_login', 'Apple OAuth Login Button');
    if (isLoggingIn) return;
    setIsLocalLoggingIn(true);
    try {
      const { code, idToken } = await signInWithApple();
      if (loginWithApple) {
        const result = await loginWithApple({ code, idToken });
        onLoginSuccess?.(result.doOnboarding);
      }
    } catch (err: any) {
      if (
        err?.code === 'ERR_REQUEST_CANCELED' ||
        err?.code === 'SIGN_IN_CANCELLED'
      ) {
        return;
      }
      showAuthErrorAlert(err, UI_STRINGS.AUTH.APPLE_LOGIN_FAIL_DEFAULT);
    } finally {
      setIsLocalLoggingIn(false);
    }
  };

  const handleSupportLinkPress = async () => {
    trackButtonClick(
      'btn_customer_support_mailto',
      'Customer Support Mailto Link',
    );
    try {
      await openCustomerSupportMail();
    } catch (err) {
      logger.error(
        '[LoginScreen] Failed to open customer support mail modal:',
        err,
      );
    }
  };

  return (
    <View style={styles.screenBackground}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={[styles.hero, !isAppleAvailable && styles.androidHero]}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>
              {ONBOARDING_UI_STRINGS.LOGIN_TITLE}
            </Text>
            <Text style={styles.subTitle}>{UI_STRINGS.AUTH.SUB_TITLE}</Text>
          </View>
          <View
            style={styles.heroIllustration}
            testID='login-hero-illustration'
            accessible={false}
          />
        </View>
        <SafeAreaView style={styles.bottomCardContainer} edges={['bottom']}>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel={ONBOARDING_UI_STRINGS.GOOGLE_LOGIN}
            accessibilityState={{ disabled: isLoggingIn, busy: isLoggingIn }}
            style={[
              styles.providerButton,
              styles.googleLoginButton,
              isLoggingIn && styles.disabledButton,
            ]}
            onPress={handleGoogleLogin}
            disabled={isLoggingIn}
            activeOpacity={0.8}
            testID='google-login-button'>
            <View style={styles.providerLogo} accessible={false}>
              <Image
                source={require('../../assets/figma/share/google.png')}
                style={styles.googleLogo}
                resizeMode='contain'
                accessible={false}
              />
            </View>
            <Text
              style={[styles.providerLabel, styles.googleLabel]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {ONBOARDING_UI_STRINGS.GOOGLE_LOGIN}
            </Text>
          </TouchableOpacity>
          {isAppleAvailable && (
            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel={ONBOARDING_UI_STRINGS.APPLE_LOGIN}
              accessibilityState={{ disabled: isLoggingIn, busy: isLoggingIn }}
              style={[
                styles.providerButton,
                styles.appleLoginButton,
                isLoggingIn && styles.disabledButton,
              ]}
              onPress={handleAppleLogin}
              disabled={isLoggingIn}
              activeOpacity={0.8}
              testID='apple-login-button'>
              <View style={styles.providerLogo} accessible={false}>
                <Ionicons
                  name='logo-apple'
                  size={24}
                  color={palette.white}
                  accessible={false}
                />
              </View>
              <Text
                style={[styles.providerLabel, styles.appleLabel]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {ONBOARDING_UI_STRINGS.APPLE_LOGIN}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.footerText}>
            {UI_STRINGS.COMMON.CUSTOMER_SUPPORT_TEXT}
            <Text
              style={styles.supportLink}
              onPress={handleSupportLinkPress}
              testID='customer-support-mailto-link'>
              {UI_STRINGS.COMMON.CUSTOMER_SUPPORT_LINK}
            </Text>
          </Text>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenBackground: { flex: 1, backgroundColor: palette.primary },
  content: { flexGrow: 1 },
  hero: { flexGrow: 1, minHeight: 526, paddingTop: 50, overflow: 'hidden' },
  androidHero: { minHeight: 566 },
  titleSection: { paddingHorizontal: 24, gap: 19 },
  mainTitle: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -1,
    color: palette.white,
  },
  subTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: -1,
    color: palette.white,
  },
  heroIllustration: {
    width: 267,
    height: 267,
    alignSelf: 'flex-end',
    marginRight: -21,
    marginTop: 48,
    marginBottom: 10,
  },
  bottomCardContainer: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    alignItems: 'center',
  },
  providerButton: {
    width: '100%',
    maxWidth: 350,
    height: 62,
    borderRadius: 120,
    paddingHorizontal: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  googleLoginButton: {
    borderWidth: 1,
    borderColor: palette.gray300,
    backgroundColor: palette.white,
  },
  appleLoginButton: { backgroundColor: palette.black },
  providerLogo: {
    position: 'absolute',
    left: 24,
    top: 19,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: { width: 24, height: 24 },
  providerLabel: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    textAlign: 'center',
  },
  googleLabel: { color: palette.black },
  appleLabel: { color: palette.white },
  footerText: {
    marginTop: 6,
    fontSize: 12,
    color: palette.subText,
    lineHeight: 18,
    textAlign: 'center',
  },
  supportLink: {
    color: palette.deepNavy,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  disabledButton: { opacity: 0.6 },
});
