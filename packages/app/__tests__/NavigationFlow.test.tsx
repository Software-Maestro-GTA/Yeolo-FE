/**
 * @file NavigationFlow.test.tsx
 * @description Reproduces back navigation, taste analysis entry, completed creation and share-link flows using isolated screen doubles.
 */
import React from 'react';
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  ToastAndroid,
} from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { NavigationRoot } from '../src/navigation/NavigationRoot';
import { AuthContext, type AuthContextType } from '../src/context/AuthContext';
import { NAV_STEPS, UI_STRINGS } from '../src/constants';
import { getPhotoAccess } from '../src/services/photoPermissionService';
jest.mock('../src/services/photoPermissionService', () => ({
  getPhotoAccess: jest.fn(),
}));

jest.mock('../src/layouts', () => ({
  MainLayout: ({ children }: any) => children,
  OnboardingLayout: ({ children }: any) => children,
}));

jest.mock('../src/screens/HomeScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    HomeScreen: ({
      onNavigateToProfile,
      onNavigateToCreate,
      onNavigateToExplore,
      onSelectCourse,
    }: any) => (
      <>
        <Text>Home route</Text>
        <Button title='Open profile' onPress={onNavigateToProfile} />
        <Button title='Create from home' onPress={onNavigateToCreate} />
        <Button title='Open course list' onPress={onNavigateToExplore} />
        <Button
          title='Open existing course'
          onPress={() => onSelectCourse('existing-course')}
        />
      </>
    ),
  };
});

jest.mock('../src/screens/ProfileScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    ProfileScreen: ({ onEditProfile, onReanalyzeTaste }: any) => (
      <>
        <Text>Profile route</Text>
        <Button title='Edit profile' onPress={onEditProfile} />
        <Button title='Reanalyze taste' onPress={onReanalyzeTaste} />
      </>
    ),
  };
});

jest.mock('../src/screens/ProfileInputScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    ProfileInputScreen: ({ onGoBack, onSaveSuccess }: any) => (
      <>
        <Text>Profile edit route</Text>
        <Button title='Profile edit back' onPress={onGoBack} />
        <Button title='Profile saved' onPress={onSaveSuccess} />
      </>
    ),
  };
});

jest.mock('../src/screens/CourseListScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    CourseListScreen: ({ onCreateCourse }: any) => (
      <>
        <Text>Course list route</Text>
        <Button title='Create from list' onPress={onCreateCourse} />
      </>
    ),
  };
});

jest.mock('../src/screens/CourseCreateScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    CourseCreateScreen: ({ onSubmit, onBack, onPhoto }: any) => (
      <>
        <Text>Create route</Text>
        <Button title='Submit course' onPress={onSubmit} />
        <Button title='Create back' onPress={onBack} />
        <Button title='Analyze taste from creation' onPress={onPhoto} />
      </>
    ),
  };
});

jest.mock('../src/screens/CourseGeneratingScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    CourseGeneratingScreen: ({ onComplete, onReturnToCreate }: any) => (
      <>
        <Text>Generating route</Text>
        <Button
          title='Generation complete'
          onPress={() => onComplete('generated-course')}
        />
        <Button title='Retry creation' onPress={onReturnToCreate} />
      </>
    ),
  };
});

jest.mock('../src/screens/CourseDetailScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    CourseDetailScreen: ({
      courseId,
      onBack,
      initialViewState,
      onViewStateChange,
      onOpenBooking,
    }: any) => (
      <>
        <Text>Detail route: {courseId}</Text>
        <Text>Restored day: {initialViewState?.selectedDay ?? 1}</Text>
        <Text>
          Restored currency: {initialViewState?.currencyMode ?? 'KRW'}
        </Text>
        <Button
          title='Choose second day and local currency'
          onPress={() =>
            onViewStateChange({ selectedDay: 2, currencyMode: 'LOCAL' })
          }
        />
        <Button
          title='Open detail booking'
          onPress={() => onOpenBooking('hotel', { keyword: '도쿄' })}
        />
        <Button title='Detail back' onPress={onBack} />
      </>
    ),
  };
});

jest.mock('../src/screens/CourseShareScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    CourseShareScreen: ({
      shareToken,
      onNavigateToLogin,
      onDecline,
      onSaveSuccess,
    }: any) => (
      <>
        <Text>Share route: {shareToken}</Text>
        <Button title='Login to save share' onPress={onNavigateToLogin} />
        <Button title='Decline share' onPress={onDecline} />
        <Button
          title='Accepted without course ID'
          onPress={() => onSaveSuccess()}
        />
      </>
    ),
  };
});

