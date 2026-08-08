/**
 * @file LoginScreen.tsx
 * @description Google & Apple login UI screen updated to match Figma UI design context with inline gradient title.
 */
import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@yeolo/common';
import { GoogleLogoIcon } from '../components/GoogleLogoIcon';
import { UI_STRINGS } from '../constants';
import { palette, theme } from '../theme/colors';
import { AuthContext } from '../context';
import {
  signInWithGoogle,
  signInWithApple,
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
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom', 'left', 'right']}>
        <LinearGradient
          colors={theme.colors.gradient.loginBackground}
          locations={[0, 0.5, 1]}
          style={styles.gradientContent}>
          <View style={styles.innerContainer}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.subTitle}>{UI_STRINGS.AUTH.SUB_TITLE}</Text>

              {/* Gradient Main Title */}
              <MaskedView
                maskElement={
                  <Text
                    style={[
                      styles.mainTitle,
                      { backgroundColor: 'transparent' },
                    ]}>
                    {UI_STRINGS.AUTH.MAIN_TITLE}
                  </Text>
                }>
                <LinearGradient
                  colors={theme.colors.gradient.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  <Text style={[styles.mainTitle, { opacity: 0 }]}>
                    {UI_STRINGS.AUTH.MAIN_TITLE}
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>

            {/* Google Login Action Button */}
            <TouchableOpacity
              style={[
                styles.googleLoginButton,
                isLoggingIn && styles.disabledButton,
              ]}
              activeOpacity={0.8}
              onPress={handleGoogleLogin}
              disabled={isLoggingIn}>
              <View style={styles.buttonContent}>
                <GoogleLogoIcon size={20} style={styles.logoIcon} />
                <Text style={styles.googleButtonText}>
                  {UI_STRINGS.AUTH.GOOGLE_BUTTON_TEXT}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Apple Login Action Button */}
            {isAppleAvailable && (
              <TouchableOpacity
                style={[
                  styles.appleLoginButton,
                  isLoggingIn && styles.disabledButton,
                ]}
                activeOpacity={0.8}
                onPress={handleAppleLogin}
                disabled={isLoggingIn}
                testID='apple-login-button'>
                <View style={styles.buttonContent}>
                  <Ionicons
                    name='logo-apple'
                    size={20}
                    color={palette.white}
                    style={styles.logoIcon}
                  />
                  <Text style={styles.appleButtonText}>
                    {UI_STRINGS.AUTH.APPLE_BUTTON_TEXT}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Customer Support Footer Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {UI_STRINGS.COMMON.CUSTOMER_SUPPORT_TEXT}
                <Text
                  style={styles.supportLink}
                  onPress={handleSupportLinkPress}
                  testID='customer-support-mailto-link'>
                  {UI_STRINGS.COMMON.CUSTOMER_SUPPORT_LINK}
                </Text>
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenBackground: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  safeArea: {
    flex: 1,
  },
  gradientContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  innerContainer: {
    width: '100%',
    gap: 12,
  },
  titleSection: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  subTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: palette.deepNavy,
    lineHeight: 32,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: palette.primary,
    lineHeight: 50,
    letterSpacing: -0.8,
  },
  googleLoginButton: {
    width: '100%',
    height: 56,
    backgroundColor: palette.white,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: palette.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  appleLoginButton: {
    width: '100%',
    height: 56,
    backgroundColor: palette.black,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: palette.black,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: 0.3,
  },
  appleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.white,
    letterSpacing: 0.3,
  },
  footerContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: palette.subText,
    lineHeight: 20,
  },
  supportLink: {
    color: palette.deepNavy,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
