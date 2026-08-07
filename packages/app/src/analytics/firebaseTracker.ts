/**
 * @file firebaseTracker.ts
 * @description React Native Firebase Analytics implementation of AnalyticsTracker for @yeolo/app using Modular SDK API.
 */

import analytics, {
  getAnalytics,
  logEvent as modularLogEvent,
  setUserId as modularSetUserId,
  setUserProperties as modularSetUserProperties,
} from '@react-native-firebase/analytics';
import type { AnalyticsTracker, GA4EventParams } from '@yeolo/common';
import { logger } from '@yeolo/common';

export class AppAnalyticsTracker implements AnalyticsTracker {
  private getAnalyticsInstance() {
    return typeof getAnalytics === 'function' ? getAnalytics() : analytics();
  }

  public async logEvent(eventName: string, params?: GA4EventParams): Promise<void> {
    logger.info(`[AppAnalyticsTracker] logEvent "${eventName}":`, params);
    try {
      if (typeof modularLogEvent === 'function') {
        await modularLogEvent(this.getAnalyticsInstance(), eventName, params);
      } else {
        await analytics().logEvent(eventName, params);
      }
    } catch (error) {
      console.warn(`[AppAnalyticsTracker] Failed to log event "${eventName}":`, error);
    }
  }

  public async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      const eventParams = {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      };
      if (typeof modularLogEvent === 'function') {
        await modularLogEvent(this.getAnalyticsInstance(), 'screen_view', eventParams);
      } else {
        await analytics().logEvent('screen_view', eventParams);
      }
    } catch (error) {
      console.warn(`[AppAnalyticsTracker] Failed to log screen_view "${screenName}":`, error);
    }
  }

  public async logButtonClick(buttonId: string, buttonName?: string, params?: GA4EventParams): Promise<void> {
    try {
      const eventParams = {
        button_id: buttonId,
        button_name: buttonName || buttonId,
        ...params,
      };
      if (typeof modularLogEvent === 'function') {
        await modularLogEvent(this.getAnalyticsInstance(), 'button_click', eventParams);
      } else {
        await analytics().logEvent('button_click', eventParams);
      }
    } catch (error) {
      console.warn(`[AppAnalyticsTracker] Failed to log button_click "${buttonId}":`, error);
    }
  }

  public async setUserId(userId: string | null): Promise<void> {
    try {
      if (typeof modularSetUserId === 'function') {
        await modularSetUserId(this.getAnalyticsInstance(), userId);
      } else {
        await analytics().setUserId(userId);
      }
    } catch (error) {
      console.warn(`[AppAnalyticsTracker] Failed to set user ID:`, error);
    }
  }

  public async setUserProperty(name: string, value: string | null): Promise<void> {
    try {
      if (typeof modularSetUserProperties === 'function') {
        await modularSetUserProperties(this.getAnalyticsInstance(), { [name]: value });
      } else {
        await analytics().setUserProperty(name, value);
      }
    } catch (error) {
      console.warn(`[AppAnalyticsTracker] Failed to set user property "${name}":`, error);
    }
  }
}

export const appAnalyticsTracker = new AppAnalyticsTracker();
