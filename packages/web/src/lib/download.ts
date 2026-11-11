/**
 * @file download.ts
 * @description 다운로드 링크 접속 기기에 따른 앱 스토어 및 홈페이지 주소 선택
 */

export const APP_STORE_URL = 'https://apps.apple.com/kr/app/id6796231811';
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.yeolo.app';

/** 브라우저의 기기 정보를 받아 이동할 스토어 또는 홈페이지 주소를 반환합니다. */
export function getDownloadUrl(
  device: Pick<Navigator, 'userAgent' | 'maxTouchPoints'>,
): string {
  const { userAgent, maxTouchPoints } = device;
  const isIPadDesktopMode = /Macintosh/i.test(userAgent) && maxTouchPoints > 1;

  if (/iPhone|iPad|iPod/i.test(userAgent) || isIPadDesktopMode) {
    return APP_STORE_URL;
  }

  if (/Android/i.test(userAgent)) {
    return PLAY_STORE_URL;
  }

  return '/';
}
