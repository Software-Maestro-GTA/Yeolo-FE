/**
 * @file CourseCreateScreen.test.tsx
 * @description 코스 조건·추천 여행지와 저장된 취향의 조회·빈 상태·재시도를 검증합니다.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import React from 'react';
import { act, fireEvent, waitFor, within } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import {
  createTestQueryClient,
  renderWithQueryClient as render,
} from './test-utils';
import { server } from './mocks/server';
import {
  layoutDestinationCountries,
  revealDestinationCountry,
} from './mocks/destinationPickerLayout';
import { CourseCreateScreen } from '../src/screens/CourseCreateScreen';
import { CourseGeneratingScreen } from '../src/screens/CourseGeneratingScreen';
import { COURSE_POPULAR_DESTINATIONS } from '../src/constants/courseUiStrings';
import { getTasteProfileQueryKey } from '../src/hooks/queries/useTasteProfileQuery';

import { useCourseStore } from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as commonApi from '@yeolo/common';

jest.mock('../src/components/navigation/BottomNavBar', () => ({
  BottomNavBar: () => null,
}));

const savedTasteProfile = {
  intro: '한곳에 머물며 쉬는 여행을 좋아해요.',
  hashtags: ['#여유로운여행'],
  types: [],
  recommendCity: {
    countryName: '포르투갈',
    cityName: '리스본',
    imageUrl: 'https://cdn.yeolo.com/cities/lisbon.jpg',
    reason: '햇살 가득한 골목에서 쉬어갈 수 있어요.',
  },
};

describe('CourseCreateScreen (UI v3 & API-LOC-1~3 / API-COURSE-1)', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());

  beforeEach(async () => {
    jest.clearAllMocks();
    useCourseStore.setState({
      createdCourseId: null,
      isGenerating: false,
      progressStep: null,
      progressMessage: null,
      error: null,
      errorCode: null,
    });
    await AsyncStorage.setItem('accessToken', 'mock-bearer-token');

    jest.spyOn(commonApi, 'fetchCountriesApi').mockResolvedValue({
      status: 200,
      message: '국가 목록 조회 성공',
      data: {
        countries: [
          { countryName: '대한민국' },
          { countryName: '일본' },
          { countryName: '태국' },
          { countryName: '프랑스' },
          { countryName: '포르투갈' },
        ],
      },
    });

    jest
      .spyOn(commonApi, 'fetchCitiesApi')
      .mockImplementation(async (_, countryName) => {
        const cityMap: Record<string, { cityName: string }[]> = {
          대한민국: [{ cityName: '제주' }, { cityName: '서울' }],
          일본: [
            { cityName: '도쿄' },
            { cityName: '오사카' },
            { cityName: '나고야' },
          ],
          태국: [{ cityName: '방콕' }],
          프랑스: [{ cityName: '파리' }],
          포르투갈: [{ cityName: '리스본' }],
        };
        return {
          status: 200,
          message: '도시 목록 조회 성공',
          data: { cities: cityMap[countryName] || [] },
        };
      });

    jest
      .spyOn(commonApi, 'searchLocationsApi')
      .mockImplementation(async (_, keyword) => {
        const all = [
          {
            countryName: '대한민국',
            cities: [{ cityName: '제주' }, { cityName: '서울' }],
          },
          {
            countryName: '일본',
            cities: [
              { cityName: '도쿄' },
              { cityName: '오사카' },
              { cityName: '나고야' },
            ],
          },
          {
            countryName: '태국',
            cities: [{ cityName: '방콕' }],
          },
          {
            countryName: '프랑스',
            cities: [{ cityName: '파리' }],
          },
          {
            countryName: '포르투갈',
            cities: [{ cityName: '리스본' }],
          },
        ];
        const kw = (keyword || '').trim().toLowerCase();
        const results = kw
          ? all
              .map((item) => {
                if (item.countryName.toLowerCase().includes(kw)) return item;
                const matchedCities = item.cities.filter((c) =>
                  c.cityName.toLowerCase().includes(kw),
                );
                if (matchedCities.length > 0) {
                  return {
                    countryName: item.countryName,
                    cities: matchedCities,
                  };
                }
                return null;
              })
              .filter(
                (
                  x,
                ): x is {
                  countryName: string;
                  cities: { cityName: string }[];
                } => x !== null,
              )
          : all;
        return {
          status: 200,
          message: '지역 검색 성공',
          data: { results },
        };
      });
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  const nextMonthDates = () => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { start: `${month}-01`, end: `${month}-04`, tooLong: `${month}-30` };
  };

  it('UI v3 시안2의 취향, 목적지·날짜, 예산 카드와 비활성 생성 버튼을 표시한다', async () => {
    const { getByText, getByTestId, findByText } = await render(
      <CourseCreateScreen />,
    );
    expect(getByText('여행 코스 추천받기')).toBeTruthy();
    expect(await findByText('내 취향 다시보기')).toBeTruthy();
    expect(getByTestId('destination-card')).toBeTruthy();
    expect(getByTestId('date-card')).toBeTruthy();
    expect(getByTestId('budget-card')).toBeTruthy();
    expect(getByTestId('budget-amount-text').props.accessibilityLabel).toBe(
      '총 300만원',
    );
    expect(
      getByTestId('submit-course-btn').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it.each([404, 200])(
    '취향이 없는 %s 응답은 취향 분석하기 버튼으로 사진 분석을 시작한다',
    async (status) => {
      server.use(
        http.get('*/api/users/me/taste-profile', () =>
          HttpResponse.json(
            {
              status,
              message:
                status === 404
                  ? '저장된 성향 프로필이 없습니다.'
                  : '성향 프로필 조회 성공',
              data:
                status === 404
                  ? null
                  : { ...savedTasteProfile, intro: '', hashtags: [] },
            },
            { status },
          ),
        ),
      );
      const onPhoto = jest.fn();
      const { findByTestId, getByText, queryByTestId } = await render(
        <CourseCreateScreen onPhoto={onPhoto} />,
      );
      await fireEvent.press(await findByTestId('course-create-photo'));
      expect(getByText('취향 분석하기')).toBeTruthy();
      expect(queryByTestId('toggle-taste-summary')).toBeNull();
      expect(queryByTestId('retry-course-taste')).toBeNull();
      expect(onPhoto).toHaveBeenCalledTimes(1);
    },
  );

  it('취향이 없고 분석 이동 콜백도 없으면 빈 취향 카드를 숨긴다', async () => {
    const noTasteResponse = jest.fn(() =>
      HttpResponse.json(
        { status: 404, message: '저장된 성향 프로필이 없습니다.', data: null },
        { status: 404 },
      ),
    );
    server.use(http.get('*/api/users/me/taste-profile', noTasteResponse));
    const { queryByTestId } = await render(<CourseCreateScreen />);
    await waitFor(() => expect(noTasteResponse).toHaveBeenCalled());
    await waitFor(() =>
      expect(queryByTestId('course-taste-loading')).toBeNull(),
    );
    expect(queryByTestId('my-taste-banner')).toBeNull();
    expect(queryByTestId('course-create-photo')).toBeNull();
    expect(queryByTestId('toggle-taste-summary')).toBeNull();
  });

  it.each([
    ['소개', savedTasteProfile.intro, []],
    ['태그', '', savedTasteProfile.hashtags],
  ])(
    '취향 %s만 저장돼 있어도 다시보기를 제공한다',
    async (_, intro, hashtags) => {
      server.use(
        http.get('*/api/users/me/taste-profile', () =>
          HttpResponse.json({
            status: 200,
            message: '성향 프로필 조회 성공',
            data: { ...savedTasteProfile, intro, hashtags },
          }),
        ),
      );
      const { findByTestId, findByText, queryByTestId } = await render(
        <CourseCreateScreen onPhoto={jest.fn()} />,
      );
      await fireEvent.press(await findByTestId('toggle-taste-summary'));
      expect(
        await findByText(intro ? String(intro) : '#여유로운여행'),
      ).toBeTruthy();
      expect(queryByTestId('course-create-photo')).toBeNull();
    },
  );

  it('취향 조회 중에는 분석 버튼 대신 로딩을 표시하고 완료 후 저장된 취향으로 전환한다', async () => {
    let releaseResponse!: () => void;
    const responseReady = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.get('*/api/users/me/taste-profile', async () => {
        await responseReady;
        return HttpResponse.json({
          status: 200,
          message: '성향 프로필 조회 성공',
          data: savedTasteProfile,
        });
      }),
    );
    const { getByTestId, queryByTestId, findByText } = await render(
      <CourseCreateScreen onPhoto={jest.fn()} />,
    );
    try {
      expect(getByTestId('course-taste-loading')).toBeTruthy();
      expect(queryByTestId('course-create-photo')).toBeNull();
      expect(queryByTestId('toggle-taste-summary')).toBeNull();
    } finally {
      await act(async () => releaseResponse());
    }
    await findByText('내 취향 다시보기');
    expect(queryByTestId('course-taste-loading')).toBeNull();
    await fireEvent.press(getByTestId('toggle-taste-summary'));
    expect(await findByText(savedTasteProfile.intro)).toBeTruthy();
  });

  it('서버 오류는 분석 안내로 오인하지 않고 다시 시도한 뒤 저장된 취향을 표시한다', async () => {
    server.use(
      http.get('*/api/users/me/taste-profile', () =>
        HttpResponse.json(
          { status: 500, message: '서버 오류가 발생했습니다.', data: null },
          { status: 500 },
        ),
      ),
    );
    const { findByTestId, findByText, getByTestId, getByText, queryByTestId } =
      await render(<CourseCreateScreen onPhoto={jest.fn()} />);
    await findByTestId('retry-course-taste');
    expect(getByText('여행 취향을 불러오지 못했어요.')).toBeTruthy();
    expect(queryByTestId('course-create-photo')).toBeNull();
    expect(queryByTestId('toggle-taste-summary')).toBeNull();
    server.resetHandlers();
    await fireEvent.press(getByTestId('retry-course-taste'));
    await findByText('내 취향 다시보기');
    await fireEvent.press(getByTestId('toggle-taste-summary'));
    expect(
      await findByText('쉬엄쉬엄 다니면서 사진은 야무지게 찍는 타입'),
    ).toBeTruthy();
    expect(queryByTestId('retry-course-taste')).toBeNull();
  });

  it('캐시된 취향이 있으면 백그라운드 조회 실패에도 기존 취향을 보여준다', async () => {
    server.use(
      http.get('*/api/users/me/taste-profile', () =>
        HttpResponse.json(
          { status: 500, message: '서버 오류가 발생했습니다.', data: null },
          { status: 500 },
        ),
      ),
    );
    const client = createTestQueryClient();
    client.setQueryData(getTasteProfileQueryKey(), savedTasteProfile, {
      updatedAt: 0,
    });
    const { getByTestId, getByText, queryByTestId } = await render(
      <QueryClientProvider client={client}>
        <CourseCreateScreen onPhoto={jest.fn()} />
      </QueryClientProvider>,
    );
    expect(getByText('내 취향 다시보기')).toBeTruthy();
    await waitFor(() =>
      expect(client.getQueryState(getTasteProfileQueryKey())?.status).toBe(
        'error',
      ),
    );
    await fireEvent.press(getByTestId('toggle-taste-summary'));
    expect(getByText(savedTasteProfile.intro)).toBeTruthy();
    expect(queryByTestId('course-create-photo')).toBeNull();
    expect(queryByTestId('retry-course-taste')).toBeNull();
  });

  it.each([null, 'INFJ'] as const)(
    '일반·MBTI(%s) 경로 모두 국가 중복 없이 인기 여행지 4개의 국가와 도시를 표시한다',
    async (mbti) => {
      const { getByTestId, getByText, getAllByTestId } = await render(
        <CourseCreateScreen mbti={mbti} />,
      );
      expect(getByTestId('recommended-destinations')).toBeTruthy();
      expect(getByText('추천 여행지')).toBeTruthy();
      const destinations = getAllByTestId(/^recommended-destination-/);
      expect(destinations).toHaveLength(4);
      const countries = destinations.map((chip) => {
        const [country, city] = chip.props.accessibilityLabel.split(', ');
        expect(within(chip).getAllByText(country)).toHaveLength(
          country === city ? 2 : 1,
        );
        expect(within(chip).getAllByText(city)).toHaveLength(
          country === city ? 2 : 1,
        );
        expect(
          COURSE_POPULAR_DESTINATIONS.some(
            (destination) =>
              destination.country === country && destination.city === city,
          ),
        ).toBe(true);
        return country;
      });
      expect(new Set(countries).size).toBe(4);
    },
  );

  it.each([
    ['일본', '도쿄'],
    ['아이슬란드', '레이캬비크'],
  ])(
    '취향 결과 %s·%s를 첫 번째로 포함해 중복 없이 네 곳을 표시하고 선택한다',
    async (countryName, cityName) => {
      jest.spyOn(Math, 'random').mockReturnValue(0.999999);
      const { getAllByTestId, getByText, getByTestId } = await render(
        <CourseCreateScreen
          recommendedDestination={{ countryName, cityName }}
        />,
      );
      const chips = getAllByTestId(/^recommended-destination-/);
      expect(chips).toHaveLength(4);
      expect(chips[0].props.accessibilityLabel).toBe(
        `${countryName}, ${cityName}`,
      );
      expect(
        new Set(chips.map((chip) => chip.props.accessibilityLabel)).size,
      ).toBe(4);
      expect(
        chips.filter((chip) =>
          chip.props.accessibilityLabel.startsWith(`${countryName}, `),
        ),
      ).toHaveLength(1);
      await fireEvent.press(chips[0]);
      expect(getByText(`${countryName}  |  ${cityName}`)).toBeTruthy();
      await fireEvent(getByTestId('budget-slider'), 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      });
      expect(
        getAllByTestId(/^recommended-destination-/).map(
          (chip) => chip.props.accessibilityLabel,
        ),
      ).toEqual(chips.map((chip) => chip.props.accessibilityLabel));
    },
  );

  it('화면에 새로 진입하면 인기 여행지에서 추천을 다시 뽑는다', async () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
    const firstScreen = await render(<CourseCreateScreen />);
    const firstRecommendations = firstScreen
      .getAllByTestId(/^recommended-destination-/)
      .map((chip) => chip.props.testID);
    await firstScreen.unmount();
    random.mockReturnValue(0);
    const secondScreen = await render(<CourseCreateScreen />);
    const secondRecommendations = secondScreen
      .getAllByTestId(/^recommended-destination-/)
      .map((chip) => chip.props.testID);
    expect(secondRecommendations).toHaveLength(4);
    expect(secondRecommendations).not.toEqual(firstRecommendations);
  });

  it('추천 칩은 국가와 도시를 즉시 설정하고 같은 국가의 다른 도시에는 선택 표시를 하지 않는다', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999999);
    const {
      getByTestId,
      findByTestId,
      getAllByTestId,
      getByText,
      queryByTestId,
    } = await render(<CourseCreateScreen />);
    const recommendation = getAllByTestId(/^recommended-destination-일본-/)[0];
    const recommendationId = recommendation.props.testID;
    const [country, city] = recommendation.props.accessibilityLabel.split(', ');
    await fireEvent.press(recommendation);
    expect(getByText(`${country}  |  ${city}`)).toBeTruthy();
    expect(queryByTestId('destination-sheet')).toBeNull();
    expect(
      getByTestId(recommendationId).props.accessibilityState.selected,
    ).toBe(true);
    expect(
      getByTestId('submit-course-btn').props.accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.press(getByTestId('open-destination-sheet'));
    await layoutDestinationCountries();
    const otherCity = ['도쿄', '오사카', '나고야'].find(
      (name) => name !== city,
    );
    await fireEvent.press(await findByTestId(`destination-city-${otherCity}`));
    expect(getByText(`${country}  |  ${otherCity}`)).toBeTruthy();
    expect(queryByTestId('destination-sheet')).toBeNull();
    expect(
      getByTestId(recommendationId).props.accessibilityState.selected,
    ).toBe(false);
  });

  it('국가 탐색을 취소하면 기존 목적지를 보존하고 리렌더·시트 재개폐에도 추천 여행지가 유지된다', async () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
    const {
      getByTestId,
      findByTestId,
      getByText,
      getAllByTestId,
      queryByTestId,
    } = await render(<CourseCreateScreen />);
    const recommendations = () =>
      getAllByTestId(/^recommended-destination-/).map(
        (chip) => chip.props.testID,
      );
    const initialRecommendations = recommendations();
    random.mockReturnValue(0);
    await fireEvent.press(getByTestId('open-destination-sheet'));
    await layoutDestinationCountries();
    await fireEvent.press(await findByTestId('destination-country-포르투갈'));
    await fireEvent.press(await findByTestId('destination-city-리스본'));
    await fireEvent.press(getByTestId('open-destination-sheet'));
    await layoutDestinationCountries();
    await fireEvent.press(await revealDestinationCountry('일본'));
    await findByTestId('destination-city-도쿄');
    expect(getByText('포르투갈  |  리스본')).toBeTruthy();
    await fireEvent.press(getByTestId('destination-sheet-backdrop'));
    expect(queryByTestId('destination-sheet')).toBeNull();
    expect(getByText('포르투갈  |  리스본')).toBeTruthy();
    expect(
      getAllByTestId(/^recommended-destination-일본-/)[0].props
        .accessibilityState.selected,
    ).toBe(false);
    await fireEvent.press(getByTestId('open-destination-sheet'));
    await layoutDestinationCountries();
    await findByTestId('destination-city-리스본');
    expect(
      getByTestId('destination-country-포르투갈').props.accessibilityState
        .selected,
    ).toBe(true);
    expect(queryByTestId('destination-city-도쿄')).toBeNull();
    await fireEvent.press(getByTestId('destination-sheet-backdrop'));
    await fireEvent(getByTestId('budget-slider'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(getByTestId('budget-amount-text').props.accessibilityLabel).toBe(
      '총 310만원',
    );
    expect(recommendations()).toEqual(initialRecommendations);
    expect(getByText('포르투갈  |  리스본')).toBeTruthy();
  });

  it('MBTI 경로는 별도 사진 유도 없이 저장된 취향과 여행 조건 입력을 표시한다', async () => {
    const tasteRequest = jest.fn(() =>
      HttpResponse.json(
        { status: 404, message: '저장된 성향 프로필이 없습니다.', data: null },
        { status: 404 },
      ),
    );
    server.use(http.get('*/api/users/me/taste-profile', tasteRequest));
    const onPhoto = jest.fn();
    const { getByTestId, getByText, queryByTestId } = await render(
      <CourseCreateScreen mbti='INFJ' onPhoto={onPhoto} />,
    );
    expect(getByTestId('recommended-destinations')).toBeTruthy();
    expect(queryByTestId('course-create-photo')).toBeNull();
    expect(getByTestId('open-destination-sheet')).toBeTruthy();
    expect(getByTestId('open-date-sheet')).toBeTruthy();
    expect(onPhoto).not.toHaveBeenCalled();
    await fireEvent.press(getByTestId('toggle-taste-summary'));
    expect(
      getByText('머물 곳을 미리 골라\n조용히 쉬어 가는 타입'),
    ).toBeTruthy();
    expect(getByText('#미리준비')).toBeTruthy();
    expect(tasteRequest).not.toHaveBeenCalled();
  });

  it('인기는 맨 위에 두고 국가·도시를 이름순으로 표시한 뒤 선택한 지역 쌍을 유지한다', async () => {
    const {
      getByTestId,
      findByTestId,
      getAllByTestId,
      getByText,
      queryByTestId,
    } = await render(<CourseCreateScreen />);
    await fireEvent.press(getByTestId('open-destination-sheet'));
    await layoutDestinationCountries();
    await findByTestId('destination-country-일본');
    expect(
      getAllByTestId(/^destination-country-(?!pane$)/).map(
        (row) => row.props.testID,
      ),
    ).toEqual([
      'destination-country-popular',
      'destination-country-__favorites__',
      'destination-country-대한민국',
      'destination-country-일본',
      'destination-country-태국',
      'destination-country-포르투갈',
      'destination-country-프랑스',
    ]);
    await findByTestId('destination-city-교토');
    expect(
      getAllByTestId(/^destination-city-/)
        .slice(0, 5)
        .map((row) => row.props.testID),
    ).toEqual([
      'destination-city-교토',
      'destination-city-나고야',
      'destination-city-나트랑',
      'destination-city-뉴욕',
      'destination-city-다낭',
    ]);
    await fireEvent.press(await revealDestinationCountry('일본'));
    await findByTestId('destination-city-도쿄');
    expect(
      getAllByTestId(/^destination-city-/).map((row) => row.props.testID),
    ).toEqual([
      'destination-city-나고야',
      'destination-city-도쿄',
      'destination-city-오사카',
    ]);
    await fireEvent.press(getByTestId('destination-city-도쿄'));
    expect(getByText('일본  |  도쿄')).toBeTruthy();
    expect(queryByTestId('destination-sheet')).toBeNull();
    expect(commonApi.fetchCitiesApi).toHaveBeenCalledWith(
      expect.any(String),
      '일본',
    );
  });

  it.each([
    ['일', '도쿄', '일본'],
    ['리스', '리스본', '포르투갈'],
  ])(
    '통합검색 %s 결과에서 도시를 선택할 수 있다',
    async (keyword, city, country) => {
      const { getByTestId, findByTestId, getAllByTestId, getByText } =
        await render(<CourseCreateScreen />);
      await fireEvent.press(getByTestId('open-destination-sheet'));
      await layoutDestinationCountries();
      await fireEvent.changeText(getByTestId('destination-search'), keyword);
      await findByTestId(`destination-city-${city}`);
      if (keyword === '일') {
        expect(
          getAllByTestId(/^destination-city-/).map((row) => row.props.testID),
        ).toEqual([
          'destination-city-나고야',
          'destination-city-도쿄',
          'destination-city-오사카',
        ]);
      }
      await fireEvent.press(getByTestId(`destination-city-${city}`));
      expect(getByText(`${country}  |  ${city}`)).toBeTruthy();
      expect(commonApi.searchLocationsApi).toHaveBeenCalledWith(
        expect.any(String),
        keyword,
        expect.anything(),
      );
    },
  );

  it('국가를 바꾸면 새 국가의 도시만 표시하고 유효한 쌍으로 교체한다', async () => {
    const { getByTestId, findByTestId, queryByTestId, getByText } =
      await render(<CourseCreateScreen />);
    await fireEvent.press(getByTestId('open-destination-sheet'));
    await layoutDestinationCountries();
    await fireEvent.press(await findByTestId('destination-country-포르투갈'));
    await fireEvent.press(await findByTestId('destination-city-리스본'));
    await fireEvent.press(getByTestId('open-destination-sheet'));
    await layoutDestinationCountries();
    await findByTestId('destination-city-리스본');
    await fireEvent.press(await revealDestinationCountry('일본'));
    await findByTestId('destination-city-도쿄');
    expect(queryByTestId('destination-city-리스본')).toBeNull();
    await fireEvent.press(getByTestId('destination-city-도쿄'));
    expect(getByText('일본  |  도쿄')).toBeTruthy();
  });

  it('날짜를 확정하고 예산을 조절하면 API-COURSE-1에 실제 숫자 예산을 제출한다', async () => {
    const onSubmit = jest.fn();
    const { getByTestId, findByTestId } = await render(
      <CourseCreateScreen onSubmit={onSubmit} />,
    );
    const dates = nextMonthDates();
    await fireEvent.press(getByTestId('open-destination-sheet'));
    await layoutDestinationCountries();
    await fireEvent.press(await findByTestId('destination-country-포르투갈'));
    await fireEvent.press(await findByTestId('destination-city-리스본'));
    await fireEvent.press(getByTestId('open-date-sheet'));
    await fireEvent.press(await findByTestId(`calendar-day-${dates.start}`));
    await fireEvent.press(await findByTestId(`calendar-day-${dates.end}`));
    await fireEvent.press(getByTestId('confirm-travel-dates'));
    await fireEvent(getByTestId('budget-slider'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(getByTestId('budget-slider').props.accessibilityValue.now).toBe(
      3100000,
    );
    expect(
      getByTestId('submit-course-btn').props.accessibilityState.disabled,
    ).toBe(false);
    await fireEvent.press(getByTestId('submit-course-btn'));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        destinationCountry: '포르투갈',
        destinationCity: '리스본',
        startDate: dates.start,
        totalDays: 4,
        budget: 3100000,
      }),
    );
  });

  it.each(['completed', 'failed'])(
    '이전 %s 상태를 토큰 조회나 로딩 화면 진입보다 먼저 지운다',
    async (previous) => {
      useCourseStore.setState({
        createdCourseId: previous === 'completed' ? 'previous-course' : null,
        error: previous === 'failed' ? '이전 요청 실패' : null,
      });
      const onComplete = jest.fn();
      const onSubmit = jest.fn();
      function Flow() {
        const [submitted, setSubmitted] = React.useState(false);
        return submitted ? (
          <CourseGeneratingScreen onComplete={onComplete} />
        ) : (
          <CourseCreateScreen
            mbti='INFP'
            onSubmit={() => {
              onSubmit(useCourseStore.getState());
              setSubmitted(true);
            }}
          />
        );
      }
      const screen = await render(<Flow />);
      const dates = nextMonthDates();
      await fireEvent.press(screen.getByTestId('open-destination-sheet'));
      await layoutDestinationCountries();
      await fireEvent.press(
        await screen.findByTestId('destination-country-포르투갈'),
      );
      await fireEvent.press(
        await screen.findByTestId('destination-city-리스본'),
      );
      await fireEvent.press(screen.getByTestId('open-date-sheet'));
      await fireEvent.press(
        await screen.findByTestId(`calendar-day-${dates.start}`),
      );
      await fireEvent.press(
        await screen.findByTestId(`calendar-day-${dates.end}`),
      );
      await fireEvent.press(screen.getByTestId('confirm-travel-dates'));

      let resolveToken!: (value: string) => void;
      const tokenRead = new Promise<string>((resolve) => {
        resolveToken = resolve;
      });
      jest.spyOn(AsyncStorage, 'getItem').mockReturnValueOnce(tokenRead);
      try {
        await fireEvent.press(screen.getByTestId('submit-course-btn'));
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ createdCourseId: null, error: null }),
        );
        // Keep token lookup pending beyond the stale completion's one-second delay.
        await act(
          async () => new Promise((resolve) => setTimeout(resolve, 1200)),
        );
        expect(onComplete).not.toHaveBeenCalled();
        expect(
          screen.getByTestId('progress-bar-container').props.accessibilityValue
            .now,
        ).toBeLessThan(15);
        expect(screen.getByTestId('step-3-pending')).toBeTruthy();
      } finally {
        await act(async () => {
          resolveToken('mock-bearer-token');
        });
      }
    },
  );

  it('예산 트랙을 터치하면 예산이 바뀌며 양 끝 값은 50~1,000만원으로 제한된다', async () => {
    const { getByTestId, getByText } = await render(<CourseCreateScreen />);
    const slider = getByTestId('budget-slider');
    await fireEvent(slider, 'layout', {
      nativeEvent: { layout: { width: 200 } },
    });
    await fireEvent(slider, 'responderGrant', {
      nativeEvent: { locationX: 100 },
    });
    expect(getByTestId('budget-amount-text').props.accessibilityLabel).toBe(
      '총 530만원',
    );
    await fireEvent(slider, 'responderMove', {
      nativeEvent: { locationX: -20 },
    });
    expect(getByTestId('budget-slider').props.accessibilityValue.now).toBe(
      500000,
    );
    await fireEvent(slider, 'responderMove', {
      nativeEvent: { locationX: 220 },
    });
    await fireEvent(slider, 'responderRelease', {
      nativeEvent: { locationX: 220 },
    });
    expect(getByTestId('budget-slider').props.accessibilityValue.now).toBe(
      10000000,
    );
  });

  it('확정 전에 날짜 시트를 닫으면 입력은 저장되지 않고 생성 버튼은 비활성이다', async () => {
    const { getByTestId, findByTestId, queryByTestId, getByText } =
      await render(<CourseCreateScreen />);
    const dates = nextMonthDates();
    await fireEvent.press(getByTestId('open-date-sheet'));
    await fireEvent.press(await findByTestId(`calendar-day-${dates.start}`));
    await fireEvent.press(await findByTestId(`calendar-day-${dates.end}`));
    await fireEvent.press(getByTestId('date-sheet-backdrop'));
    expect(queryByTestId('date-sheet')).toBeNull();
    expect(getByText('여행 날짜를 선택해 주세요')).toBeTruthy();
    expect(
      getByTestId('submit-course-btn').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('일정 최대 29일 제한을 넘는 종료일은 선택할 수 없다', async () => {
    const { getByTestId, findByTestId } = await render(<CourseCreateScreen />);
    const today = new Date();
    const tooLate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 29,
    );
    const dateKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    await fireEvent.press(getByTestId('open-date-sheet'));
    await fireEvent.press(await findByTestId(`calendar-day-${dateKey(today)}`));
    expect(
      (await findByTestId(`calendar-day-${dateKey(tooLate)}`)).props
        .accessibilityState.disabled,
    ).toBe(true);
    expect(
      getByTestId('confirm-travel-dates').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('뒤로 가기는 전달된 navigation callback을 실행한다', async () => {
    const onBack = jest.fn();
    const { getByTestId } = await render(
      <CourseCreateScreen onBack={onBack} />,
    );
    await fireEvent.press(getByTestId('course-create-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
