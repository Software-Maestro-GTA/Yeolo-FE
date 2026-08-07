/**
 * @file AnalyticsService.ts
 * @description Facade service for dispatching GA4 tracking events to registered trackers.
 */

import type { AnalyticsTracker, GA4EventParams } from './types';
import { logger } from '../utils/logger';


export class AnalyticsService {
  private static instance: AnalyticsService;
  private trackers: AnalyticsTracker[] = [];

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public registerTracker(tracker: AnalyticsTracker): void {
    if (!this.trackers.includes(tracker)) {
      this.trackers.push(tracker);
    }
  }

  public unregisterTracker(tracker: AnalyticsTracker): void {
    this.trackers = this.trackers.filter((t) => t !== tracker);
  }

  public clearTrackers(): void {
    this.trackers = [];
  }

  public getTrackers(): AnalyticsTracker[] {
    return [...this.trackers];
  }

  public async logEvent(eventName: string, params?: GA4EventParams): Promise<void> {
    logger.info(`[AnalyticsService] logEvent "${eventName}":`, params);
    await Promise.all(
      this.trackers.map(async (tracker) => {
        try {
          await tracker.logEvent(eventName, params);
        } catch (error) {
          console.error(`[AnalyticsService] Error logging event "${eventName}":`, error);
        }
      })
    );
  }

  public async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    logger.info(`[AnalyticsService] logScreenView "${screenName}":`, screenClass);
    await Promise.all(
      this.trackers.map(async (tracker) => {
        try {
          await tracker.logScreenView(screenName, screenClass);
        } catch (error) {
          console.error(`[AnalyticsService] Error logging screen_view "${screenName}":`, error);
        }
      })
    );
  }

  public async logButtonClick(
    buttonId: string,
    buttonName?: string,
    params?: GA4EventParams
  ): Promise<void> {
    logger.info(`[AnalyticsService] logButtonClick "${buttonId}":`, buttonName, params);
    await Promise.all(
      this.trackers.map(async (tracker) => {
        try {
          await tracker.logButtonClick(buttonId, buttonName, params);
        } catch (error) {
          console.error(`[AnalyticsService] Error logging button_click "${buttonId}":`, error);
        }
      })
    );
  }

  public async setUserId(userId: string | null): Promise<void> {
    logger.info(`[AnalyticsService] setUserId:`, userId);
    await Promise.all(
      this.trackers.map(async (tracker) => {
        try {
          if (tracker.setUserId) {
            await tracker.setUserId(userId);
          }
        } catch (error) {
          console.error(`[AnalyticsService] Error setting user ID:`, error);
        }
      })
    );
  }

  public async setUserProperty(name: string, value: string | null): Promise<void> {
    logger.info(`[AnalyticsService] setUserProperty "${name}":`, value);
    await Promise.all(
      this.trackers.map(async (tracker) => {
        try {
          if (tracker.setUserProperty) {
            await tracker.setUserProperty(name, value);
          }
        } catch (error) {
          console.error(`[AnalyticsService] Error setting user property "${name}":`, error);
        }
      })
    );
  }
}

export const analyticsService = AnalyticsService.getInstance();
