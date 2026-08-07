/**
 * @file authService.ts
 * @description Google Sign-in helper functions encapsulating native @react-native-google-signin/google-signin SDK.
 */
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@yeolo/common';
import { UI_STRINGS } from '../constants';

/**
 * Configure the native Google Sign-in SDK.
 * @param webClientId - The OAuth client ID configured in the Google Developer Console for web/backend communication.
 * @param iosClientId - The OAuth client ID configured specifically for iOS client bundling.
 */
export const initializeGoogleSignin = (
  webClientId?: string,
  iosClientId?: string
): void => {
  logger.info('[AuthService] Initializing GoogleSignin with webClientId:', webClientId);
  try {
    if (!webClientId) {
      logger.warn('[AuthService] webClientId가 설정되지 않아 GoogleSignin 구성을 건너뜁니다.');
      return;
    }
    GoogleSignin.configure({
      webClientId,
      iosClientId,
      offlineAccess: true
    });
  } catch (error) {
    logger.error('[AuthService] GoogleSignin initialize error:', error);
  }
};

/**
 * Execute native Google login and extract the authorization code.
 * @returns Promise<string> representing the Google server auth code.
 */
export const signInWithGoogle = async (): Promise<string> => {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  const code = response.data?.serverAuthCode;

  if (!code) {
    throw new Error(UI_STRINGS.AUTH.MISSING_AUTH_CODE_ERROR);
  }

  return code;
};

/**
 * Check if Apple authentication is available on the current device.
 */
export const isAppleAuthAvailable = async (): Promise<boolean> => {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    logger.warn('[AuthService] isAvailableAsync check failed:', error);
    return false;
  }
};

/**
 * Execute native Apple login and extract authorization code & identity token.
 * @returns Promise<{ code: string; idToken: string | null }> representing authorization credentials.
 */
export const signInWithApple = async (): Promise<{ code: string; idToken: string | null }> => {
  logger.info('[AuthService] Executing signInWithApple...');
  const isAvailable = await isAppleAuthAvailable();
  if (!isAvailable) {
    throw new Error('Apple 로그인을 이용할 수 없는 환경 또는 빌드입니다.');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const code = credential.authorizationCode;
  const idToken = credential.identityToken;

  if (!code) {
    throw new Error(UI_STRINGS.AUTH.MISSING_APPLE_CODE_ERROR);
  }

  return { code, idToken };
};

/**
 * Terminate native Google session on logout.
 */
export const signOutGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    logger.warn('[AuthService] Google signout warning:', error);
  }
};

/**
 * Clear local session tokens and user data from AsyncStorage.
 */
export const clearLocalSession = async (): Promise<void> => {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('user');
};

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/**
 * Register a listener to be called when 401 Unauthorized occurs.
 */
export const onUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

/**
 * Trigger session cleanup and notify all registered listeners to redirect to login.
 */
export const notifyUnauthorized = async (): Promise<void> => {
  logger.warn('[AuthService] 401 Unauthorized detected! Clearing local session and redirecting to login...');
  await clearLocalSession();
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      logger.error('[AuthService] Error executing 401 listener:', e);
    }
  });
};
