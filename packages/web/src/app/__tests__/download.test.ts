/**
 * @file download.test.ts
 * @description 다운로드 링크의 iOS·Android·데스크톱 및 iPad 데스크톱 모드 분기 검증
 */

import { getDownloadUrl } from '@/lib/download';

describe('다운로드 링크 이동 대상', () => {
  it.each([
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5],
    ['iPad', 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', 5],
    ['iPod', 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)', 5],
    [
      '데스크톱 모드 iPad',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
      5,
    ],
  ])('%s는 App Store로 이동한다', (_name, userAgent, maxTouchPoints) => {
    expect(getDownloadUrl({ userAgent, maxTouchPoints })).toBe(
      'https://apps.apple.com/kr/app/id6796231811',
    );
  });

  it.each([
    [
      'Android 휴대폰',
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
    ],
    [
      'Android 태블릿',
      'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
    ],
  ])('%s는 Google Play로 이동한다', (_name, userAgent) => {
    expect(getDownloadUrl({ userAgent, maxTouchPoints: 5 })).toBe(
      'https://play.google.com/store/apps/details?id=com.yeolo.app',
    );
  });

  it.each([
    [
      'macOS',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
      0,
    ],
    ['Windows 터치 PC', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 10],
    ['Linux', 'Mozilla/5.0 (X11; Linux x86_64)', 0],
    ['알 수 없는 기기', '', 0],
  ])('%s는 홈페이지로 이동한다', (_name, userAgent, maxTouchPoints) => {
    expect(getDownloadUrl({ userAgent, maxTouchPoints })).toBe('/');
  });
});
