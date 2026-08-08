/**
 * @file tasteMappings.ts
 * @description DOM-2 taste profile metadata dictionary and mapping utilities.
 */

export interface TasteMetaItem {
  label: string;
  description: string;
  icon?: string;
}

export const TRAVEL_PACE_DENSITY_MAP: Record<string, TasteMetaItem> = {
  slow_stay: {
    label: '느긋한 체류형',
    description: '한 지역에 오래 머무름',
  },
  balanced: {
    label: '균형형',
    description: '관광과 휴식을 적절히 배분',
  },
  dense_schedule: {
    label: '빡빡한 일정형',
    description: '짧은 시간에 많은 장소 방문',
  },
  spontaneous: {
    label: '즉흥형',
    description: '현장에서 일정을 결정',
  },
  long_stay: {
    label: '장기여행형',
    description: '몇 주 이상 머무르며 생활하듯 여행',
  },
};

export const ACTIVITY_PREFERENCE_MAP: Record<string, TasteMetaItem> = {
  viewing: {
    label: '관람형',
    description: '박물관, 미술관, 공연 관람 선호',
  },
  experience: {
    label: '체험형',
    description: '공방, 요리, 전통문화 체험 선호',
  },
  adventure: {
    label: '모험형',
    description: '익스트림 스포츠, 트레킹 선호',
  },
  photographyVideo: {
    label: '사진·영상형',
    description: '사진과 영상 기록 중심 활동 선호',
  },
  gourmetExploration: {
    label: '미식 탐방형',
    description: '맛집, 시장, 카페 탐방 선호',
  },
  nightlife: {
    label: '밤문화형',
    description: '야간 활동과 나이트라이프 선호',
  },
  shopping: {
    label: '쇼핑형',
    description: '쇼핑 활동 선호',
  },
  relaxation: {
    label: '휴식형',
    description: '휴식 중심 활동 선호',
  },
  localInteraction: {
    label: '현지인 교류형',
    description: '현지인과의 교류 및 로컬 경험 선호',
  },
};

export const SEASONAL_ENVIRONMENT_MAP: Record<string, TasteMetaItem> = {
  warm_region: {
    label: '따뜻한 지역 선호형',
    description: '온화하고 따뜻한 기후 선호',
  },
  cold_region: {
    label: '추운 지역 선호형',
    description: '시원하거나 추운 지역 선호',
  },
  summer_resort: {
    label: '여름 휴양형',
    description: '여름 바다와 휴양지 선호',
  },
  winter_sports: {
    label: '겨울 스포츠형',
    description: '설경 및 액티비티 선호',
  },
  spring_flower_autumn_foliage: {
    label: '봄꽃·가을 단풍형',
    description: '계절감을 만끽하는 풍경 선호',
  },
  dry_weather: {
    label: '건조한 날씨 선호형',
    description: '쾌적하고 건조한 날씨 선호',
  },
  off_season: {
    label: '비수기 여행형',
    description: '여유로운 비수기 분위기 선호',
  },
  peak_season: {
    label: '성수기 분위기 선호형',
    description: '활기찬 축제 분위기 선호',
  },
};

export const TRAVEL_PURPOSE_MAP: Record<string, TasteMetaItem> = {
  relaxation: {
    label: '휴양형',
    description: '쉬고 재충전하는 여행',
  },
  sightseeing: {
    label: '관광형',
    description: '유명 명소와 랜드마크 중심',
  },
  culturalExperience: {
    label: '문화체험형',
    description: '역사, 전통, 현지 문화 중심',
  },
  gourmet: {
    label: '미식형',
    description: '음식점, 시장, 카페 탐방 중심',
  },
  natureExploration: {
    label: '자연탐방형',
    description: '산, 바다, 숲, 국립공원 중심',
  },
  activity: {
    label: '액티비티형',
    description: '등산, 서핑, 스키, 다이빙 등',
  },
  shopping: {
    label: '쇼핑형',
    description: '쇼핑몰, 아웃렛, 기념품 중심',
  },
  festivalEvent: {
    label: '축제·이벤트형',
    description: '공연, 스포츠, 지역 축제 중심',
  },
  wellness: {
    label: '웰니스형',
    description: '스파, 요가, 명상, 온천 중심',
  },
  selfDevelopment: {
    label: '자기계발형',
    description: '어학, 워케이션, 교육 프로그램 중심',
  },
};

export const FOOD_PREFERENCE_MAP: Record<string, TasteMetaItem> = {
  localFoodActive: {
    label: '현지 음식 적극 체험형',
    description: '현지 음식을 적극적으로 경험',
  },
  famousRestaurantCentered: {
    label: '유명 맛집 중심형',
    description: '유명 맛집 방문 선호',
  },
  streetFood: {
    label: '길거리 음식형',
    description: '시장과 길거리 음식 선호',
  },
  cafeDessert: {
    label: '카페·디저트형',
    description: '카페와 디저트 탐방 선호',
  },
  fineDining: {
    label: '파인다이닝형',
    description: '고급 레스토랑 경험 선호',
  },
  familiarFoodPreferred: {
    label: '익숙한 음식 선호형',
    description: '새로운 음식보다 익숙한 음식 선호',
  },
  dietaryRestriction: {
    label: '식단 제한형',
    description: '채식, 할랄, 알레르기 등 제한 고려 필요',
  },
  sightseeingOverFood: {
    label: '관광 우선형',
    description: '음식보다 관광을 더 중시',
  },
};

export const PREFERRED_LOCATION_TYPE_MAP: Record<string, TasteMetaItem> = {
  bigCity: {
    label: '대도시형',
    description: '대도시 중심 여행 선호',
    icon: 'grid',
  },
  smallTownAlley: {
    label: '소도시·골목형',
    description: '소도시와 골목 탐방 선호',
    icon: 'compass',
  },
  natureHinterland: {
    label: '자연·오지형',
    description: '자연 중심의 한적한 장소 선호',
    icon: 'feather',
  },
  beachResort: {
    label: '해변·휴양지형',
    description: '바다와 휴양지 중심 여행 선호',
    icon: 'sun',
  },
  mountainPlateau: {
    label: '산악·고원형',
    description: '산악, 고원, 트레킹 지역 선호',
    icon: 'shield',
  },
  historicalCity: {
    label: '역사도시형',
    description: '역사와 문화 자원이 많은 도시 선호',
    icon: 'book-open',
  },
  themeParkResort: {
    label: '테마파크·리조트형',
    description: '테마파크와 복합 리조트 선호',
    icon: 'smile',
  },
  famousSpotPreferred: {
    label: '유명 관광지 선호형',
    description: '검증된 유명 명소 선호',
    icon: 'eye',
  },
  hiddenSpotPreferred: {
    label: '숨은 명소 선호형',
    description: '덜 알려진 장소와 로컬 스팟 선호',
    icon: 'map-pin',
  },
};

/**
 * Extracts Top N entries from a score map object.
 *
 * @param obj Record of string key to number score
 * @param limit Top N count (default 3)
 */
export function getTopScoredItems<T extends string>(
  obj: Partial<Record<T, number>> | undefined,
  limit: number = 3,
): { key: T; score: number }[] {
  if (!obj) return [];
  return (Object.entries(obj) as [T, number | undefined][])
    .filter(
      (entry): entry is [T, number] =>
        typeof entry[1] === 'number' && entry[1] > 0,
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, score]) => ({ key, score }));
}
