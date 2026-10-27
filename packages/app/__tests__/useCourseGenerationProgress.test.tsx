/**
 * @file useCourseGenerationProgress.test.tsx
 * @description 공통 진행률 소유자가 화면·하단 카드 전환과 새 시도 사이의 진행을 일관되게 유지하는지 검증합니다.
 */
import React, { useState } from 'react';
import { Animated } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { useCourseStore } from '@yeolo/common';
import { useCourseGenerationProgress } from '../src/hooks/useCourseGenerationProgress';
import { CourseGeneratingScreen } from '../src/screens/CourseGeneratingScreen';
import { CourseGenerationStatusCard } from '../src/components/course/CourseGenerationStatusCard';
import { renderWithQueryClient as render } from './test-utils';

function GenerationFlow() {
  const [fullScreen, setFullScreen] = useState(true);
  const { isGenerating, createdCourseId, error } = useCourseStore();
  const progress = useCourseGenerationProgress({
    active: isGenerating,
    completed: Boolean(createdCourseId),
    error,
  });
  return fullScreen ? (
    <CourseGeneratingScreen
      progress={progress}
      onBack={() => setFullScreen(false)}
    />
  ) : (
    <CourseGenerationStatusCard
      progress={progress}
      status={createdCourseId ? 'complete' : error ? 'error' : 'generating'}
      title='코스 생성 중'
      message='최적 동선 구성 중'
      onPress={() => setFullScreen(true)}
      onDismiss={jest.fn()}
    />
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  useCourseStore.getState().resetCourseState();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  useCourseStore.getState().resetCourseState();
});

it('화면↔카드 이동 중 진행을 이어가고 실제 완료·새 시도에서만 완료/초기화한다', async () => {
  useCourseStore
    .getState()
    .setProgress('LOADING_TASTE_PREFERENCE', '취향 로딩');
  const timing = jest.spyOn(Animated, 'timing');
  const ui = await render(<GenerationFlow />);
  const percentage = () =>
    ui.getByTestId('progress-bar-container').props.accessibilityValue.now;
  const cardPercentage = () => {
    const arc = ui.getByTestId('course-generation-status-progress-arc', {
      includeHiddenElements: true,
    });
    return Math.round(
      100 * (1 - arc.props.strokeDashoffset / arc.props.strokeDasharray[0]),
    );
  };
  await act(async () => jest.advanceTimersByTime(10000));
  const beforeLeaving = percentage();
  expect(beforeLeaving).toBeGreaterThan(5);
  const animations = timing.mock.calls.length;
  await fireEvent.press(ui.getByTestId('course-generating-back'));
  expect(cardPercentage()).toBe(beforeLeaving);
  await act(async () => jest.advanceTimersByTime(10000));
  const onCard = cardPercentage();
  expect(onCard).toBeGreaterThan(beforeLeaving);
  await act(async () =>
    useCourseStore.getState().setProgress('GENERATING_COURSE', '코스 생성'),
  );
  expect(cardPercentage()).toBe(onCard);
  await fireEvent.press(ui.getByTestId('course-generation-status-action'));
  await act(async () => jest.advanceTimersByTime(32));
  expect(percentage()).toBeGreaterThanOrEqual(onCard);
  expect(timing).toHaveBeenCalledTimes(animations);
  await act(async () => useCourseStore.getState().setComplete('saved-course'));
  await act(async () => jest.advanceTimersByTime(700));
  expect(percentage()).toBe(100);
  await act(async () => {
    useCourseStore.getState().resetCourseState();
    useCourseStore.getState().setProgress('GENERATING_COURSE', '새 코스 생성');
  });
  expect(percentage()).toBe(5);
  await ui.unmount();
});
