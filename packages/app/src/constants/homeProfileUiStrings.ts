/**
 * @file homeProfileUiStrings.ts
 * @description UI v3 홈과 프로필 화면의 표시 문구입니다.
 */
export const HOME_PROFILE_UI = {
  brand: '여로',
  greeting: (name: string) => `${name}님의 여행 취향은?`,
  guest: '여행자',
  tasteLead: '사진으로 간단하게',
  taste: '여행 취향 알아보기',
  viewTaste: '내 여행 취향 보기',
  createLead: '쉽고 빠르게',
  create: '여행 코스 생성하기',
  reel: '최근 다녀온 여행지 릴스 제작하기',
  reelLoadError:
    '릴스 정보를 불러오지 못했어요. 버튼을 눌러 다시 시도해 주세요.',
  recent: '최근 생성한 코스',
  allCourses: '코스 전체보기',
  empty: '최근 생성한 코스가 없어요',
  booking: '여행 예약',
  flight: '항공',
  hotel: '숙소',
  ticket: '티켓',
  profile: '프로필',
  back: '뒤로가기',
  delete: '최근 코스 삭제',
  deleteError: '코스를 삭제하지 못했어요. 다시 시도해 주세요.',
  loadError: '최근 코스를 불러오지 못했어요.',
  retry: '다시 시도',
  settings: '설정',
  usage: '이용',
  appInfo: '앱 정보',
  inquiry: '1:1 문의하기',
  instagram: '여로 인스타그램 바로가기',
  instagramError: '인스타그램을 열지 못했어요. 잠시 후 다시 시도해 주세요.',
  withdraw: '탈퇴하기',
  editProfile: '프로필 수정',
} as const;
