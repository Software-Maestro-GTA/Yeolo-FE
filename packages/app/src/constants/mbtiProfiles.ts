/**
 * @file mbtiProfiles.ts
 * @description MBTI별 화면용 여행 소개와 세 가지 여행 스타일 바의 편집 예시를 정의합니다.
 */
export type MbtiType = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`;

/** 측정 점수가 아닌 여행 스타일 바의 다섯 단계 표시 위치입니다. */
export type MbtiSpectrumPosition = -50 | -25 | 0 | 25 | 50;

interface MbtiProfile {
  summary: string;
  tags: string;
  spectra: {
    /** 음수: 미리 계획, 양수: 현장 선택 */
    planningStyle: MbtiSpectrumPosition;
    /** 음수: 여유롭게, 양수: 촘촘하게 */
    itineraryDensity: MbtiSpectrumPosition;
    /** 음수: 조용하게, 양수: 활기차게 */
    travelAtmosphere: MbtiSpectrumPosition;
  };
}

/**
 * MBTI 유형을 소재로 작성한 화면 전용 편집 예시입니다.
 * 검증된 MBTI 특성이나 개인의 측정 결과가 아니며, 취향 데이터로 저장하거나 API에 전송하지 않습니다.
 */
export const MBTI_PROFILES: Record<MbtiType, MbtiProfile> = {
  INFJ: {
    summary: '머물 곳을 미리 골라\n조용히 쉬어 가는 타입',
    tags: '#미리준비 #느긋하게 #차분하게',
    spectra: {
      planningStyle: -25,
      itineraryDensity: -50,
      travelAtmosphere: -25,
    },
  },
  INFP: {
    summary: '마음이 이끄는 곳에서\n느긋하게 머무는 타입',
    tags: '#그때그때 #느린여행 #고요하게',
    spectra: {
      planningStyle: 25,
      itineraryDensity: -50,
      travelAtmosphere: -50,
    },
  },
  INTJ: {
    summary: '관심 있는 곳을 골라\n차분히 깊이 둘러보는 타입',
    tags: '#계획여행 #여유동선 #조용하게',
    spectra: {
      planningStyle: -50,
      itineraryDensity: -25,
      travelAtmosphere: -50,
    },
  },
  INTP: {
    summary: '호기심 가는 곳을 따라\n새로운 장면을 찾는 타입',
    tags: '#자유선택 #느긋하게 #차분하게',
    spectra: {
      planningStyle: 25,
      itineraryDensity: -25,
      travelAtmosphere: -25,
    },
  },
  ISFJ: {
    summary: '익숙한 동선을 준비해\n편안하게 쉬어 가는 타입',
    tags: '#미리준비 #편안한일정 #고요하게',
    spectra: {
      planningStyle: -25,
      itineraryDensity: -25,
      travelAtmosphere: -50,
    },
  },
  ISFP: {
    summary: '끌리는 길로 발길을 돌려\n여유롭게 쉬어 가는 타입',
    tags: '#즉흥여행 #쉬엄쉬엄 #차분하게',
    spectra: {
      planningStyle: 50,
      itineraryDensity: -50,
      travelAtmosphere: -25,
    },
  },
  ISTJ: {
    summary: '준비한 일정에 맞춰\n차근차근 여행하는 타입',
    tags: '#계획여행 #알찬동선 #차분하게',
    spectra: {
      planningStyle: -50,
      itineraryDensity: 25,
      travelAtmosphere: -25,
    },
  },
  ISTP: {
    summary: '그날 끌리는 곳을 찾아\n내 속도로 둘러보는 타입',
    tags: '#현장선택 #적당한일정 #차분하게',
    spectra: {
      planningStyle: 50,
      itineraryDensity: 0,
      travelAtmosphere: -25,
    },
  },
  ENFJ: {
    summary: '함께 갈 곳을 미리 정해\n여유롭게 어울리는 타입',
    tags: '#함께계획 #느긋하게 #즐겁게',
    spectra: {
      planningStyle: -25,
      itineraryDensity: -25,
      travelAtmosphere: 25,
    },
  },
  ENFP: {
    summary: '그날의 끌림을 따라\n느긋하게 어울리는 타입',
    tags: '#즉흥여행 #여유롭게 #활기차게',
    spectra: {
      planningStyle: 50,
      itineraryDensity: -25,
      travelAtmosphere: 50,
    },
  },
  ENTJ: {
    summary: '가보고 싶은 곳을 정해\n하루를 알차게 즐기는 타입',
    tags: '#미리계획 #꽉찬일정 #활기차게',
    spectra: {
      planningStyle: -50,
      itineraryDensity: 50,
      travelAtmosphere: 25,
    },
  },
  ENTP: {
    summary: '새로운 재미를 찾아\n다양한 곳을 누비는 타입',
    tags: '#자유선택 #알찬하루 #활기차게',
    spectra: {
      planningStyle: 25,
      itineraryDensity: 25,
      travelAtmosphere: 25,
    },
  },
  ESFJ: {
    summary: '함께할 일정을 준비해\n쉬고 즐기며 어울리는 타입',
    tags: '#미리준비 #균형일정 #함께즐겨요',
    spectra: {
      planningStyle: -25,
      itineraryDensity: 0,
      travelAtmosphere: 25,
    },
  },
  ESFP: {
    summary: '눈앞의 즐거움을 따라\n신나게 곳곳을 누비는 타입',
    tags: '#현장선택 #알찬하루 #신나게',
    spectra: {
      planningStyle: 50,
      itineraryDensity: 25,
      travelAtmosphere: 50,
    },
  },
  ESTJ: {
    summary: '여행 동선을 미리 짜서\n하루를 알차게 채우는 타입',
    tags: '#계획여행 #알찬하루',
    spectra: {
      planningStyle: -50,
      itineraryDensity: 50,
      travelAtmosphere: 0,
    },
  },
  ESTP: {
    summary: '재미있는 곳을 발견하면\n바로 움직여 즐기는 타입',
    tags: '#즉흥여행 #꽉찬일정 #활기차게',
    spectra: {
      planningStyle: 50,
      itineraryDensity: 50,
      travelAtmosphere: 25,
    },
  },
};
