/**
 * @file TasteProfileView.tsx
 * @description UI component for visually presenting taste profile analysis following Figma UI v1 design specifications.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TasteProfile } from '@yeolo/common';
import { Ionicons } from '@expo/vector-icons';

export interface TasteProfileViewProps {
  profile: TasteProfile;
}

const PACE_LABELS: Record<string, string> = {
  slow_stay: '느긋한 체류형',
  balanced: '균형형',
  dense_schedule: '빡빡한 일정형',
  spontaneous: '즉흥형',
  long_stay: '장기여행형',
};

const SPENDING_LABELS: Record<string, string> = {
  cost_effective: '가성비형',
  moderate: '중간 소비형',
  luxury: '럭셔리형',
};

const COMPANION_LABELS: Record<string, string> = {
  solo: '혼자 여행형',
  couple: '연인 여행형',
  friends: '친구 여행형',
  family: '가족 여행형',
  with_children: '아이 동반형',
  with_parents: '부모님 동반형',
  group: '단체 여행형',
  with_pet: '반려동물 동반형',
  social: '어울림형',
};

const PURPOSE_LABELS: Record<string, string> = {
  relaxation: '휴양/힐링',
  sightseeing: '관광 탐방',
  culturalExperience: '문화/예술',
  gourmet: '미식 탐험',
  natureExploration: '자연 탐방',
  activity: '액티비티',
  shopping: '쇼핑 선호',
  festivalEvent: '축제/이벤트',
  wellness: '웰니스/명상',
  selfDevelopment: '자기계발',
};

const LOCATION_LABELS: Record<string, string> = {
  bigCity: '대도시 선호',
  smallTownAlley: '소도시/골목',
  natureHinterland: '자연/오지',
  beachResort: '해변/휴양지',
  mountainPlateau: '산악/고원',
  historicalCity: '역사도시',
  themeParkResort: '테마파크',
  famousSpotPreferred: '유명 명소',
  hiddenSpotPreferred: '숨은 명소',
};

const FOOD_LABELS: Record<string, string> = {
  localFoodActive: '현지 음식 적극 체험',
  famousRestaurantCentered: '유명 맛집 탐방',
  streetFood: '길거리 음식',
  cafeDessert: '카페 & 디저트',
  fineDining: '파인다이닝',
  familiarFoodPreferred: '익숙한 음식 선호',
  dietaryRestriction: '식단 고려',
  sightseeingOverFood: '관광 중시',
};

const SEASON_LABELS: Record<string, string> = {
  warm_region: '따뜻한 지역',
  cold_region: '추운 지역',
  summer_resort: '여름 휴양',
  winter_sports: '겨울 스포츠',
  spring_flower_autumn_foliage: '봄꽃·가을 단풍',
  dry_weather: '건조한 날씨',
  off_season: '비수기 여행',
  peak_season: '성수기 여행',
};

export const TasteProfileView: React.FC<TasteProfileViewProps> = ({ profile }) => {
  const renderTraitBar = (label: string, score: number = 3, index: number) => {
    const percentage = Math.min(Math.max(Math.round((score / 5) * 100), 0), 100);
    // Alternate bar colors between purple (#4648D4) and mint (#4EDEA3) per Figma design
    const barColor = index % 2 === 0 ? '#4648D4' : '#4EDEA3';

    return (
      <View key={label} style={styles.traitRow}>
        <View style={styles.traitHeader}>
          <Text style={styles.traitLabel}>{label}</Text>
          <Text style={[styles.traitPercentage, { color: barColor }]}>
            {percentage}%
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${percentage}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderSection = (
    title: string,
    dataObj: Record<string, number | undefined>,
    labelsMap: Record<string, string>
  ) => {
    const entries = Object.entries(dataObj || {})
      .filter(([, val]) => typeof val === 'number' && val > 0)
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .slice(0, 3); // Show top 4 items for clean layout

    if (entries.length === 0) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        {entries.map(([key, score], idx) =>
          renderTraitBar(labelsMap[key] || key, score, idx)
        )}
      </View>
    );
  };

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Icon Badge */}
      <View style={styles.headerSection}>
        <View style={styles.iconOverlay}>
          <Ionicons name="sparkles" size={28} color="#4648D4" />
        </View>
      </View>


      {/* 2. Core Style Badges */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>핵심 여행 키워드</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgePrimary}>
            <Text style={styles.badgePrimaryText}>
              {PACE_LABELS[profile.travelPaceDensity] || profile.travelPaceDensity}
            </Text>
          </View>
          <View style={styles.badgeSecondary}>
            <Text style={styles.badgeSecondaryText}>
              {COMPANION_LABELS[profile.companionType] || profile.companionType}
            </Text>
          </View>
          <View style={styles.badgeAccent}>
            <Text style={styles.badgeAccentText}>
              {SPENDING_LABELS[profile.spendingTendency] || profile.spendingTendency}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Trait Bars Section (Figma Design) */}
      {renderSection(
        '여행 성향 분석',
        profile.travelPurpose as Record<string, number | undefined>,
        PURPOSE_LABELS
      )}

      {renderSection(
        '선호 장소 유형',
        profile.preferredLocationType as Record<string, number | undefined>,
        LOCATION_LABELS
      )}

      {renderSection(
        '음식 취향',
        profile.foodPreference as Record<string, number | undefined>,
        FOOD_LABELS
      )}

      {/* 4. Seasonal Tags */}
      {Array.isArray(profile.seasonalEnvironmentPreference) &&
        profile.seasonalEnvironmentPreference.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>계절 및 환경 취향</Text>
            <View style={styles.tagWrap}>
              {profile.seasonalEnvironmentPreference.map((item) => (
                <View key={item} style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>
                    {SEASON_LABELS[item] || item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 150, // Space to scroll past floating button (56px) and bottom nav (64px)
    gap: 20,
  },


  headerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  iconOverlay: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(225, 224, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  personaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#030612',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },
  personaSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#45464C',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#1A1F2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePrimary: {
    backgroundColor: '#4648D4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgePrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  badgeSecondary: {
    backgroundColor: '#4EDE A3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeSecondaryText: {
    color: '#030612',
    fontWeight: '600',
    fontSize: 14,
  },
  badgeAccent: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeAccentText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#1A1F2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171C1F',
    marginBottom: 16,
  },
  traitRow: {
    marginBottom: 14,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  traitLabel: {
    fontSize: 14,
    color: '#45464C',
    fontWeight: '500',
  },
  traitPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#EAEFF2',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 9999,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagBadgeText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
});
