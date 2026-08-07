/**
 * @file CourseShareScreen.test.tsx
 * @description Unit tests for CourseShareScreen component matching Figma UI specifications.
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithQueryClient as render } from './test-utils';
import { CourseShareScreen } from '../src/screens/CourseShareScreen';
import { AuthContext } from '../src/context';

describe('CourseShareScreen (Figma 공유 수신 및 로그인 요청)', () => {
  it('로그인 상태일 때 코스 카드와 코스 저장/거절 버튼이 정상 렌더링되고 로그인 바텀시트가 표시되지 않아야 한다', async () => {
    const mockAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      user: { uid: 'user-1', email: 'test@yeolo.com', displayName: '김선규' },
      login: jest.fn(),
      logout: jest.fn(),
    };

    const { findByTestId, findByText, queryByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <CourseShareScreen />
      </AuthContext.Provider>
    );

    expect(await findByTestId('course-share-screen')).toBeTruthy();
    expect(await findByText('공유된 여행 코스')).toBeTruthy();
    expect(await findByTestId('inviter-card')).toBeTruthy();
    expect(await findByTestId('course-card')).toBeTruthy();
    expect(await findByTestId('btn-save-course')).toBeTruthy();
    expect(await findByTestId('btn-decline-course')).toBeTruthy();
    expect(queryByTestId('login-bottom-sheet')).toBeNull();
  });

  it('미로그인(게스트) 상태일 때 딤 오버레이 및 로그인 요청 바텀시트(Google, Apple 로그인 버튼)가 표시되어야 한다', async () => {
    const mockGuestAuthContext = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    };

    const { findByTestId, findByText } = await render(
      <AuthContext.Provider value={mockGuestAuthContext as any}>
        <CourseShareScreen />
      </AuthContext.Provider>
    );

    expect(await findByTestId('dim-overlay')).toBeTruthy();
    expect(await findByTestId('login-bottom-sheet')).toBeTruthy();
    expect(await findByText('로그인이 필요합니다')).toBeTruthy();
    expect(await findByTestId('btn-google-login')).toBeTruthy();
    expect(await findByTestId('btn-apple-login')).toBeTruthy();
  });

  it('코스 저장 버튼 및 거절 버튼 클릭 시 해당 콜백이 호출되어야 한다', async () => {
    const mockSaveSuccess = jest.fn();
    const mockDecline = jest.fn();
    const mockAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      user: { uid: 'user-1' },
    };

    const { findByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <CourseShareScreen onSaveSuccess={mockSaveSuccess} onDecline={mockDecline} />
      </AuthContext.Provider>
    );

    const btnSave = await findByTestId('btn-save-course');
    fireEvent.press(btnSave);
    expect(mockSaveSuccess).toHaveBeenCalledTimes(1);

    const btnDecline = await findByTestId('btn-decline-course');
    fireEvent.press(btnDecline);
    expect(mockDecline).toHaveBeenCalledTimes(1);
  });
});
