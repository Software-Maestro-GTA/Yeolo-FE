/**
 * @file analytics.test.ts
 * @description Unit tests for AnalyticsService in @yeolo/common.
 */

import { analyticsService, AnalyticsService, AnalyticsTracker } from '../index';

describe('AnalyticsService (@yeolo/common)', () => {
  let mockTracker: jest.Mocked<AnalyticsTracker>;

  beforeEach(() => {
    analyticsService.clearTrackers();
    mockTracker = {
      logEvent: jest.fn(),
      logScreenView: jest.fn(),
      logButtonClick: jest.fn(),
      setUserId: jest.fn(),
      setUserProperty: jest.fn(),
    };
  });

  test('should register and unregister trackers correctly', () => {
    analyticsService.registerTracker(mockTracker);
    expect(analyticsService.getTrackers()).toContain(mockTracker);

    analyticsService.unregisterTracker(mockTracker);
    expect(analyticsService.getTrackers()).not.toContain(mockTracker);
  });

  test('should dispatch logEvent to all registered trackers', async () => {
    analyticsService.registerTracker(mockTracker);
    await analyticsService.logEvent('test_event', { key: 'value' });

    expect(mockTracker.logEvent).toHaveBeenCalledWith('test_event', {
      key: 'value',
    });
  });

  test('should dispatch logScreenView to all registered trackers', async () => {
    analyticsService.registerTracker(mockTracker);
    await analyticsService.logScreenView('HomeScreen', 'HomeScreenClass');

    expect(mockTracker.logScreenView).toHaveBeenCalledWith(
      'HomeScreen',
      'HomeScreenClass',
    );
  });

  test('should dispatch logButtonClick to all registered trackers', async () => {
    analyticsService.registerTracker(mockTracker);
    await analyticsService.logButtonClick('btn_submit', 'Submit Button', {
      step: 1,
    });

    expect(mockTracker.logButtonClick).toHaveBeenCalledWith(
      'btn_submit',
      'Submit Button',
      { step: 1 },
    );
  });

  test('should set user ID and user properties on trackers', async () => {
    analyticsService.registerTracker(mockTracker);
    await analyticsService.setUserId('user_123');
    await analyticsService.setUserProperty('user_role', 'admin');

    expect(mockTracker.setUserId).toHaveBeenCalledWith('user_123');
    expect(mockTracker.setUserProperty).toHaveBeenCalledWith(
      'user_role',
      'admin',
    );
  });

  test('should handle tracker errors gracefully without throwing', async () => {
    const errorTracker: AnalyticsTracker = {
      logEvent: jest.fn().mockImplementation(() => {
        throw new Error('Tracker failed');
      }),
      logScreenView: jest.fn(),
      logButtonClick: jest.fn(),
    };

    analyticsService.registerTracker(errorTracker);
    await expect(
      analyticsService.logEvent('failing_event'),
    ).resolves.not.toThrow();
  });
});
