/**
 * @file OnboardingBackNavigation.test.tsx
 * @description Returning users can leave consent and permission guidance without starting another analysis.
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { requestPermissionsAsync } from 'expo-media-library';
import { PhotoConsentScreen } from '../src/screens/PhotoConsentScreen';
import { PhotoAuthExplainScreen } from '../src/screens/PhotoAuthExplainScreen';
import { MBTIConsentScreen } from '../src/screens/MBTIConsentScreen';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

type ScreenCallbacks = {
  onBack?: () => void;
  onNext: () => void;
  onAlternative: () => void;
};

const screens: [string, (callbacks: ScreenCallbacks) => React.ReactElement][] =
  [
    [
      '사진 분석 동의',
      ({ onBack, onNext }) => (
        <PhotoConsentScreen onBack={onBack} onNext={onNext} />
      ),
    ],
    [
      '사진 권한 안내',
      ({ onBack, onNext }) => (
        <PhotoAuthExplainScreen onBack={onBack} onNext={onNext} />
      ),
    ],
    [
      'MBTI 대체 경로',
      ({ onBack, onNext, onAlternative }) => (
        <MBTIConsentScreen
          onBack={onBack}
          onNext={onNext}
          onPhoto={onAlternative}
        />
      ),
    ],
  ];

beforeEach(() => jest.clearAllMocks());

it.each(screens)(
  '%s에서 뒤로가기는 분석이나 다른 경로를 시작하지 않고 진입 화면으로 돌아간다',
  async (_name, createScreen) => {
    const onBack = jest.fn();
    const onNext = jest.fn();
    const onAlternative = jest.fn();
    const screen = await render(
      createScreen({ onBack, onNext, onAlternative }),
    );

    await fireEvent.press(
      screen.getByRole('button', { name: UI_STRINGS.ONBOARDING.BACK }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
    expect(onAlternative).not.toHaveBeenCalled();
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  },
);

it.each(screens)(
  '%s에서 복귀 경로가 없는 최초 온보딩에는 뒤로가기 버튼을 표시하지 않는다',
  async (_name, createScreen) => {
    const screen = await render(
      createScreen({ onNext: jest.fn(), onAlternative: jest.fn() }),
    );

    expect(
      screen.queryByRole('button', { name: UI_STRINGS.ONBOARDING.BACK }),
    ).toBeNull();
  },
);
