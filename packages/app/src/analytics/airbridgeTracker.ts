/**
 * @file airbridgeTracker.ts
 * @description Airbridge implementation of the shared AnalyticsTracker interface for mobile attribution and event tracking.
 */

import { Airbridge, AirbridgeCategory } from 'airbridge-react-native-sdk';
import type { AnalyticsTracker, GA4EventParams } from '@yeolo/common';
import { logger } from '@yeolo/common';

const STANDARD_EVENT_CATEGORIES: Record<string, string> = {
  login: AirbridgeCategory.SIGN_IN,
  sign_in: AirbridgeCategory.SIGN_IN,
  sign_up: AirbridgeCategory.SIGN_UP,
  logout: AirbridgeCategory.SIGN_OUT,
  sign_out: AirbridgeCategory.SIGN_OUT,
  tutorial_complete: AirbridgeCategory.COMPLETE_TUTORIAL,
  share: AirbridgeCategory.SHARE,
  purchase: AirbridgeCategory.ORDER_COMPLETED,
};

/**
 * Sends the app's shared analytics contract to Airbridge.
 *
 * Firebase-compatible event parameters are forwarded as Airbridge custom
 * attributes so existing screen and button instrumentation needs no changes.
 */
export class AirbridgeAnalyticsTracker implements AnalyticsTracker {
  public logEvent(eventName: string, params?: GA4EventParams): void {
    const category = STANDARD_EVENT_CATEGORIES[eventName] || eventName;
    logger.info(
      `[AirbridgeAnalyticsTracker] trackEvent "${category}":`,
      params,
    );

    try {
      Airbridge.trackEvent(category, undefined, params);
    } catch (error) {
      console.warn(
        `[AirbridgeAnalyticsTracker] Failed to track event "${category}":`,
        error,
      );
    }
  }

  public logScreenView(screenName: string, screenClass?: string): void {
    this.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  }

  public logButtonClick(
    buttonId: string,
    buttonName?: string,
    params?: GA4EventParams,
  ): void {
    this.logEvent('button_click', {
      button_id: buttonId,
      button_name: buttonName || buttonId,
      ...params,
    });
  }

  public setUserId(userId: string | null): void {
    try {
      if (userId) {
        Airbridge.setUserID(userId);
      } else {
        Airbridge.clearUserID();
      }
    } catch (error) {
      console.warn('[AirbridgeAnalyticsTracker] Failed to set user ID:', error);
    }
  }

  public setUserProperty(name: string, value: string | null): void {
    try {
      if (value === null) {
        Airbridge.removeUserAttribute(name);
      } else {
        Airbridge.setUserAttribute(name, value);
      }
    } catch (error) {
      console.warn(
        `[AirbridgeAnalyticsTracker] Failed to set user property "${name}":`,
        error,
      );
    }
  }
}

export const airbridgeAnalyticsTracker = new AirbridgeAnalyticsTracker();
