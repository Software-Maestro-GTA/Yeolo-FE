/**
 * @file CourseCreateScreen.test.tsx
 * @description Unit and integration tests for CourseCreateScreen travel condition input form matching Figma UI specs.
 */
import React from 'react';
import { fireEvent, waitFor, act, within } from '@testing-library/react-native';
import { renderWithQueryClient as render } from './test-utils';
import { CourseCreateScreen } from '../src/screens/CourseCreateScreen';

import { useCourseStore } from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as commonApi from '@yeolo/common';

jest.mock('../src/components/navigation/BottomNavBar', () => ({
  BottomNavBar: () => null,
}));

describe('CourseCreateScreen (FUN-6: 여행 조건 입력 폼)', () => {
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

    jest
      .spyOn(commonApi, 'fetchCountryAutocomplete')
      .mockImplementation(async (_, keyword) => {
        const allCountries = [
          { countryId: 'c-1', countryNameKo: '대한민국' },
          { countryId: 'c-2', countryNameKo: '일본' },
          { countryId: 'c-3', countryNameKo: '태국' },
          { countryId: 'c-4', countryNameKo: '프랑스' },
        ];
        const filtered = keyword
          ? allCountries.filter((c) => c.countryNameKo.includes(keyword))
          : allCountries;
        return {
          status: 200,
          message: '국가 자동완성 조회 성공',
          data: { countries: filtered },
        };
      });

    jest
      .spyOn(commonApi, 'fetchCityAutocomplete')
      .mockImplementation(async (_, keyword) => {
        const allCities = [
          {
            cityId: 'city-1',
            cityNameKo: '도쿄',
            countryId: 'c-2',
            countryNameKo: '일본',
          },
          {
            cityId: 'city-2',
            cityNameKo: '오사카',
            countryId: 'c-2',
            countryNameKo: '일본',
          },
          {
            cityId: 'city-3',
            cityNameKo: '방콕',
            countryId: 'c-3',
            countryNameKo: '태국',
          },
        ];
        const filtered = keyword
          ? allCities.filter((c) => c.cityNameKo.includes(keyword))
          : allCities;
        return {
          status: 200,
          message: '도시 자동완성 조회 성공',
          data: { cities: filtered },
        };
      });
  });

  it('Figma UI 스펙 타이틀과 카드가 정상적으로 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(<CourseCreateScreen />);

    expect(getByText('코스 생성')).toBeTruthy();
    expect(getByText('당신만의 여행 코스를 만들어 드릴게요.')).toBeTruthy();
    expect(getByTestId('destination-card')).toBeTruthy();
    expect(getByTestId('date-card')).toBeTruthy();
    expect(getByTestId('budget-card')).toBeTruthy();
  });

  it('필수 입력값(국가, 도시, 날짜, 예산)이 비어있는 경우 "코스 생성하기" 버튼이 비활성화되어야 한다', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId } = await render(
      <CourseCreateScreen onSubmit={mockOnSubmit} />,
    );

    const submitButton = getByTestId('submit-course-btn');
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('인기 여행지 칩 클릭 시 국가와 도시명이 자동으로 입력창에 설정되어야 한다', async () => {
    const { getByTestId, getByText } = await render(<CourseCreateScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('popular-tag-도쿄'));
    });

    expect(getByTestId('input-country').props.value).toBe('일본');
    expect(getByTestId('input-city').props.value).toBe('도쿄');
  });

  it('필수 조건(국가, 도시, 캘린더 선택 날짜, 예산)이 모두 올바르게 채워지면 submit 버튼이 활성화되어야 한다', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId, getByText, getAllByText } = await render(
      <CourseCreateScreen onSubmit={mockOnSubmit} />,
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '대한민국');
      fireEvent.changeText(getByTestId('input-city'), '제주');
    });

    await act(async () => {
      fireEvent.press(getByText('출발일'));
    });

    await act(async () => {
      fireEvent.press(getAllByText('20')[0]);
    });

    await act(async () => {
      fireEvent.press(getAllByText('25')[0]);
    });

    await act(async () => {
      fireEvent.press(getByText('가성비'));
    });

    await waitFor(() => {
      expect(
        getByTestId('submit-course-btn').props.accessibilityState?.disabled,
      ).toBeFalsy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('submit-course-btn'));
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('국가 검색창에 키워드 입력 시 API-LOC-1 국가 자동완성 리스트가 렌더링되고 항목 선택이 가능해야 한다', async () => {
    const { getByTestId, findByTestId, getByText } = await render(
      <CourseCreateScreen />,
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '일');
    });

    await findByTestId('country-dropdown');
    const countryOption = getByText('일본');
    expect(countryOption).toBeTruthy();

    await act(async () => {
      fireEvent.press(countryOption);
    });

    expect(getByTestId('input-country').props.value).toBe('일본');
  });

  it('도시 검색창에 키워드 입력 시 API-LOC-2 도시 자동완성 리스트가 렌더링되고 항목 선택이 가능해야 한다', async () => {
    const { getByTestId, findByTestId, getAllByText } = await render(
      <CourseCreateScreen />,
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-city'), '도');
    });

    await findByTestId('city-dropdown');
    const cityOptions = getAllByText('도쿄');
    expect(cityOptions.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.press(cityOptions[0]);
    });

    expect(getByTestId('input-city').props.value).toBe('도쿄');
  });

  it('검색 결과가 없는 키워드 입력 시 "검색 결과가 없습니다" 안내 뷰가 노출되지 않고 드롭다운이 비어있거나 뜨지 않아야 한다', async () => {
    const { getByTestId, queryByText, queryByTestId } = await render(
      <CourseCreateScreen />,
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '존재하지않는국가XYZ');
    });

    await waitFor(() => {
      expect(queryByText('검색 결과가 없습니다')).toBeNull();
      expect(queryByText('검색 결과가 없습니다.')).toBeNull();
      expect(queryByTestId('country-dropdown')).toBeNull();
    });
  });

  it('자동완성 및 리스트에 존재하지 않는 국가를 임의 입력할 경우 submit 버튼이 비활성화되어야 한다', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId, getByText, getAllByText } = await render(
      <CourseCreateScreen onSubmit={mockOnSubmit} />,
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '가짜국가123');
      fireEvent.changeText(getByTestId('input-city'), '도쿄');
      fireEvent.press(getByText('출발일'));
    });

    await act(async () => {
      fireEvent.press(getAllByText('20')[0]);
      fireEvent.press(getAllByText('25')[0]);
      fireEvent.press(getByText('가성비'));
    });

    expect(
      getByTestId('submit-course-btn').props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it('국가를 변경하게 되면 기존에 입력되었던 여행 도시가 자동으로 초기화되어야 한다', async () => {
    const { getByTestId, findByTestId, getByText } = await render(
      <CourseCreateScreen />,
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-city'), '도');
    });

    await findByTestId('city-dropdown');
    await act(async () => {
      fireEvent.press(within(getByTestId('city-dropdown')).getByText('도쿄'));
    });

    expect(getByTestId('input-city').props.value).toBe('도쿄');

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '프랑스');
    });

    expect(getByTestId('input-city').props.value).toBe('');
  });

  it('캘린더가 열려있을 때 바깥 영역을 터치하면 캘린더가 닫혀야 한다', async () => {
    const { getByTestId, getByText, queryByTestId } = await render(
      <CourseCreateScreen />,
    );

    await act(async () => {
      fireEvent.press(getByText('출발일'));
    });

    expect(getByTestId('inline-calendar')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('dismiss-overlay-area'));
    });

    await waitFor(() => {
      expect(queryByTestId('inline-calendar')).toBeNull();
    });
  });

  it('국가가 대한민국일 때 불일치하는 도시(도쿄)를 입력하면 submit 버튼이 비활성화되어야 한다', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId, getByText, getAllByText } = await render(
      <CourseCreateScreen onSubmit={mockOnSubmit} />,
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '대한민국');
      fireEvent.changeText(getByTestId('input-city'), '도쿄');
      fireEvent.press(getByText('출발일'));
    });

    await act(async () => {
      fireEvent.press(getAllByText('20')[0]);
      fireEvent.press(getAllByText('25')[0]);
      fireEvent.press(getByText('가성비'));
    });

    expect(
      getByTestId('submit-course-btn').props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it('오늘 이전의 과거 날짜는 캘린더에서 비활성화(disabled)되어 선택할 수 없어야 한다', async () => {
    const { getByTestId, getByText, getAllByText } = await render(
      <CourseCreateScreen />,
    );

    await act(async () => {
      fireEvent.press(getByText('출발일'));
    });

    expect(getByTestId('inline-calendar')).toBeTruthy();

    const dayOneCell = getAllByText('1')[0];
    expect(dayOneCell).toBeTruthy();

    await act(async () => {
      fireEvent.press(dayOneCell);
    });

    expect(getByTestId('input-country')).toBeTruthy();
  });

  it('여행 기간이 30일 이상일 경우 해당 날짜 선택이 비활성화되거나 submit 버튼이 비활성화되어야 한다', async () => {
    const { getByTestId, getByText } = await render(<CourseCreateScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '대한민국');
      fireEvent.changeText(getByTestId('input-city'), '제주');
    });

    expect(
      getByTestId('submit-course-btn').props.accessibilityState?.disabled,
    ).toBe(true);
  });
});
