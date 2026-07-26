/**
 * @file CourseListScreen.test.tsx
 * @description Unit and integration tests for 이전 생성 코스 목록 조회 및 상세 이동 (FUN-7, API-FB-10, DOM-2).
 * @requirements REQ-9
 * @functional FUN-7
 * @api API-FB-10
 * @author Antigravity Agent
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CourseListScreen } from '../src/screens/CourseListScreen';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/components/navigation/BottomNavBar', () => ({
  BottomNavBar: () => null,
}));

const mockCourseList: commonApi.CourseSummary[] = [
  {
    courseId: 'course-uuid-1',
    title: '2박 3일 서귀포 감성 가득 힐링 코스',
    destinationCountry: '대한민국',
    destinationCity: '제주',
    startDate: '2026-08-01',
    totalDays: 3,
    tags: ['힐링', '카페', '자연'],
    recommendationReason: '카페·자연 선호 코스',
    createdAt: '2026-07-20T10:00:00Z',
  },
  {
    courseId: 'course-uuid-2',
    title: '도쿄 3박 4일 미식 & 쇼핑 투어',
    destinationCountry: '일본',
    destinationCity: '도쿄',
    startDate: '2026-09-10',
    totalDays: 4,
    tags: ['미식', '쇼핑', '도시'],
    recommendationReason: '미식 중심 코스',
    createdAt: '2026-07-18T14:30:00Z',
  },
];

describe('CourseListScreen (FUN-7: 이전 생성 코스 목록 조회 및 상세 이동)', () => {
  const mockOnSelectCourse = jest.fn();
  const mockOnCreateCourse = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-token');
  });

  it('이전 생성 코스 목록 API 데이터 조회 후 Bento Grid 카드 및 CTA 카드가 올바르게 렌더링되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByText, getByTestId } = await render(
      <CourseListScreen onSelectCourse={mockOnSelectCourse} onCreateCourse={mockOnCreateCourse} />
    );

    await waitFor(() => {
      expect(getByText('당신의 여로')).toBeTruthy();
      expect(getByText('대한민국 제주')).toBeTruthy();
      expect(getByText('일본 도쿄')).toBeTruthy();
    });

    expect(getByText('AI와 함께 여로를 만들어보세요')).toBeTruthy();
    expect(getByTestId('search-input')).toBeTruthy();
  });

  it('코스 카드 클릭 시 해당 코스 상세 화면(onSelectCourse)으로 내비게이션 이벤트가 발생해야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByTestId, getByText } = await render(
      <CourseListScreen onSelectCourse={mockOnSelectCourse} onCreateCourse={mockOnCreateCourse} />
    );

    await waitFor(() => {
      expect(getByText('대한민국 제주')).toBeTruthy();
    });

    const card1 = getByTestId('course-card-course-uuid-1');
    fireEvent.press(card1);

    expect(mockOnSelectCourse).toHaveBeenCalledWith('course-uuid-1');
  });

  it('AI 코스 생성 CTA 카드 클릭 시 코스 생성 흐름(onCreateCourse)으로 이동해야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByTestId } = await render(
      <CourseListScreen onSelectCourse={mockOnSelectCourse} onCreateCourse={mockOnCreateCourse} />
    );

    await waitFor(() => {
      expect(getByTestId('create-course-cta-card')).toBeTruthy();
    });

    fireEvent.press(getByTestId('create-course-cta-card'));
    expect(mockOnCreateCourse).toHaveBeenCalled();
  });

  it('검색 바에 검색어 입력 시 해당하는 코스 카드만 필터링되어 노출되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByTestId, getByText, queryByText } = await render(
      <CourseListScreen onSelectCourse={mockOnSelectCourse} onCreateCourse={mockOnCreateCourse} />
    );

    await waitFor(() => {
      expect(getByText('대한민국 제주')).toBeTruthy();
      expect(getByText('일본 도쿄')).toBeTruthy();
    });

    const searchInput = getByTestId('search-input');
    await act(async () => {
      fireEvent.changeText(searchInput, '도쿄');
    });

    await waitFor(() => {
      expect(getByText('일본 도쿄')).toBeTruthy();
      expect(queryByText('대한민국 제주')).toBeNull();
    });
  });

  it('생성된 코스가 없는 경우 Empty State 안내 뷰 및 코스 생성 CTA 버튼이 노출되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue([]);

    const { getByText, getByTestId } = await render(
      <CourseListScreen onSelectCourse={mockOnSelectCourse} onCreateCourse={mockOnCreateCourse} />
    );

    await waitFor(() => {
      expect(getByText('아직 생성된 여행 코스가 없습니다')).toBeTruthy();
      expect(getByTestId('empty-create-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('empty-create-button'));
    expect(mockOnCreateCourse).toHaveBeenCalled();
  });

  it('API 목록 조회 실패 시 재시도 버튼 및 에러 메시지가 표시되고, 재시도 클릭 시 데이터를 다시 요청해야 한다', async () => {
    const apiSpy = jest
      .spyOn(commonApi, 'getCourseListApi')
      .mockRejectedValueOnce(new commonApi.ApiError(500, '서버 오류가 발생했습니다.'))
      .mockResolvedValueOnce(mockCourseList);

    const { getByTestId, getByText } = await render(
      <CourseListScreen onSelectCourse={mockOnSelectCourse} onCreateCourse={mockOnCreateCourse} />
    );

    await waitFor(() => {
      expect(getByText('서버 오류가 발생했습니다.')).toBeTruthy();
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('retry-button'));
    });

    await waitFor(() => {
      expect(getByText('대한민국 제주')).toBeTruthy();
    });

    expect(apiSpy).toHaveBeenCalledTimes(2);
  });
});
