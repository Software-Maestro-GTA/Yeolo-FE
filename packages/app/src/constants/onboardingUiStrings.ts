/**
 * @file onboardingUiStrings.ts
 * @description UI v3 onboarding copy and accessibility labels kept together while shared strings remain compatible.
 */
export const ONBOARDING_UI_STRINGS = {
  LOGIN_TITLE: '나도 몰랐던 내 안의\n여행 취향 발견',
  GOOGLE_LOGIN: '구글로 시작하기',
  APPLE_LOGIN: '애플로 시작하기',
  CLOSE: '분석 닫기',
  PRIVACY_BULLET: '×',
  PHOTO_HELP_TITLE: '더 완벽한 여행지를 위해\n전체 접근을 허용해주세요',
  HOME_PHOTO_HELP_TITLE: '더 완벽한 여행지를 위해\n전체 접근을 허용해주세요',
  PHOTO_HELP_DESCRIPTION: '사진은 절대 서버에 저장되지 않아요',
  MBTI_LINK: 'mbti로 알아보기',
  MBTI_REQUIRED: 'MBTI 4개 항목을 모두 선택해 주세요.',
  MBTI_SAVE_ERROR: 'MBTI 저장에 실패했습니다. 다시 시도해 주세요.',
  NOTICE: '알림',
  RETRY: '다시 시도하기',
  LOADING_PROFILE: '여행 취향을 불러오고 있어요',
  PROFILE_FALLBACK: '나의 시그니처 여행 스타일',
  SELECT_PHOTOS_ERROR:
    '사진을 다시 선택할 수 없습니다. 설정에서 사진 권한을 변경해주세요.',
  MBTI_OPTIONS: [
    [
      { letter: 'E', label: 'E, 외향형' },
      { letter: 'I', label: 'I, 내향형' },
    ],
    [
      { letter: 'S', label: 'S, 감각형' },
      { letter: 'N', label: 'N, 직관형' },
    ],
    [
      { letter: 'T', label: 'T, 사고형' },
      { letter: 'F', label: 'F, 감정형' },
    ],
    [
      { letter: 'J', label: 'J, 판단형' },
      { letter: 'P', label: 'P, 인식형' },
    ],
  ],
} as const;
