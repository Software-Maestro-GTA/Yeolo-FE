/**
 * @file OnboardingScreens.test.tsx
 * @description 플랫폼별 사진 권한 안내와 권한 흐름, 16개 MBTI 여행 스타일·결과 화면 액션을 검증합니다.
 */
import React from 'react';
import { AppState, Linking, Platform, type AppStateStatus } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { getPermissionsAsync } from 'expo-media-library';
import { PhotoAuthExplainScreen } from '../src/screens/PhotoAuthExplainScreen';
import { MBTIConsentScreen } from '../src/screens/MBTIConsentScreen';
import { MBTIResultScreen } from '../src/screens/MBTIResultScreen';
import { MBTI_PROFILES, type MbtiType } from '../src/constants/mbtiProfiles';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

// Expo maps all images to 1 in Jest; unique sources detect platform image mix-ups.
jest.mock('../assets/ui-v3-onboarding/android-settings-app.png', () => ({
  uri: 'android-settings-app.png',
}));
jest.mock(
  '../assets/ui-v3-onboarding/android-settings-permissions.png',
  () => ({
    uri: 'android-settings-permissions.png',
  }),
);
jest.mock('../assets/ui-v3-onboarding/android-settings-photos.png', () => ({
  uri: 'android-settings-photos.png',
}));
jest.mock('../assets/ui-v3-onboarding/settings-search.png', () => ({
  uri: 'settings-search.png',
}));
jest.mock('../assets/ui-v3-onboarding/settings-photos.png', () => ({
  uri: 'settings-photos.png',
}));
jest.mock('../assets/ui-v3-onboarding/settings-access.png', () => ({
  uri: 'settings-access.png',
}));

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
  ['ios', 'limited', 'granted'],
  ['ios', 'none', 'denied'],
  ['android', 'limited', 'granted'],
  ['android', 'none', 'denied'],
] as const)(
  '%s with %s access offers only the settings CTA and opens settings',
  async (platform, accessPrivileges, status) => {
    permission.mockResolvedValue({ status, accessPrivileges });
    jest.replaceProperty(Platform, 'OS', platform);
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const next = jest.fn();
    const screen = await render(<PhotoAuthExplainScreen onNext={next} />);

    expect(open).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole('button', { name: '권한 설정으로 이동' }),
    );

    expect(open).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(
      screen.queryByText('전체 사진 접근을 허용한 뒤 다시 눌러주세요.'),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: '권한 설정으로 이동' }),
    ).not.toHaveProp(
      'accessibilityHint',
      '전체 사진 접근을 허용한 뒤 다시 눌러주세요.',
    );
    expect(screen.queryByText(UI_STRINGS.PHOTO_AUTH.START)).toBeNull();
    expect(
      screen.getAllByRole('button', { name: '권한 설정으로 이동' }),
    ).toHaveLength(1);
  },
);

it('shows the captured Android permission steps and opens app settings from each step', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  const screen = await render(<PhotoAuthExplainScreen onNext={jest.fn()} />);
  const steps = [
    '여로 앱 정보에서 ‘권한’ 선택',
    '앱 권한에서 ‘사진 및 동영상’ 선택',
    '‘항상 모두 허용’ 선택',
  ];
  const images = [
    require('../assets/ui-v3-onboarding/android-settings-app.png'),
    require('../assets/ui-v3-onboarding/android-settings-permissions.png'),
    require('../assets/ui-v3-onboarding/android-settings-photos.png'),
  ];

  for (const [index, step] of steps.entries()) {
    expect(screen.getByText(step)).toBeTruthy();
    expect(
      screen.getByTestId(`photo-permission-step-image-${index}`),
    ).toHaveProp('source', images[index]);
    await fireEvent.press(
      screen.getByRole('button', {
        name: `${step}. ${UI_STRINGS.PHOTO_AUTH.OPEN_SETTINGS}`,
      }),
    );
  }
  expect(open).toHaveBeenCalledTimes(3);
  expect(screen.queryByText(UI_STRINGS.PHOTO_AUTH.IOS_STEPS[0])).toBeNull();
});

it('keeps the iOS permission screenshots and instructions', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const screen = await render(<PhotoAuthExplainScreen onNext={jest.fn()} />);
  const images = [
    require('../assets/ui-v3-onboarding/settings-search.png'),
    require('../assets/ui-v3-onboarding/settings-photos.png'),
    require('../assets/ui-v3-onboarding/settings-access.png'),
  ];

  for (const [index, step] of UI_STRINGS.PHOTO_AUTH.IOS_STEPS.entries()) {
    expect(screen.getByText(step)).toBeTruthy();
    expect(
      screen.getByTestId(`photo-permission-step-image-${index}`),
    ).toHaveProp('source', images[index]);
  }
  expect(screen.queryByText('‘항상 모두 허용’ 선택')).toBeNull();
});

it.each([
  ['limited', 'granted'],
  ['none', 'denied'],
])('access %s cannot start analysis', async (accessPrivileges, status) => {
  permission.mockResolvedValue({ status, accessPrivileges });
  const next = jest.fn();
  const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  await fireEvent.press(screen.getByText('권한 설정으로 이동'));
  expect(open).toHaveBeenCalledTimes(1);
  expect(next).not.toHaveBeenCalled();
});

