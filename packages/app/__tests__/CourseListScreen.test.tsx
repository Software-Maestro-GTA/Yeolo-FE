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
    coverImageUrl:
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
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
    coverImageUrl:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
    startDate: '2026-09-10',
    totalDays: 4,
    tags: ['미식', '쇼핑', '도시'],
    recommendationReason: '미식 중심 코스',
    createdAt: '2026-07-18T14:30:00Z',
  },
];

describe('CourseListScreen UI v3 목록 및 삭제', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-token');
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue(mockCourseList);
  });

  it('실제 목적지, 계산한 날짜와 태그를 목록 카드에 표시하고 검색·생성 배너는 제거한다', async () => {
    const screen = await render(
      <CourseListScreen onCreateCourse={jest.fn()} />,
    );
    await screen.findByTestId('course-card-course-uuid-1');
    expect(screen.getByText('최근 생성한 코스')).toBeTruthy();
    expect(screen.getByText('26.08.01 - 26.08.03')).toBeTruthy();
    expect(screen.getByText('#힐링')).toBeTruthy();
    expect(screen.queryByTestId('search-input')).toBeNull();
    expect(screen.queryByTestId('compact-cta')).toBeNull();
  });

  it('카드 선택과 뒤로 가기를 연결하고 편집중에는 삭제 버튼을 노출한다', async () => {
    const onSelect = jest.fn(),
      onBack = jest.fn();
    const screen = await render(
      <CourseListScreen onSelectCourse={onSelect} onBack={onBack} />,
    );
    await fireEvent.press(
      await screen.findByTestId('course-card-course-uuid-1'),
    );
    expect(onSelect).toHaveBeenCalledWith('course-uuid-1');
    expect(screen.queryByTestId('delete-course-course-uuid-1')).toBeNull();
    await fireEvent.press(screen.getByTestId('toggle-course-edit'));
    expect(screen.getByText('완료')).toBeTruthy();
    expect(screen.getByTestId('delete-course-course-uuid-1')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('toggle-course-edit'));
    expect(screen.queryByTestId('delete-course-course-uuid-1')).toBeNull();
    await fireEvent.press(screen.getByTestId('course-list-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('삭제 아이콘은 코스 요약 확인 모달을 열고 취소는 API를 호출하지 않는다', async () => {
    const deletion = jest
      .spyOn(commonApi, 'deleteCourseApi')
      .mockResolvedValue(undefined);
    const screen = await render(<CourseListScreen />);
    await screen.findByTestId('course-card-course-uuid-1');
    await fireEvent.press(screen.getByTestId('toggle-course-edit'));
    await fireEvent.press(screen.getByTestId('delete-course-course-uuid-1'));
    expect(screen.getByText('이 코스를 삭제할까요?')).toBeTruthy();
    expect(screen.getByTestId('course-delete-summary')).toBeTruthy();
    expect(deletion).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('btn-cancel-delete'));
    expect(screen.queryByTestId('course-delete-modal-card')).toBeNull();
    expect(screen.getByTestId('course-card-course-uuid-1')).toBeTruthy();
    expect(deletion).not.toHaveBeenCalled();
  });

  it('길게 누르기로도 기존 삭제 확인 동선을 유지한다', async () => {
    const screen = await render(<CourseListScreen />);
    await fireEvent(
      await screen.findByTestId('course-card-course-uuid-1'),
      'longPress',
    );
    expect(screen.getByTestId('course-delete-modal-card')).toBeTruthy();
  });

  it('확인 후 삭제 성공 시 목록에서 제거하고 recent storage와 선택 ID를 정리한다', async () => {
    await AsyncStorage.setItem('recentCourseId', 'course-uuid-1');
    const deletion = jest
      .spyOn(commonApi, 'deleteCourseApi')
      .mockResolvedValue(undefined);
    const onDeleted = jest.fn();
    const screen = await render(<CourseListScreen onDeleted={onDeleted} />);
    await fireEvent(
      await screen.findByTestId('course-card-course-uuid-1'),
      'longPress',
    );
    await fireEvent.press(screen.getByTestId('btn-confirm-delete'));
    await waitFor(() =>
      expect(onDeleted).toHaveBeenCalledWith('course-uuid-1'),
    );
    expect(deletion).toHaveBeenCalledWith(
      expect.any(String),
      'mock-token',
      'course-uuid-1',
    );
    expect(screen.queryByTestId('course-card-course-uuid-1')).toBeNull();
    expect(screen.getByTestId('course-card-course-uuid-2')).toBeTruthy();
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('recentCourseId')).toBeNull(),
    );
  });

  it('삭제 실패 시 카드와 저장값을 유지하며 같은 확인 창에서 다시 시도할 수 있다', async () => {
    await AsyncStorage.setItem('recentCourseId', 'course-uuid-1');
    const deletion = jest
      .spyOn(commonApi, 'deleteCourseApi')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    const onDeleted = jest.fn();
    const screen = await render(<CourseListScreen onDeleted={onDeleted} />);
    await fireEvent(
      await screen.findByTestId('course-card-course-uuid-1'),
      'longPress',
    );
    await fireEvent.press(screen.getByTestId('btn-confirm-delete'));
    await screen.findByText('offline');
    expect(screen.getByTestId('course-card-course-uuid-1')).toBeTruthy();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('recentCourseId')).toBe('course-uuid-1');
    await fireEvent.press(screen.getByTestId('btn-confirm-delete'));
    await waitFor(() =>
      expect(onDeleted).toHaveBeenCalledWith('course-uuid-1'),
    );
    expect(deletion).toHaveBeenCalledTimes(2);
  });

  it('다른 코스를 삭제해도 최근 코스 저장값은 보존한다', async () => {
    await AsyncStorage.setItem('recentCourseId', 'course-uuid-2');
    jest.spyOn(commonApi, 'deleteCourseApi').mockResolvedValue(undefined);
    const onDeleted = jest.fn();
    const screen = await render(<CourseListScreen onDeleted={onDeleted} />);
    await fireEvent(
      await screen.findByTestId('course-card-course-uuid-1'),
      'longPress',
    );
    await fireEvent.press(screen.getByTestId('btn-confirm-delete'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(await AsyncStorage.getItem('recentCourseId')).toBe('course-uuid-2');
  });

  it('빈 목록에서는 새 코스 생성으로 이동한다', async () => {
    jest.spyOn(commonApi, 'getCourseListApi').mockResolvedValue([]);
    const onCreate = jest.fn();
    const screen = await render(<CourseListScreen onCreateCourse={onCreate} />);
    await screen.findByText('아직 저장된 코스가 없어요');
    await fireEvent.press(screen.getByTestId('empty-create-button'));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
  it('삭제 요청 중에는 중복 확인과 닫기를 막는다', async () => {
    let finishDelete!: () => void;
    const deletion = jest.spyOn(commonApi, 'deleteCourseApi').mockReturnValue(
      new Promise<void>((resolve) => {
        finishDelete = resolve;
      }),
    );
    const screen = await render(<CourseListScreen />);
    await fireEvent(
      await screen.findByTestId('course-card-course-uuid-1'),
      'longPress',
    );
    await fireEvent.press(screen.getByTestId('btn-confirm-delete'));
    await waitFor(() => expect(deletion).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByTestId('btn-confirm-delete').props.accessibilityState
          .disabled,
      ).toBe(true),
    );
    await fireEvent.press(screen.getByTestId('btn-confirm-delete'));
    await fireEvent.press(screen.getByTestId('btn-cancel-delete'));
    expect(deletion).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('course-delete-modal-card')).toBeTruthy();
    await act(async () => finishDelete());
    await waitFor(() =>
      expect(screen.queryByTestId('course-delete-modal-card')).toBeNull(),
    );
  });

  it('목록 오류 뒤 재시도로 실제 코스를 다시 표시한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseListApi')
      .mockRejectedValueOnce(new Error('목록 연결 오류'))
      .mockResolvedValueOnce(mockCourseList);
    const screen = await render(<CourseListScreen />);
    await screen.findByText('목록 연결 오류');
    await fireEvent.press(screen.getByTestId('retry-button'));
    await screen.findByTestId('course-card-course-uuid-1');
    expect(screen.queryByTestId('retry-button')).toBeNull();
  });
});
