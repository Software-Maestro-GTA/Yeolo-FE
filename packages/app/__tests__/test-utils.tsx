/**
 * @file test-utils.tsx
 * @description Testing utility helpers providing QueryClientProvider wrapper for unit tests.
 * @author Antigravity Agent
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react-native';

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
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>,
    options
  );
}

describe('test-utils', () => {
  it('createTestQueryClient 유틸리티 함수가 정의되어 있어야 한다', () => {
    expect(createTestQueryClient).toBeDefined();
    expect(renderWithQueryClient).toBeDefined();
  });
});
