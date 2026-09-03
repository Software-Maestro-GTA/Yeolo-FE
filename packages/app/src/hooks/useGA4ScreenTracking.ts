/**
 * @file useGA4ScreenTracking.ts
 * @description Hook to automatically track screen_view events in mobile app screens.
 */

import { useEffect } from 'react';
import { analyticsService } from '@yeolo/common';

export function useGA4ScreenTracking(screenName: string, screenClass?: string) {
  useEffect(() => {
    if (screenName) {
      analyticsService.logScreenView(screenName, screenClass || screenName);
    }
  }, [screenName, screenClass]);
}

export default useGA4ScreenTracking;
