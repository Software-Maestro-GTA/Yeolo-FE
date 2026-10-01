/**
 * @file analytics.test.tsx
 * @description Unit tests for Firebase and Airbridge analytics trackers in @yeolo/app.
 */

import { AppAnalyticsTracker } from '../src/analytics/firebaseTracker';
import { AirbridgeAnalyticsTracker } from '../src/analytics/airbridgeTracker';
import { analyticsService } from '@yeolo/common';
import {
  logEvent,
  setUserId,
  setUserProperties,
} from '@react-native-firebase/analytics';
import { Airbridge } from 'airbridge-react-native-sdk';

describe('App Analytics (@yeolo/app)', () => {
  let tracker: AppAnalyticsTracker;

  beforeEach(() => {
    tracker = new AppAnalyticsTracker();
    analyticsService.clearTrackers();
    jest.clearAllMocks();
  });

  test('logEvent should delegate to modular firebase analytics logEvent', async () => {
    await tracker.logEvent('test_app_event', { screen: 'home' });
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'test_app_event', {
      screen: 'home',
    });
  });

  test('logScreenView should delegate to modular firebase analytics logEvent with screen_view event', async () => {
    await tracker.logScreenView('HomeScreen', 'HomeScreenClass');
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'screen_view', {
      screen_name: 'HomeScreen',
      screen_class: 'HomeScreenClass',
    });
  });

  test('logButtonClick should delegate to modular firebase analytics logEvent with button_click', async () => {
    await tracker.logButtonClick('btn_app_start', 'App Start Button', {
      extra: 'data',
    });
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
    expect(setUserProperties).toHaveBeenCalledWith(expect.anything(), {
      membership: 'gold',
    });
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

describe('Airbridge Analytics (@yeolo/app)', () => {
  let tracker: AirbridgeAnalyticsTracker;

  beforeEach(() => {
    tracker = new AirbridgeAnalyticsTracker();
    analyticsService.clearTrackers();
    jest.clearAllMocks();
  });

  test('logEvent should send custom events and attributes to Airbridge', () => {
    tracker.logEvent('course_created', { course_id: 'course-1' });

    expect(Airbridge.trackEvent).toHaveBeenCalledWith(
      'course_created',
      undefined,
      { course_id: 'course-1' },
    );
  });

  test('logEvent should map recommended auth events to Airbridge standard categories', () => {
    tracker.logEvent('login', { method: 'google' });

    expect(Airbridge.trackEvent).toHaveBeenCalledWith(
      'airbridge.user.signin',
      undefined,
      { method: 'google' },
    );
  });

  test('screen and button events should preserve existing analytics attributes', () => {
    tracker.logScreenView('HomeScreen');
    tracker.logButtonClick('btn_create_course', 'Create course', {
      source: 'home',
    });

    expect(Airbridge.trackEvent).toHaveBeenNthCalledWith(
      1,
      'screen_view',
      undefined,
      {
        screen_name: 'HomeScreen',
        screen_class: 'HomeScreen',
      },
    );
    expect(Airbridge.trackEvent).toHaveBeenNthCalledWith(
      2,
      'button_click',
      undefined,
      {
        button_id: 'btn_create_course',
        button_name: 'Create course',
        source: 'home',
      },
    );
  });

  test('user identity and properties should be set and cleared', () => {
    tracker.setUserId('user-99');
    tracker.setUserProperty('membership', 'gold');
    tracker.setUserProperty('membership', null);
    tracker.setUserId(null);

    expect(Airbridge.setUserID).toHaveBeenCalledWith('user-99');
    expect(Airbridge.setUserAttribute).toHaveBeenCalledWith(
      'membership',
      'gold',
    );
    expect(Airbridge.removeUserAttribute).toHaveBeenCalledWith('membership');
    expect(Airbridge.clearUserID).toHaveBeenCalled();
  });
});
