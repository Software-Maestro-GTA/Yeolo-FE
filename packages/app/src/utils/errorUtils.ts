/**
 * @file errorUtils.ts
 * @description Common utility functions for formatting and displaying user-facing authentication & API error messages.
 */
import { Alert, Platform, ToastAndroid } from 'react-native';
import { logger } from '@yeolo/common';
import { UI_STRINGS } from '../constants';

/**
 * Extract user-friendly error message from ApiError or fallback to defaultMessage.
 */
export const getAuthErrorMessage = (err: any, defaultMessage: string): string => {
  if (err?.name === 'ApiError' && err?.message) {
    return err.message;
  }
  return defaultMessage;
};

/**
 * Display platform-specific error notification (Toast for Android, Alert for iOS/Web).
 */
export const showAuthErrorAlert = (
  err: any,
  defaultMessage: string,
  title: string = UI_STRINGS.AUTH.LOGIN_ERROR_TITLE
): void => {
  logger.error('[AuthError] Detail:', err?.code, err?.message, err);
  const userMessage = getAuthErrorMessage(err, defaultMessage);
  if (Platform.OS === 'android') {
    ToastAndroid.show(userMessage, ToastAndroid.SHORT);
  } else {
    Alert.alert(title, userMessage);
  }
};
