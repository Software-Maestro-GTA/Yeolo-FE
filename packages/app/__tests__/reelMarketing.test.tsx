/**
 * @file reelMarketing.test.tsx
 * @description Marketing reference contract: city/count cover, bottom gradient captions, inset map labels and no ending.
 */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { buildReelPlan } from '../src/services/courseReelService';
import { ReelPreview } from '../src/components/course/ReelPreview';
import { reelCourse } from './mocks/reel-fixtures';
import { UI_STRINGS } from '../src/constants/strings';
const day = reelCourse.itinerary.days[0];
const photos = [
  { placeId: '카페', uri: 'file:///cafe.jpg', caption: '커피 한 잔' },
  { placeId: '바다', uri: 'file:///sea.jpg', caption: '바다 산책' },
];
const makePlan = () =>
  buildReelPlan(day, photos, '부산', '막 찍어도 예쁜', undefined, {
    uri: 'file:///map.png',
    points: [
      { x: 0.2, y: 0.3, label: '1' },
      { x: 0.6, y: 0.4, label: '2' },
    ],
  });
it.each([0, 1])(
  '소개·장소 미리보기는 재생 시간이 지나도 고정 구도를 유지한다 (장면 %s)',
  async (index) => {
    jest.useFakeTimers();
    try {
      const plan = makePlan();
      const scene = plan.scenes[index];
      const ui = await render(
        <ReelPreview plan={{ ...plan, scenes: [scene] }} />,
      );
      const photoStyle = () =>
        StyleSheet.flatten(ui.getByTestId('reel-photo-background').props.style);
      const initial = photoStyle();
      expect(initial).toMatchObject({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      });
      expect(initial.transform).toBeUndefined();
      await fireEvent.press(ui.getByLabelText(UI_STRINGS.REEL.PLAY));
      await act(() => jest.advanceTimersByTime(1000));
      expect(photoStyle()).toEqual(initial);
      expect(ui.getByTestId('reel-photo-background').props.source).toEqual({
        uri: scene.uri,
      });
      await ui.unmount();
    } finally {
      jest.useRealTimers();
    }
  },
);
it('소개는 도시명·장소 수와 편집한 설명을 쓰고 지도에서 끝난다', () => {
  const plan = makePlan();
  expect(plan.scenes[0]).toMatchObject({
    title: '부산 여행 코스 2곳',
    caption: '막 찍어도 예쁜',
  });
  expect(plan.scenes.map((scene) => scene.role)).toEqual([
    'hook',
    'stop',
    'stop',
    'route',
  ]);
  expect(
    plan.scenes
      .filter((scene) => scene.role === 'stop')
      .map((scene) => scene.number),
  ).toEqual(['1', '2']);
  expect(plan.scenes.at(-1)?.points.map((point) => point.name)).toEqual([
    '카페',
    '바다',
  ]);
});

it('마지막 지도에는 선택한 여행 날짜만 표시하고 장소 화면에는 날짜를 넣지 않는다', async () => {
  const plan = buildReelPlan(day, photos, '광화문', '함께 놀기 좋은');
  expect(plan.scenes[0]).toMatchObject({
    title: '광화문 여행 코스 2곳',
    caption: '함께 놀기 좋은',
  });
  expect(plan.scenes.at(-1)).toMatchObject({
    kind: 'route',
    caption: '2026. 10. 03.',
  });
  const ui = await render(
    <ReelPreview plan={{ ...plan, scenes: [plan.scenes.at(-1)!] }} />,
  );
  expect(ui.getByText('2026. 10. 03.')).toBeTruthy();
  expect(
    plan.scenes
      .filter((scene) => scene.role === 'stop')
      .every((scene) => !scene.caption.includes('2026. 10. 03.')),
  ).toBe(true);
});

