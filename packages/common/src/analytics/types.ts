/**
 * @file types.ts
 * @description Analytics tracking interfaces and GA4 event data models for Yeolo platform.
 */

export interface GA4ScreenViewEvent {
  screen_name: string;
  screen_class?: string;
  [key: string]: any;
}

export interface GA4ButtonClickEvent {
  button_id: string;
  button_name?: string;
  screen_name?: string;
  [key: string]: any;
}

export type GA4EventParams = Record<string, any>;

export interface AnalyticsTracker {
  logEvent(eventName: string, params?: GA4EventParams): Promise<void> | void;
  logScreenView(screenName: string, screenClass?: string): Promise<void> | void;
  logButtonClick(
    buttonId: string,
    buttonName?: string,
    params?: GA4EventParams,
  ): Promise<void> | void;
  setUserId?(userId: string | null): Promise<void> | void;
  setUserProperty?(name: string, value: string | null): Promise<void> | void;
}
