/**
 * @file useGA4ButtonClick.ts
 * @description Hook providing a helper function to log button_click events in mobile app components.
 * @requirements REQ-22
 * @functional FUN-GA4
 * @api N/A
 * @author Antigravity Agent
 */

import { useCallback } from 'react';
import { analyticsService, GA4EventParams } from '@yeolo/common';

export function useGA4ButtonClick() {
  const trackButtonClick = useCallback(
    (buttonId: string, buttonName?: string, params?: GA4EventParams) => {
      analyticsService.logButtonClick(buttonId, buttonName, params);
    },
    []
  );

  return { trackButtonClick };
}

export default useGA4ButtonClick;
