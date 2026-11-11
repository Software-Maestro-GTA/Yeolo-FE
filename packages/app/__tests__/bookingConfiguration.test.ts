/**
 * @file bookingConfiguration.test.ts
 * @description Ensures partner credentials never enter the public Expo configuration.
 */
const resolveConfig = require('../app.config');

test('파트너 키를 앱에 노출하지 않고 다른 Expo 설정을 보존한다', () => {
  const previous = process.env.MY_REAL_TRIP_API_KEY;
  try {
    process.env.MY_REAL_TRIP_API_KEY = 'test-key-not-a-secret';
    const config = resolveConfig({
      config: { extra: { existing: true, myRealTripApiKey: 'legacy-key' } },
    });
    expect(config.extra).toEqual({ existing: true });
    expect(JSON.stringify(config)).not.toContain('test-key-not-a-secret');
    expect(JSON.stringify(config)).not.toContain('legacy-key');
  } finally {
    if (previous === undefined) delete process.env.MY_REAL_TRIP_API_KEY;
    else process.env.MY_REAL_TRIP_API_KEY = previous;
  }
});
