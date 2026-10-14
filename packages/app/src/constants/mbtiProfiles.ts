/**
 * @file mbtiProfiles.ts
 * @description Provisional fixed MBTI travel copy; INFJ follows UI v3, other types await final product content.
 */
export type MbtiType = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`;
interface MbtiProfile {
  summary: string;
  tags: string;
  pace: string;
  photo: string;
  weather: string;
}
// Display-only presets, never persisted as photo-derived taste profiles or sent to analysis APIs.
export const MBTI_PROFILES: Record<MbtiType, MbtiProfile> = {
  INFJ: {
    summary: '쉬엄쉬엄 다니면서\n사진은 야무지게 찍는 타입',
    tags: '#여유로운여행 #인생샷 #따뜻한',
    pace: '여유',
    photo: '감성',
    weather: '따뜻한 날씨',
  },
  INFP: {
    summary: '마음에 드는 풍경 앞에서\n오래 머무는 타입',
    tags: '#느린여행 #감성기록',
    pace: '여유',
    photo: '감성',
    weather: '온화한 날씨',
  },
  INTJ: {
    summary: '관심 있는 장소를 골라\n차분하게 둘러보는 타입',
    tags: '#계획여행 #탐구',
    pace: '계획적',
    photo: '기록',
    weather: '선선한 날씨',
  },
  INTP: {
    summary: '호기심 가는 곳을 따라\n새로운 장면을 찾는 타입',
    tags: '#발견 #자유여행',
    pace: '자유롭게',
    photo: '기록',
    weather: '선선한 날씨',
  },
  ISFJ: {
    summary: '편안한 일정 속에서\n소중한 추억을 모으는 타입',
    tags: '#편안한여행 #추억',
    pace: '여유',
    photo: '기록',
    weather: '온화한 날씨',
  },
  ISFP: {
    summary: '아름다운 순간을 만나면\n발걸음을 멈추는 타입',
    tags: '#풍경 #감성여행',
    pace: '여유',
    photo: '감성',
    weather: '따뜻한 날씨',
  },
  ISTJ: {
    summary: '준비한 일정에 맞춰\n차근차근 여행하는 타입',
    tags: '#계획여행 #알찬기록',
    pace: '계획적',
    photo: '기록',
    weather: '온화한 날씨',
  },
  ISTP: {
    summary: '직접 경험하며\n나만의 길을 찾는 타입',
    tags: '#체험 #자유여행',
    pace: '자유롭게',
    photo: '기록',
    weather: '선선한 날씨',
  },
  ENFJ: {
    summary: '함께하는 사람과\n여행의 즐거움을 나누는 타입',
    tags: '#함께여행 #추억',
    pace: '활기차게',
    photo: '감성',
    weather: '따뜻한 날씨',
  },
  ENFP: {
    summary: '새로운 만남과 풍경에\n설레는 타입',
    tags: '#새로운발견 #즉흥여행',
    pace: '자유롭게',
    photo: '감성',
    weather: '따뜻한 날씨',
  },
  ENTJ: {
    summary: '가보고 싶은 곳을 정해\n알차게 즐기는 타입',
    tags: '#알찬여행 #목표달성',
    pace: '빠르게',
    photo: '기록',
    weather: '온화한 날씨',
  },
  ENTP: {
    summary: '낯선 경험을 찾아\n여행에 변화를 더하는 타입',
    tags: '#도전 #발견',
    pace: '활기차게',
    photo: '기록',
    weather: '선선한 날씨',
  },
  ESFJ: {
    summary: '함께 웃는 순간을\n사진으로 남기는 타입',
    tags: '#함께여행 #인생샷',
    pace: '계획적',
    photo: '감성',
    weather: '따뜻한 날씨',
  },
  ESFP: {
    summary: '눈앞의 즐거운 순간을\n마음껏 즐기는 타입',
    tags: '#활기찬여행 #인생샷',
    pace: '활기차게',
    photo: '감성',
    weather: '따뜻한 날씨',
  },
  ESTJ: {
    summary: '여행 동선을 준비해\n하루를 알차게 채우는 타입',
    tags: '#계획여행 #효율적인동선',
    pace: '빠르게',
    photo: '기록',
    weather: '온화한 날씨',
  },
  ESTP: {
    summary: '재미있는 경험을 찾아\n바로 움직이는 타입',
    tags: '#체험여행 #즉흥',
    pace: '활기차게',
    photo: '기록',
    weather: '따뜻한 날씨',
  },
};
