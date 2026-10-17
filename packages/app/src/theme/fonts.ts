/**
 * @file fonts.ts
 * @description UI v3의 Pretendard 정적 글꼴과 굵기별 이름을 정의합니다.
 */
export const appFonts = {
  'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
  'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
  'Pretendard-ExtraBold': require('../../assets/fonts/Pretendard-ExtraBold.otf'),
};

export function fontForWeight(weight: string | number = '400') {
  const value = weight === 'bold' ? 700 : Number(weight);
  if (value >= 800) return 'Pretendard-ExtraBold';
  if (value >= 700) return 'Pretendard-Bold';
  if (value >= 600) return 'Pretendard-SemiBold';
  if (value >= 500) return 'Pretendard-Medium';
  return 'Pretendard-Regular';
}
