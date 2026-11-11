/**
 * @file AppVersionNotice.test.tsx
 * @description Verifies version mismatch guidance, platform store navigation, and store-open retry.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';
import { AppVersionNotice } from '../src/components/common/AppVersionNotice';
import { UI_STRINGS } from '../src/constants/strings';
import { APP_CONFIG } from '../src/constants/config';

let mockMismatch: { status: number } | null = null;
let mockListener: () => void;
jest.mock('../src/services/appVersionService', () => ({
  getVersionMismatch: () => mockMismatch,
  subscribeVersionMismatch: (listener: () => void) => {
    mockListener = listener;
    return () => {};
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockMismatch = null;
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());

it('appears when an API reports a mismatch after the root has mounted', async () => {
  await render(<AppVersionNotice />);
  expect(screen.queryByText(UI_STRINGS.APP_UPDATE.TITLE)).toBeNull();
  await act(() => {
    mockMismatch = { status: 426 };
    mockListener();
  });
  expect(screen.getByText(UI_STRINGS.APP_UPDATE.MESSAGE)).toBeTruthy();
});

it.each([
  ['ios', APP_CONFIG.APP_STORE_URL],
  ['android', APP_CONFIG.PLAY_STORE_URL],
] as const)(
  'opens the %s store for a mismatch retained during startup',
  async (platform, url) => {
    jest.replaceProperty(Platform, 'OS', platform);
    mockMismatch = { status: 426 };
    await render(<AppVersionNotice />);
    await fireEvent.press(
      screen.getByRole('button', { name: UI_STRINGS.APP_UPDATE.OPEN_STORE }),
    );
    expect(Linking.openURL).toHaveBeenCalledWith(url);
    expect(screen.getByText(UI_STRINGS.APP_UPDATE.TITLE)).toBeTruthy();
  },
);

it('allows another store attempt after opening fails', async () => {
  mockMismatch = { status: 426 };
  jest
    .mocked(Linking.openURL)
    .mockRejectedValueOnce(new Error('store unavailable'));
  await render(<AppVersionNotice />);
  await fireEvent.press(
    screen.getByRole('button', { name: UI_STRINGS.APP_UPDATE.OPEN_STORE }),
  );
  expect(
    await screen.findByText(UI_STRINGS.APP_UPDATE.STORE_ERROR),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: UI_STRINGS.APP_UPDATE.OPEN_STORE }),
  );
  await waitFor(() =>
    expect(screen.queryByText(UI_STRINGS.APP_UPDATE.STORE_ERROR)).toBeNull(),
  );
  expect(Linking.openURL).toHaveBeenCalledTimes(2);
});
