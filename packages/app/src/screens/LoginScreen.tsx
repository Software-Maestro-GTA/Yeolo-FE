/**
 * @file LoginScreen.tsx
 * @description Google login UI screen matching Figma design context and Google OAuth flow.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GoogleLogoIcon from '../components/GoogleLogoIcon';
import { AUTH_CONSTANTS, BRAND_COLORS } from '../constants/auth';
import { AuthContext } from '../context/AuthContext';
import { signInWithGoogle } from '../services/authService';

const LoginScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const loginWithGoogle = authContext?.loginWithGoogle;
  const isLoggingIn = authContext?.isLoading || false;

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    try {
      // 1. Retrieve the authorization code via Google SDK
      const code = await signInWithGoogle();
      // 2. Submit authorization code to the backend via AuthContext
      if (loginWithGoogle) {
        await loginWithGoogle(code);
      }
    } catch (error: any) {
      Alert.alert('로그인 오류', error.message || 'Google 로그인에 실패했습니다.');
    }
  };

  return (
    <LinearGradient
      colors={BRAND_COLORS.BACKGROUND_GRADIENT}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Bottom Content Area with Top-fading Gradient Background */}
          <LinearGradient
            colors={BRAND_COLORS.BOTTOM_GRADIENT}
            style={styles.bottomContentArea}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.subTitle}>{AUTH_CONSTANTS.SUB_TITLE}</Text>
              <Text style={styles.mainTitle}>{AUTH_CONSTANTS.MAIN_TITLE}</Text>
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleGoogleLogin}
              disabled={isLoggingIn}
            >
              <View style={styles.buttonContent}>
                <GoogleLogoIcon size={20} style={styles.logoIcon} />
                <Text style={styles.buttonText}>{AUTH_CONSTANTS.GOOGLE_BUTTON_TEXT}</Text>
              </View>
            </TouchableOpacity>

            {/* Customer Support Footer Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {AUTH_CONSTANTS.CUSTOMER_SUPPORT_TEXT}
                <Text style={styles.supportLink}>
                  {AUTH_CONSTANTS.CUSTOMER_SUPPORT_LINK}
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
    color: BRAND_COLORS.TEXT_DARK,
    lineHeight: 32,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: BRAND_COLORS.PRIMARY,
    lineHeight: 50,
    letterSpacing: -0.8,
  },
  loginButton: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    backgroundColor: BRAND_COLORS.BUTTON_BACKGROUND,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND_COLORS.BUTTON_TEXT,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  footerContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: BRAND_COLORS.TEXT_MUTED,
    lineHeight: 20,
    textAlign: 'center',
  },
  supportLink: {
    color: BRAND_COLORS.PRIMARY,
    fontWeight: '500',
  },
});

export default LoginScreen;
