/**
 * @file CourseReelComposer.test.tsx
 * @description Reel editor tests covering per-date drafts, native export, retries and canceled component cleanup.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { CourseReelComposer } from '../src/components/course/CourseReelComposer';
import * as service from '../src/services/courseReelService';
import { renderWithQueryClient as render } from './test-utils';
import { reelCourse } from './mocks/reel-fixtures';
import { UI_STRINGS } from '../src/constants/strings';

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
  ReelRouteMap: ({ onReady }: { onReady: (snapshot: unknown) => void }) => {
    const React = require('react');
    React.useEffect(() => {
      onReady({
        uri: 'file:///map.png',
        points: [{ x: 0.5, y: 0.4, label: '1' }],
      });
    }, [onReady]);
    return null;
  },
}));
const S = UI_STRINGS.REEL;
const output = 'file:///reel.mp4';
describe('CourseReelComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (service.pickReelPhoto as jest.Mock).mockResolvedValue('file:///photo.jpg');
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
  it('장소명과 메시지를 수정해 영상에 반영하고 사진 교체·날짜 이동에도 보존한다', async () => {
    const { getByTestId, findByTestId, queryByTestId } = await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.changeText(
      getByTestId('reel-place-name-카페'),
      '우리의 작은 카페',
    );
    await fireEvent.changeText(getByTestId('reel-caption-카페'), '');
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.press(getByTestId('reel-day-2'));
    await fireEvent.press(getByTestId('reel-day-1'));
    expect(getByTestId('reel-place-name-카페').props.value).toBe(
      '우리의 작은 카페',
    );
    expect(getByTestId('reel-caption-카페').props.value).toBe('');
    await fireEvent.press(getByTestId('reel-create'));
    await findByTestId('reel-share');
    expect(
      (service.generateReel as jest.Mock).mock.calls[0][0].scenes[2],
    ).toMatchObject({ title: '우리의 작은 카페', caption: '' });
    expect(reelCourse.itinerary.days[0].stops[1].place.placeName).toBe('카페');
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
    const { getByTestId, queryByTestId } = await mount();
    expect(getByTestId('reel-create').props.accessibilityState.disabled).toBe(
      true,
    );
    await fireEvent.press(getByTestId('reel-photo-카페'));
    expect(queryByTestId('reel-caption-카페')).toBeNull();
    expect(service.generateReel).not.toHaveBeenCalled();
  });
  it('날짜별 사진과 자막을 보존하며 선택한 날짜만 생성한다', async () => {
    const { getByTestId } = await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.changeText(
      getByTestId('reel-caption-카페'),
      '좋아하는 커피',
    );
    await fireEvent.press(getByTestId('reel-day-2'));
    expect(getByTestId('reel-create').props.accessibilityState.disabled).toBe(
      true,
    );
    await fireEvent.press(getByTestId('reel-photo-야경'));
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
    await fireEvent.press(getByTestId('reel-day-1'));
    expect(getByTestId('reel-caption-카페').props.value).toBe('좋아하는 커피');
    expect(service.deleteReel).toHaveBeenCalledWith(output);
  });
  it('생성 결과를 재생·저장·공유하고, 문구 수정 시 이전 영상을 제거한다', async () => {
    const { getByTestId, findByTestId, findByText, queryByTestId } =
      await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.changeText(
      getByTestId('reel-ending'),
      '부산에서 만난 우리',
    );
    await fireEvent.press(getByTestId('reel-create'));
    await findByTestId('reel-share');
    expect(
      (service.generateReel as jest.Mock).mock.calls[0][0].scenes.at(-1)
        .caption,
    ).toBe('부산에서 만난 우리');
    await fireEvent.press(getByTestId('reel-watch'));
    expect(service.previewReel).toHaveBeenCalledWith(output);
    await fireEvent.press(getByTestId('reel-save'));
    expect(service.saveReel).toHaveBeenCalledWith(output);
    await findByText(S.SAVED);
    await fireEvent.press(getByTestId('reel-share'));
    expect(service.shareReel).toHaveBeenCalledWith(output);
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
    const { getByTestId, findByText, findByTestId } = await mount();
    await fireEvent.press(getByTestId('reel-photo-카페'));
    await fireEvent.press(getByTestId('reel-create'));
    await fireEvent.press(getByTestId('reel-create'));
    expect(service.generateReel).toHaveBeenCalledTimes(1);
    await act(async () => {
      reject(new Error('encoder'));
    });
    await findByText(S.EXPORT_ERROR);
    await fireEvent.press(getByTestId('reel-create'));
    await findByTestId('reel-share');
    expect(service.generateReel).toHaveBeenCalledTimes(2);
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
