/**
 * @file DestinationPickerSheet.test.tsx
 * @description Verifies measured country layouts start at the selected country without a visible scroll restoration sequence.
 */
import React from 'react';
import { Dimensions, FlatList } from 'react-native';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import * as commonApi from '@yeolo/common';
import { renderWithQueryClient as render } from './test-utils';
import {
  layoutDestinationCountries,
  revealDestinationCountry,
} from './mocks/destinationPickerLayout';
import { DestinationPickerSheet } from '../src/components/course/DestinationPickerSheet';

const countriesResponse = {
  status: 200,
  message: 'ok',
  data: {
    countries: ['프랑스', '일본', '대한민국', '태국', '포르투갈'].map(
      (countryName) => ({ countryName }),
    ),
  },
};
const props = { onClose: jest.fn(), onSelect: jest.fn() };
const measurePattern = /^destination-country-measure-/;
const hidden = { includeHiddenElements: true };
const countryList = () => screen.getByTestId('destination-countries');
const columnLayout = (width: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width, height: 290 } },
});

describe('DestinationPickerSheet measured initial position', () => {
  let scrollToIndex: jest.SpyInstance;
  let scrollToOffset: jest.SpyInstance;

  beforeEach(() => {
    jest
      .spyOn(commonApi, 'fetchCountriesApi')
      .mockResolvedValue(countriesResponse);
    jest.spyOn(commonApi, 'fetchCitiesApi').mockResolvedValue({
      status: 200,
      message: 'ok',
      data: { cities: [] },
    });
    jest.spyOn(commonApi, 'searchLocationsApi').mockResolvedValue({
      status: 200,
      message: 'ok',
      data: { results: [] },
    });
    scrollToIndex = jest
      .spyOn(FlatList.prototype, 'scrollToIndex')
      .mockImplementation(() => {});
    scrollToOffset = jest
      .spyOn(FlatList.prototype, 'scrollToOffset')
      .mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('모든 실제 행 높이가 준비되기 전에는 목록을 노출하지 않고 선택 국가부터 시작한다', async () => {
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    expect(screen.queryByTestId('destination-countries')).toBeNull();
    await fireEvent(
      screen.getByTestId('destination-country-pane'),
      'layout',
      columnLayout(150),
    );
    const firstRow = await screen.findByTestId(
      'destination-country-measure-popular',
      hidden,
    );
    expect(screen.queryAllByTestId(measurePattern)).toHaveLength(0);
    await fireEvent(firstRow, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 150, height: 58 } },
    });
    expect(screen.queryByTestId('destination-countries')).toBeNull();
    await layoutDestinationCountries({
      heights: { 대한민국: 84, 일본: 64, 포르투갈: 72 },
    });
    const list = countryList();
    expect(list.props.initialScrollIndex).toBe(5);
    expect(list.props.getItemLayout(list.props.data, 0)).toEqual({
      index: 0,
      length: 58,
      offset: 0,
    });
    expect(list.props.getItemLayout(list.props.data, 3)).toEqual({
      index: 3,
      length: 64,
      offset: 200,
    });
    expect(list.props.getItemLayout(list.props.data, 5)).toEqual({
      index: 5,
      length: 72,
      offset: 322,
    });
    expect(scrollToIndex).not.toHaveBeenCalled();
    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('닫으면 목록을 제거하고 재개방하면 측정 캐시로 확정 국가를 바로 표시한다', async () => {
    const ui = await render(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    await layoutDestinationCountries();
    await fireEvent.press(await revealDestinationCountry('일본'));
    expect(screen.getByTestId('destination-country-일본')).toHaveProp(
      'accessibilityState',
      { selected: true },
    );
    await ui.rerender(
      <DestinationPickerSheet
        {...props}
        visible={false}
        initialCountry='포르투갈'
      />,
    );
    expect(screen.queryByTestId('destination-countries', hidden)).toBeNull();
    await ui.rerender(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    await screen.findByTestId('destination-countries');
    expect(screen.queryAllByTestId(measurePattern, hidden)).toHaveLength(0);
    expect(countryList().props.initialScrollIndex).toBe(5);
    expect(screen.getByTestId('destination-country-포르투갈')).toHaveProp(
      'accessibilityState',
      { selected: true },
    );
    expect(scrollToIndex).not.toHaveBeenCalled();
    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('국가 조회가 늦으면 데이터와 실측이 모두 준비된 뒤 목록을 처음 표시한다', async () => {
    let resolveCountries!: (value: typeof countriesResponse) => void;
    jest.mocked(commonApi.fetchCountriesApi).mockReturnValue(
      new Promise((resolve) => {
        resolveCountries = resolve;
      }),
    );
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='프랑스' />,
    );
    await fireEvent(
      screen.getByTestId('destination-country-pane'),
      'layout',
      columnLayout(150),
    );
    expect(screen.queryByTestId('destination-countries')).toBeNull();
    expect(screen.queryAllByTestId(measurePattern, hidden)).toHaveLength(0);
    await act(async () => resolveCountries(countriesResponse));
    await screen.findByTestId('destination-country-measure-프랑스', hidden);
    expect(screen.queryByTestId('destination-countries')).toBeNull();
    await layoutDestinationCountries();
    expect(countryList().props.initialScrollIndex).toBe(6);
    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  it('긴 목록도 첫 렌더부터 선택 인덱스를 사용하고 나중에 복원 스크롤을 예약하지 않는다', async () => {
    jest.useFakeTimers();
    jest.mocked(commonApi.fetchCountriesApi).mockResolvedValue({
      ...countriesResponse,
      data: {
        countries: [
          ...countriesResponse.data.countries,
          ...Array.from({ length: 25 }, (_, index) => ({
            countryName: `가나 ${index + 1}`,
          })),
        ],
      },
    });
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='프랑스' />,
    );
    await layoutDestinationCountries();
    expect(countryList().props.initialScrollIndex).toBe(31);
    expect(
      countryList().props.getItemLayout(countryList().props.data, 31),
    ).toEqual({ index: 31, length: 58, offset: 1798 });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });
    expect(scrollToIndex).not.toHaveBeenCalled();
    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('직접 탐색한 뒤 검색을 지우면 현재 탐색 국가에서 목록을 다시 표시한다', async () => {
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    await layoutDestinationCountries();
    await fireEvent.press(await revealDestinationCountry('일본'));
    await fireEvent.changeText(screen.getByTestId('destination-search'), '일');
    expect(screen.queryByTestId('destination-countries')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('destination-search'), '');
    await screen.findByTestId('destination-countries');
    expect(countryList().props.initialScrollIndex).toBe(3);
    expect(screen.getByTestId('destination-country-일본')).toHaveProp(
      'accessibilityState',
      { selected: true },
    );
    expect(scrollToIndex).not.toHaveBeenCalled();
    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it('열 너비가 바뀌면 이전 측정값을 버리고 새 줄바꿈 높이로 시작한다', async () => {
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    await layoutDestinationCountries();
    await fireEvent(
      screen.getByTestId('destination-country-pane'),
      'layout',
      columnLayout(100),
    );
    expect(screen.queryByTestId('destination-countries')).toBeNull();
    await layoutDestinationCountries({
      width: 100,
      heights: { 대한민국: 96, 포르투갈: 84 },
    });
    const list = countryList();
    expect(list.props.initialScrollIndex).toBe(5);
    expect(list.props.getItemLayout(list.props.data, 5)).toEqual({
      index: 5,
      length: 84,
      offset: 328,
    });
  });

  it('접근성 글자 배율이 바뀌면 높이를 다시 측정한다', async () => {
    const previousWindow = Dimensions.get('window');
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    await layoutDestinationCountries();
    try {
      await act(async () => {
        Dimensions.set({ window: { ...previousWindow, fontScale: 1.6 } });
      });
      expect(screen.queryByTestId('destination-countries')).toBeNull();
      await layoutDestinationCountries({ heights: { 대한민국: 90 } });
      const list = countryList();
      expect(list.props.getItemLayout(list.props.data, 5)).toEqual({
        index: 5,
        length: 58,
        offset: 322,
      });
    } finally {
      await act(async () => Dimensions.set({ window: previousWindow }));
    }
  });

  it('서버 국가 목록이 바뀌면 새 이름순 목록의 높이와 인덱스를 계산한다', async () => {
    const ui = await render(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    await layoutDestinationCountries();
    await ui.rerender(
      <DestinationPickerSheet
        {...props}
        visible={false}
        initialCountry='포르투갈'
      />,
    );
    jest.mocked(commonApi.fetchCountriesApi).mockResolvedValue({
      ...countriesResponse,
      data: {
        countries: [
          ...countriesResponse.data.countries,
          { countryName: '캐나다' },
        ],
      },
    });
    await ui.rerender(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    await screen.findByTestId('destination-country-measure-캐나다', hidden);
    expect(screen.queryByTestId('destination-countries')).toBeNull();
    await layoutDestinationCountries();
    const list = countryList();
    expect(list.props.initialScrollIndex).toBe(6);
    expect(list.props.getItemLayout(list.props.data, 6)).toEqual({
      index: 6,
      length: 58,
      offset: 348,
    });
  });

  it('너비 변경 전의 늦은 측정 이벤트가 새 목록의 높이를 덮어쓰지 않는다', async () => {
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='포르투갈' />,
    );
    await fireEvent(
      screen.getByTestId('destination-country-pane'),
      'layout',
      columnLayout(150),
    );
    const oldRows = await screen.findAllByTestId(measurePattern, hidden);
    const oldLayouts = oldRows.map((row) => row.props.onLayout);
    await fireEvent(
      screen.getByTestId('destination-country-pane'),
      'layout',
      columnLayout(100),
    );
    await act(async () => {
      oldLayouts.forEach((onLayout) =>
        onLayout({
          nativeEvent: { layout: { x: 0, y: 0, width: 150, height: 58 } },
        }),
      );
    });
    expect(screen.queryByTestId('destination-countries')).toBeNull();
    await layoutDestinationCountries({ width: 100, heights: { 대한민국: 96 } });
    const list = countryList();
    expect(list.props.getItemLayout(list.props.data, 5)).toEqual({
      index: 5,
      length: 58,
      offset: 328,
    });
  });

  it('국가 조회가 실패하고 도시 조회만 성공해도 국가 목록에서 재시도할 수 있다', async () => {
    jest
      .mocked(commonApi.fetchCountriesApi)
      .mockRejectedValueOnce(new Error('국가 목록 조회 실패'))
      .mockResolvedValue(countriesResponse);
    jest.mocked(commonApi.fetchCitiesApi).mockResolvedValue({
      status: 200,
      message: 'ok',
      data: { cities: [{ cityName: '파리' }] },
    });
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='프랑스' />,
    );
    await screen.findByTestId('destination-city-파리');
    await layoutDestinationCountries();
    expect(screen.getByTestId('destination-country-popular')).toBeTruthy();
    const pane = within(screen.getByTestId('destination-country-pane'));
    expect(pane.getByText('여행지를 불러오지 못했어요.')).toBeTruthy();
    await fireEvent.press(pane.getByText('다시 시도'));
    await waitFor(() =>
      expect(commonApi.fetchCountriesApi).toHaveBeenCalledTimes(2),
    );
    await screen.findByTestId('destination-country-measure-프랑스', hidden);
    await layoutDestinationCountries();
    expect(countryList().props.initialScrollIndex).toBe(6);
    expect(screen.getByTestId('destination-country-프랑스')).toHaveProp(
      'accessibilityState',
      { selected: true },
    );
    expect(pane.queryByText('다시 시도')).toBeNull();
    expect(screen.getByTestId('destination-city-파리')).toBeTruthy();
  });

  it('첫 국가 조회가 실패해도 로컬 인기 탭을 선택할 수 있다', async () => {
    jest
      .mocked(commonApi.fetchCountriesApi)
      .mockRejectedValue(new Error('국가 목록 조회 실패'));
    await render(
      <DestinationPickerSheet {...props} visible initialCountry='프랑스' />,
    );
    await layoutDestinationCountries();
    await fireEvent.press(screen.getByTestId('destination-country-popular'));
    expect(screen.getByTestId('destination-country-popular')).toHaveProp(
      'accessibilityState',
      { selected: true },
    );
  });

  it.each(['', '목록에 없는 국가'])(
    '선택 값이 %s이면 유효한 인기 인덱스로 처음 표시한다',
    async (initialCountry) => {
      await render(
        <DestinationPickerSheet
          {...props}
          visible
          initialCountry={initialCountry}
        />,
      );
      await layoutDestinationCountries();
      expect(countryList().props.initialScrollIndex).toBe(0);
      expect(scrollToIndex).not.toHaveBeenCalled();
      expect(scrollToOffset).not.toHaveBeenCalled();
    },
  );
});