jest.mock('../src/screens/LoginScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    LoginScreen: ({ onLoginSuccess }: any) => (
      <>
        <Text>Login route</Text>
        <Button
          title='Existing account signed in'
          onPress={() => onLoginSuccess(false)}
        />
      </>
    ),
  };
});

jest.mock('../src/screens/BookingScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    BookingScreen: ({ onBack }: any) => (
      <>
        <Text>Booking route</Text>
        <Button title='Booking back' onPress={onBack} />
      </>
    ),
  };
});
jest.mock('../src/screens/PhotoAuthExplainScreen', () => {
  const React = require('react');
  const { Text, Button } = require('react-native');
  return {
    PhotoAuthExplainScreen: ({ onBack }: any) => (
      <>
        <Text>Photo settings route</Text>
        <Button title='Photo settings back' onPress={onBack} />
      </>
    ),
  };
});
jest.mock('../src/screens/MBTIConsentScreen', () => {
  const React = require('react');
  const { Button } = require('react-native');
  return {
    MBTIConsentScreen: ({ onNext }: any) => (
      <Button title='Choose MBTI' onPress={onNext} />
    ),
  };
});
jest.mock('../src/screens/MBTIResultScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    MBTIResultScreen: ({ onGenerateCourse, onBack }: any) => (
      <>
        <Text>MBTI result route</Text>
        <Button
          title='Generate from MBTI'
          onPress={() => {
            void onGenerateCourse();
          }}
        />
        <Button title='MBTI result back' onPress={onBack} />
      </>
    ),
  };
});
jest.mock('../src/screens/MbtiInputScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    MbtiInputScreen: ({ onNext }: any) => (
      <>
        <Text>MBTI input route</Text>
        <Button title='Select INFJ' onPress={() => onNext('INFJ')} />
      </>
    ),
  };
});
jest.mock('../src/screens/PhotoConsentScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    PhotoConsentScreen: ({ onNext, onBack }: any) => (
      <>
        <Text>Photo consent route</Text>
        <Button title='Grant all photos' onPress={() => onNext('all')} />
        {onBack && <Button title='Photo consent back' onPress={onBack} />}
      </>
    ),
  };
});
jest.mock('../src/screens/TasteAnalysisScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    TasteAnalysisScreen: ({
      mode,
      onClose,
      onFinish,
      onFailureStateChange,
      onChooseMbti,
    }: any) => (
      <>
        <Text>Taste analysis route</Text>
        <Text>Analysis mode: {mode}</Text>
        <Button
          title='Show analysis failure'
          onPress={() => onFailureStateChange?.(true)}
        />
        <Button title='Choose MBTI after failure' onPress={onChooseMbti} />
        {onClose && <Button title='Close taste analysis' onPress={onClose} />}
        <Button
          title='Taste analysis finished'
          onPress={() => onFinish('taste-completed')}
        />
      </>
    ),
  };
});
jest.mock('../src/screens/TasteProfileScreen', () => {
  const React = require('react');
  const { Button, Text } = require('react-native');
  return {
    TasteProfileScreen: ({ onBack, onReanalyze }: any) => (
      <>
        <Text>Taste profile route</Text>
        <Button
          title='Reanalyze result'
          onPress={() => {
            void onReanalyze?.();
          }}
        />
        <Button title='Taste profile back' onPress={onBack} />
      </>
    ),
  };
});

const authenticated = {
  isAuthenticated: true,
  isLoading: false,
  hasCompletedOnboarding: true,
  user: null,
  loginWithGoogle: jest.fn(),
  loginWithApple: jest.fn(),
  logout: jest.fn(),
} satisfies AuthContextType;

type HardwareBackCallback = Parameters<typeof BackHandler.addEventListener>[1];
const backHandlers = new Set<HardwareBackCallback>();
const urlHandlers = new Set<(event: { url: string }) => void>();

async function press(
  screen: Awaited<ReturnType<typeof render>>,
  title: string,
) {
  await fireEvent.press(screen.getByText(title.toUpperCase()));
}

async function hardwareBack() {
  expect(backHandlers.size).toBe(1);
  await act(async () => {
    expect(
      [...backHandlers][0]({
        type: 'hardwareBackPress',
        timeStamp: Date.now(),
      }),
    ).toBe(true);
  });
}

async function openRuntimeShare(token: string) {
  expect(urlHandlers.size).toBe(1);
  await act(async () => {
    urlHandlers.forEach((handler) =>
      handler({ url: `yeolo://invite/${token}` }),
    );
  });
}

