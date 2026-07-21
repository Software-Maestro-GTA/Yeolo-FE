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

  it('유효하지 않은 날짜 포맷이나 0 이하 일수 입력 시 생성 버튼이 비활성화되어야 한다', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId } = await render(
      <CourseCreateScreen onSubmit={mockOnSubmit} />
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '대한민국');
      fireEvent.changeText(getByTestId('input-city'), '제주');
      fireEvent.changeText(getByTestId('input-start-date'), '2026-99-99');
      fireEvent.changeText(getByTestId('input-total-days'), '0');
      fireEvent.press(getByTestId('budget-cost_effective'));
    });

    await waitFor(() => {
      expect(getByTestId('submit-course-btn').props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('필수 조건이 모두 올바르게 입력되면 버튼이 활성화되고 폼 데이터를 전달하며 submit 되어야 한다', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId } = await render(
      <CourseCreateScreen onSubmit={mockOnSubmit} />
    );

    await act(async () => {
      fireEvent.changeText(getByTestId('input-country'), '대한민국');
      fireEvent.changeText(getByTestId('input-city'), '제주');
      fireEvent.changeText(getByTestId('input-start-date'), '2026-08-01');
      fireEvent.changeText(getByTestId('input-total-days'), '3');
      fireEvent.press(getByTestId('budget-cost_effective'));
    });

    await waitFor(() => {
      expect(getByTestId('submit-course-btn').props.accessibilityState?.disabled).toBeFalsy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('submit-course-btn'));
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        destinationCountry: '대한민국',
        destinationCity: '제주',
        startDate: '2026-08-01',
        totalDays: 3,
        budgetType: 'cost_effective',
      });
    });
  });
});
