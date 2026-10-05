/**
 * @file courseReelService.test.ts
 * @description Reel story ordering, validation, picker cancellation and native export/listener contracts.
 */
import { requireOptionalNativeModule } from 'expo';
import * as ImagePicker from 'expo-image-picker';
import {
  buildReelPlan,
  captureReelMap,
  reelMapCoordinates,
  generateReel,
  pickReelPhoto,
  cancelReel,
  saveReel,
  shareReel,
  previewReel,
} from '../src/services/courseReelService';
import { reelCourse, reelStop } from './mocks/reel-fixtures';
import { UI_STRINGS } from '../src/constants/strings';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));
const day = reelCourse.itinerary.days[0];
const photos = [
  { placeId: '바다', uri: 'file:///sea.jpg', caption: '바다와 우리' },
  { placeId: '카페', uri: 'file:///cafe.jpg', caption: '커피 한 잔' },
];

describe('course reel service', () => {
  beforeEach(() => jest.clearAllMocks());
  it('캡처한 Google Maps 배경과 SDK 투영 좌표를 그대로 영상에 반영한다', () => {
    const map = {
      uri: 'file:///map.png',
      points: [
        { x: 0.2, y: 0.3, label: '1' },
        { x: 0.6, y: 0.4, label: '2' },
      ],
    };
    const plan = buildReelPlan(
      day,
      [
        {
          ...photos[1],
          placeName: '우리의 카페',
          caption: '기억하고 싶은 순간',
        },
      ],
      '부산',
      '',
      undefined,
      map,
    );
    expect(plan.scenes[1]).toMatchObject(map);
    expect(plan.scenes[2]).toMatchObject({
      title: '우리의 카페',
      caption: '기억하고 싶은 순간',
    });
  });
  it('지도 캡처가 없으면 배경 없는 영상을 생성하지 않는다', async () => {
    const generateAsync = jest.fn();
    (requireOptionalNativeModule as jest.Mock).mockReturnValue({
      generateAsync,
    });
    await expect(
      generateReel(buildReelPlan(day, photos, '', ''), jest.fn()),
    ).rejects.toThrow(UI_STRINGS.REEL.MAP_ERROR);
    expect(generateAsync).not.toHaveBeenCalled();
  });
  it('같은 장소를 다시 방문해도 사진을 중복으로 세지 않는다', () => {
    const revisited = {
      ...day,
      stops: [
        ...day.stops,
        ...Array.from({ length: 5 }, (_, i) => reelStop('카페', i + 3)),
      ],
    };
    const plan = buildReelPlan(revisited, photos, '하루', '');
    expect(plan.scenes.filter((s) => s.title === '카페')).toHaveLength(1);
    expect(reelMapCoordinates(revisited)).toHaveLength(7);
  });
  it('선택한 첫 장면을 쓰되 본문 사진은 코스의 방문 순서로 배치한다', () => {
    const plan = buildReelPlan(
      day,
      photos,
      '부산 하루',
      '오래 기억하기',
      '바다',
    );
    expect(plan).toMatchObject({ width: 720, height: 1280, fps: 24 });
    expect(plan.scenes.map((s) => s.uri)).toEqual([
      'file:///sea.jpg',
      '',
      'file:///cafe.jpg',
      'file:///sea.jpg',
      'file:///sea.jpg',
    ]);
    expect(reelMapCoordinates(day).map((p) => p.label)).toEqual(['1', '2']);
    expect(plan.scenes.at(-1)?.caption).toBe('오래 기억하기');
    expect(plan.scenes.reduce((n, s) => n + s.seconds, 0)).toBe(13);
    expect(day.stops[0].sequence).toBe(2);
  });
  it('현재 날짜와 관계없는 사진이나 빈 사진으로 영상을 만들지 않는다', () => {
    expect(() => buildReelPlan(day, [], '', '')).toThrow(
      UI_STRINGS.REEL.EMPTY_PHOTOS,
    );
    expect(() =>
      buildReelPlan(
        day,
        [{ placeId: '야경', uri: 'file:///night.jpg', caption: '' }],
        '',
        '',
      ),
    ).toThrow(UI_STRINGS.REEL.EMPTY_PHOTOS);
  });
  it('5곳 상한과 문구 길이를 지키고 없는 첫 장소는 첫 방문 사진으로 대체한다', () => {
    const stops = Array.from({ length: 6 }, (_, i) =>
      reelStop(String(i), i + 1),
    );
    const six = stops.map((s) => ({
      placeId: s.place.placeId,
      uri: 'file:///photo.jpg',
      caption: '',
    }));
    expect(() => buildReelPlan({ ...day, stops }, six, '', '')).toThrow(
      UI_STRINGS.REEL.LIMIT,
    );
    const plan = buildReelPlan(
      day,
      photos,
      'a'.repeat(100),
      'b'.repeat(100),
      'missing',
    );
    expect(plan.scenes[0].uri).toBe('file:///cafe.jpg');
    expect(plan.scenes[0].title.length).toBe(40);
    expect(plan.scenes.at(-1)?.caption.length).toBe(80);
  });
  it('잘못된 좌표를 지도 캡처에서 제외하고 방문 순서를 유지한다', () => {
    expect(
      reelMapCoordinates({
        ...day,
        stops: day.stops.map((s) => ({
          ...s,
          place: { ...s.place, latitude: NaN },
        })),
      }),
    ).toEqual([]);
    expect(reelMapCoordinates(day).map((p) => p.label)).toEqual(['1', '2']);
  });
  it('SDK 지도 캡처 모듈에 뷰 태그와 좌표를 전달하고 투영 결과를 반환한다', async () => {
    const snapshot = {
      uri: 'file:///map.png',
      points: [{ x: 0.5, y: 0.3, label: '1' }],
    };
    const captureMapAsync = jest.fn().mockResolvedValue(snapshot);
    (requireOptionalNativeModule as jest.Mock).mockReturnValue({
      captureMapAsync,
    });
    expect(await captureReelMap(42, reelMapCoordinates(day))).toEqual(snapshot);
    expect(captureMapAsync).toHaveBeenCalledWith(
      42,
      JSON.stringify(reelMapCoordinates(day)),
    );
  });
  it('사진 선택 취소 시 null을 반환하고 전체 보관함 권한을 요청하지 않는다', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: true,
      assets: null,
    });
    expect(await pickReelPhoto()).toBeNull();
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
      }),
    );
    expect(
      ImagePicker.requestMediaLibraryPermissionsAsync,
    ).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    '실제 MP4 요청 완료/실패 후 진행 리스너를 제거한다 (실패=%s)',
    async (fail) => {
      let listener: (event: {
        jobId: string;
        progress: number;
      }) => void = () => {};
      const remove = jest.fn();
      const module = {
        addListener: jest.fn((_, cb) => {
          listener = cb;
          return { remove };
        }),
        generateAsync: jest.fn(async (_json, jobId) => {
          listener({ jobId: 'other', progress: 0.5 });
          listener({ jobId, progress: 0.8 });
          if (fail) throw new Error('encoder failed');
          return 'file:///reel.mp4';
        }),
      };
      (requireOptionalNativeModule as jest.Mock).mockReturnValue(module);
      const progress = jest.fn();
      const plan = buildReelPlan(day, photos, '부산', '', undefined, {
        uri: 'file:///map.png',
        points: [],
      });
      if (fail)
        await expect(generateReel(plan, progress)).rejects.toThrow(
          'encoder failed',
        );
      else expect(await generateReel(plan, progress)).toBe('file:///reel.mp4');
      expect(progress).toHaveBeenCalledTimes(1);
      expect(progress).toHaveBeenCalledWith(0.8);
      expect(JSON.parse(module.generateAsync.mock.calls[0][0])).toEqual(plan);
      expect(remove).toHaveBeenCalledTimes(1);
    },
  );
  it('모듈 없는 기존 앱에서 성공을 가장하지 않고 업데이트 안내를 반환한다', async () => {
    (requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
    await expect(
      generateReel(buildReelPlan(day, photos, '', ''), jest.fn()),
    ).rejects.toThrow(UI_STRINGS.REEL.UNAVAILABLE);
    expect(() => cancelReel()).not.toThrow();
  });
  it('완성된 MP4 경로를 저장·재생·공유 모듈로 전달한다', async () => {
    const module = {
      saveAsync: jest.fn(),
      shareAsync: jest.fn(),
      previewAsync: jest.fn(),
      cancel: jest.fn(),
    };
    (requireOptionalNativeModule as jest.Mock).mockReturnValue(module);
    await saveReel('file:///reel.mp4');
    await shareReel('file:///reel.mp4');
    await previewReel('file:///reel.mp4');
    cancelReel();
    for (const action of [
      module.saveAsync,
      module.shareAsync,
      module.previewAsync,
    ])
      expect(action).toHaveBeenCalledWith('file:///reel.mp4');
    expect(module.cancel).toHaveBeenCalledTimes(1);
  });
});
