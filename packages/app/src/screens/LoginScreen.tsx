/**
 * @file LoginScreen.tsx
 * @description Google login UI screen matching Figma design context and Google OAuth flow.
 * @requirements REQ-11, REQ-22
 * @functional FUN-1, FUN-GA4
 * @api API-FB-1
 * @author Antigravity Agent
 */
import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ToastAndroid, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleLogoIcon } from '../components/GoogleLogoIcon';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { theme } from '../theme';
import { AuthContext } from '../context';
import { signInWithGoogle, openCustomerSupportMail } from '../services';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface LoginScreenProps {
  onLoginSuccess?: (isNewUser: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  useGA4ScreenTracking('LoginScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const authContext = useContext(AuthContext);
  const loginWithGoogle = authContext?.loginWithGoogle;
  const isLoggingIn = authContext?.isLoading || false;

  const handleGoogleLogin = async () => {
    trackButtonClick('btn_google_login', 'Google OAuth Login Button');
    if (isLoggingIn) return;
    try {
      const code = await signInWithGoogle();
      if (loginWithGoogle) {
        const result = await loginWithGoogle(code);
        onLoginSuccess?.(result?.isNewUser ?? false);
      }
    } catch (err: unknown) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('로그인에 실패했습니다.', ToastAndroid.SHORT);
      }
    }
  };

  const handleSupportLinkPress = async () => {
    trackButtonClick('btn_customer_support_mailto', 'Customer Support Mailto Link');
    try {
      await openCustomerSupportMail();
    } catch (err) {
      console.error('Failed to open customer support mail modal:', err);
    }
  };

  return (
    <LinearGradient
      colors={theme.colors.gradient.background}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Bottom Content Area with Top-fading Gradient Background */}
          <LinearGradient
            colors={theme.colors.gradient.bottom}
            style={styles.bottomContentArea}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.subTitle}>{UI_STRINGS.AUTH.SUB_TITLE}</Text>
              <Text style={styles.mainTitle}>{UI_STRINGS.AUTH.MAIN_TITLE}</Text>
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleGoogleLogin}
              disabled={isLoggingIn}
            >
              <View style={styles.buttonContent}>
                <GoogleLogoIcon size={22} style={styles.logoIcon} />
                <Text style={styles.buttonText}>{UI_STRINGS.AUTH.GOOGLE_BUTTON_TEXT}</Text>
              </View>
            </TouchableOpacity>

            {/* Customer Support Footer Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {UI_STRINGS.COMMON.CUSTOMER_SUPPORT_TEXT}
                <Text
                  style={styles.supportLink}
                  onPress={handleSupportLinkPress}
                  testID="customer-support-mailto-link"
                >
                  {UI_STRINGS.COMMON.CUSTOMER_SUPPORT_LINK}
                </Text>
              </Text>
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomContentArea: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
    width: '100%',
  },
  titleSection: {
    paddingBottom: 32,
    alignItems: 'flex-start',
  },
  subTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: theme.colors.text.primary,
    lineHeight: 32,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: theme.colors.primary,
    lineHeight: 50,
    letterSpacing: -0.8,
  },
  loginButton: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  footerContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  supportLink: {
    color: theme.colors.text.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
