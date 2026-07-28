/**
 * @file App.tsx
 * @description Main mobile application root component initializing providers, analytics, and navigation.
 * @requirements REQ-11, REQ-22
 * @functional FUN-1, FUN-GA4
 * @author Antigravity Agent
 */
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { analyticsService } from '@yeolo/common';
import { appAnalyticsTracker } from './analytics';
import { AuthProvider } from './context/AuthContext';
import NavigationRoot from './navigation/NavigationRoot';

import { APP_CONFIG } from './constants/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: APP_CONFIG.QUERY_STALE_TIME,
    },
  },
});

export default function App() {
  useEffect(() => {
    analyticsService.registerTracker(appAnalyticsTracker);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationRoot />
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
