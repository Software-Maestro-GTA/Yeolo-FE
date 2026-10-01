/**
 * @file bookingConfiguration.test.ts
 * @description Verifies the existing MY_REAL_TRIP_API_KEY reaches Expo's app configuration.
 */
const resolveConfig = require('../app.config');

test('기존 환경변수 이름을 Expo extra에 연결하고 다른 설정을 보존한다', () => {
  const previous = process.env.MY_REAL_TRIP_API_KEY;
  try {
    process.env.MY_REAL_TRIP_API_KEY = 'test-key-not-a-secret';
    const config = resolveConfig({ config: { extra: { existing: true } } });
    expect(config.extra).toEqual({
      existing: true,
      myRealTripApiKey: 'test-key-not-a-secret',
    });
    delete process.env.MY_REAL_TRIP_API_KEY;
    expect(resolveConfig({ config: {} }).extra.myRealTripApiKey).toBe('');
  } finally {
    if (previous === undefined) delete process.env.MY_REAL_TRIP_API_KEY;
    else process.env.MY_REAL_TRIP_API_KEY = previous;
  }
});