it('keeps selected-photo analysis unavailable after returning from settings with limited access', async () => {
  let resume!: (state: AppStateStatus) => void;
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      resume = listener;
      return { remove: jest.fn() };
    });
  const next = jest.fn();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  await act(async () => resume('active'));
  expect(next).not.toHaveBeenCalled();
  expect(screen.queryByText('선택한 사진으로 다시 분석')).toBeNull();
  expect(screen.queryByText(UI_STRINGS.PHOTO_AUTH.START)).toBeNull();
  expect(screen.getByText('권한 설정으로 이동')).toBeTruthy();
});

it('switches to settings after permission is revoked while away', async () => {
  let resume!: (state: AppStateStatus) => void;
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      resume = listener;
      return { remove: jest.fn() };
    });
  permission.mockResolvedValue({ status: 'granted', accessPrivileges: 'all' });
  const next = jest.fn();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  expect(screen.getByText(UI_STRINGS.PHOTO_AUTH.START)).toBeTruthy();
  expect(screen.queryByText('권한 설정으로 이동')).toBeNull();
  permission.mockResolvedValue({ status: 'denied', accessPrivileges: 'none' });
  await act(async () => resume('active'));
  expect(screen.queryByText(UI_STRINGS.PHOTO_AUTH.START)).toBeNull();
  expect(screen.getByText('권한 설정으로 이동')).toBeTruthy();
  expect(next).not.toHaveBeenCalled();
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
  await fireEvent.press(
    screen.getByRole('button', {
      name: '권한 설정으로 이동',
    }),
  );
  expect(open).toHaveBeenCalledTimes(1);
  permission.mockResolvedValue({ status: 'granted', accessPrivileges: 'all' });
  await act(async () => resume('active'));
  expect(
    screen.getByRole('button', { name: UI_STRINGS.PHOTO_AUTH.START }),
  ).toHaveProp('accessibilityHint', UI_STRINGS.PHOTO_AUTH.READY);
  expect(next).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(UI_STRINGS.PHOTO_AUTH.START));
  expect(next).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('권한 설정으로 이동')).toBeNull();
  await screen.unmount();
  expect(remove).toHaveBeenCalled();
});

it('rechecks a revoked permission even if the initial check was full', async () => {
  permission.mockResolvedValueOnce({
    status: 'granted',
    accessPrivileges: 'all',
  });
  const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  const next = jest.fn();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  expect(
    screen.getByRole('button', { name: UI_STRINGS.PHOTO_AUTH.START }),
  ).toHaveProp('accessibilityHint', UI_STRINGS.PHOTO_AUTH.READY);
  await fireEvent.press(screen.getByText(UI_STRINGS.PHOTO_AUTH.START));
  expect(next).not.toHaveBeenCalled();
  expect(open).toHaveBeenCalledTimes(1);
  expect(screen.getByText('권한 설정으로 이동')).toBeTruthy();
});

it('permission check and settings failures remain recoverable in the same screen', async () => {
  permission.mockRejectedValue(new Error('native error'));
  jest
    .spyOn(Linking, 'openSettings')
    .mockRejectedValue(new Error('settings error'));
  const next = jest.fn();
  const screen = await render(<PhotoAuthExplainScreen onNext={next} />);
  expect(
    screen.getByText(UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR),
  ).toBeTruthy();
  expect(next).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', {
      name: '권한 설정으로 이동',
    }),
  );
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
    for (const label of [
      '계획 방식',
      '계획',
      '즉흥',
      '일정 밀도',
      '여유',
      '촘촘',
      '여행 분위기',
      '고요',
      '활기',
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText('사진 취향')).toBeNull();
    expect(screen.queryByText('날씨 취향')).toBeNull();
    expect(screen.getByText(UI_STRINGS.MBTI_RESULT.SOURCE)).toBeTruthy();
    await fireEvent.press(screen.getByText(UI_STRINGS.MBTI_RESULT.COURSE_CTA));
    await fireEvent.press(
      screen.getByText(UI_STRINGS.MBTI_RESULT.PHOTO_ACTION),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: UI_STRINGS.ONBOARDING.BACK }),
    );
    expect(onCourse).toHaveBeenCalledTimes(1);
    expect(onPhoto).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  },
);

it('updates all three spectra when the MBTI result changes', async () => {
  const actions = {
    onGenerateCourse: jest.fn(),
    onPhoto: jest.fn(),
    onBack: jest.fn(),
  };
  const screen = await render(<MBTIResultScreen mbti='INFP' {...actions} />);
  expect(screen.getByLabelText('계획 방식, 계획 / 즉흥, 25')).toBeTruthy();
  expect(screen.getByLabelText('일정 밀도, 여유 / 촘촘, -50')).toBeTruthy();
  expect(screen.getByLabelText('여행 분위기, 고요 / 활기, -50')).toBeTruthy();

  await screen.rerender(<MBTIResultScreen mbti='ESTJ' {...actions} />);

  expect(screen.getByText(MBTI_PROFILES.ESTJ.summary)).toBeTruthy();
  expect(screen.queryByText(MBTI_PROFILES.INFP.summary)).toBeNull();
  expect(screen.getByLabelText('계획 방식, 계획 / 즉흥, -50')).toBeTruthy();
  expect(screen.getByLabelText('일정 밀도, 여유 / 촘촘, 50')).toBeTruthy();
  expect(screen.getByLabelText('여행 분위기, 고요 / 활기, 0')).toBeTruthy();
});
