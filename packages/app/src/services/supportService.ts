/**
 * @file supportService.ts
 * @description In-app customer support service supporting In-App MailComposer modal via expo-mail-composer.
 */
import { Linking, Alert } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { logger } from '@yeolo/common';
import { APP_CONFIG, UI_STRINGS } from '../constants';

export interface OpenSupportMailOptions {
  subject?: string;
  body?: string;
}

/**
 * Open In-App MailComposer modal for customer support.
 * Retains full app focus so users return immediately to Yeolo without restarting.
 */
export async function openCustomerSupportMail(
  options: OpenSupportMailOptions = {},
): Promise<void> {
  const recipient = APP_CONFIG.DEFAULT_SUPPORT_EMAIL;
  const defaultSubject =
    options.subject || UI_STRINGS.COMMON.SUPPORT_MAIL_DEFAULT_SUBJECT;
  const defaultBody =
    options.body || UI_STRINGS.COMMON.SUPPORT_MAIL_DEFAULT_BODY;

  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: [recipient],
        subject: defaultSubject,
        body: defaultBody,
      });
      return;
    }
  } catch (composerErr) {
    logger.warn(
      '[SupportService] MailComposer failed or not available:',
      composerErr,
    );
  }

  // Fallback to mailto link if MailComposer is unavailable
  const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(defaultBody)}`;
  try {
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
      return;
    }
  } catch (linkErr) {
    logger.warn('[SupportService] canOpenURL failed:', linkErr);
  }

  // Final fallback: Try opening raw mailto URL directly or alert user with support email
  try {
    await Linking.openURL(mailtoUrl);
  } catch (err) {
    logger.warn('[SupportService] Final mailto openURL failed:', err);
    Alert.alert(
      UI_STRINGS.COMMON.SUPPORT_EMAIL_TITLE,
      `${UI_STRINGS.COMMON.SUPPORT_EMAIL_FAIL_ALERT}${recipient}`,
    );
  }
}
