/**
 * @file CourseGeneratingScreen.test.tsx
 * @description Course generation states, delayed navigation, and animation cleanup on failure or unmount.
 */
import React from 'react';
import { Animated } from 'react-native';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { CourseGeneratingScreen } from '../src/screens/CourseGeneratingScreen';
import { useCourseStore } from '@yeolo/common';
import { renderWithQueryClient as render } from './test-utils';

describe('CourseGeneratingScreen (TSK-58: 코스 생성 동적 단계 및 1초 딜레이 연동)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    useCourseStore.setState({
      createdCourseId: null,
      isGenerating: false,
      progressStep: null,
      progressMessage: null,
      error: null,
      errorCode: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('SSE 시작 전(1단계 진행전)에는 UI v3 타이틀과 1단계·2단계 모두 대기 상태(pending)로 렌더링되어야 한다', async () => {
    const mockOnComplete = jest.fn();

    const { getByTestId, getByText } = await render(
      <CourseGeneratingScreen onComplete={mockOnComplete} />,
    );

    expect(getByText('딱 맞는 코스를 생성하고 있어요')).toBeTruthy();
    expect(getByText('취향 데이터 스캔 중...')).toBeTruthy();
    expect(getByText('맞춤형 여행지 탐색 중...')).toBeTruthy();
    expect(getByText('최적 동선 구성 중...')).toBeTruthy();
    expect(getByTestId('step-1-pending')).toBeTruthy();
    expect(getByTestId('step-2-pending')).toBeTruthy();
  });

  it('LOADING_TASTE_PREFERENCE 수신 시 1단계 진행중(loading), 2단계 대기(pending) 상태여야 한다', async () => {
    const mockOnComplete = jest.fn();

    useCourseStore.setState({
      isGenerating: true,
      progressStep: 'LOADING_TASTE_PREFERENCE',
      progressMessage: '사용자 정보를 불러오는 중입니다.',
    });

    const { getByTestId } = await render(
      <CourseGeneratingScreen onComplete={mockOnComplete} />,
    );

    expect(getByTestId('step-1-loading')).toBeTruthy();
    expect(getByTestId('step-2-pending')).toBeTruthy();
    expect(getByTestId('progress-text').props.children).toBe(
      '사용자 정보를 불러오는 중입니다.',
    );
  });

  it('GENERATING_COURSE 수신 시 1단계 완료(completed), 2단계 진행중(loading) 상태여야 한다', async () => {
    const mockOnComplete = jest.fn();

    useCourseStore.setState({
      isGenerating: true,
      progressStep: 'GENERATING_COURSE',
      progressMessage: '개인 맞춤형 여행 코스를 생성 중입니다.',
    });

    const { getByTestId } = await render(
      <CourseGeneratingScreen onComplete={mockOnComplete} />,
    );

    expect(getByTestId('step-1-completed')).toBeTruthy();
    expect(getByTestId('step-2-loading')).toBeTruthy();
    expect(getByTestId('progress-text').props.children).toBe(
      '개인 맞춤형 여행 코스를 생성 중입니다.',
    );
  });

  it('complete 이벤트 수신(createdCourseId 설정) 시 1단계와 2단계 모두 완료(completed) 상태여야 한다', async () => {
    const mockOnComplete = jest.fn();

    useCourseStore.setState({
      createdCourseId: '550e8400-e29b-41d4-a716-446655440030',
      progressStep: 'COMPLETE',
      progressMessage: '여행 코스 생성 성공',
    });

    const { getByTestId } = await render(
      <CourseGeneratingScreen onComplete={mockOnComplete} />,
    );

    expect(getByTestId('step-1-completed')).toBeTruthy();
    expect(getByTestId('step-2-completed')).toBeTruthy();
  });

  it('2단계 완료(createdCourseId 설정) 후 즉시 이동하지 않고 1초(1000ms) 텀을 두고 onComplete가 실행되어야 한다', async () => {
    jest.useFakeTimers();
    const mockOnComplete = jest.fn();

    await render(<CourseGeneratingScreen onComplete={mockOnComplete} />);

    expect(mockOnComplete).not.toHaveBeenCalled();

    await act(async () => {
      useCourseStore.setState({
        createdCourseId: '550e8400-e29b-41d4-a716-446655440030',
        progressStep: 'COMPLETE',
      });
    });

    // Before 1000ms: onComplete should NOT be called yet
    expect(mockOnComplete).not.toHaveBeenCalled();

    // Advance timers by 1000ms
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnComplete).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440030',
    );
  });

  it('에러 발생 시 실패 메시지와 재시도 버튼이 노출되고 이전 입력값을 유지할 수 있어야 한다', async () => {
    const mockOnRetry = jest.fn();

    useCourseStore.setState({ error: '여행 조건 입력값이 올바르지 않습니다.' });

    const { getByTestId, getByText } = await render(
      <CourseGeneratingScreen onRetry={mockOnRetry} />,
    );

    expect(getByText('코스 생성 중 오류가 발생했습니다')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('retry-btn'));
    });

    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('생성 중 실패하면 보이지 않는 애니메이션과 주기적인 진행률 갱신을 중지한다', async () => {
    jest.useFakeTimers();
    const timing = jest.spyOn(Animated, 'timing');
    const loop = jest.spyOn(Animated, 'loop');
    await render(<CourseGeneratingScreen />);
    const spinner = loop.mock.results[0].value;
    const stopSpinner = jest.spyOn(spinner, 'stop');
    const progress = timing.mock.calls.find(
      ([, config]) => !config.useNativeDriver,
    )![0];
    const stopProgress = jest.spyOn(progress, 'stopAnimation');

    await act(async () => {
      useCourseStore.setState({ error: '일시적으로 코스를 생성할 수 없어요.' });
    });

    expect(stopSpinner).toHaveBeenCalledTimes(1);
    expect(stopProgress).toHaveBeenCalled();
    const animationsAtFailure = timing.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(timing).toHaveBeenCalledTimes(animationsAtFailure);
  });

  it.each([false, true])(
    '화면을 닫으면 진행률 애니메이션과 완료 이동을 취소한다 (완료=%s)',
    async (completed) => {
      jest.useFakeTimers();
      if (completed)
        useCourseStore.setState({
          createdCourseId: 'completed-course',
          progressStep: 'COMPLETE',
        });
      const timing = jest.spyOn(Animated, 'timing');
      const onComplete = jest.fn();
      const { unmount } = await render(
        <CourseGeneratingScreen onComplete={onComplete} />,
      );
      const progress = timing.mock.calls.find(
        ([, config]) => !config.useNativeDriver,
      )![0];
      const stopProgress = jest.spyOn(progress, 'stopAnimation');

      await unmount();

      expect(stopProgress).toHaveBeenCalled();
      const animationsAtUnmount = timing.mock.calls.length;
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(timing).toHaveBeenCalledTimes(animationsAtUnmount);
      expect(onComplete).not.toHaveBeenCalled();
    },
  );

  it('코스 생성 중 에러 발생 시 시작 화면으로 이동 버튼(go-intro-btn)이 노출되고 클릭 시 Intro 화면(onNavigateToIntro)으로 이동해야 한다', async () => {
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
      />,
    );

    expect(getByText('시작 화면으로 이동')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('go-intro-btn'));
    });

    expect(mockOnNavigateToIntro).toHaveBeenCalled();
  });
});