it.each(['', 'not-a-date', '2026-02-30'])(
  '날짜가 없거나 잘못된 경우 현재 날짜로 대체하지 않는다 (%s)',
  (date) => {
    const plan = buildReelPlan(
      { ...day, date },
      photos,
      '광화문',
      '함께 놀기 좋은',
    );
    expect(plan.scenes.at(-1)?.caption).toBe('');
  },
);
it('마지막 지도 아래에 날짜와 지정한 여행 지역을 두 줄로 표시한다', async () => {
  const plan = buildReelPlan(
    day,
    photos,
    '광화문',
    '함께 놀기 좋은',
    undefined,
    undefined,
    undefined,
    { footerLocation: '서울, 광화문에서' },
  );
  const footer = '2026. 10. 03.\n서울, 광화문에서';
  expect(plan.scenes.at(-1)?.caption).toBe(footer);
  const ui = await render(
    <ReelPreview plan={{ ...plan, scenes: [plan.scenes.at(-1)!] }} />,
  );
  expect(ui.getByText(footer).props.numberOfLines).toBe(2);
});
it('장소명 아래 설명을 표시하고 소개 설명과 고정 구도는 유지한다', async () => {
  const plan = makePlan();
  expect(plan.scenes[0].caption).toBe('막 찍어도 예쁜');
  expect(
    plan.scenes
      .filter((scene) => scene.role === 'stop')
      .map((scene) => scene.caption),
  ).toEqual(['커피 한 잔', '바다 산책']);
  const ui = await render(
    <ReelPreview plan={{ ...plan, scenes: [plan.scenes[1]] }} />,
  );
  expect(ui.getByTestId('reel-scene-title').props.children).toBe('카페');
  expect(ui.getByTestId('reel-place-number').props.children).toBe('1');
  expect(ui.getByText('커피 한 잔')).toBeTruthy();
  expect(plan.scenes[1].seconds).toBe(3);
});
it.each(['', '   '])(
  '빈 장소 제목에는 사진의 번호를 표시하지 않는다 (%s)',
  async (placeName) => {
    const plan = buildReelPlan(day, [{ ...photos[0], placeName }], '부산', '');
    const scene = plan.scenes[1];
    expect(scene.title).toBe('');
    expect(scene.number).toBeUndefined();
    // A stale preview plan must not leave an orphaned badge either.
    const ui = await render(
      <ReelPreview plan={{ ...plan, scenes: [{ ...scene, number: '1' }] }} />,
    );
    expect(ui.queryByTestId('reel-place-number')).toBeNull();
    expect(ui.getByText(photos[0].caption)).toBeTruthy();
  },
);
it('장소 캡션에는 박스나 상단 배지 대신 하단 그라데이션과 제목 옆 번호를 쓴다', async () => {
  const plan = makePlan();
  const ui = await render(
    <ReelPreview plan={{ ...plan, scenes: [plan.scenes[1]] }} />,
  );
  expect(ui.getByTestId('reel-bottom-gradient')).toBeTruthy();
  expect(ui.getByTestId('reel-place-number').props.children).toBe('1');
  expect(ui.queryByTestId('reel-caption-panel')).toBeNull();
  expect(ui.queryByText('오늘의 여행')).toBeNull();
});
it('지도는 선 없이 번호와 장소명 쌍을 하나씩 보여주고 모두 남긴다', async () => {
  jest.useFakeTimers();
  try {
    const plan = makePlan();
    const ui = await render(
      <ReelPreview plan={{ ...plan, scenes: [plan.scenes.at(-1)!] }} />,
    );
    expect(ui.queryByTestId('reel-route-line')).toBeNull();
    expect(ui.queryByText('바다')).toBeNull();
    await fireEvent.press(ui.getByLabelText(UI_STRINGS.REEL.PLAY));
    await act(() => jest.advanceTimersByTime(250));
    expect(ui.getByText('카페')).toBeTruthy();
    expect(ui.queryByText('바다')).toBeNull();
    await act(() => jest.advanceTimersByTime(500));
    expect(ui.getByText('카페')).toBeTruthy();
    expect(ui.getByText('바다')).toBeTruthy();
    await ui.unmount();
  } finally {
    jest.useRealTimers();
  }
});

it('일부 사진만 선택해도 소개·사진·지도 번호가 같은 장소를 가리킨다', () => {
  const plan = buildReelPlan(day, [photos[1]], '부산', '', undefined, {
    uri: 'file:///map.png',
    points: [
      { x: 0.2, y: 0.3, label: '1' },
      { x: 0.6, y: 0.4, label: '2' },
    ],
  });
  expect(plan.scenes[0].title).toBe('부산 여행 코스 1곳');
  expect(plan.scenes[1]).toMatchObject({ title: '바다', number: '1' });
  expect(plan.scenes.at(-1)?.points).toEqual([
    expect.objectContaining({ label: '1', name: '바다' }),
  ]);
});

it('지도 이름표를 카드 안에 두고 Google 로고의 하단 영역을 비워둔다', () => {
  const plan = makePlan(),
    l = plan.layout;
  for (const p of plan.scenes.at(-1)!.points) {
    expect(p.nameX).toBeGreaterThanOrEqual(l.mapX + 8);
    expect(p.nameY).toBeGreaterThanOrEqual(l.mapY + 8);
    expect(p.nameX! + p.nameWidth!).toBeLessThanOrEqual(l.mapX + l.mapSize - 8);
    expect(p.nameY! + l.mapNameHeight).toBeLessThanOrEqual(
      l.mapY + l.mapSize - 52,
    );
  }
});

it('모든 장면의 우측 상단에 같은 Figma 심볼 원본과 배치를 유지한다', async () => {
  const plan = makePlan();
  expect(plan).toMatchObject({
    brandMark: { uri: expect.stringMatching(/^data:image\/png;base64,/) },
    layout: {
      logoX: 650,
      logoY: 34,
      logoWidth: expect.any(Number),
      logoHeight: expect.any(Number),
    },
  });
  for (const scene of plan.scenes) {
    const ui = await render(
      <ReelPreview plan={{ ...plan, scenes: [scene] }} />,
    );
    expect(ui.getByTestId('reel-brand-mark').props.source).toEqual(
      (plan as typeof plan & { brandMark: { uri: string } }).brandMark,
    );
    await ui.unmount();
  }
});
