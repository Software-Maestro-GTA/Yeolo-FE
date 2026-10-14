/**
 * @file OnboardingScreens.test.tsx
 * @description UI v3 permission gates, settings resume, and fixed MBTI result actions.
 */
import React from 'react';
import { AppState, Linking, type AppStateStatus } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { getPermissionsAsync } from 'expo-media-library';
import { PhotoAuthExplainScreen } from '../src/screens/PhotoAuthExplainScreen';
import { MBTIConsentScreen } from '../src/screens/MBTIConsentScreen';
import { MBTIResultScreen } from '../src/screens/MBTIResultScreen';
import { MBTI_PROFILES, type MbtiType } from '../src/constants/mbtiProfiles';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

const permission = getPermissionsAsync as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  permission.mockResolvedValue({
    status: 'granted',
    accessPrivileges: 'limited',
  });
});
afterEach(() => jest.restoreAllMocks());

it.each([
  ['limited', 'granted'],
  ['none', 'denied'],
])('access %s cannot start analysis', async (accessPrivileges, status) => {
  permission.mockResolvedValue({ status, accessPrivileges });
  const next = jest.fn();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  await fireEvent.press(screen.getByText(UI_STRINGS.PHOTO_AUTH.START));
  await waitFor(() => expect(permission).toHaveBeenCalledTimes(2));
  expect(next).not.toHaveBeenCalled();
  expect(screen.getByText(UI_STRINGS.PHOTO_AUTH.REQUIRED)).toBeTruthy();
});

it('opens settings, refreshes on resume, and waits for an explicit start tap', async () => {
  let resume!: (state: AppStateStatus) => void;
  const remove = jest.fn();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      resume = listener;
      return { remove };
    });
  const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  const next = jest.fn();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  await fireEvent.press(screen.getByText(UI_STRINGS.PHOTO_AUTH.OPEN_SETTINGS));
  expect(open).toHaveBeenCalledTimes(1);
  permission.mockResolvedValue({ status: 'granted', accessPrivileges: 'all' });
  await act(async () => resume('active'));
  expect(screen.getByText(UI_STRINGS.PHOTO_AUTH.READY)).toBeTruthy();
  expect(next).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(UI_STRINGS.PHOTO_AUTH.START));
  expect(next).toHaveBeenCalledTimes(1);
  await screen.unmount();
  expect(remove).toHaveBeenCalled();
});

it('rechecks a revoked permission even if the initial check was full', async () => {
  permission.mockResolvedValueOnce({
    status: 'granted',
    accessPrivileges: 'all',
  });
  const next = jest.fn();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  expect(screen.getByText(UI_STRINGS.PHOTO_AUTH.READY)).toBeTruthy();
  await fireEvent.press(screen.getByText(UI_STRINGS.PHOTO_AUTH.START));
  expect(next).not.toHaveBeenCalled();
});

it('permission check and settings failures remain recoverable in the same screen', async () => {
  permission.mockRejectedValue(new Error('native error'));
  jest
    .spyOn(Linking, 'openSettings')
    .mockRejectedValue(new Error('settings error'));
  const next = jest.fn();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  await fireEvent.press(screen.getByText(UI_STRINGS.PHOTO_AUTH.START));
  expect(
    screen.getByText(UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR),
  ).toBeTruthy();
  expect(next).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(UI_STRINGS.PHOTO_AUTH.OPEN_SETTINGS));
  expect(screen.getByText(UI_STRINGS.PHOTO_AUTH.SETTINGS_ERROR)).toBeTruthy();
});

it('MBTI consent offers MBTI and photo permission actions', async () => {
  const onNext = jest.fn();
  const onPhoto = jest.fn();
  const screen = await render(
    <MBTIConsentScreen onNext={onNext} onPhoto={onPhoto} />,
  );
  await fireEvent.press(screen.getByText(UI_STRINGS.MBTI_CONSENT.START));
  await fireEvent.press(screen.getByText(UI_STRINGS.MBTI_CONSENT.PHOTO));
  expect(onNext).toHaveBeenCalledTimes(1);
  expect(onPhoto).toHaveBeenCalledTimes(1);
});

it.each(Object.keys(MBTI_PROFILES) as MbtiType[])(
  'shows a fixed %s result and both exits',
  async (mbti) => {
    const onCourse = jest.fn();
    const onPhoto = jest.fn();
    const onBack = jest.fn();
    const screen = await render(
      <MBTIResultScreen
        mbti={mbti}
        onGenerateCourse={onCourse}
        onPhoto={onPhoto}
        onBack={onBack}
      />,
    );
    expect(
      screen.getByText(`${mbti} ${UI_STRINGS.MBTI_RESULT.TITLE}`),
    ).toBeTruthy();
    expect(screen.getByText(MBTI_PROFILES[mbti].summary)).toBeTruthy();
    await fireEvent.press(screen.getByText(UI_STRINGS.MBTI_RESULT.COURSE));
    await fireEvent.press(
      screen.getByText(UI_STRINGS.MBTI_RESULT.PHOTO_ACTION),
    );
    await fireEvent.press(screen.getByText(UI_STRINGS.ONBOARDING.BACK));
    expect(onCourse).toHaveBeenCalledTimes(1);
    expect(onPhoto).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  },
);
