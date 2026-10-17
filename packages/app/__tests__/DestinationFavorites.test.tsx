/**
 * @file DestinationFavorites.test.tsx
 * @description Verifies local destination favorites, star interactions and offline access through the shared picker.
 */
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as commonApi from '@yeolo/common';
import { renderWithQueryClient as render } from './test-utils';
import { DestinationPickerSheet } from '../src/components/course/DestinationPickerSheet';
import {
  layoutDestinationCountries,
  revealDestinationCountry,
} from './mocks/destinationPickerLayout';

const favoritesKey = 'yeolo:destination-favorites:v1';
const starId = (country: string, city: string) =>
  `destination-favorite-${JSON.stringify([country, city])}`;

describe('DestinationPickerSheet local favorites', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.removeItem(favoritesKey);
    jest.spyOn(commonApi, 'fetchCountriesApi').mockResolvedValue({
      status: 200,
      message: 'ok',
      data: {
        countries: [
          { countryName: '프랑스' },
          { countryName: '미국' },
          { countryName: '일본' },
        ],
      },
    });
    jest.spyOn(commonApi, 'fetchCitiesApi').mockResolvedValue({
      status: 200,
      message: 'ok',
      data: { cities: [{ cityName: '파리' }] },
    });
    jest.spyOn(commonApi, 'searchLocationsApi').mockResolvedValue({
      status: 200,
      message: 'ok',
      data: {
        results: [
          { countryName: '프랑스', cities: [{ cityName: '파리' }] },
          { countryName: '미국', cities: [{ cityName: '파리' }] },
        ],
      },
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('국가 목록에서 인기는 첫 번째, 즐겨찾기는 두 번째로 표시한다', async () => {
    await render(
      <DestinationPickerSheet
        visible
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );
    await layoutDestinationCountries();
    expect(
      screen
        .getAllByTestId(/^destination-country-(?!pane$)/)
        .map((row) => row.props.testID),
    ).toEqual([
      'destination-country-popular',
      'destination-country-__favorites__',
      'destination-country-미국',
      'destination-country-일본',
      'destination-country-프랑스',
    ]);
    expect(screen.getByText('즐겨찾기')).toBeTruthy();
  });

  it('도시 별표는 폰에 저장하고 시트를 유지하며 즐겨찾기 행은 국가와 도시를 선택한다', async () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    await render(
      <DestinationPickerSheet
        visible
        initialCountry='프랑스'
        onClose={onClose}
        onSelect={onSelect}
      />,
    );
    await layoutDestinationCountries();
    const star = await screen.findByTestId(starId('프랑스', '파리'));
    expect(star).toHaveProp('accessibilityLabel', '프랑스 파리 즐겨찾기 추가');
    await fireEvent.press(star);
    await waitFor(() =>
      expect(screen.getByTestId(starId('프랑스', '파리'))).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ selected: true }),
      ),
    );
    await waitFor(async () =>
      expect(
        JSON.parse((await AsyncStorage.getItem(favoritesKey)) || '[]'),
      ).toEqual([{ country: '프랑스', city: '파리' }]),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByTestId('destination-sheet')).toBeTruthy();
    await fireEvent.press(await revealDestinationCountry('__favorites__'));
    expect(await screen.findByText('프랑스 · 파리')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('destination-city-파리'));
    expect(onSelect).toHaveBeenCalledWith('프랑스', '파리');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(commonApi.fetchCitiesApi).not.toHaveBeenCalledWith(
      expect.any(String),
      '__favorites__',
    );
  });

  it('앱 화면을 다시 마운트해도 저장한 별표와 즐겨찾는 여행지가 유지된다', async () => {
    const ui = await render(
      <DestinationPickerSheet
        visible
        initialCountry='프랑스'
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );
    await fireEvent.press(await screen.findByTestId(starId('프랑스', '파리')));
    await waitFor(() =>
      expect(screen.getByTestId(starId('프랑스', '파리'))).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ selected: true }),
      ),
    );
    await ui.unmount();

    await render(
      <DestinationPickerSheet
        visible
        initialCountry='프랑스'
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId(starId('프랑스', '파리'))).toHaveProp(
        'accessibilityLabel',
        '프랑스 파리 즐겨찾기 해제',
      ),
    );
    await layoutDestinationCountries();
    await fireEvent.press(await revealDestinationCountry('__favorites__'));
    expect(await screen.findByText('프랑스 · 파리')).toBeTruthy();
  });

  it('국가·도시 서버 조회가 실패해도 휴대폰에 저장한 여행지를 선택할 수 있다', async () => {
    await AsyncStorage.setItem(
      favoritesKey,
      JSON.stringify([{ country: '프랑스', city: '파리' }]),
    );
    jest
      .mocked(commonApi.fetchCountriesApi)
      .mockRejectedValue(new Error('offline'));
    jest
      .mocked(commonApi.fetchCitiesApi)
      .mockRejectedValue(new Error('offline'));
    const onClose = jest.fn();
    const onSelect = jest.fn();
    await render(
      <DestinationPickerSheet
        visible
        initialCountry='프랑스'
        onClose={onClose}
        onSelect={onSelect}
      />,
    );
    await layoutDestinationCountries();
    await fireEvent.press(await revealDestinationCountry('__favorites__'));
    expect(await screen.findByText('프랑스 · 파리')).toBeTruthy();
    expect(screen.getByTestId(starId('프랑스', '파리'))).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: true }),
    );
    await fireEvent.press(screen.getByTestId('destination-city-파리'));
    expect(onSelect).toHaveBeenCalledWith('프랑스', '파리');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(commonApi.fetchCitiesApi).not.toHaveBeenCalledWith(
      expect.any(String),
      '__favorites__',
    );
  });

  it('즐겨찾기에서 별표를 해제하면 저장 목록에서도 사라지고 시트는 열린 채로 유지된다', async () => {
    await AsyncStorage.setItem(
      favoritesKey,
      JSON.stringify([{ country: '프랑스', city: '파리' }]),
    );
    const onClose = jest.fn();
    const onSelect = jest.fn();
    await render(
      <DestinationPickerSheet visible onClose={onClose} onSelect={onSelect} />,
    );
    await layoutDestinationCountries();
    await fireEvent.press(await revealDestinationCountry('__favorites__'));
    const star = await screen.findByTestId(starId('프랑스', '파리'));
    expect(star).toHaveProp('accessibilityLabel', '프랑스 파리 즐겨찾기 해제');
    await fireEvent.press(star);
    await waitFor(() =>
      expect(screen.queryByTestId('destination-city-파리')).toBeNull(),
    );
    expect(
      screen.getByText(/도시 옆 별표를 눌러\s*즐겨찾는 여행지를 모아보세요\./),
    ).toBeTruthy();
    expect(
      JSON.parse((await AsyncStorage.getItem(favoritesKey)) || '[]'),
    ).toEqual([]);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('destination-sheet')).toBeTruthy();
  });

  it('저장한 여행지가 없으면 안내를 표시하고 즐겨찾기를 국가로 서버에 요청하지 않는다', async () => {
    await render(
      <DestinationPickerSheet
        visible
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );
    await layoutDestinationCountries();
    await fireEvent.press(await revealDestinationCountry('__favorites__'));
    expect(
      await screen.findByText(
        /도시 옆 별표를 눌러\s*즐겨찾는 여행지를 모아보세요\./,
      ),
    ).toBeTruthy();
    expect(screen.queryAllByTestId(/^destination-city-/)).toHaveLength(0);
    expect(commonApi.fetchCitiesApi).not.toHaveBeenCalled();
  });

  it('검색에서 이름이 같은 도시도 국가별로 별표를 저장하고 해제하며 정확한 국가를 선택한다', async () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    await render(
      <DestinationPickerSheet visible onClose={onClose} onSelect={onSelect} />,
    );
    await layoutDestinationCountries();
    await fireEvent.changeText(
      screen.getByTestId('destination-search'),
      '파리',
    );
    const franceStar = await screen.findByTestId(starId('프랑스', '파리'));
    expect(await screen.findByText('미국 · 파리')).toBeTruthy();
    expect(screen.getByText('프랑스 · 파리')).toBeTruthy();
    await fireEvent.press(franceStar);
    await waitFor(() =>
      expect(screen.getByTestId(starId('프랑스', '파리'))).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ selected: true }),
      ),
    );
    await fireEvent.press(screen.getByTestId(starId('미국', '파리')));
    await waitFor(() =>
      expect(screen.getByTestId(starId('미국', '파리'))).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ selected: true }),
      ),
    );
    expect(
      JSON.parse((await AsyncStorage.getItem(favoritesKey)) || '[]'),
    ).toEqual([
      { country: '프랑스', city: '파리' },
      { country: '미국', city: '파리' },
    ]);
    await fireEvent.press(screen.getByTestId(starId('프랑스', '파리')));
    await waitFor(() =>
      expect(screen.getByTestId(starId('프랑스', '파리'))).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ selected: false }),
      ),
    );
    expect(screen.getByTestId(starId('미국', '파리'))).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: true }),
    );
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByTestId('destination-search'), '');
    await fireEvent.press(await revealDestinationCountry('__favorites__'));
    expect(await screen.findByText('미국 · 파리')).toBeTruthy();
    expect(screen.queryByText('프랑스 · 파리')).toBeNull();
    await fireEvent.press(screen.getByTestId('destination-city-파리'));
    expect(onSelect).toHaveBeenCalledWith('미국', '파리');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
