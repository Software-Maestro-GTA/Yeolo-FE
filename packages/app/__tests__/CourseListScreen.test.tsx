/**
 * @file CourseListScreen.test.tsx
 * @description Unit and integration tests for CourseListScreen and CourseDeleteModal matching Figma UI specifications.
 */
import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { CourseListScreen } from '../src/screens/CourseListScreen';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithQueryClient as render } from './test-utils';

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

describe('CourseListScreen (FUN-7: 이전 생성 코스 목록 조회, 삭제 모달 및 상세 이동)', () => {
  const mockOnSelectCourse = jest.fn();
  const mockOnCreateCourse = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-token');
  });

  it('이전 생성 코스 목록 API 데이터 조회 후 Figma UI 스펙 요소들이 올바르게 렌더링되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByText, getByTestId } = await render(
      <CourseListScreen
        onSelectCourse={mockOnSelectCourse}
        onCreateCourse={mockOnCreateCourse}
      />,
    );

    await waitFor(() => {
      expect(getByText('2박 3일 서귀포 감성 가득 힐링 코스')).toBeTruthy();
      expect(getByText('도쿄 3박 4일 미식 & 쇼핑 투어')).toBeTruthy();
    });

    expect(getByTestId('compact-cta')).toBeTruthy();
    expect(getByText('새로운 맞춤형 일정이 필요할 땐?')).toBeTruthy();
    expect(getByTestId('search-input')).toBeTruthy();
  });

  it('코스 카드 클릭 시 해당 코스 상세 화면(onSelectCourse)으로 내비게이션 이벤트가 발생해야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByTestId, getByText } = await render(
      <CourseListScreen
        onSelectCourse={mockOnSelectCourse}
        onCreateCourse={mockOnCreateCourse}
      />,
    );

    await waitFor(() => {
      expect(getByText('2박 3일 서귀포 감성 가득 힐링 코스')).toBeTruthy();
    });

    const card1 = getByTestId('course-card-course-uuid-1');
    fireEvent.press(card1);

    expect(mockOnSelectCourse).toHaveBeenCalledWith('course-uuid-1');
  });

  it('삭제 아이콘 클릭 또는 코스 카드 길게 누르기(longPress) 시 코스 삭제 확인 바텀시트 모달(CourseDeleteModal)이 오픈되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByTestId, getByText, queryByTestId } = await render(
      <CourseListScreen
        onSelectCourse={mockOnSelectCourse}
        onCreateCourse={mockOnCreateCourse}
      />,
    );

    await waitFor(() => {
      expect(getByText('2박 3일 서귀포 감성 가득 힐링 코스')).toBeTruthy();
    });

    expect(queryByTestId('course-delete-modal-card')).toBeNull();

    // 1. Long Press event test on card
    const card1 = getByTestId('course-card-course-uuid-1');
    fireEvent(card1, 'longPress');

    await waitFor(() => {
      expect(getByTestId('course-delete-modal-card')).toBeTruthy();
      expect(getByText('코스를 삭제하시겠습니까?')).toBeTruthy();
    });

    const cancelBtn = getByTestId('btn-cancel-delete');
    fireEvent.press(cancelBtn);

    await waitFor(() => {
      expect(queryByTestId('course-delete-modal-card')).toBeNull();
    });
  });

  it('코스 삭제 모달에서 삭제하기 클릭 시 API-COURSE-4(deleteCourseApi)를 호출하고 목록을 갱신해야 한다', async () => {
    const mockDeleteApi = jest
      .spyOn(commonApi, 'deleteCourseApi' as any)
      .mockResolvedValue(undefined);
    const getCourseListSpy = jest
      .spyOn(commonApi, 'getCourseListApi')
      .mockResolvedValueOnce(mockCourseList)
      .mockResolvedValueOnce([mockCourseList[1]]);

    const { getByTestId, getByText, queryByText } = await render(
      <CourseListScreen
        onSelectCourse={mockOnSelectCourse}
        onCreateCourse={mockOnCreateCourse}
      />,
    );

    await waitFor(() => {
      expect(getByText('2박 3일 서귀포 감성 가득 힐링 코스')).toBeTruthy();
    });

    // Long Press card to trigger delete modal
    const card1 = getByTestId('course-card-course-uuid-1');
    fireEvent(card1, 'longPress');

    await waitFor(() => {
      expect(getByTestId('course-delete-modal-card')).toBeTruthy();
    });

    // Confirm deletion
    const confirmBtn = getByTestId('btn-confirm-delete');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    await waitFor(() => {
      expect(mockDeleteApi).toHaveBeenCalledWith(
        expect.any(String),
        'mock-token',
        'course-uuid-1',
      );
    });
  });

  it('검색 바에 검색어 입력 시 해당하는 코스 카드만 필터링되어 노출되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByTestId, getByText, queryByText } = await render(
      <CourseListScreen
        onSelectCourse={mockOnSelectCourse}
        onCreateCourse={mockOnCreateCourse}
      />,
    );

    await waitFor(() => {
      expect(getByText('2박 3일 서귀포 감성 가득 힐링 코스')).toBeTruthy();
      expect(getByText('도쿄 3박 4일 미식 & 쇼핑 투어')).toBeTruthy();
    });

    const searchInput = getByTestId('search-input');
    await act(async () => {
      fireEvent.changeText(searchInput, '도쿄');
    });

    await waitFor(() => {
      expect(getByText('도쿄 3박 4일 미식 & 쇼핑 투어')).toBeTruthy();
      expect(queryByText('2박 3일 서귀포 감성 가득 힐링 코스')).toBeNull();
    });
  });

  it('생성된 코스가 없는 경우 Figma UI 스펙 Empty State 안내 뷰 및 새 코스 생성 CTA 버튼이 노출되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue([]);

    const { getByText, getByTestId } = await render(
      <CourseListScreen
        onSelectCourse={mockOnSelectCourse}
        onCreateCourse={mockOnCreateCourse}
      />,
    );

    await waitFor(() => {
      expect(getByText('아직 저장된 코스가 없어요')).toBeTruthy();
      expect(getByTestId('empty-create-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('empty-create-button'));
    expect(mockOnCreateCourse).toHaveBeenCalled();
  });

  it('검색 바에 검색어 입력 시 우측에 지우기(X) 버튼이 노출되고, 클릭 시 검색어가 초기화되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);

    const { getByTestId, getByText, queryByTestId } = await render(
      <CourseListScreen
        onSelectCourse={mockOnSelectCourse}
        onCreateCourse={mockOnCreateCourse}
      />,
    );

    await waitFor(() => {
      expect(getByText('2박 3일 서귀포 감성 가득 힐링 코스')).toBeTruthy();
    });

    const searchInput = getByTestId('search-input');
    expect(queryByTestId('clear-search-button')).toBeNull();

    // 1. Enter search query "도쿄"
    fireEvent.changeText(searchInput, '도쿄');

    // Clear button should be visible after state update
    await waitFor(() => {
      expect(getByTestId('clear-search-button')).toBeTruthy();
    });

    // 2. Press clear button
    fireEvent.press(getByTestId('clear-search-button'));

    // Search query should be cleared and clear button hidden
    await waitFor(() => {
      expect(queryByTestId('clear-search-button')).toBeNull();
      expect(getByText('2박 3일 서귀포 감성 가득 힐링 코스')).toBeTruthy();
      expect(getByText('도쿄 3박 4일 미식 & 쇼핑 투어')).toBeTruthy();
    });
  });
});
