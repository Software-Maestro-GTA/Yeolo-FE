/**
 * @file CourseCreateScreen.test.tsx
 * @description Unit and integration tests for CourseCreateScreen travel condition input form matching Figma UI specs.
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CourseCreateScreen } from '../src/screens/CourseCreateScreen';
import { useCourseStore } from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      fireEvent.press(getByText('🇯🇵 도쿄'));
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
      fireEvent.press(getAllByText('1')[0]);
    });

    await act(async () => {
      fireEvent.press(getAllByText('3')[0]);
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
});
