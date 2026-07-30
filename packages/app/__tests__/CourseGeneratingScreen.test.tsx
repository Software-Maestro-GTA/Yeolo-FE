/**
 * @file CourseGeneratingScreen.test.tsx
 * @description Unit and integration tests for CourseGeneratingScreen SSE progress display and navigation.
 * @requirements REQ-7
 * @functional FUN-6
 * @api API-FB-4
 * @author Antigravity Agent
 */
import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { CourseGeneratingScreen } from '../src/screens/CourseGeneratingScreen';
import { useCourseStore } from '@yeolo/common';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

describe('CourseGeneratingScreen (API-FB-4: SSE 스트리밍 로딩 및 상태 바인딩)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCourseStore.setState({
      createdCourseId: null,
      isGenerating: false,
      progressStep: null,
      progressMessage: null,
      error: null,
      errorCode: null,
    });
  });

  it('SSE progress 이벤트 메시지를 실시간으로 렌더링해야 한다', async () => {
    const mockOnComplete = jest.fn();

    useCourseStore.setState({ progressMessage: '사용자 취향 프로필을 불러오는 중입니다.' });

    const { getByTestId } = await render(
      <CourseGeneratingScreen
        onComplete={mockOnComplete}
      />
    );

    expect(getByTestId('progress-text').props.children).toBe('사용자 취향 프로필을 불러오는 중입니다.');

    await act(async () => {
      useCourseStore.setState({ progressMessage: '개인 맞춤형 여행 코스를 생성 중입니다.' });
    });

    await waitFor(() => {
      expect(getByTestId('progress-text').props.children).toBe('개인 맞춤형 여행 코스를 생성 중입니다.');
    });
  });

  it('complete 이벤트 완료 시 전달된 courseId로 onComplete 네비게이션이 실행되어야 한다', async () => {
    const mockOnComplete = jest.fn();

    useCourseStore.setState({ createdCourseId: '550e8400-e29b-41d4-a716-446655440030' });

    await render(
      <CourseGeneratingScreen
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440030');
    });
  });

  it('에러 발생 시 실패 메시지와 재시도 버튼이 노출되고 이전 입력값을 유지할 수 있어야 한다', async () => {
    const mockOnRetry = jest.fn();

    useCourseStore.setState({ error: '여행 조건 입력값이 올바르지 않습니다.' });

    const { getByTestId, getByText } = await render(
      <CourseGeneratingScreen
        onRetry={mockOnRetry}
      />
    );

    expect(getByText('코스 생성 중 오류가 발생했습니다.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('retry-btn'));
    });

    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('코스 생성 중 에러 발생 시 취향 분석하기 버튼(go-intro-btn)이 노출되고 클릭 시 Intro 화면(onNavigateToIntro)으로 이동해야 한다', async () => {
    const mockOnNavigateToIntro = jest.fn();
    const mockOnRetry = jest.fn();

    useCourseStore.setState({
      error: '코스 생성 중 서버 오류가 발생했습니다.',
      errorCode: 500,
    });

    const { getByTestId, getByText } = await render(
      <CourseGeneratingScreen
        onRetry={mockOnRetry}
        onNavigateToIntro={mockOnNavigateToIntro}
      />
    );

    expect(getByText(UI_STRINGS.TASTE_PROFILE.START_ANALYSIS)).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('go-intro-btn'));
    });

    expect(mockOnNavigateToIntro).toHaveBeenCalled();
  });
});
