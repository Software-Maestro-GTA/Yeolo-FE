/**
 * @file ReelPreview.test.tsx
 * @description Verifies that empty scene text stays empty while missing plans show guidance.
 */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ReelPreview } from '../src/components/course/ReelPreview';
import { buildReelPlan } from '../src/services/courseReelService';
import { UI_STRINGS } from '../src/constants/strings';
import { reelCourse } from './mocks/reel-fixtures';

it('빈 제목과 한 줄을 미리보기 안내 문구로 대체하지 않는다', async () => {
  const plan = buildReelPlan(
    reelCourse.itinerary.days[0],
    [{ placeId: '카페', uri: 'file:///photo.jpg', caption: '' }],
    '',
    '',
  );
  const scene = { ...plan.scenes[0], title: '', caption: '' };
  const ui = await render(<ReelPreview plan={{ ...plan, scenes: [scene] }} />);
  expect(ui.queryByText(UI_STRINGS.REEL.PREVIEW)).toBeNull();
  expect(ui.queryByText(UI_STRINGS.REEL.EMPTY_PHOTOS)).toBeNull();
  await ui.rerender(<ReelPreview plan={null} />);
  expect(ui.getByText(UI_STRINGS.REEL.PREVIEW)).toBeTruthy();
  expect(ui.getByText(UI_STRINGS.REEL.EMPTY_PHOTOS)).toBeTruthy();
});

it('미리보기는 멈춘 시점에서 이어 재생하고 지도 체류 시간을 내보내기와 맞춘다', async () => {
  jest.useFakeTimers();
  try {
    const plan = buildReelPlan(
      reelCourse.itinerary.days[0],
      [
        {
          placeId: '카페',
          uri: 'file:///photo.jpg',
          placeName: '내 카페',
          caption: '',
        },
      ],
      '부산',
      '막 찍어도 예쁜',
      undefined,
      { uri: 'file:///map.png', points: [] },
    );
    const ui = await render(<ReelPreview plan={plan} />);
    await fireEvent.press(ui.getByLabelText(UI_STRINGS.REEL.PLAY));
    await act(() => jest.advanceTimersByTime(1000));
    await fireEvent.press(ui.getByLabelText(UI_STRINGS.REEL.PAUSE));
    await act(() => jest.advanceTimersByTime(5000));
    expect(ui.getByText('부산 여행 코스 1곳')).toBeTruthy();
    await fireEvent.press(ui.getByLabelText(UI_STRINGS.REEL.PLAY));
    await act(() => jest.advanceTimersByTime(600));
    expect(ui.getByText('내 카페')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(3000));
    expect(ui.getByTestId('reel-map-background')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(3600));
    expect(ui.getByTestId('reel-map-background')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(500));
    expect(ui.queryByTestId('reel-map-background')).toBeNull();
    expect(ui.getByText('부산 여행 코스 1곳')).toBeTruthy();
    await ui.unmount();
  } finally {
    jest.useRealTimers();
  }
});
