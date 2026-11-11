/**
 * @file HomeScreen.test.tsx
 * @description UI v3 홈의 진입 동선, 최신 코스 최대 세 개와 빈 상태·조회 실패 및 예약 연결을 검증합니다.
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeScreen } from '../src/screens/HomeScreen';
import { renderWithQueryClient as render } from './test-utils';

const course = {
  courseId: 'recent-course',
  title: '도쿄 여행',
  destinationCountry: '일본',
  destinationCity: '도쿄',
  startDate: '2026-10-14',
  totalDays: 2,
  tags: [],
  recommendationReason: '',
  itinerary: {
    days: [
      {
        day: 1,
        date: '2026-10-14',
        stops: [
          { type: 'place', place: { placeId: 'p1', placeName: '모리 미술관' } },
        ],
      },
    ],
  },
} as unknown as commonApi.CourseDetail;

describe('HomeScreen UI v3', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue([]);
    await AsyncStorage.setItem('accessToken', 'mock-token');
    jest
      .spyOn(commonApi, 'fetchTasteProfileApi')
      .mockRejectedValue(new commonApi.ApiError(404, 'Not found'));
  });

  it('두 기능 카드와 릴스 진입, 빈 최근 코스, 세 예약 버튼을 표시한다', async () => {
    const screen = await render(<HomeScreen />);
    expect(screen.getByLabelText('여로')).toBeTruthy();
    expect(screen.getByText('여행 취향 알아보기')).toBeTruthy();
    expect(screen.getByText('여행 코스 생성하기')).toBeTruthy();
    expect(screen.getByText('최근 다녀온 여행지 릴스 제작하기')).toBeTruthy();
    expect(await screen.findByText('최근 생성한 코스가 없어요')).toBeTruthy();
    for (const kind of ['flight', 'hotel', 'ticket'])
      expect(screen.getByTestId(`booking-tile-${kind}`)).toBeTruthy();
  });

  it('프로필, 코스 생성, 전체 코스와 사진 동의 진입을 연결한다', async () => {
    const onProfile = jest.fn(),
      onCreate = jest.fn(),
      onExplore = jest.fn(),
      onPhoto = jest.fn();
    const screen = await render(
      <HomeScreen
        onNavigateToProfile={onProfile}
        onNavigateToCreate={onCreate}
        onNavigateToExplore={onExplore}
        onNavigateToPhotoConsent={onPhoto}
      />,
    );
    await fireEvent.press(screen.getByTestId('home-profile'));
    await fireEvent.press(screen.getByText('여행 코스 생성하기'));
    await fireEvent.press(screen.getByText('최근 생성한 코스'));
    await fireEvent.press(screen.getByText('여행 취향 알아보기'));
    expect(onProfile).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onExplore).toHaveBeenCalledTimes(1);
    expect(onPhoto).toHaveBeenCalledTimes(1);
  });

  it('분석 결과가 있으면 취향 보기로 이동한다', async () => {
    jest.spyOn(commonApi, 'fetchTasteProfileApi').mockResolvedValue({
      intro: '여행 취향',
      hashtags: [],
      types: [],
      recommendCity: [],
    } as any);
    const onTaste = jest.fn(),
      onPhoto = jest.fn();
    const screen = await render(
      <HomeScreen
        onNavigateToTasteProfile={onTaste}
        onNavigateToPhotoConsent={onPhoto}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('home-taste-card').props.accessibilityLabel,
      ).toBe('내 여행 취향 보기'),
    );
    await fireEvent.press(screen.getByTestId('home-taste-card'));
    expect(onTaste).toHaveBeenCalledTimes(1);
    expect(onPhoto).not.toHaveBeenCalled();
  });

  it('상세 조회 없이 목록의 목적지·기간·태그를 표시하고 카드 클릭을 연결한다', async () => {
    const getDetail = jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(course);
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue([
      {
        ...course,
        tags: ['문화', '#미식'],
        coverImageUrl: '',
        createdAt: '2026-10-16',
      },
    ]);
    const onSelect = jest.fn();
    const screen = await render(<HomeScreen onSelectCourse={onSelect} />);
    expect(await screen.findByText('도쿄')).toBeTruthy();
    expect(screen.getByText('26.10.14 - 26.10.15')).toBeTruthy();
    expect(screen.getByText('#문화')).toBeTruthy();
    expect(screen.getByText('#미식')).toBeTruthy();
    expect(screen.queryByText('모리 미술관')).toBeNull();
    expect(getDetail).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('course-card-recent-course'));
    expect(onSelect).toHaveBeenCalledWith('recent-course');
  });

  it('홈에서는 상세를 조회하지 않고 릴스 버튼을 누르면 제작 미리보기를 연다', async () => {
    const getDetail = jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(course);
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue([
      { ...course, coverImageUrl: '', createdAt: '2026-10-16' },
      ...['파리', '부산', '서울'].map((city, index) => ({
        ...course,
        courseId: `other-${index}`,
        destinationCity: city,
        tags: [`여행${index}`],
        coverImageUrl: '',
        createdAt: '2026-10-15',
      })),
    ]);
    const onExplore = jest.fn();
    const screen = await render(<HomeScreen onNavigateToExplore={onExplore} />);
    await screen.findByText('도쿄');
    expect(getDetail).not.toHaveBeenCalled();
    expect(screen.getAllByTestId(/^course-card-/)).toHaveLength(3);
    await fireEvent.press(screen.getByTestId('home-reel'));
    expect(await screen.findByTestId('reel-next')).toBeTruthy();
    expect(onExplore).not.toHaveBeenCalled();
    expect(getDetail).toHaveBeenCalledTimes(1);
    expect(getDetail).toHaveBeenCalledWith(
      expect.any(String),
      'mock-token',
      'recent-course',
    );
    await fireEvent.press(screen.getByTestId('reel-next'));
    expect(screen.getByTestId('reel-course-recent-course')).toBeTruthy();
    expect(screen.getAllByTestId(/^reel-course-/)).toHaveLength(4);
    expect(screen.getByText('#여행2')).toBeTruthy();
    expect(getDetail).toHaveBeenCalledTimes(1);
  });

  it('릴스 상세 조회가 실패하면 홈에서 다시 시도해 미리보기를 연다', async () => {
    const getDetail = jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(course);
    jest
      .spyOn(commonApi, 'getCourseListApi')
      .mockResolvedValue([
        { ...course, coverImageUrl: '', createdAt: '2026-10-16' },
      ]);
    const screen = await render(<HomeScreen />);
    await screen.findByText('도쿄');
    await fireEvent.press(screen.getByTestId('home-reel'));
    expect(
      await screen.findByText(
        '릴스 정보를 불러오지 못했어요. 버튼을 눌러 다시 시도해 주세요.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('home-reel'));
    expect(await screen.findByTestId('reel-next')).toBeTruthy();
    expect(getDetail).toHaveBeenCalledTimes(2);
  });

  it('생성일 최신순으로 최대 세 코스를 표시하고 전체 목록으로 연결한다', async () => {
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue(course);
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(
      ['도쿄', '파리', '리스본', '방콕'].map((city, index) => ({
        ...course,
        courseId: `course-${index}`,
        destinationCity: city,
        coverImageUrl: '',
        createdAt: ['2026-10-15', '2026-10-17', '2026-10-16', '2026-10-14'][
          index
        ],
      })),
    );
    const onExplore = jest.fn();
    const screen = await render(<HomeScreen onNavigateToExplore={onExplore} />);
    expect(await screen.findByText('파리')).toBeTruthy();
    expect(
      screen.getAllByTestId(/^course-card-/).map((card) => card.props.testID),
    ).toEqual([
      'course-card-course-1',
      'course-card-course-2',
      'course-card-course-0',
    ]);
    expect(screen.getByText('도쿄')).toBeTruthy();
    expect(screen.getByText('리스본')).toBeTruthy();
    expect(screen.queryByText('방콕')).toBeNull();
    await fireEvent.press(screen.getByText('코스 전체보기'));
    expect(onExplore).toHaveBeenCalledTimes(1);
  });

  it('목록 조회 실패를 빈 상태와 구별하고 다시 시도한다', async () => {
    const getList = jest
      .spyOn(commonApi, 'getCourseListApi')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]);
    const screen = await render(<HomeScreen />);
    expect(
      await screen.findByText('최근 코스를 불러오지 못했어요.'),
    ).toBeTruthy();
    expect(screen.queryByText('최근 생성한 코스가 없어요')).toBeNull();
    await fireEvent.press(screen.getByText('다시 시도'));
    expect(await screen.findByText('최근 생성한 코스가 없어요')).toBeTruthy();
    expect(getList).toHaveBeenCalledTimes(2);
  });

  it.each(['flight', 'hotel', 'ticket'])(
    '최근 코스가 있어도 홈의 %s 예약은 빈 입력 조건으로 진입한다',
    async (kind) => {
      jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue(course);
      jest
        .spyOn(commonApi, 'getCourseListApi')
        .mockResolvedValue([
          { ...course, coverImageUrl: '', createdAt: '2026-10-16' },
        ]);
      const onOpenBooking = jest.fn();
      const screen = await render(<HomeScreen onOpenBooking={onOpenBooking} />);
      await screen.findByText('도쿄');
      await fireEvent.press(screen.getByTestId(`booking-tile-${kind}`));
      expect(onOpenBooking).toHaveBeenCalledWith(kind, {});
    },
  );
});
