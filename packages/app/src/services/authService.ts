/**
 * @file authService.ts
 * @description Google Sign-in helper functions encapsulating native @react-native-google-signin/google-signin SDK.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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
  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: true,
  });
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
 * Terminate native Google session on logout.
 */
export const signOutGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.warn('Google signout warning:', error);
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
      console.error('[AuthService] Error executing 401 listener:', e);
    }
  });
};
