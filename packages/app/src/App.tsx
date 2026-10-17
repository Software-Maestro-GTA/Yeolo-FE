/**
 * @file App.tsx
 * @description Main mobile application root component utilizing BackgroundProvider and BackgroundImageLayout shell for edge-to-edge background media and safe area support.
 */
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { appFonts } from './theme/fonts';
import { TypographyProvider } from './components/common/Typography';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { analyticsService, ApiError } from '@yeolo/common';
import { airbridgeAnalyticsTracker, appAnalyticsTracker } from './analytics';
import { AuthProvider, BackgroundProvider } from './context';
import NavigationRoot from './navigation/NavigationRoot';
import { notifyUnauthorized } from './services/authService';
import { BackgroundImageLayout } from './layouts';

import { APP_CONFIG } from './constants/config';

const handleGlobalApiError = (error: unknown) => {
  if (
    (error instanceof ApiError &&
      (error.status === 401 || error.status === 403)) ||
    (typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as any).status === 401)
  ) {
    notifyUnauthorized();
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleGlobalApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalApiError,
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (
          (error instanceof ApiError &&
            (error.status === 401 || error.status === 403)) ||
          (typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            (error as any).status === 401)
        ) {
          return false;
        }
        return failureCount < 1;
      },
      staleTime: APP_CONFIG.QUERY_STALE_TIME,
    },
  },
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  useEffect(() => {
    analyticsService.registerTracker(appAnalyticsTracker);
    analyticsService.registerTracker(airbridgeAnalyticsTracker);

    return () => {
      analyticsService.unregisterTracker(appAnalyticsTracker);
      analyticsService.unregisterTracker(airbridgeAnalyticsTracker);
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <TypographyProvider loaded={fontsLoaded}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <BackgroundProvider>
              <BackgroundImageLayout>
                <NavigationRoot />
                <StatusBar style='dark' />
              </BackgroundImageLayout>
            </BackgroundProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </TypographyProvider>
  );
}