describe('NavigationRoot user navigation flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getPhotoAccess).mockReset().mockResolvedValue('all');
    backHandlers.clear();
    urlHandlers.clear();
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(ToastAndroid, 'show').mockImplementation(() => {});
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest
      .spyOn(Linking, 'addEventListener')
      .mockImplementation((_event, handler) => {
        urlHandlers.add(handler);
        return {
          remove: () => {
            urlHandlers.delete(handler);
          },
        } as ReturnType<typeof Linking.addEventListener>;
      });
    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        backHandlers.add(handler);
        return {
          remove: () => {
            backHandlers.delete(handler);
          },
        };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('a first-time user can go back after analysis fails and choose MBTI', async () => {
    const screen = await render(
      <AuthContext.Provider
        value={{ ...authenticated, hasCompletedOnboarding: false }}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Grant all photos');
    await press(screen, 'Show analysis failure');
    await hardwareBack();
    expect(screen.getByText('Photo consent route')).toBeTruthy();
    await press(screen, 'Grant all photos');
    await press(screen, 'Show analysis failure');
    await press(screen, 'Choose MBTI after failure');
    expect(screen.getByText('MBTI input route')).toBeTruthy();
  });

  it.each(['Profile edit back', 'Profile saved'])(
    '%s returns to profile and the next Android back returns home',
    async (returnAction) => {
      const screen = await render(
        <AuthContext.Provider value={authenticated}>
          <NavigationRoot />
        </AuthContext.Provider>,
      );

      await press(screen, 'Open profile');
      await press(screen, 'Edit profile');
      expect(screen.getByText('Profile edit route')).toBeTruthy();
      await press(screen, returnAction);
      expect(screen.getByText('Profile route')).toBeTruthy();

      await hardwareBack();

      expect(screen.getByText('Home route')).toBeTruthy();
      expect(screen.queryByText('Profile edit route')).toBeNull();
    },
  );

  it('Android back from an initial course list falls back to home', async () => {
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot initialStep={NAV_STEPS.COURSE_LIST} />
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Course list route')).toBeTruthy();

    await hardwareBack();

    expect(screen.getByText('Home route')).toBeTruthy();
  });

  it.each([
    ['home', 'Create from home', 'Home route'],
    ['list', 'Create from list', 'Course list route'],
  ])(
    'taste analysis entry returns to creation and preserves the %s origin',
    async (origin, createAction, originScreen) => {
      const screen = await render(
        <AuthContext.Provider value={authenticated}>
          <NavigationRoot />
        </AuthContext.Provider>,
      );
      if (origin === 'list') {
        await press(screen, 'Open course list');
      }
      await press(screen, createAction);
      await press(screen, 'Analyze taste from creation');

      expect(screen.getByText('Photo consent route')).toBeTruthy();
      await press(screen, 'Photo consent back');
      expect(screen.getByText('Create route')).toBeTruthy();

      await press(screen, 'Create back');

      expect(screen.getByText(originScreen)).toBeTruthy();
      expect(screen.queryByText('Photo consent route')).toBeNull();
      expect(screen.queryByText('Create route')).toBeNull();
    },
  );

  it.each([
    ['home', 'Create from home', 'Home route'],
    ['list', 'Create from list', 'Course list route'],
  ])(
    'completed generation started from %s returns to its origin instead of the submitted form',
    async (origin, createAction, originScreen) => {
      const screen = await render(
        <AuthContext.Provider value={authenticated}>
          <NavigationRoot />
        </AuthContext.Provider>,
      );
      if (origin === 'list') {
        await press(screen, 'Open course list');
      }
      await press(screen, createAction);
      await press(screen, 'Submit course');
      expect(screen.getByText('Generating route')).toBeTruthy();
      await press(screen, 'Generation complete');
      expect(screen.getByText('Detail route: generated-course')).toBeTruthy();

      await press(screen, 'Detail back');

      expect(screen.getByText(originScreen)).toBeTruthy();
      expect(screen.queryByText('Create route')).toBeNull();
      expect(screen.queryByText('Generating route')).toBeNull();
    },
  );

  it('back from a runtime share link restores the screen open before the link', async () => {
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Open profile');
    expect(screen.getByText('Profile route')).toBeTruthy();

    await openRuntimeShare('runtime-profile-share');
    expect(screen.getByText('Share route: runtime-profile-share')).toBeTruthy();
    await hardwareBack();

    expect(screen.getByText('Profile route')).toBeTruthy();
    await hardwareBack();
    expect(screen.getByText('Home route')).toBeTruthy();
  });

  it('sign-in required by a runtime share link resumes that same token', async () => {
    const screen = await render(
      <AuthContext.Provider
        value={{ ...authenticated, isAuthenticated: false }}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Login route')).toBeTruthy();
    await openRuntimeShare('resume-after-login');
    expect(screen.getByText('Share route: resume-after-login')).toBeTruthy();
    await press(screen, 'Login to save share');
    expect(screen.getByText('Login route')).toBeTruthy();

    await screen.rerender(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Existing account signed in');

    expect(screen.getByText('Share route: resume-after-login')).toBeTruthy();
    expect(screen.queryByText('Home route')).toBeNull();
  });

  it('losing authentication returns to login and clears protected back history', async () => {
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Open profile');
    await press(screen, 'Edit profile');

    await screen.rerender(
      <AuthContext.Provider
        value={{ ...authenticated, isAuthenticated: false }}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Login route')).toBeTruthy();
    await hardwareBack();
    expect(screen.getByText('Login route')).toBeTruthy();
    expect(screen.queryByText('Profile edit route')).toBeNull();
    expect(screen.queryByText('Profile route')).toBeNull();
  });

  it('a declined launch link is not replayed when authentication changes', async () => {
    jest
      .mocked(Linking.getInitialURL)
      .mockResolvedValue('yeolo://invite/declined-launch-share');
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Share route: declined-launch-share')).toBeTruthy();
    await press(screen, 'Decline share');
    expect(screen.getByText('Home route')).toBeTruthy();

    await screen.rerender(
      <AuthContext.Provider
        value={{ ...authenticated, isAuthenticated: false }}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    expect(Linking.getInitialURL).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Share route: declined-launch-share')).toBeNull();
    expect(screen.getByText('Login route')).toBeTruthy();
  });

  it.each([
    ['all', 'full'],
    ['limited', 'limited'],
  ] as const)(
    'result reanalysis checks current %s access and skips settings with %s analysis',
    async (access, mode) => {
      jest.mocked(getPhotoAccess).mockResolvedValue(access);
      const screen = await render(
        <AuthContext.Provider value={authenticated}>
          <NavigationRoot initialStep={NAV_STEPS.TASTE_PROFILE} />
        </AuthContext.Provider>,
      );
      await press(screen, 'Reanalyze result');
      expect(getPhotoAccess).toHaveBeenCalledTimes(1);
      expect(screen.getByText(`Analysis mode: ${mode}`)).toBeTruthy();
      expect(screen.queryByText('Photo settings route')).toBeNull();
      await press(screen, 'Close taste analysis');
      expect(screen.getByText('Taste profile route')).toBeTruthy();
      jest.mocked(getPhotoAccess).mockResolvedValue('denied');
      await press(screen, 'Reanalyze result');
      expect(getPhotoAccess).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Photo settings route')).toBeTruthy();
      expect(screen.queryByText('Taste analysis route')).toBeNull();
      await press(screen, 'Photo settings back');
      expect(screen.getByText('Taste profile route')).toBeTruthy();
    },
  );

  it('permission check failure keeps the result and allows a retry', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest
      .mocked(getPhotoAccess)
      .mockRejectedValueOnce(new Error('permission unavailable'));
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot initialStep={NAV_STEPS.TASTE_PROFILE} />
      </AuthContext.Provider>,
    );
    await press(screen, 'Reanalyze result');
    expect(screen.getByText('Taste profile route')).toBeTruthy();
    expect(screen.queryByText('Taste analysis route')).toBeNull();
    expect(alert).toHaveBeenCalledWith(
      UI_STRINGS.ONBOARDING.ERROR_TITLE,
      UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR,
    );
    await press(screen, 'Reanalyze result');
    expect(screen.getByText('Taste analysis route')).toBeTruthy();
  });

  it('duplicate reanalysis presses share one permission check and ignore its result after leaving', async () => {
    let resolveAccess!: (value: 'all') => void;
    jest.mocked(getPhotoAccess).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAccess = resolve;
        }),
    );
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot initialStep={NAV_STEPS.TASTE_PROFILE} />
      </AuthContext.Provider>,
    );
    await press(screen, 'Reanalyze result');
    await press(screen, 'Reanalyze result');
    expect(getPhotoAccess).toHaveBeenCalledTimes(1);
    await press(screen, 'Taste profile back');
    expect(screen.getByText('Home route')).toBeTruthy();
    await act(async () => {
      resolveAccess('all');
    });
    expect(screen.getByText('Home route')).toBeTruthy();
    expect(screen.queryByText('Taste analysis route')).toBeNull();
  });

  it('closing a profile reanalysis returns to profile', async () => {
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Open profile');
    await press(screen, 'Reanalyze taste');
    await press(screen, 'Grant all photos');
    expect(screen.getByText('Taste analysis route')).toBeTruthy();

    await press(screen, 'Close taste analysis');

    expect(screen.getByText('Profile route')).toBeTruthy();
    await hardwareBack();
    expect(screen.getByText('Home route')).toBeTruthy();
  });

  it('back after completed profile reanalysis skips the photo permission flow', async () => {
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Open profile');
    await press(screen, 'Reanalyze taste');
    await press(screen, 'Grant all photos');
    await press(screen, 'Taste analysis finished');
    expect(screen.getByText('Taste profile route')).toBeTruthy();

    await press(screen, 'Taste profile back');

    expect(screen.getByText('Profile route')).toBeTruthy();
    expect(screen.queryByText('Photo consent route')).toBeNull();
    await hardwareBack();
    expect(screen.getByText('Home route')).toBeTruthy();
  });

  it('a delayed onboarding save cannot navigate after leaving its MBTI result', async () => {
    let finishOnboarding!: () => void;
    const setHasCompletedOnboarding = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishOnboarding = resolve;
        }),
    );
    const screen = await render(
      <AuthContext.Provider
        value={{ ...authenticated, setHasCompletedOnboarding }}>
        <NavigationRoot initialStep={NAV_STEPS.MBTI_CONSENT} />
      </AuthContext.Provider>,
    );
    await press(screen, 'Choose MBTI');
    await press(screen, 'Select INFJ');
    await press(screen, 'Generate from MBTI');
    expect(setHasCompletedOnboarding).toHaveBeenCalledWith(true);
    await press(screen, 'MBTI result back');
    expect(screen.getByText('MBTI input route')).toBeTruthy();

    await act(async () => {
      finishOnboarding();
    });

    expect(screen.getByText('MBTI input route')).toBeTruthy();
    expect(screen.queryByText('Create route')).toBeNull();
  });

  it('restores the selected course day and currency after a booking visit', async () => {
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Open existing course');
    expect(screen.getByText('Detail route: existing-course')).toBeTruthy();
    expect(screen.getByText('Restored day: 1')).toBeTruthy();
    expect(screen.getByText('Restored currency: KRW')).toBeTruthy();
    await press(screen, 'Choose second day and local currency');

    await press(screen, 'Open detail booking');
    expect(screen.getByText('Booking route')).toBeTruthy();
    await press(screen, 'Booking back');

    expect(screen.getByText('Detail route: existing-course')).toBeTruthy();
    expect(screen.getByText('Restored day: 2')).toBeTruthy();
    expect(screen.getByText('Restored currency: LOCAL')).toBeTruthy();
  });

  it('an accepted share without a course ID opens the list instead of the previous course', async () => {
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Open existing course');
    expect(screen.getByText('Detail route: existing-course')).toBeTruthy();
    await openRuntimeShare('accepted-without-id');
    expect(screen.getByText('Share route: accepted-without-id')).toBeTruthy();

    await press(screen, 'Accepted without course ID');

    expect(screen.getByText('Course list route')).toBeTruthy();
    expect(screen.queryByText('Detail route: existing-course')).toBeNull();
  });

  it('back after retrying course generation returns home instead of duplicating the creation form', async () => {
    const screen = await render(
      <AuthContext.Provider value={authenticated}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await press(screen, 'Create from home');
    await press(screen, 'Submit course');
    expect(screen.getByText('Generating route')).toBeTruthy();
    await press(screen, 'Retry creation');
    expect(screen.getByText('Create route')).toBeTruthy();

    await press(screen, 'Create back');

    expect(screen.getByText('Home route')).toBeTruthy();
    expect(screen.queryByText('Create route')).toBeNull();
    expect(screen.queryByText('Generating route')).toBeNull();
  });

  it('Android back on initial onboarding cannot bypass it into the course list', async () => {
    const screen = await render(
      <AuthContext.Provider
        value={{ ...authenticated, hasCompletedOnboarding: false }}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Photo consent route')).toBeTruthy();

    await hardwareBack();

    expect(screen.getByText('Photo consent route')).toBeTruthy();
    expect(screen.queryByText('Course list route')).toBeNull();
    expect(screen.queryByText('Home route')).toBeNull();
  });
});
