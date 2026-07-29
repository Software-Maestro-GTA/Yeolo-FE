/**
 * @file CourseCreateScreen.test.tsx
 * @description Unit and integration tests for CourseCreateScreen travel condition input form.
 * @requirements REQ-7
 * @functional FUN-6
 * @api API-FB-4
 * @author Antigravity Agent
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

  it('필수 입력값(국가, 도시, 날짜, 일수, 예산)이 비어있는 경우 "코스 생성하기" 버튼이 비활성화되어야 한다', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId } = await render(
      <CourseCreateScreen onSubmit={mockOnSubmit} />
    );

    const submitButton = getByTestId('submit-course-btn');
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('시작일 및 종료일 입력란은 키보드 타이핑이 불가능(editable: false)하고 캘린더 선택으로 지정되어야 한다', async () => {
    const { getByTestId } = await render(
      <CourseCreateScreen />
    );

    const startDateInput = getByTestId('input-start-date');
    const endDateInput = getByTestId('input-total-days');

    expect(startDateInput.props.editable).toBe(false);
    expect(endDateInput.props.editable).toBe(false);
  });

  it('필수 조건(국가, 도시, 캘린더 선택 날짜, 예산)이 모두 올바르게 채워지면 submit 버튼이 활성화되어야 한다', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId, getAllByText } = await render(
      <CourseCreateScreen onSubmit={mockOnSubmit} />
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '대한민국');
      fireEvent.changeText(getByTestId('input-city'), '제주');
    });

    await act(async () => {
      fireEvent.press(getByTestId('input-start-date'));
    });

    await act(async () => {
      fireEvent.press(getAllByText('1')[0]);
    });

    await act(async () => {
      fireEvent.press(getAllByText('3')[0]);
    });

    await act(async () => {
      fireEvent.press(getByTestId('budget-cost_effective'));
    });

    await waitFor(() => {
      expect(getByTestId('submit-course-btn').props.accessibilityState?.disabled).toBeFalsy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('submit-course-btn'));
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('국가와 도시 입력창이 모두 자유롭게 입력 가능해야 한다', async () => {
    const { getByTestId } = await render(
      <CourseCreateScreen />
    );

    const cityInput = getByTestId('input-city');
    const countryInput = getByTestId('input-country');

    expect(cityInput.props.editable).not.toBe(false);

    await act(async () => {
      fireEvent.changeText(cityInput, '파리');
      fireEvent.changeText(countryInput, '프랑스');
    });

    expect(countryInput.props.value).toBe('프랑스');
    expect(cityInput.props.value).toBe('파리');
  });
});
