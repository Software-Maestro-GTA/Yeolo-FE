/**
 * @file CourseReelComposer.test.tsx
 * @description Reel editor tests covering per-date drafts, shared guidance dialog dismissal, native export, retries and canceled component cleanup.
 */
import React from 'react';
import { Alert, FlatList, Keyboard, StyleSheet, UIManager } from 'react-native';
import { act, fireEvent, waitFor, within } from '@testing-library/react-native';
import { CourseReelComposer } from '../src/components/course/CourseReelComposer';
import * as service from '../src/services/courseReelService';
import { renderWithQueryClient as render } from './test-utils';
import { reelCourse } from './mocks/reel-fixtures';
import { UI_STRINGS } from '../src/constants/strings';
import * as commonApi from '@yeolo/common';

const mockMapCleanup = jest.fn();
const mockMapDays = jest.fn();
const mockMapCallbacks = jest.fn();
let mockHoldMap = false;
const originalMeasureInWindow = UIManager.measureInWindow;

jest.mock('../src/services/courseReelService', () => ({
  ...jest.requireActual('../src/services/courseReelService'),
  pickReelPhoto: jest.fn(),
  generateReel: jest.fn(),
  cancelReel: jest.fn(),
  deleteReel: jest.fn().mockResolvedValue(undefined),
  previewReel: jest.fn().mockResolvedValue(undefined),
  saveReel: jest.fn().mockResolvedValue(undefined),
  shareReel: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/components/course/ReelRouteMap', () => ({
  ReelRouteMap: ({
    day,
    onReady,
  }: {
    day: (typeof reelCourse.itinerary.days)[number];
    onReady: (snapshot: unknown) => void;
  }) => {
    const React = require('react');
    mockMapDays(day);
    mockMapCallbacks(onReady);
    React.useEffect(() => {
      if (mockHoldMap) {
        onReady(null);
        return mockMapCleanup;
      }
      onReady({
        uri: 'file:///map.png',
        points: day.stops.map((stop) => ({
          x: stop.sequence / 10,
          y: 0.4,
          label: String(stop.sequence),
        })),
      });
      return mockMapCleanup;
    }, [day, onReady]);
    return null;
  },
}));
const S = UI_STRINGS.REEL;
const output = 'file:///reel.mp4';
describe('CourseReelComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHoldMap = false;
    jest
      .mocked(service.pickReelPhoto)
      .mockReset()
      .mockResolvedValue('file:///photo.jpg');
    (service.generateReel as jest.Mock).mockResolvedValue(output);
  });
  const mount = () =>
    render(
      <CourseReelComposer
        course={reelCourse}
        initialDay={1}
        onClose={jest.fn()}
      />,
    );
  it('코스 소개와 코스 설명을 편집 목록 상단에 항상 보여준다', async () => {
    const ui = await mount();
    expect(ui.getByLabelText('코스 소개')).toBeTruthy();
    expect(ui.getByLabelText('코스 설명')).toBeTruthy();
    expect(ui.queryByText('소개 제목')).toBeNull();
    expect(ui.queryByText('소개 설명')).toBeNull();
    expect(ui.getByTestId('reel-intro-fields')).toBeTruthy();
    expect(ui.queryByTestId('reel-settings-toggle')).toBeNull();
  });
  it('편집 시 완료 왼쪽에 초기화를 표시하고 제목 옆에는 접근성 이름이 있는 아이콘만 둔다', async () => {
    const ui = await mount();
    expect(ui.queryByTestId('reel-reset')).toBeNull();
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    const controls = ui.getByTestId('reel-edit-controls');
    expect(
      within(controls)
        .getAllByRole('button')
        .map((button) => button.props.accessibilityLabel),
    ).toEqual(['초기화', '완료']);
    const heading = within(ui.getByTestId('reel-heading-카페'));
    expect(heading.getByText('카페')).toBeTruthy();
    for (const action of ['위로', '아래로', '삭제']) {
      expect(
        heading.getByRole('button', { name: `카페 ${action}` }),
      ).toBeTruthy();
      expect(heading.queryByText(action)).toBeNull();
    }
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    expect(ui.queryByTestId('reel-reset')).toBeNull();
  });
  it('원래 제목행 높이를 유지해 사진과 입력칸 높이가 맞고 편집해도 늘어나지 않는다', async () => {
    const ui = await mount();
    const headingStyle = () =>
      StyleSheet.flatten(ui.getByTestId('reel-heading-카페').props.style);
    const before = headingStyle();
    expect(before.height).toBe(23);
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    expect(headingStyle()).toEqual(before);
    expect(
      StyleSheet.flatten(ui.getByTestId('reel-remove-카페').props.style)
        .minHeight,
    ).toBeLessThanOrEqual(before.height);
  });
  it.each(['cancel', 'close', 'backdrop', 'back'])(
    '초기화는 확인 전까지 적용하지 않고 %s로 닫아도 편집을 유지한다',
    async (dismiss) => {
      const ui = await mount();
      await fireEvent.press(ui.getByTestId('reel-photo-카페'));
      await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
      await fireEvent.press(ui.getByTestId('reel-remove-바다'));
      const captures = mockMapCleanup.mock.calls.length;
      await fireEvent.press(ui.getByTestId('reel-reset'));
      expect(ui.getByText('항목을 초기화할까요?')).toBeTruthy();
      expect(ui.queryByTestId('reel-photo-바다')).toBeNull();
      expect(mockMapCleanup).toHaveBeenCalledTimes(captures);
      if (dismiss === 'back')
        await fireEvent(ui.getByTestId('reel-reset-modal'), 'requestClose');
      else
        await fireEvent.press(
          ui.getByTestId(
            dismiss === 'cancel'
              ? 'reel-cancel-reset'
              : `reel-dialog-${dismiss}`,
            { includeHiddenElements: true },
          ),
        );
      expect(ui.queryByTestId('reel-reset-modal')).toBeNull();
      expect(ui.queryByTestId('reel-photo-바다')).toBeNull();
      expect(ui.getByTestId('reel-edit-toggle').props.accessibilityLabel).toBe(
        '완료',
      );
      expect(
        ui.getByTestId('reel-create').props.accessibilityState.disabled,
      ).toBe(false);
    },
  );
  it('초기화로 현재 날짜의 순서·삭제를 복원하고 사진·직접 수정한 문구와 다른 날짜 초안은 유지한다', async () => {
    jest
      .mocked(service.pickReelPhoto)
      .mockResolvedValueOnce('file:///cafe.jpg')
      .mockResolvedValueOnce('file:///sea.jpg');
    const ui = await mount();
    expect(ui.getByTestId('reel-intro-title').props.value).toBe(
      reelCourse.title,
    );
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-바다'));
    await fireEvent.changeText(ui.getByTestId('reel-intro-title'), '우리 여행');
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-카페'),
      '우리 카페',
    );
    await fireEvent.changeText(
      ui.getByTestId('reel-caption-카페'),
      '쉬어 가기',
    );
    await fireEvent.changeText(ui.getByTestId('reel-place-name-바다'), '');
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-remove-야경'));
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-move-up-바다'));
    await fireEvent.press(ui.getByTestId('reel-remove-카페'));
    await fireEvent.press(ui.getByTestId('reel-reset'));
    await fireEvent.press(ui.getByTestId('reel-confirm-reset'));
    expect(
      ui.getAllByTestId(/^reel-photo-/).map((item) => item.props.testID),
    ).toEqual(['reel-photo-카페', 'reel-photo-바다']);
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe(
      '우리 카페',
    );
    expect(ui.getByTestId('reel-caption-카페').props.value).toBe('쉬어 가기');
    expect(ui.getByTestId('reel-place-name-바다').props.value).toBe('');
    expect(mockMapDays.mock.calls.at(-1)![0]).toEqual(
      reelCourse.itinerary.days[0],
    );
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    const plan = jest.mocked(service.generateReel).mock.calls[0][0];
    expect(plan.scenes[0].title).toBe('우리 여행');
    expect(
      plan.scenes
        .filter((scene) => scene.role === 'stop')
        .map(({ title, caption, uri, number }) => ({
          title,
          caption,
          uri,
          number,
        })),
    ).toEqual([
      {
        title: '우리 카페',
        caption: '쉬어 가기',
        uri: 'file:///cafe.jpg',
        number: '1',
      },
      { title: '', caption: '', uri: 'file:///sea.jpg', number: undefined },
    ]);
    expect(plan.scenes.at(-1)?.points.map(({ label }) => label)).toEqual([
      '1',
      '2',
    ]);
    await fireEvent.press(ui.getByTestId('reel-back'));
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    expect(ui.queryByTestId('reel-photo-야경')).toBeNull();
  });
  it('순서만 초기화할 때 같은 지도 캡처를 재사용한다', async () => {
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    const captures = mockMapCleanup.mock.calls.length;
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-move-up-바다'));
    await fireEvent.press(ui.getByTestId('reel-reset'));
    await fireEvent.press(ui.getByTestId('reel-confirm-reset'));
    expect(mockMapCleanup).toHaveBeenCalledTimes(captures);
    expect(
      ui.getAllByTestId(/^reel-photo-/).map((item) => item.props.testID),
    ).toEqual(['reel-photo-카페', 'reel-photo-바다']);
    expect(
      ui.getByTestId('reel-create').props.accessibilityState.disabled,
    ).toBe(false);
  });
  it('삭제했던 사진은 활성 사진 제한에서 제외하고 복원 시 제한 초과를 안전하게 안내한다', async () => {
    const source = reelCourse.itinerary.days[0].stops[0];
    const course = {
      ...reelCourse,
      itinerary: {
        days: [
          {
            ...reelCourse.itinerary.days[0],
            stops: Array.from({ length: 8 }, (_, index) => ({
              ...source,
              sequence: index + 1,
              place: {
                ...source.place,
                googlePlaceId: `id${index}`,
                placeName: `장소${index}`,
              },
            })),
          },
        ],
      },
    };
    const ui = await render(
      <CourseReelComposer course={course} initialDay={1} onClose={jest.fn()} />,
    );
    // FlatList renders all eight rows in its initial window.
    for (let i = 0; i < 7; i++)
      await fireEvent.press(ui.getByTestId(`reel-photo-id${i}`));
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-remove-id0'));
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-photo-id7'));
    expect(service.pickReelPhoto).toHaveBeenCalledTimes(8);
    expect(
      ui.getByTestId('reel-create').props.accessibilityState.disabled,
    ).toBe(false);
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-reset'));
    await fireEvent.press(ui.getByTestId('reel-confirm-reset'));
    expect(ui.getByText(S.LIMIT)).toBeTruthy();
    expect(
      ui.getByTestId('reel-create').props.accessibilityState.disabled,
    ).toBe(true);
    expect(service.generateReel).not.toHaveBeenCalled();
    await fireEvent.press(ui.getByTestId('reel-remove-id7'));
    expect(ui.queryByText(S.LIMIT)).toBeNull();
    expect(
      ui.getByTestId('reel-create').props.accessibilityState.disabled,
    ).toBe(false);
  });
  it('편집 모드에서 순서를 바꾸면 사진·문구와 지도 번호·등장 순서가 함께 바뀐다', async () => {
    jest
      .mocked(service.pickReelPhoto)
      .mockResolvedValueOnce('file:///cafe.jpg')
      .mockResolvedValueOnce('file:///sea.jpg');
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-바다'));
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-카페'),
      '우리 카페',
    );
    await fireEvent.changeText(
      ui.getByTestId('reel-caption-카페'),
      '카페에서 쉬기',
    );
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-바다'),
      '우리 바다',
    );
    const captures = mockMapCleanup.mock.calls.length;
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    expect(ui.queryByTestId('reel-location-map')).toBeNull();
    expect(
      ui.getByTestId('reel-move-up-카페').props.accessibilityState.disabled,
    ).toBe(true);
    expect(
      ui.getByTestId('reel-move-down-바다').props.accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.press(ui.getByTestId('reel-move-down-카페'));
    expect(
      ui.getAllByTestId(/^reel-photo-/).map((item) => item.props.testID),
    ).toEqual(['reel-photo-바다', 'reel-photo-카페']);
    expect(mockMapCleanup).toHaveBeenCalledTimes(captures);
    expect(
      ui.getByTestId('reel-create').props.accessibilityState.disabled,
    ).toBe(false);
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    const plan = jest.mocked(service.generateReel).mock.calls[0][0];
    expect(plan.scenes[0].uri).toBe('file:///sea.jpg');
    expect(
      plan.scenes
        .filter((scene) => scene.role === 'stop')
        .map(({ title, caption, uri, number }) => ({
          title,
          caption,
          uri,
          number,
        })),
    ).toEqual([
      { title: '우리 바다', caption: '', uri: 'file:///sea.jpg', number: '1' },
      {
        title: '우리 카페',
        caption: '카페에서 쉬기',
        uri: 'file:///cafe.jpg',
        number: '2',
      },
    ]);
    const points = plan.scenes.at(-1)!.points;
    expect(points.map(({ label, name }) => ({ label, name }))).toEqual([
      { label: '1', name: '우리 바다' },
      { label: '2', name: '우리 카페' },
    ]);
    expect(points[0].x).toBeGreaterThan(points[1].x);
    expect(
      reelCourse.itinerary.days[0].stops.map((stop) => stop.place.latitude),
    ).toEqual([35.02, 35.01]);
  });
  it('순서·삭제 초안을 날짜별로 보존하고 삭제 후 남은 장소로 지도와 영상 수를 갱신한다', async () => {
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-바다'));
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-카페'),
      '우리 카페',
    );
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-move-up-바다'));
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    expect(
      ui.getAllByTestId(/^reel-photo-/).map((item) => item.props.testID),
    ).toEqual(['reel-photo-바다', 'reel-photo-카페']);
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-remove-바다'));
    expect(ui.queryByTestId('reel-photo-바다')).toBeNull();
    expect(mockMapDays.mock.calls.at(-1)![0].stops).toHaveLength(1);
    expect(mockMapDays.mock.calls.at(-1)![0].stops[0].place.latitude).toBe(
      35.01,
    );
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    expect(ui.queryByTestId('reel-photo-바다')).toBeNull();
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe(
      '우리 카페',
    );
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    const plan = jest.mocked(service.generateReel).mock.calls[0][0];
    expect(plan.scenes[0].title).toBe(reelCourse.title);
    expect(plan.scenes.at(-1)?.points).toEqual([
      expect.objectContaining({ label: '1', name: '우리 카페' }),
    ]);
    expect(reelCourse.itinerary.days[0].stops).toHaveLength(2);
  });
  it('모든 항목을 삭제하면 빈 목록과 비활성 생성 버튼을 보여준다', async () => {
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    for (const place of ['카페', '바다'])
      await fireEvent.press(ui.getByTestId(`reel-remove-${place}`));
    expect(ui.getByText(S.EMPTY_DAY)).toBeTruthy();
    expect(
      ui.getByTestId('reel-create').props.accessibilityState.disabled,
    ).toBe(true);
    expect(mockMapDays.mock.calls.at(-1)![0].stops).toHaveLength(0);
  });
  it('삭제 후 새 지도 캡처가 끝나기 전에는 이전 지도 콜백으로 내보내지 않는다', async () => {
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    const oldReady = mockMapCallbacks.mock.calls.at(-1)![0];
    mockHoldMap = true;
    await fireEvent.press(ui.getByTestId('reel-edit-toggle'));
    await fireEvent.press(ui.getByTestId('reel-remove-바다'));
    expect(
      ui.getByTestId('reel-create').props.accessibilityState.disabled,
    ).toBe(true);
    expect(
      ui.getByTestId('reel-preview-open').props.accessibilityState.disabled,
    ).toBe(true);
    await act(async () => oldReady({ uri: 'file:///old.png', points: [] }));
    expect(
      ui.getByTestId('reel-create').props.accessibilityState.disabled,
    ).toBe(true);
    const nextReady = mockMapCallbacks.mock.calls.at(-1)![0];
    await act(async () =>
      nextReady({
        uri: 'file:///updated.png',
        points: [{ x: 0.3, y: 0.4, label: '1' }],
      }),
    );
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      jest.mocked(service.generateReel).mock.calls[0][0].scenes.at(-1)?.uri,
    ).toBe('file:///updated.png');
  });
  it('장소 ID가 비어 있어도 장소별 사진과 제목 및 빈 설명을 영상에 반영한다', async () => {
    const course = {
      ...reelCourse,
      itinerary: {
        days: reelCourse.itinerary.days.map((day) => ({
          ...day,
          stops: day.stops.map((stop) => ({
            ...stop,
            place: { ...stop.place, googlePlaceId: '' },
          })),
        })),
      },
    };
    const ui = await render(
      <CourseReelComposer course={course} initialDay={1} onClose={jest.fn()} />,
    );
    for (const place of ['카페', '바다']) {
      expect(ui.getByLabelText(`${place} ${S.CAPTION_LABEL}`).props.value).toBe(
        '',
      );
      await fireEvent.press(ui.getByLabelText(`${place} ${S.ADD_PHOTO}`));
      await fireEvent.changeText(
        ui.getByLabelText(`${place} ${S.PLACE_NAME_LABEL}`),
        `우리 ${place}`,
      );
    }
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    expect(ui.getByLabelText(`바다 ${S.PLACE_NAME_LABEL}`).props.value).toBe(
      '우리 바다',
    );
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    const plan = jest.mocked(service.generateReel).mock.calls[0][0];
    expect(
      plan.scenes
        .filter((scene) => scene.role === 'stop')
        .map(({ title, caption }) => ({ title, caption })),
    ).toEqual([
      { title: '우리 카페', caption: '' },
      { title: '우리 바다', caption: '' },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    UIManager.measureInWindow = originalMeasureInWindow;
  });

  it('코스 제목과 장소명을 기본 입력하고 설명은 빈 값으로 시작한다', async () => {
    const ui = await mount();
    for (const place of ['카페', '바다']) {
      expect(ui.getByTestId(`reel-place-name-${place}`).props.value).toBe(
        place,
      );
      expect(ui.getByLabelText(`${place} ${S.CAPTION_LABEL}`).props.value).toBe(
        '',
      );
    }
    expect(ui.getByTestId('reel-title').props.value).toBe('');
    expect(ui.getByTestId('reel-title').props.placeholder).toBe(
      '예: 막 찍어도 예쁜',
    );
    expect(ui.queryByTestId('reel-ending')).toBeNull();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe('카페');
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    expect(ui.getByTestId('reel-place-name-야경').props.value).toBe('야경');
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    const plan = (service.generateReel as jest.Mock).mock.calls[0][0];
    expect(plan.scenes[0].title).toBe(reelCourse.title);
    expect(plan.scenes[0].caption).toBe('');
    expect(plan.scenes[1]).toMatchObject({
      uri: 'file:///photo.jpg',
      title: '카페',
      caption: '',
    });
    expect(plan.scenes.at(-1)).toMatchObject({
      kind: 'route',
      title: '',
      caption: '2026. 10. 03.\n한국, 부산에서',
    });
  });

  it('소개 제목과 설명을 따로 수정하고 사진 교체·날짜 이동 후에도 내보낸다', async () => {
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    expect(ui.getByTestId('reel-intro-title').props.value).toBe(
      reelCourse.title,
    );
    await fireEvent.changeText(
      ui.getByTestId('reel-intro-title'),
      '우리의 부산 산책',
    );
    await fireEvent.changeText(ui.getByTestId('reel-title'), '함께 놀기 좋은');
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      jest.mocked(service.generateReel).mock.calls[0][0].scenes[0],
    ).toMatchObject({
      title: '우리의 부산 산책',
      caption: '함께 놀기 좋은',
    });
    await fireEvent.press(ui.getByTestId('reel-back'));
    await fireEvent.changeText(ui.getByTestId('reel-intro-title'), '');
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      jest.mocked(service.generateReel).mock.calls[1][0].scenes[0],
    ).toMatchObject({
      title: '',
      caption: '함께 놀기 좋은',
    });
  });

  it('waits for the keyboard before revealing a place title and does not scroll again once visible', async () => {
    let scrollOffset = 0;
    const reveal = jest.fn(({ offset }: { offset: number }) => {
      scrollOffset = offset;
    });
    jest.spyOn(FlatList.prototype, 'getNativeScrollRef').mockReturnValue({
      measureInWindow: (callback: (...values: number[]) => void) =>
        callback(0, 200, 360, 180),
    } as any);
    jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(reveal);
    UIManager.measureInWindow = jest.fn((_target, callback) =>
      callback(0, 400 - scrollOffset, 300, 70),
    );
    const listeners = new Map<string, (...args: any[]) => void>();
    const originalAdd = Keyboard.addListener.bind(Keyboard);
    jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
      listeners.set(name, callback);
      return originalAdd(name, callback);
    });
    const ui = await mount();
    await fireEvent(ui.getByTestId('reel-place-name-카페'), 'focus', {
      nativeEvent: { target: 42 },
    });
    await fireEvent(ui.getByTestId('reel-editor-list'), 'layout', {
      nativeEvent: { layout: { width: 360, height: 180 } },
    });
    await act(
      async () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    expect(reveal).not.toHaveBeenCalled();
    await act(async () => {
      listeners.get('keyboardDidShow')?.({
        endCoordinates: { screenY: 400, height: 300 },
      });
    });
    await waitFor(() =>
      expect(reveal).toHaveBeenCalledWith({ offset: 106, animated: false }),
    );
    expect(ui.queryByTestId('reel-create')).toBeNull();
    reveal.mockClear();
    await fireEvent(ui.getByTestId('reel-editor-list'), 'layout', {
      nativeEvent: { layout: { width: 360, height: 180 } },
    });
    await act(
      async () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    expect(reveal).not.toHaveBeenCalled();
    await act(async () => listeners.get('keyboardDidHide')?.({}));
    expect(ui.getByTestId('reel-create')).toBeTruthy();
    await fireEvent(ui.getByTestId('reel-editor-list'), 'layout', {
      nativeEvent: { layout: { width: 360, height: 500 } },
    });
    await act(
      async () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    expect(reveal).not.toHaveBeenCalled();
  });

  it('keeps consecutive keyboard layout corrections at the latest requested offset until native scroll catches up', async () => {
    let viewportHeight = 180;
    let scrollOffset = 0;
    const reveal = jest.fn(({ offset }: { offset: number }) => {
      scrollOffset = offset;
    });
    jest.spyOn(FlatList.prototype, 'getNativeScrollRef').mockReturnValue({
      measureInWindow: (callback: (...values: number[]) => void) =>
        callback(0, 200, 360, viewportHeight),
    } as any);
    jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(reveal);
    UIManager.measureInWindow = jest.fn((_target, callback) =>
      callback(0, 400 - scrollOffset, 300, 70),
    );
    const listeners = new Map<string, (...args: any[]) => void>();
    const originalAdd = Keyboard.addListener.bind(Keyboard);
    jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
      listeners.set(name, callback);
      return originalAdd(name, callback);
    });
    const ui = await mount();
    await fireEvent(ui.getByTestId('reel-place-name-카페'), 'focus', {
      nativeEvent: { target: 42 },
    });
    await act(async () =>
      listeners.get('keyboardDidShow')?.({
        endCoordinates: { screenY: 400, height: 300 },
      }),
    );
    await waitFor(() =>
      expect(reveal).toHaveBeenLastCalledWith({ offset: 106, animated: false }),
    );
    // The native view has moved, but its onScroll event has not reached JS yet.
    viewportHeight = 170;
    await fireEvent(ui.getByTestId('reel-editor-list'), 'layout', {
      nativeEvent: { layout: { width: 360, height: viewportHeight } },
    });
    await waitFor(() =>
      expect(reveal).toHaveBeenLastCalledWith({ offset: 116, animated: false }),
    );
    // A clamped native position must still replace the requested position.
    scrollOffset = 100;
    await fireEvent.scroll(ui.getByTestId('reel-editor-list'), {
      nativeEvent: { contentOffset: { y: scrollOffset } },
    });
    viewportHeight = 160;
    await fireEvent(ui.getByTestId('reel-editor-list'), 'layout', {
      nativeEvent: { layout: { width: 360, height: viewportHeight } },
    });
    await waitFor(() =>
      expect(reveal).toHaveBeenLastCalledWith({ offset: 126, animated: false }),
    );
  });

  it('does not bounce a tall focused field between the top and bottom or override a user drag', async () => {
    let scrollOffset = 0;
    const reveal = jest.fn(({ offset }: { offset: number }) => {
      scrollOffset = offset;
    });
    jest.spyOn(FlatList.prototype, 'getNativeScrollRef').mockReturnValue({
      measureInWindow: (callback: (...values: number[]) => void) =>
        callback(0, 200, 360, 80),
    } as any);
    jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(reveal);
    UIManager.measureInWindow = jest.fn((_target, callback) =>
      callback(0, 400 - scrollOffset, 300, 150),
    );
    const listeners = new Map<string, (...args: any[]) => void>();
    const originalAdd = Keyboard.addListener.bind(Keyboard);
    jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
      listeners.set(name, callback);
      return originalAdd(name, callback);
    });
    const ui = await mount();
    await fireEvent(ui.getByTestId('reel-place-name-카페'), 'focus', {
      nativeEvent: { target: 42 },
    });
    await act(async () => {
      listeners.get('keyboardDidShow')?.({
        endCoordinates: { screenY: 400, height: 300 },
      });
    });
    await waitFor(() =>
      expect(reveal).toHaveBeenCalledWith({ offset: 184, animated: false }),
    );
    await fireEvent.scroll(ui.getByTestId('reel-editor-list'), {
      nativeEvent: { contentOffset: { y: scrollOffset } },
    });
    reveal.mockClear();
    await fireEvent(ui.getByTestId('reel-editor-list'), 'layout', {
      nativeEvent: { layout: { width: 360, height: 80 } },
    });
    await act(
      async () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    expect(reveal).not.toHaveBeenCalled();
    await fireEvent(ui.getByTestId('reel-editor-list'), 'scrollBeginDrag');
    scrollOffset = 0;
    await fireEvent(ui.getByTestId('reel-editor-list'), 'layout', {
      nativeEvent: { layout: { width: 360, height: 80 } },
    });
    await act(
      async () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    expect(reveal).not.toHaveBeenCalled();
  });

  it('ignores measurements from an input that lost focus or from before the keyboard closed', async () => {
    const reveal = jest.fn();
    jest.spyOn(FlatList.prototype, 'getNativeScrollRef').mockReturnValue({
      measureInWindow: (callback: (...values: number[]) => void) =>
        callback(0, 200, 360, 180),
    } as any);
    jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(reveal);
    const pending = new Map<number, (...values: number[]) => void>();
    UIManager.measureInWindow = jest.fn((target, callback) => {
      pending.set(target, callback);
    });
    const listeners = new Map<string, (...args: any[]) => void>();
    const originalAdd = Keyboard.addListener.bind(Keyboard);
    jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
      listeners.set(name, callback);
      return originalAdd(name, callback);
    });
    const ui = await mount();
    await act(async () =>
      listeners.get('keyboardDidShow')?.({
        endCoordinates: { screenY: 400, height: 300 },
      }),
    );
    await fireEvent(ui.getByTestId('reel-place-name-카페'), 'focus', {
      nativeEvent: { target: 42 },
    });
    await waitFor(() => expect(pending.has(42)).toBe(true));
    await fireEvent(ui.getByTestId('reel-place-name-바다'), 'focus', {
      nativeEvent: { target: 84 },
    });
    await waitFor(() => expect(pending.has(84)).toBe(true));
    await act(async () => pending.get(42)?.(0, 500, 300, 70));
    expect(reveal).not.toHaveBeenCalled();
    await act(async () => listeners.get('keyboardWillHide')?.({}));
    await act(async () => pending.get(84)?.(0, 500, 300, 70));
    expect(reveal).not.toHaveBeenCalled();
  });

  it('사진 영역에서 사진을 추가하고 제목과 장소 설명 입력 안내를 표시한다', async () => {
    const ui = await mount();
    for (const label of ['썸네일', '사진 넣기', '사진 빼기', '내용 지우기'])
      expect(ui.queryByText(label)).toBeNull();
    expect(ui.getByLabelText(`카페 ${S.CAPTION_LABEL}`).props.value).toBe('');
    expect(ui.getByTestId('reel-place-name-카페').props.placeholder).toBe(
      '제목을 입력해주세요.',
    );
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    expect(service.pickReelPhoto).toHaveBeenCalledTimes(1);
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe('카페');
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-카페'),
      '새 제목',
    );
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe('새 제목');
  });

  it('사진을 넣기 전 쓴 제목을 사진 추가·교체·날짜 변경 후에도 유지한다', async () => {
    const ui = await mount();
    expect(ui.queryByText('AI 작성')).toBeNull();
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-카페'),
      '커피 한 잔',
    );
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe(
      '커피 한 잔',
    );
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      jest.mocked(service.generateReel).mock.calls[0][0].scenes[1],
    ).toMatchObject({ title: '커피 한 잔', caption: '' });
  });

  it('장소 설명을 사진 추가·교체와 날짜 이동 후에도 보존하고 비운 값도 영상에 반영한다', async () => {
    const ui = await mount();
    const description = '커피와 디저트를 즐기는 곳.\n산책 사이 잠깐 쉬어가요.';
    await fireEvent.changeText(
      ui.getByTestId('reel-caption-카페'),
      description,
    );
    await fireEvent.changeText(ui.getByTestId('reel-place-name-카페'), '카페');
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.changeText(
      ui.getByTestId('reel-caption-야경'),
      '다른 날의 설명',
    );
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    expect(ui.getByTestId('reel-caption-카페').props.value).toBe(description);
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      jest.mocked(service.generateReel).mock.calls[0][0].scenes[1],
    ).toMatchObject({
      title: '카페',
      caption: description,
      uri: 'file:///photo.jpg',
    });
    await fireEvent.press(ui.getByTestId('reel-back'));
    await fireEvent.changeText(ui.getByTestId('reel-caption-카페'), '');
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      jest.mocked(service.generateReel).mock.calls[1][0].scenes[1],
    ).toMatchObject({ title: '카페', caption: '' });
  });

  it('편집과 순서 이동 없이 일정 순서로 표시한다', async () => {
    const ui = await mount();
    expect(ui.queryByTestId('reel-order-edit')).toBeNull();
    expect(ui.queryAllByTestId(/^reel-(move|reorder)-/)).toHaveLength(0);
    expect(ui.queryByText('썸네일')).toBeNull();
    expect(
      ui.getAllByTestId(/^reel-photo-/).map((item) => item.props.testID),
    ).toEqual(['reel-photo-카페', 'reel-photo-바다']);
  });

  it('제목을 직접 비워도 사진과 다른 장소 제목을 유지하고 날짜 이동 후에도 빈 제목을 보존한다', async () => {
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-카페'),
      '지울 제목',
    );
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-바다'),
      '바다의 추억',
    );
    await fireEvent.changeText(ui.getByTestId('reel-place-name-카페'), '');
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.press(ui.getByTestId('reel-day-1'));
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe('');
    expect(ui.getByTestId('reel-place-name-바다').props.value).toBe(
      '바다의 추억',
    );
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      jest.mocked(service.generateReel).mock.calls[0][0].scenes[1],
    ).toMatchObject({ title: '', caption: '', uri: 'file:///photo.jpg' });
  });

  it('일정의 첫 사진을 썸네일로 사용하고 완료 화면 닫기도 변경 유실을 알린다', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const onClose = jest.fn();
    jest
      .mocked(service.pickReelPhoto)
      .mockResolvedValueOnce('file:///cafe.jpg')
      .mockResolvedValueOnce('file:///sea.jpg');
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        initialDay={1}
        onClose={onClose}
      />,
    );
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-바다'));
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      jest.mocked(service.generateReel).mock.calls[0][0].scenes[0].uri,
    ).toBe('file:///cafe.jpg');
    await fireEvent.press(ui.getByTestId('reel-close'));
    expect(onClose).not.toHaveBeenCalled();
    expect(ui.getByTestId('reel-leave-modal')).toBeTruthy();
    expect(ui.getByText(/사라집니다/)).toBeTruthy();
    expect(alert).not.toHaveBeenCalled();
  });

  it('안내 버튼은 현재 여행지와 선택한 날짜의 제작 범위를 알려준다', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-day-2'));
    await fireEvent.press(ui.getByTestId('reel-info'));
    expect(ui.getByTestId('reel-info-modal')).toBeTruthy();
    expect(ui.getByText(/한국 · 부산/)).toBeTruthy();
    expect(ui.getByText(/2026.10.04/)).toBeTruthy();
    expect(alert).not.toHaveBeenCalled();
    await fireEvent.press(ui.getByTestId('reel-info-modal-close'));
    expect(ui.queryByTestId('reel-info-modal')).toBeNull();
    await fireEvent.press(ui.getByTestId('reel-info'));
    // The modal card hides its backdrop from screen readers, but touch still dismisses it.
    await fireEvent.press(
      ui.getByTestId('reel-info-modal-backdrop', {
        includeHiddenElements: true,
      }),
    );
    expect(ui.queryByTestId('reel-info-modal')).toBeNull();
    await fireEvent.press(ui.getByTestId('reel-info'));
    await fireEvent(ui.getByTestId('reel-info-modal'), 'requestClose');
    expect(ui.queryByTestId('reel-info-modal')).toBeNull();
    expect(ui.getByTestId('reel-day-2').props.accessibilityState.selected).toBe(
      true,
    );
  });

  it('초기값만 있으면 바로 닫고 문구 수정 후에는 계속 편집 또는 나가기를 선택한다', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const onClose = jest.fn();
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        initialDay={1}
        onClose={onClose}
      />,
    );
    await fireEvent.press(ui.getByTestId('reel-back'));
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-카페'),
      '새 메시지',
    );
    await fireEvent(ui.getByTestId('reel-back'), 'requestClose');
    expect(onClose).not.toHaveBeenCalled();
    expect(ui.getByTestId('reel-leave-modal')).toBeTruthy();
    expect(ui.getByText(/사라집니다/)).toBeTruthy();
    expect(alert).not.toHaveBeenCalled();
    await fireEvent.press(ui.getByTestId('reel-keep-editing'));
    expect(ui.queryByTestId('reel-leave-modal')).toBeNull();
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe(
      '새 메시지',
    );
    expect(onClose).not.toHaveBeenCalled();
    for (const dismiss of ['close', 'backdrop', 'system']) {
      await fireEvent.press(ui.getByTestId('reel-back'));
      if (dismiss === 'system')
        await fireEvent(ui.getByTestId('reel-leave-modal'), 'requestClose');
      else
        await fireEvent.press(
          ui.getByTestId(`reel-dialog-${dismiss}`, {
            includeHiddenElements: dismiss === 'backdrop',
          }),
        );
      expect(ui.queryByTestId('reel-leave-modal')).toBeNull();
      expect(ui.getByTestId('reel-place-name-카페').props.value).toBe(
        '새 메시지',
      );
      expect(onClose).not.toHaveBeenCalled();
    }
    await fireEvent.press(ui.getByTestId('reel-back'));
    await fireEvent.press(ui.getByTestId('reel-confirm-leave'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('도입 화면은 앱에서 만든 예시 영상을 보여주고 코스 선택 시 플레이어를 해제한다', async () => {
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        initialDay={1}
        initialStep='intro'
        onClose={jest.fn()}
      />,
    );
    const hidden = { includeHiddenElements: true };
    const player = ui.getByTestId('reel-example-video-player', hidden);
    expect(player.props.player.loop).toBe(true);
    expect(player.props.player.muted).toBe(true);
    expect(ui.getByTestId('reel-example-video-poster', hidden)).toBeTruthy();
    expect(ui.queryByText(UI_STRINGS.REEL.EMPTY_PHOTOS)).toBeNull();
    await fireEvent.press(ui.getByTestId('reel-next'));
    expect(ui.queryByTestId('reel-example-video', hidden)).toBeNull();
    expect(ui.getByTestId('reel-course-reel-course')).toBeTruthy();
  });

  it('도입 화면에서 실제 코스를 선택해야 편집기로 이동한다', async () => {
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        initialDay={1}
        initialStep='intro'
        onClose={jest.fn()}
      />,
    );
    await fireEvent.press(ui.getByTestId('reel-next'));
    expect(ui.getByTestId('reel-next').props.accessibilityState.disabled).toBe(
      true,
    );
    await fireEvent.press(ui.getByTestId('reel-course-reel-course'));
    expect(ui.getByTestId('reel-next').props.accessibilityState.disabled).toBe(
      false,
    );
    await fireEvent.press(ui.getByTestId('reel-next'));
    expect(ui.getByTestId('reel-photo-카페')).toBeTruthy();
  });
  it('여행지 목록은 장소 대신 목록 태그를 보여주고 선택 완료한 코스만 상세 조회한다', async () => {
    const second = {
      ...reelCourse,
      courseId: 'second-course',
      destinationCity: '서울',
    };
    const getDetail = jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(second);
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        courseSummaries={[
          {
            ...reelCourse,
            createdAt: '2026-10-16',
            coverImageUrl: '',
            tags: ['바다여행', '#힐링'],
          },
          {
            ...second,
            coverImageUrl: '',
            createdAt: '2026-10-17',
            tags: ['도심산책'],
          },
        ]}
        initialDay={1}
        initialStep='select'
        onClose={jest.fn()}
      />,
    );
    expect(ui.getByText('릴스를 제작할 여행지를 선택해 주세요.')).toBeTruthy();
    expect(ui.getByText('#바다여행')).toBeTruthy();
    expect(ui.getByText('#힐링')).toBeTruthy();
    expect(ui.getByText('#도심산책')).toBeTruthy();
    expect(ui.queryByText('카페')).toBeNull();
    expect(ui.getAllByTestId(/^reel-course-/)).toHaveLength(2);
    await fireEvent.press(ui.getByTestId('reel-course-second-course'));
    expect(
      ui.getByTestId('reel-course-second-course').props.accessibilityState
        .checked,
    ).toBe(true);
    expect(getDetail).not.toHaveBeenCalled();
    await fireEvent.press(ui.getByTestId('reel-next'));
    expect(await ui.findByTestId('reel-photo-카페')).toBeTruthy();
    expect(getDetail).toHaveBeenCalledTimes(1);
    expect(getDetail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      'second-course',
    );
    getDetail.mockRestore();
  });
  it('선택한 코스의 상세 조회 실패 후 선택을 유지하고 재시도한다', async () => {
    const second = { ...reelCourse, courseId: 'second-course' };
    const getDetail = jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(second);
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        courseSummaries={[
          {
            ...second,
            coverImageUrl: '',
            createdAt: '2026-10-17',
            tags: ['산책'],
          },
        ]}
        initialDay={1}
        initialStep='select'
        onClose={jest.fn()}
      />,
    );
    await fireEvent.press(ui.getByTestId('reel-course-second-course'));
    await fireEvent.press(ui.getByTestId('reel-next'));
    expect(
      await ui.findByText(
        '코스를 불러오지 못했어요. 선택 완료를 눌러 다시 시도해 주세요.',
      ),
    ).toBeTruthy();
    expect(
      ui.getByTestId('reel-course-second-course').props.accessibilityState
        .checked,
    ).toBe(true);
    await fireEvent.press(ui.getByTestId('reel-next'));
    expect(await ui.findByTestId('reel-photo-카페')).toBeTruthy();
    expect(getDetail).toHaveBeenCalledTimes(2);
  });
  it('선택 화면의 시스템 뒤로가기는 도입 화면으로 돌아간 뒤 닫는다', async () => {
    const onClose = jest.fn();
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        initialDay={1}
        initialStep='intro'
        onClose={onClose}
      />,
    );
    await fireEvent.press(ui.getByTestId('reel-next'));
    expect(ui.getByTestId('reel-course-reel-course')).toBeTruthy();
    await fireEvent(ui.getByTestId('reel-course-reel-course'), 'requestClose');
    expect(ui.queryByTestId('reel-course-reel-course')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    await fireEvent(ui.getByTestId('reel-next'), 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('완료 화면의 시스템 뒤로가기는 사진과 문구를 보존한 편집기로 돌아간다', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const onClose = jest.fn();
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        initialDay={1}
        onClose={onClose}
      />,
    );
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.changeText(
      ui.getByTestId('reel-place-name-카페'),
      '우리의 카페',
    );
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-share');
    await fireEvent(ui.getByTestId('reel-share'), 'requestClose');
    expect(ui.queryByTestId('reel-share')).toBeNull();
    expect(ui.getByTestId('reel-place-name-카페').props.value).toBe(
      '우리의 카페',
    );
    expect(service.deleteReel).toHaveBeenCalledWith(output);
    expect(onClose).not.toHaveBeenCalled();
    await fireEvent(ui.getByTestId('reel-create'), 'requestClose');
    expect(onClose).not.toHaveBeenCalled();
    expect(ui.getByTestId('reel-leave-modal')).toBeTruthy();
    expect(alert).not.toHaveBeenCalled();
    await fireEvent.press(ui.getByTestId('reel-confirm-leave'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('미리보기의 시스템 뒤로가기는 편집기를 닫지 않고 미리보기만 닫는다', async () => {
    const onClose = jest.fn();
    const ui = await render(
      <CourseReelComposer
        course={reelCourse}
        initialDay={1}
        onClose={onClose}
      />,
    );
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-preview-open'));
    await fireEvent(ui.getByTestId('reel-preview-close'), 'requestClose');
    expect(ui.queryByTestId('reel-preview-close')).toBeNull();
    expect(ui.getByTestId('reel-create')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
  it('사진을 교체해도 화면과 영상은 일정 순서를 유지한다', async () => {
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-바다'));
    await fireEvent.changeText(ui.getByTestId('reel-place-name-카페'), '카페');
    await fireEvent.changeText(ui.getByTestId('reel-place-name-바다'), '바다');
    await fireEvent.press(ui.getByTestId('reel-preview-open'));
    expect(ui.getByTestId('reel-preview')).toBeTruthy();
    await fireEvent.press(ui.getByTestId('reel-preview-close'));
    expect(ui.getByTestId('reel-place-name-카페').props.editable).toBe(true);
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-create'));
    await ui.findByTestId('reel-save');
    expect(
      (service.generateReel as jest.Mock).mock.calls[0][0].scenes
        .filter((scene: service.ReelScene) => scene.role === 'stop')
        .map((scene: service.ReelScene) => scene.title),
    ).toEqual(['카페', '바다']);
    expect(reelCourse.itinerary.days[0].stops[0].sequence).toBe(2);
  });
  it('수정한 장소명을 사진 교체·날짜 이동에도 보존하고 변경 시 이전 영상을 제거한다', async () => {
    const { getByTestId, findByTestId, queryByTestId } = await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.changeText(
      getByTestId('reel-place-name-카페'),
      '우리의 작은 카페',
    );
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.press(getByTestId('reel-day-2'));
    await fireEvent.press(getByTestId('reel-day-1'));
    expect(getByTestId('reel-place-name-카페').props.value).toBe(
      '우리의 작은 카페',
    );
    await fireEvent.press(getByTestId('reel-create'));
    await findByTestId('reel-share');
    expect(
      jest.mocked(service.generateReel).mock.calls[0][0].scenes[1],
    ).toMatchObject({ title: '우리의 작은 카페', caption: '' });
    expect(reelCourse.itinerary.days[0].stops[1].place.placeName).toBe('카페');
    await fireEvent.press(getByTestId('reel-back'));
    await fireEvent.changeText(
      getByTestId('reel-place-name-카페'),
      '새로운 카페',
    );
    expect(queryByTestId('reel-share')).toBeNull();
    expect(service.deleteReel).toHaveBeenCalledWith(output);
  });

  it('저장 선택을 취소하면 이전 저장 완료 문구도 남기지 않는다', async () => {
    (service.saveReel as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const { getByTestId, findByText, queryByText } = await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.press(getByTestId('reel-create'));
    await waitFor(() => expect(getByTestId('reel-save')).toBeTruthy());
    await fireEvent.press(getByTestId('reel-save'));
    await findByText(S.SAVED);
    await fireEvent.press(getByTestId('reel-save'));
    expect(queryByText(S.SAVED)).toBeNull();
  });
  it('사진이 없는 상태에서는 생성하지 않고, 선택 취소 시에도 빈 상태를 유지한다', async () => {
    (service.pickReelPhoto as jest.Mock).mockResolvedValueOnce(null);
    const { getByTestId } = await mount();
    expect(getByTestId('reel-create').props.accessibilityState.disabled).toBe(
      true,
    );
    await fireEvent.press(getByTestId('reel-photo-카페'));
    expect(getByTestId('reel-place-name-카페').props.value).toBe('카페');
    expect(getByTestId('reel-create').props.accessibilityState.disabled).toBe(
      true,
    );
    expect(service.generateReel).not.toHaveBeenCalled();
  });
  it('날짜별 사진과 제목을 보존하며 선택한 날짜만 생성한다', async () => {
    const { getByTestId } = await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.changeText(
      getByTestId('reel-place-name-카페'),
      '좋아하는 커피',
    );
    await fireEvent.press(getByTestId('reel-day-2'));
    expect(getByTestId('reel-create').props.accessibilityState.disabled).toBe(
      true,
    );
    await fireEvent.press(getByTestId('reel-photo-야경'));
    await fireEvent.changeText(getByTestId('reel-place-name-야경'), '야경');
    await fireEvent.press(getByTestId('reel-create'));
    await waitFor(() => expect(service.generateReel).toHaveBeenCalled());
    expect(
      (service.generateReel as jest.Mock).mock.calls[0][0].scenes.map(
        (s: service.ReelScene) => s.title,
      ),
    ).toContain('야경');
    expect(
      (service.generateReel as jest.Mock).mock.calls[0][0].scenes.map(
        (s: service.ReelScene) => s.title,
      ),
    ).not.toContain('카페');
    await fireEvent.press(getByTestId('reel-back'));
    await fireEvent.press(getByTestId('reel-day-1'));
    expect(getByTestId('reel-place-name-카페').props.value).toBe(
      '좋아하는 커피',
    );
    expect(service.deleteReel).toHaveBeenCalledWith(output);
  });
  it('생성 결과를 재생·저장·공유하고, 문구 수정 시 이전 영상을 제거한다', async () => {
    const { getByTestId, findByTestId, findByText, queryByTestId } =
      await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.changeText(getByTestId('reel-title'), '직접 쓴 여행 제목');
    await fireEvent.press(getByTestId('reel-create'));
    await findByTestId('reel-share');
    expect(
      (service.generateReel as jest.Mock).mock.calls[0][0].scenes.at(-1).kind,
    ).toBe('route');
    expect(
      (service.generateReel as jest.Mock).mock.calls[0][0].scenes[0].caption,
    ).toBe('직접 쓴 여행 제목');
    await fireEvent.press(getByTestId('reel-watch'));
    expect(service.previewReel).toHaveBeenCalledWith(output);
    await fireEvent.press(getByTestId('reel-save'));
    expect(service.saveReel).toHaveBeenCalledWith(output);
    await findByText(S.SAVED);
    await fireEvent.press(getByTestId('reel-share'));
    expect(service.shareReel).toHaveBeenCalledWith(output);
    await fireEvent.press(getByTestId('reel-back'));
    await fireEvent.changeText(getByTestId('reel-title'), '새로운 제목');
    expect(queryByTestId('reel-share')).toBeNull();
    expect(service.deleteReel).toHaveBeenCalledWith(output);
  });
  it('생성 실패 시 오류와 재시도를 제공하고 중복 생성 요청을 막는다', async () => {
    let reject: (e: Error) => void = () => {};
    (service.generateReel as jest.Mock).mockReturnValueOnce(
      new Promise((_, r) => {
        reject = r;
      }),
    );
    const { getByTestId, findByText, findByTestId, queryByTestId } =
      await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.press(getByTestId('reel-create'));
    expect(getByTestId('reel-rendering')).toBeTruthy();
    expect(queryByTestId('reel-create')).toBeNull();
    expect(service.generateReel).toHaveBeenCalledTimes(1);
    expect(mockMapCleanup).not.toHaveBeenCalled();
    await act(async () => {
      reject(new Error('encoder'));
    });
    await findByText(S.EXPORT_ERROR);
    await fireEvent.press(getByTestId('reel-create'));
    await findByTestId('reel-share');
    expect(service.generateReel).toHaveBeenCalledTimes(2);
    expect(mockMapCleanup).not.toHaveBeenCalled();
  });
  it('진행률이 후퇴하지 않고 파일 생성이 끝나기 전에는 100%나 완료 화면을 보이지 않는다', async () => {
    let report: (value: number) => void = () => {};
    let finish: (uri: string) => void = () => {};
    jest
      .mocked(service.generateReel)
      .mockImplementationOnce((_plan, onProgress) => {
        report = onProgress;
        return new Promise<string>((resolve) => {
          finish = resolve;
        });
      });
    const ui = await mount();
    await fireEvent.press(ui.getByTestId('reel-photo-카페'));
    await fireEvent.press(ui.getByTestId('reel-create'));
    const percent = () =>
      ui.getByRole('progressbar').props.accessibilityValue.now;
    expect(percent()).toBe(0);
    await act(async () => report(0.5));
    expect(percent()).toBe(50);
    await act(async () => {
      report(0.2);
      report(Number.NaN);
    });
    expect(percent()).toBe(50);
    await act(async () => report(1));
    expect(percent()).toBe(99);
    expect(ui.getByTestId('reel-rendering')).toBeTruthy();
    expect(ui.queryByTestId('reel-save')).toBeNull();
    await act(async () => finish(output));
    expect(await ui.findByTestId('reel-save')).toBeTruthy();
  });
  it('편집기를 닫으면 생성을 취소하고 늦게 완성된 파일도 삭제한다', async () => {
    let resolve: (s: string) => void = () => {};
    (service.generateReel as jest.Mock).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { getByTestId, unmount } = await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.press(getByTestId('reel-create'));
    await unmount();
    expect(service.cancelReel).toHaveBeenCalled();
    await act(async () => {
      resolve(output);
    });
    expect(service.deleteReel).toHaveBeenCalledWith(output);
  });
  it('사진 불러오기·저장 실패 시 성공 메시지를 표시하지 않는다', async () => {
    (service.pickReelPhoto as jest.Mock).mockRejectedValueOnce(
      new Error('photo'),
    );
    (service.saveReel as jest.Mock).mockRejectedValueOnce(
      new Error('permission'),
    );
    const { getByTestId, findByText, queryByText } = await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await findByText(S.PICK_ERROR);
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.press(getByTestId('reel-create'));
    await fireEvent.press(getByTestId('reel-save'));
    await findByText(S.ACTION_ERROR);
    expect(queryByText(S.SAVED)).toBeNull();
  });
});
