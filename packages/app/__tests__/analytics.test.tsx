/**
 * @file analytics.test.tsx
 * @description Unit tests for AppAnalyticsTracker and hooks in @yeolo/app.
 */

import { AppAnalyticsTracker } from '../src/analytics/firebaseTracker';
import { analyticsService } from '@yeolo/common';
import { logEvent, setUserId, setUserProperties } from '@react-native-firebase/analytics';

describe('App Analytics (@yeolo/app)', () => {
  let tracker: AppAnalyticsTracker;

  beforeEach(() => {
    tracker = new AppAnalyticsTracker();
    analyticsService.clearTrackers();
    jest.clearAllMocks();
  });

  test('logEvent should delegate to modular firebase analytics logEvent', async () => {
    await tracker.logEvent('test_app_event', { screen: 'home' });
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'test_app_event', { screen: 'home' });
  });

  test('logScreenView should delegate to modular firebase analytics logEvent with screen_view event', async () => {
    await tracker.logScreenView('HomeScreen', 'HomeScreenClass');
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'screen_view', {
      screen_name: 'HomeScreen',
      screen_class: 'HomeScreenClass',
    });
  });

  test('logButtonClick should delegate to modular firebase analytics logEvent with button_click', async () => {
    await tracker.logButtonClick('btn_app_start', 'App Start Button', { extra: 'data' });
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'button_click', {
      button_id: 'btn_app_start',
      button_name: 'App Start Button',
      extra: 'data',
    });
  });

  test('setUserId and setUserProperty should delegate to modular firebase analytics', async () => {
    await tracker.setUserId('user_app_99');
    expect(setUserId).toHaveBeenCalledWith(expect.anything(), 'user_app_99');

    await tracker.setUserProperty('membership', 'gold');
    expect(setUserProperties).toHaveBeenCalledWith(expect.anything(), { membership: 'gold' });
  });

  test('analyticsService integration with AppAnalyticsTracker', async () => {
    analyticsService.registerTracker(tracker);
    await analyticsService.logScreenView('CourseListScreen');

    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'screen_view', {
      screen_name: 'CourseListScreen',
      screen_class: 'CourseListScreen',
    });
  });
});
