/**
 * @file ReelPreview.test.tsx
 * @description Verifies that empty scene text stays empty while missing plans show guidance.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
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
