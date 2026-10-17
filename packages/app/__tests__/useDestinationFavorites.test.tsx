/**
 * @file useDestinationFavorites.test.tsx
 * @description 기기 도시 즐겨찾기의 영속성, 읽기·쓰기 오류 및 비동기 경합 방지를 검증합니다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  DESTINATION_FAVORITES_STORAGE_KEY,
  useDestinationFavorites,
} from '../src/hooks/useDestinationFavorites';

const tokyo = { country: '일본', city: '도쿄' };
const paris = { country: '프랑스', city: '파리' };
const originalGetItem = jest
  .mocked(AsyncStorage.getItem)
  .getMockImplementation()!;
const originalSetItem = jest
  .mocked(AsyncStorage.setItem)
  .getMockImplementation()!;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

async function renderFavorites(visible = true) {
  const hook = await renderHook(
    ({ open }: { open: boolean }) => useDestinationFavorites(open),
    {
      initialProps: { open: visible },
    },
  );
  if (visible)
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe('device destination favorites', () => {
  beforeEach(async () => {
    jest
      .mocked(AsyncStorage.getItem)
      .mockReset()
      .mockImplementation(originalGetItem);
    jest
      .mocked(AsyncStorage.setItem)
      .mockReset()
      .mockImplementation(originalSetItem);
    await AsyncStorage.clear();
  });

  it('persists a favorite on the device and restores it after remounting', async () => {
    const first = await renderFavorites();
    await act(() => first.result.current.toggle(tokyo));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      DESTINATION_FAVORITES_STORAGE_KEY,
      JSON.stringify([tokyo]),
    );
    expect(first.result.current.favorites).toEqual([tokyo]);
    await first.unmount();
    const second = await renderFavorites();
    expect(second.result.current.favorites).toEqual([tokyo]);
  });

  it('removes a favorite without changing the other saved cities', async () => {
    await AsyncStorage.setItem(
      DESTINATION_FAVORITES_STORAGE_KEY,
      JSON.stringify([tokyo, paris]),
    );
    const { result } = await renderFavorites();
    await act(() => result.current.toggle(tokyo));
    expect(result.current.favorites).toEqual([paris]);
    expect(await AsyncStorage.getItem(DESTINATION_FAVORITES_STORAGE_KEY)).toBe(
      JSON.stringify([paris]),
    );
  });

  it('distinguishes cities with the same name in different countries', async () => {
    const frenchParis = paris;
    const americanParis = { country: '미국', city: '파리' };
    const { result } = await renderFavorites();
    await act(() => result.current.toggle(frenchParis));
    await act(() => result.current.toggle(americanParis));
    expect(result.current.favorites).toEqual([frenchParis, americanParis]);
    await act(() => result.current.toggle(frenchParis));
    expect(result.current.favorites).toEqual([americanParis]);
  });

  it('reads changes saved by another screen when the picker reopens', async () => {
    const { result, rerender } = await renderFavorites();
    await rerender({ open: false });
    await AsyncStorage.setItem(
      DESTINATION_FAVORITES_STORAGE_KEY,
      JSON.stringify([paris]),
    );
    await rerender({ open: true });
    await waitFor(() => expect(result.current.favorites).toEqual([paris]));
  });

  it('does not overwrite saved favorites while the first read is pending', async () => {
    const pendingRead = deferred<string | null>();
    jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(pendingRead.promise);
    const { result } = await renderHook(() => useDestinationFavorites(true));
    expect(result.current.isLoading).toBe(true);
    await act(() => result.current.toggle(tokyo));
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    await act(() => pendingRead.resolve(JSON.stringify([paris])));
    expect(result.current.favorites).toEqual([paris]);
  });

  it('blocks writes after a read failure and recovers through reload', async () => {
    await AsyncStorage.setItem(
      DESTINATION_FAVORITES_STORAGE_KEY,
      JSON.stringify([paris]),
    );
    jest.mocked(AsyncStorage.setItem).mockClear();
    jest
      .mocked(AsyncStorage.getItem)
      .mockRejectedValueOnce(new Error('storage unavailable'));
    const { result } = await renderFavorites();
    expect(result.current.error).toBe('load');
    await act(() => result.current.toggle(tokyo));
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.favorites).toEqual([paris]);
    await act(() => result.current.toggle(tokyo));
    expect(result.current.favorites).toEqual([paris, tokyo]);
  });

  it('keeps the previous list when a write fails and allows retrying', async () => {
    await AsyncStorage.setItem(
      DESTINATION_FAVORITES_STORAGE_KEY,
      JSON.stringify([paris]),
    );
    const { result } = await renderFavorites();
    jest
      .mocked(AsyncStorage.setItem)
      .mockRejectedValueOnce(new Error('disk full'));
    await act(() => result.current.toggle(tokyo));
    expect(result.current.error).toBe('save');
    expect(result.current.favorites).toEqual([paris]);
    expect(result.current.isSaving).toBe(false);
    expect(await AsyncStorage.getItem(DESTINATION_FAVORITES_STORAGE_KEY)).toBe(
      JSON.stringify([paris]),
    );
    await act(() => result.current.toggle(tokyo));
    expect(result.current.error).toBeNull();
    expect(result.current.favorites).toEqual([paris, tokyo]);
  });

  it('accepts only one toggle while a write is in progress', async () => {
    const { result } = await renderFavorites();
    const pendingWrite = deferred<void>();
    jest.mocked(AsyncStorage.setItem).mockReturnValueOnce(pendingWrite.promise);
    let firstWrite!: Promise<void>;
    await act(() => {
      firstWrite = result.current.toggle(tokyo);
      void result.current.toggle(paris);
    });
    expect(result.current.isSaving).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    await act(async () => {
      pendingWrite.resolve();
      await firstWrite;
    });
    expect(result.current.favorites).toEqual([tokyo]);
    expect(result.current.isSaving).toBe(false);
  });

  it.each(['{broken', JSON.stringify({ city: '도쿄' })])(
    'protects malformed saved payloads from being overwritten: %s',
    async (stored) => {
      await AsyncStorage.setItem(DESTINATION_FAVORITES_STORAGE_KEY, stored);
      jest.mocked(AsyncStorage.setItem).mockClear();
      const { result } = await renderFavorites();
      expect(result.current.error).toBe('load');
      await act(() => result.current.toggle(tokyo));
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    },
  );

  it('ignores invalid array entries and deduplicates complete country and city pairs', async () => {
    await AsyncStorage.setItem(
      DESTINATION_FAVORITES_STORAGE_KEY,
      JSON.stringify([
        tokyo,
        null,
        {},
        { country: '일본', city: '' },
        { country: 12, city: '도쿄' },
        tokyo,
        { country: ' 프랑스 ', city: ' 파리 ' },
        { country: '미국', city: '파리' },
      ]),
    );
    const { result } = await renderFavorites();
    expect(result.current.favorites).toEqual([
      tokyo,
      paris,
      { country: '미국', city: '파리' },
    ]);
  });

  it('ignores a stale read from an earlier opening', async () => {
    const staleRead = deferred<string | null>();
    jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(staleRead.promise);
    const { result, rerender } = await renderHook(
      ({ open }: { open: boolean }) => useDestinationFavorites(open),
      { initialProps: { open: true } },
    );
    await rerender({ open: false });
    await AsyncStorage.setItem(
      DESTINATION_FAVORITES_STORAGE_KEY,
      JSON.stringify([paris]),
    );
    await rerender({ open: true });
    await waitFor(() => expect(result.current.favorites).toEqual([paris]));
    await act(() => staleRead.resolve(JSON.stringify([tokyo])));
    expect(result.current.favorites).toEqual([paris]);
  });

  it('waits for an in-flight write before reading on reopen', async () => {
    const { result, rerender } = await renderFavorites();
    const pendingWrite = deferred<void>();
    jest
      .mocked(AsyncStorage.setItem)
      .mockImplementationOnce(async (key, value) => {
        await pendingWrite.promise;
        await originalSetItem(key, value);
      });
    let writing!: Promise<void>;
    await act(() => {
      writing = result.current.toggle(tokyo);
    });
    await rerender({ open: false });
    await rerender({ open: true });
    expect(result.current.isLoading).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    await act(async () => {
      pendingWrite.resolve();
      await writing;
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.favorites).toEqual([tokyo]);
  });
});
