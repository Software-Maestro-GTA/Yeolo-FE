/**
 * @file test-utils.tsx
 * @description Testing utility helpers providing QueryClientProvider wrapper for unit tests.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

export function renderWithQueryClient(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const testQueryClient = createTestQueryClient();
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 360, height: 780 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };
  return render(
    <QueryClientProvider client={testQueryClient}>
      <SafeAreaProvider initialMetrics={initialMetrics}>{ui}</SafeAreaProvider>
    </QueryClientProvider>,
    options,
  );
}

describe('test-utils', () => {
  it('createTestQueryClient 유틸리티 함수가 정의되어 있어야 한다', () => {
    expect(createTestQueryClient).toBeDefined();
    expect(renderWithQueryClient).toBeDefined();
  });
});
