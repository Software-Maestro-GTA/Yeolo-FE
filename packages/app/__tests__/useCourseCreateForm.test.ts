/**
 * @file useCourseCreateForm.test.ts
 * @description Verifies autocomplete request suppression, cancellation and selected destination behavior.
 */
import { act, renderHook } from '@testing-library/react-native';
import * as common from '@yeolo/common';
import { useCourseCreateForm } from '../src/hooks/useCourseCreateForm';

describe('course destination autocomplete request lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(common, 'fetchCountryAutocomplete').mockResolvedValue({
      status: 200,
      message: '국가 자동완성 조회 성공',
      data: { countries: [] },
    });
    jest.spyOn(common, 'fetchCityAutocomplete').mockResolvedValue({
      status: 200,
      message: '도시 자동완성 조회 성공',
      data: { cities: [] },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function advance(ms: number) {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(ms);
    });
  }

  it('waits until typing stops and requests only the final country keyword', async () => {
    const { result } = await renderHook(() => useCourseCreateForm());
    await act(() => result.current.setDestinationCountry('대'));
    await advance(100);
    await act(() => result.current.setDestinationCountry('대한'));
    await advance(100);
    await act(() => result.current.setDestinationCountry('대한민국'));
    expect(common.fetchCountryAutocomplete).not.toHaveBeenCalled();
    await advance(300);
    expect(common.fetchCountryAutocomplete).toHaveBeenCalledTimes(1);
    expect(common.fetchCountryAutocomplete).toHaveBeenCalledWith(
      expect.any(String),
      '대한민국',
      undefined,
      expect.any(AbortSignal),
    );
  });

  it('aborts obsolete city requests and ignores their late responses', async () => {
    let resolveOld: (value: common.CityAutocompleteResponse) => void;
    jest.mocked(common.fetchCityAutocomplete).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const { result, unmount } = await renderHook(() => useCourseCreateForm());
    await act(() => result.current.setDestinationCity('도'));
    await advance(300);
    const oldSignal = jest.mocked(common.fetchCityAutocomplete).mock
      .calls[0][4];
    await act(() => result.current.setDestinationCity('오'));
    expect(oldSignal?.aborted).toBe(true);
    await advance(300);
    await act(() =>
      resolveOld({
        status: 200,
        message: '도시 자동완성 조회 성공',
        data: {
          cities: [
            {
              cityId: 'tokyo',
              cityNameKo: '도쿄',
              countryId: 'jp',
              countryNameKo: '일본',
            },
          ],
        },
      }),
    );
    expect(result.current.citySuggestions).toEqual([]);
    const currentSignal = jest.mocked(common.fetchCityAutocomplete).mock
      .calls[1][4];
    await unmount();
    expect(currentSignal?.aborted).toBe(true);
  });

  it('does not fetch suggestions for a selected popular destination', async () => {
    const { result } = await renderHook(() => useCourseCreateForm());
    await act(() => result.current.setDestinationCity('도'));
    await advance(100);
    await act(() =>
      result.current.handleSelectPopularDestination('일본', '도쿄'),
    );
    await advance(300);
    expect(result.current.destinationCity).toBe('도쿄');
    expect(common.fetchCountryAutocomplete).not.toHaveBeenCalled();
    expect(common.fetchCityAutocomplete).not.toHaveBeenCalled();
  });

  it('retains a recognized country when the user starts typing a city', async () => {
    jest.mocked(common.fetchCountryAutocomplete).mockResolvedValue({
      status: 200,
      message: '국가 자동완성 조회 성공',
      data: { countries: [{ countryId: 'us', countryNameKo: '미국' }] },
    });
    const { result } = await renderHook(() => useCourseCreateForm());
    await act(() => result.current.setDestinationCountry('미국'));
    await act(() => result.current.setDestinationCity('시애틀'));
    await advance(300);
    expect(result.current.countrySuggestions[0]?.countryNameKo).toBe('미국');
    expect(result.current.destinationCountry).toBe('미국');
  });
});
