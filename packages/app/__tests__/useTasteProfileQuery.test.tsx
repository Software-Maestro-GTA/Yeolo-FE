/**
 * @file useTasteProfileQuery.test.tsx
 * @description Verifies account-scoped taste results and isolation from late responses after account changes.
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as common from '@yeolo/common';
import { AuthContext, type AuthContextType } from '../src/context/AuthContext';
import { useTasteProfileQuery } from '../src/hooks/queries/useTasteProfileQuery';

const profile = (intro: string): common.TasteProfile => ({
  intro,
  hashtags: [],
  types: [],
  recommendCity: {
    countryName: '한국',
    cityName: '서울',
    imageUrl: '',
    reason: '',
  },
});

function setup(initialUserId: string | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  let userId: string | null = initialUserId;
  let isLoading = false;
  const Wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <AuthContext.Provider
        value={
          {
            isAuthenticated: !!userId,
            user: userId ? { userId } : null,
            isLoading,
          } as AuthContextType
        }>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  return {
    client,
    Wrapper,
    setUser: (id: string | null) => (userId = id),
    setLoading: (loading: boolean) => (isLoading = loading),
  };
}

afterEach(() => jest.restoreAllMocks());

it('loads the new account result instead of reusing the fresh previous account result', async () => {
  const fetchProfile = jest
    .spyOn(common, 'fetchTasteProfileApi')
    .mockResolvedValueOnce(profile('Account A'))
    .mockResolvedValueOnce(profile('Account B'));
  const { Wrapper, client, setUser } = setup('account-a');
  const { result, rerender, unmount } = await renderHook(
    () => useTasteProfileQuery(),
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(result.current.data?.intro).toBe('Account A'));
  setUser('account-b');
  await rerender({});
  expect(result.current.data?.intro).not.toBe('Account A');
  await waitFor(() => expect(result.current.data?.intro).toBe('Account B'));
  expect(fetchProfile).toHaveBeenCalledTimes(2);
  await unmount();
  client.clear();
});

it('does not replace the current account result when the previous request finishes late', async () => {
  let finishOld!: (value: common.TasteProfile) => void;
  jest
    .spyOn(common, 'fetchTasteProfileApi')
    .mockImplementationOnce(
      () => new Promise((resolve) => (finishOld = resolve)),
    )
    .mockResolvedValueOnce(profile('Account B'));
  const { Wrapper, client, setUser } = setup('account-a');
  const { result, rerender, unmount } = await renderHook(
    () => useTasteProfileQuery({ tasteProfileId: 'shared-result-id' }),
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(finishOld).toBeDefined());
  setUser('account-b');
  await rerender({});
  await waitFor(() => expect(result.current.data?.intro).toBe('Account B'));
  await act(async () => finishOld(profile('Account A')));
  expect(result.current.data?.intro).toBe('Account B');
  await unmount();
  client.clear();
});

it.each([true, () => true])(
  'does not request an anonymous profile after logout with enabled=%s',
  async (enabled) => {
    const fetchProfile = jest
      .spyOn(common, 'fetchTasteProfileApi')
      .mockResolvedValue(profile('Account A'));
    const { Wrapper, client, setUser } = setup('account-a');
    const { result, rerender, unmount } = await renderHook(
      () => useTasteProfileQuery({ options: { enabled } }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.data?.intro).toBe('Account A'));
    setUser(null);
    await rerender({});
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchProfile).toHaveBeenCalledTimes(1);
    await unmount();
    client.clear();
  },
);

it('waits for session restoration before fetching the authenticated profile', async () => {
  const fetchProfile = jest
    .spyOn(common, 'fetchTasteProfileApi')
    .mockResolvedValue(profile('Account A'));
  const { Wrapper, client, setLoading } = setup('account-a');
  setLoading(true);
  const { result, rerender, unmount } = await renderHook(
    () => useTasteProfileQuery(),
    { wrapper: Wrapper },
  );
  expect(fetchProfile).not.toHaveBeenCalled();
  expect(result.current.fetchStatus).toBe('idle');
  setLoading(false);
  await rerender({});
  await waitFor(() => expect(result.current.data?.intro).toBe('Account A'));
  await unmount();
  client.clear();
});

it.each([false, () => false])(
  'respects the caller disabling profile lookup with enabled=%s',
  async (enabled) => {
    const fetchProfile = jest.spyOn(common, 'fetchTasteProfileApi');
    const { Wrapper, client } = setup('account-a');
    const { result, unmount } = await renderHook(
      () => useTasteProfileQuery({ options: { enabled } }),
      { wrapper: Wrapper },
    );
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchProfile).not.toHaveBeenCalled();
    await unmount();
    client.clear();
  },
);
