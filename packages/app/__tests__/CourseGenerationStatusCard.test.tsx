/**
 * @file CourseGenerationStatusCard.test.tsx
 * @description Figma 진행 카드의 열기·결과·닫기와 공유 진행 값에 비례하는 게이지를 검증합니다.
 */
import React from 'react';
import { Animated } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { CourseGenerationStatusCard } from '../src/components/course/CourseGenerationStatusCard';
import { renderWithQueryClient as render } from './test-utils';

const props = {
  progress: new Animated.Value(5),
  title: '도쿄 코스를 생성하고 있어요',
  message: '최적 동선 구성 중...',
  onPress: jest.fn(),
  onDismiss: jest.fn(),
};

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

it('생성 중에는 텍스트 버튼 대신 카드 전체로 진행 화면을 열며 닫기는 제공하지 않는다', async () => {
  const ui = await render(
    <CourseGenerationStatusCard {...props} status='generating' />,
  );
  expect(ui.getByText(props.title)).toBeTruthy();
  expect(ui.getByText(props.message)).toBeTruthy();
  expect(ui.queryByText('진행 보기')).toBeNull();
  expect(ui.queryByTestId('course-generation-status-dismiss')).toBeNull();
  expect(
    ui.getByTestId('course-generation-status-action').props.accessibilityState
      .busy,
  ).toBe(true);
  await fireEvent.press(ui.getByTestId('course-generation-status-action'));
  expect(props.onPress).toHaveBeenCalledTimes(1);
  expect(props.onDismiss).not.toHaveBeenCalled();
});

it('완료되면 같은 카드에서 결과 보기와 알림 닫기를 각각 사용할 수 있다', async () => {
  const ui = await render(
    <CourseGenerationStatusCard {...props} status='complete' />,
  );
  expect(ui.getByText('결과 보기')).toBeTruthy();
  expect(
    ui.getByTestId('course-generation-status-action').props.accessibilityState
      .busy,
  ).toBe(false);
  await fireEvent.press(ui.getByTestId('course-generation-status-action'));
  await fireEvent.press(ui.getByTestId('course-generation-status-dismiss'));
  expect(props.onPress).toHaveBeenCalledTimes(1);
  expect(props.onDismiss).toHaveBeenCalledTimes(1);
});

it('회전 없이 전달된 진행 값과 같은 비율로 원형 게이지를 채운다', async () => {
  const progress = new Animated.Value(5);
  const loop = jest.spyOn(Animated, 'loop');
  const ui = await render(
    <CourseGenerationStatusCard
      {...props}
      status='generating'
      progress={progress}
    />,
  );
  for (const percent of [5, 25, 60, 85, 99]) {
    await act(async () => progress.setValue(percent));
    const arc = ui.getByTestId('course-generation-status-progress-arc', {
      includeHiddenElements: true,
    });
    const { strokeDasharray, strokeDashoffset } = arc.props;
    // Native SVG expands a single dash length to [length, length].
    expect(1 - strokeDashoffset / strokeDasharray[0]).toBeCloseTo(
      percent / 100,
    );
  }
  expect(loop).not.toHaveBeenCalled();
});
