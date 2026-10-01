/**
 * @file HomeScreen.test.tsx
 * @description Unit and integration tests for HomeScreen matching issue #62 requirements.
 */
import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeScreen } from '../src/screens/HomeScreen';
import { renderWithQueryClient as render } from './test-utils';

describe('HomeScreen (TSK-59 / #62: 홈 화면 UI/UX 및 맞춤 정보 연동)', () => {
  const mockOnCreate = jest.fn();
  const mockOnExplore = jest.fn();
  const mockOnTasteProfile = jest.fn();
  const mockOnPhotoConsent = jest.fn();
  const mockOnSelectCourse = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-token');
  });

  it('기본 UI 요소들(브랜드 로고, 인사말, 퀵 버튼 3종, 여행 예약 타일)이 올바르게 렌더링되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'fetchTasteProfileApi')
      .mockRejectedValue(new commonApi.ApiError(404, 'Not found'));

    const { getByText, getByTestId } = await render(<HomeScreen />);

    expect(getByTestId('home-screen')).toBeTruthy();
    expect(getByText('오늘은 어디로 떠나볼까요?')).toBeTruthy();

    expect(getByTestId('quick-icons')).toBeTruthy();
    expect(getByText('코스 생성하기')).toBeTruthy();
    expect(getByText('코스 둘러보기')).toBeTruthy();
    expect(getByText('내 여행 취향')).toBeTruthy();

    expect(getByTestId('booking-section')).toBeTruthy();
    expect(getByText('여행 예약')).toBeTruthy();
    expect(getByText('마이리얼트립')).toBeTruthy();
    expect(getByText('항공')).toBeTruthy();
    expect(getByText('숙소')).toBeTruthy();
    expect(getByText('투어·티켓')).toBeTruthy();
  });

  it('퀵 액션 바: "코스 생성하기" 클릭 시 onNavigateToCreate 콜백이 실행되어야 한다', async () => {
    const { getByText } = await render(
      <HomeScreen onNavigateToCreate={mockOnCreate} />,
    );

    fireEvent.press(getByText('코스 생성하기'));
    expect(mockOnCreate).toHaveBeenCalledTimes(1);
  });

  it('퀵 액션 바: "코스 둘러보기" 클릭 시 onNavigateToExplore 콜백이 실행되어야 한다', async () => {
    const { getByText } = await render(
      <HomeScreen onNavigateToExplore={mockOnExplore} />,
    );

    fireEvent.press(getByText('코스 둘러보기'));
    expect(mockOnExplore).toHaveBeenCalledTimes(1);
  });

  it('API-PREF-4 취향 존재 시 (fetchTasteProfileApi 성공), "내 여행 취향" 클릭 시 onNavigateToTasteProfile이 호출되어야 한다', async () => {
    jest.spyOn(commonApi, 'fetchTasteProfileApi').mockResolvedValue({
      tasteProfileId: 'taste-123',
      userId: 'user-1',
      updatedAt: '2026-08-01',
    } as any);

    const { getByText } = await render(
      <HomeScreen
        onNavigateToTasteProfile={mockOnTasteProfile}
        onNavigateToPhotoConsent={mockOnPhotoConsent}
      />,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    fireEvent.press(getByText('내 여행 취향'));

    expect(mockOnTasteProfile).toHaveBeenCalledTimes(1);
    expect(mockOnPhotoConsent).not.toHaveBeenCalled();
  });

  it('API-PREF-4 취향 없을 시 (404/에러), "내 여행 취향" 클릭 시 onNavigateToPhotoConsent가 호출되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'fetchTasteProfileApi')
      .mockRejectedValue(
        new commonApi.ApiError(404, '저장된 성향 프로필이 없습니다.'),
      );

    const { getByText } = await render(
      <HomeScreen
        onNavigateToTasteProfile={mockOnTasteProfile}
        onNavigateToPhotoConsent={mockOnPhotoConsent}
      />,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    fireEvent.press(getByText('내 여행 취향'));

    expect(mockOnPhotoConsent).toHaveBeenCalledTimes(1);
    expect(mockOnTasteProfile).not.toHaveBeenCalled();
  });

  it('selectedCourseId가 null 또는 빈 값일 때 최근 확인한 여행 코스 영역이 표시되지 않아야 한다', async () => {
    const { queryByTestId } = await render(
      <HomeScreen selectedCourseId={null} />,
    );

    expect(queryByTestId('recent-course-section')).toBeNull();
  });

  it('selectedCourseId가 존재할 때 API-COURSE-2 정보(getCourseDetailApi)를 조회하여 표시하고 카드 클릭 시 onSelectCourse 콜백이 호출되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue({
      courseId: 'mock-course-id-1',
      title: '2박 3일 제주 서귀포 감성 힐링 코스',
      destinationCountry: '대한민국',
      destinationCity: '제주',
      startDate: '2026-08-01',
      totalDays: 2,
      tags: ['힐링', '해변', '카페'],
      recommendationReason: '감성 힐링 추천 코스',
      itinerary: { days: [] },
    } as any);

    const { getByTestId, findByText, findByTestId } = await render(
      <HomeScreen
        selectedCourseId='mock-course-id-1'
        onSelectCourse={mockOnSelectCourse}
      />,
    );

    const recentSection = await findByTestId('recent-course-section');
    expect(recentSection).toBeTruthy();

    const courseTitle = await findByText('2박 3일 제주 서귀포 감성 힐링 코스');
    expect(courseTitle).toBeTruthy();

    fireEvent.press(getByTestId('recent-course-card'));
    expect(mockOnSelectCourse).toHaveBeenCalledWith('mock-course-id-1');
  });

  it('selectedCourseId가 존재하더라도 API 조회 실패(404 등) 시 최근 코스 영역이 표시되지 않아야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockRejectedValue(new commonApi.ApiError(404, 'Course not found'));

    const { queryByTestId } = await render(
      <HomeScreen
        selectedCourseId='invalid-course-id'
        onSelectCourse={mockOnSelectCourse}
      />,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(queryByTestId('recent-course-section')).toBeNull();
    expect(queryByTestId('recent-course-card')).toBeNull();
  });

  it('selectedCourseId가 props로 제공되지 않더라도 AuthContext에 recentCourseId가 있을 경우 최근 코스를 표시하고 클릭 시 이동해야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue({
      courseId: '550e8400-e29b-41d4-a716-446655440030',
      title: '로그인 응답 기반 최근 추천 코스',
      destinationCountry: '대한민국',
      destinationCity: '제주',
      coverImageUrl: 'https://example.com/custom-cover-image.jpg',
      startDate: '2026-08-01',
      totalDays: 3,
      tags: ['최신', '추천'],
      recommendationReason: '최근에 확인한 추천 코스입니다.',
      itinerary: { days: [] },
    } as any);

    const { AuthContext } = require('../src/context/AuthContext');
    const mockAuthValue = {
      isAuthenticated: true,
      user: { displayName: '테스터' },
      isLoading: false,
      recentCourseId: '550e8400-e29b-41d4-a716-446655440030',
      loginWithGoogle: jest.fn(),
      loginWithApple: jest.fn(),
      logout: jest.fn(),
    };

    const { getByTestId, findByText, findByTestId } = await render(
      <AuthContext.Provider value={mockAuthValue}>
        <HomeScreen onSelectCourse={mockOnSelectCourse} />
      </AuthContext.Provider>,
    );

    const recentSection = await findByTestId('recent-course-section');
    expect(recentSection).toBeTruthy();
    const courseTitle = await findByText('로그인 응답 기반 최근 추천 코스');
    expect(courseTitle).toBeTruthy();

    const thumbnail = getByTestId('recent-course-thumbnail');
    expect(thumbnail.props.source.uri).toBe(
      'https://example.com/custom-cover-image.jpg',
    );

    fireEvent.press(getByTestId('recent-course-card'));
    expect(mockOnSelectCourse).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440030',
    );
  });

  it.each(['flight', 'hotel', 'ticket'])(
    '예약 %s 타일은 마이리얼트립 검색창을 연다',
    async (kind) => {
      const onOpenBooking = jest.fn();
      const { getByTestId, queryByTestId } = await render(
        <HomeScreen onOpenBooking={onOpenBooking} />,
      );
      await fireEvent.press(getByTestId(`booking-tile-${kind}`));
      expect(onOpenBooking).toHaveBeenCalledWith(kind, expect.any(Object));
      expect(queryByTestId('booking-tile-train')).toBeNull();
    },
  );
});
