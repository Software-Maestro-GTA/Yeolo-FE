/**
 * @file useCourseCreateForm.test.ts
 * @description Verifies location search/selection (API-LOC-1~3), cancellation, and numeric budget submission (API-COURSE-1).
 */
import { act, renderHook } from '@testing-library/react-native';
import * as common from '@yeolo/common';
import { useCourseCreateForm } from '../src/hooks/useCourseCreateForm';

describe('course destination & budget form lifecycle (API-LOC-1~3, API-COURSE-1)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(common, 'fetchCountriesApi').mockResolvedValue({
      status: 200,
      message: '국가 목록 조회 성공',
      data: {
        countries: [{ countryName: '대한민국' }, { countryName: '일본' }],
      },
    });
    jest.spyOn(common, 'fetchCitiesApi').mockResolvedValue({
      status: 200,
      message: '도시 목록 조회 성공',
      data: {
        cities: [{ cityName: '도쿄' }, { cityName: '오사카' }],
      },
    });
    jest.spyOn(common, 'searchLocationsApi').mockResolvedValue({
      status: 200,
      message: '지역 검색 성공',
      data: {
        results: [
          {
            countryName: '일본',
            cities: [{ cityName: '도쿄' }],
          },
        ],
      },
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

  it('waits until typing stops and requests only the final search keyword via searchLocationsApi', async () => {
    const { result } = await renderHook(() => useCourseCreateForm());
    await act(() => result.current.setDestinationCountry('대'));
    await advance(100);
    await act(() => result.current.setDestinationCountry('대한'));
    await advance(100);
    await act(() => result.current.setDestinationCountry('대한민국'));
    expect(common.searchLocationsApi).not.toHaveBeenCalled();
    await advance(300);
    expect(common.searchLocationsApi).toHaveBeenCalledTimes(1);
    expect(common.searchLocationsApi).toHaveBeenCalledWith(
      expect.any(String),
      '대한민국',
      expect.any(AbortSignal),
    );
  });

  it('aborts obsolete search requests and ignores their late responses', async () => {
    let resolveOld: (value: common.LocationSearchResponse) => void;
    jest.mocked(common.searchLocationsApi).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const { result, unmount } = await renderHook(() => useCourseCreateForm());
    await act(() => result.current.setDestinationCity('도'));
    await advance(300);
    const oldSignal = jest.mocked(common.searchLocationsApi).mock.calls[0][2];
    await act(() => result.current.setDestinationCity('오'));
    expect(oldSignal?.aborted).toBe(true);
    await advance(300);
    await act(() =>
      resolveOld({
        status: 200,
        message: '지역 검색 성공',
        data: {
          results: [
            {
              countryName: '일본',
              cities: [{ cityName: '도쿄' }],
            },
          ],
        },
      }),
    );
    expect(result.current.citySuggestions).toEqual([
      {
        cityName: '도쿄',
        cityNameKo: '도쿄',
        countryName: '일본',
        countryNameKo: '일본',
      },
    ]);
    const currentSignal = jest.mocked(common.searchLocationsApi).mock
      .calls[1][2];
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
    expect(common.searchLocationsApi).not.toHaveBeenCalled();
  });

  it('submits numeric budget in CourseCreateRequest (API-COURSE-1)', async () => {
    const onSubmit = jest.fn();
    const { result } = await renderHook(() => useCourseCreateForm(onSubmit));

    await act(() => {
      result.current.handleSelectPopularDestination('포르투갈', '리스본');
      result.current.handleStartDateChange('2026-10-20');
      result.current.handleEndDateChange('2026-10-23');
      result.current.setBudget(1600000);
    });

    expect(result.current.isFormValid).toBe(true);

    await act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      destinationCountry: '포르투갈',
      destinationCity: '리스본',
      startDate: '2026-10-20',
      totalDays: 4,
      budget: 1600000,
    });
  });
});
