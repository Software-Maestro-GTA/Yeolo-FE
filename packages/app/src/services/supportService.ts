/**
 * @file supportService.ts
 * @description In-app customer support service supporting In-App MailComposer modal via expo-mail-composer.
 * @requirements REQ-11, REQ-12
 * @functional FUN-4
 * @api N/A
 * @author Antigravity Agent
 */
import { Linking } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { APP_CONFIG } from '../constants';

export interface OpenSupportMailOptions {
  subject?: string;
  body?: string;
}

/**
 * Open In-App MailComposer modal for customer support.
 * Retains full app focus so users return immediately to Yeolo without restarting.
 */
export async function openCustomerSupportMail(options: OpenSupportMailOptions = {}): Promise<void> {
  const isAvailable = await MailComposer.isAvailableAsync();
  const recipient = APP_CONFIG.DEFAULT_SUPPORT_EMAIL;

  if (isAvailable) {
    await MailComposer.composeAsync({
      recipients: [recipient],
      subject: options.subject || '[여로] 고객 지원 및 문의',
      body: options.body || '여로 서비스 이용 중 문의사항이나 개선 의견을 자유롭게 작성해주세요.\n\n-------------------\n',
    });
  } else {
    // Fallback to mailto link if MailComposer is unavailable
    const mailtoUrl = `mailto:${recipient}`;
    await Linking.openURL(mailtoUrl);
  }
}
