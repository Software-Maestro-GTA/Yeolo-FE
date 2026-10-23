/**
 * @file CourseGeneratingScreen.test.tsx
 * @description Verifies smooth estimated progress shared by the bar and active ring while server events retain authority over completion.
 */
import React from 'react';
import { Animated } from 'react-native';
import { fireEvent, act } from '@testing-library/react-native';
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

  it('이전 완료 상태에서 새 생성이 시작되면 진행률과 완료 이동을 초기화한다', async () => {
    jest.useFakeTimers();
    useCourseStore.setState({ createdCourseId: 'previous-course' });
    const onComplete = jest.fn();
    const screen = await render(
      <CourseGeneratingScreen onComplete={onComplete} />,
    );
    await act(async () => {
      useCourseStore.setState({
        createdCourseId: null,
        isGenerating: true,
        progressStep: 'GENERATING_COURSE',
      });
    });
    const value = () =>
      screen.getByTestId('progress-bar-container').props.accessibilityValue.now;
    expect(value()).toBe(5);
    await act(async () => jest.advanceTimersByTime(1500));
    expect(value()).toBeGreaterThan(5);
    expect(value()).toBeLessThan(15);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('오래 기다려도 진행 중 원호의 둥근 양 끝이 겹쳐 완성된 원처럼 보이지 않는다', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    useCourseStore.setState({ progressStep: 'GENERATING_COURSE' });
    const screen = await render(<CourseGeneratingScreen />);
    const progress = timing.mock.calls[0][0] as Animated.Value;
    await act(async () => progress.setValue(99));
    const arc = screen.getByTestId('step-2-progress-arc');
    // Two rounded caps cover one stroke width of the centerline gap.
    expect(
      arc.props.strokeDashoffset - arc.props.strokeWidth,
    ).toBeGreaterThanOrEqual(4);
    expect(screen.queryByTestId('step-2-completed')).toBeNull();
  });

  it('서버 대기 중에도 바와 활성 링이 함께 차오르고 완료 전에는 100%가 되지 않는다', async () => {
    jest.useFakeTimers();
    const loop = jest.spyOn(Animated, 'loop');
    useCourseStore.setState({
      isGenerating: true,
      progressStep: 'GENERATING_COURSE',
    });
    const screen = await render(<CourseGeneratingScreen />);
    const value = () =>
      screen.getByTestId('progress-bar-container').props.accessibilityValue.now;
    const initial = value();
    await act(async () => jest.advanceTimersByTime(10000));
    expect(value()).toBeGreaterThan(initial);
    const early = value();
    await act(async () => jest.advanceTimersByTime(20000));
    expect(value()).toBeGreaterThan(early);
    expect(
      screen.getByTestId('progress-bar-container').props.accessibilityValue
        .text,
    ).toContain('예상 진행');
    expect(screen.getByTestId('step-2-progress-arc')).toBeTruthy();
    expect(screen.queryByTestId('step-3-loading')).toBeNull();
    await act(async () => jest.advanceTimersByTime(700000));
    expect(value()).toBeLessThan(100);
    expect(screen.getByTestId('step-3-pending')).toBeTruthy();
    expect(loop).not.toHaveBeenCalled();
  });

  it('같은 진행 값으로 바와 원호를 그리며 SSE 단계가 바뀌어도 역행하지 않는다', async () => {
    jest.useFakeTimers();
    const timing = jest.spyOn(Animated, 'timing');
    useCourseStore.setState({ progressStep: 'LOADING_TASTE_PREFERENCE' });
    const screen = await render(<CourseGeneratingScreen />);
    const progress = timing.mock.calls[0][0] as Animated.Value;
    for (const value of [25, 60, 85]) {
      await act(async () => progress.setValue(value));
      expect(
        screen.getByTestId('progress-bar-container').props.accessibilityValue
          .now,
      ).toBe(value);
      expect(
        screen.getByTestId('step-1-progress-arc').props.strokeDashoffset,
      ).toBeCloseTo(2 * Math.PI * 9 - ((2 * Math.PI * 9 - 8) * value) / 100);
    }
    const animations = timing.mock.calls.length;
    await act(async () =>
      useCourseStore.setState({ progressStep: 'GENERATING_COURSE' }),
    );
    expect(timing).toHaveBeenCalledTimes(animations);
    expect(
      screen.getByTestId('progress-bar-container').props.accessibilityValue.now,
    ).toBe(85);
    expect(
      screen.getByTestId('step-2-progress-arc').props.strokeDashoffset,
    ).toBeCloseTo(2 * Math.PI * 9 - (2 * Math.PI * 9 - 8) * 0.85);
    expect(screen.getByTestId('step-1-completed')).toBeTruthy();
    expect(screen.getByTestId('step-3-pending')).toBeTruthy();
    await act(async () =>
      useCourseStore.setState({ createdCourseId: 'saved-course' }),
    );
    await act(async () => jest.advanceTimersByTime(700));
    expect(
      screen.getByTestId('progress-bar-container').props.accessibilityValue.now,
    ).toBe(100);
    expect(screen.getByTestId('step-2-completed')).toBeTruthy();
    expect(screen.getByTestId('step-3-completed')).toBeTruthy();
    expect(screen.getByTestId('progress-text')).toHaveTextContent(
      '여행 코스가 준비됐어요',
    );
  });

  it.each(['COMPLETE', 'UNKNOWN_STEP'])(
    'courseId 없는 %s 단계는 완료로 표시하거나 이동하지 않는다',
    async (progressStep) => {
      jest.useFakeTimers();
      const onComplete = jest.fn();
      useCourseStore.setState({
        progressStep,
        progressMessage: '서버에서 전달한 안내',
      });
      const screen = await render(
        <CourseGeneratingScreen onComplete={onComplete} />,
      );
      await act(async () => jest.advanceTimersByTime(10000));
      expect(screen.getByTestId('step-3-pending')).toBeTruthy();
      expect(screen.queryByTestId('step-2-completed')).toBeNull();
      expect(
        screen.getByTestId('progress-bar-container').props.accessibilityValue
          .now,
      ).toBeLessThan(100);
      expect(onComplete).not.toHaveBeenCalled();
    },
  );

  it('SSE 시작 전(1단계 진행전)에는 UI v3 타이틀과 1단계·2단계 모두 대기 상태(pending)로 렌더링되어야 한다', async () => {
    const mockOnComplete = jest.fn();

    const { getByTestId, getByText } = await render(
      <CourseGeneratingScreen onComplete={mockOnComplete} />,
    );

    expect(getByText('딱 맞는 코스를 생성하고 있어요')).toBeTruthy();
    expect(getByText('취향 정보 확인 중...')).toBeTruthy();
    expect(getByText('맞춤형 여행지 생성 중...')).toBeTruthy();
    expect(getByText('코스 전송 중...')).toBeTruthy();
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

  it('에러 발생 시 코스 생성 화면으로 돌아가는 버튼만 표시한다', async () => {
    const mockOnReturnToCreate = jest.fn();

    useCourseStore.setState({ error: '여행 조건 입력값이 올바르지 않습니다.' });

    const { getByTestId, getByText, queryByText, getAllByRole } = await render(
      <CourseGeneratingScreen onReturnToCreate={mockOnReturnToCreate} />,
    );

    expect(getByText('코스 생성 중 오류가 발생했습니다')).toBeTruthy();
    expect(getByText('여행 코스 생성 화면으로')).toBeTruthy();
    expect(queryByText('시작 화면으로 이동')).toBeNull();
    expect(getAllByRole('button')).toHaveLength(1);

    await act(async () => {
      fireEvent.press(getByTestId('return-to-create-btn'));
    });

    expect(mockOnReturnToCreate).toHaveBeenCalled();
  });

  it('생성 중 실패하면 보이지 않는 애니메이션과 주기적인 진행률 갱신을 중지한다', async () => {
    jest.useFakeTimers();
    const timing = jest.spyOn(Animated, 'timing');
    const loop = jest.spyOn(Animated, 'loop');
    await render(<CourseGeneratingScreen />);
    const progress = timing.mock.calls.find(
      ([, config]) => !config.useNativeDriver,
    )![0];
    const stopProgress = jest.spyOn(progress, 'stopAnimation');

    await act(async () => {
      useCourseStore.setState({ error: '일시적으로 코스를 생성할 수 없어요.' });
    });

    expect(loop).not.toHaveBeenCalled();
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

  it('생성 실패 상태를 초기화한 다음 코스 생성 화면으로 돌아간다', async () => {
    const onReturnToCreate = jest.fn(() => {
      expect(useCourseStore.getState()).toMatchObject({
        error: null,
        errorCode: null,
        progressStep: null,
        progressMessage: null,
        createdCourseId: null,
        isGenerating: false,
      });
    });
    useCourseStore.setState({
      progressStep: 'GENERATING_COURSE',
      progressMessage: '여행 코스를 생성 중입니다.',
      error: '코스 생성 중 서버 오류가 발생했습니다.',
      errorCode: 500,
    });
    const ui = await render(
      <CourseGeneratingScreen onReturnToCreate={onReturnToCreate} />,
    );
    await fireEvent.press(ui.getByTestId('return-to-create-btn'));
    expect(onReturnToCreate).toHaveBeenCalledTimes(1);
  });
});
