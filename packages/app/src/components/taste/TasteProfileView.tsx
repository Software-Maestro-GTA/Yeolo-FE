/**
 * @file TasteProfileView.tsx
 * @description Modern, premium UI component for visually presenting taste profile analysis with gradient progress bars and hero cards matching Figma UI specifications.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TasteProfile } from '@yeolo/common';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface TasteProfileViewProps {
  profile: TasteProfile;
  onReanalyze?: () => void;
}

const PACE_LABELS: Record<string, string> = {
  RELAXED: '여유로운',
  BALANCED: '균형잡힌',
  BUSY: '빽빽한',
};
const SPENDING_LABELS: Record<string, string> = {
  BUDGET: '가성비',
  MODERATE: '적정',
  LUXURY: '럭셔리',
};
const COMPANION_LABELS: Record<string, string> = {
  SOLO: '혼자',
  COUPLE: '커플',
  FAMILY: '가족',
  FRIENDS: '친구',
};
const PURPOSE_LABELS: Record<string, string> = {
  GOURMET: '미식형',
  HEALING: '휴양형',
  NATURE: '자연 탐방형',
  CULTURE: '문화 탐방형',
};
const LOCATION_LABELS: Record<string, string> = {
  BEACH: '해변·휴양지',
  CITY: '대도시',
  NATURE: '자연·비경',
  SMALL_TOWN: '소도시',
};
const FOOD_LABELS: Record<string, string> = {
  LOCAL: '현지 로컬 푸드',
  CAFE: '카페·디저트',
  GOURMET: '유명 맛집',
};
const SEASON_LABELS: Record<string, string> = {
  WARM: '따뜻한 지역 선호',
  COOL: '시원한 지역 선호',
  ALL: '사계절 무관',
};

export const TasteProfileView: React.FC<TasteProfileViewProps> = ({
  profile,
  onReanalyze,
}) => {
  const renderTraitBar = (label: string, score: number = 3, index: number) => {
    const formattedScore = Math.min(Math.max(score, 1), 5).toFixed(1);
    const percentage = Math.min(
      Math.max(Math.round((score / 5) * 100), 0),
      100,
    );

    const gradientColors =
      index % 2 === 0
        ? (['#8B5CF6', '#6366F1'] as const)
        : (['#10B981', '#34D399'] as const);
    const accentTextColor = index % 2 === 0 ? '#7C3AED' : '#059669';

    return (
      <View key={label} style={styles.traitRow}>
        <View style={styles.traitHeader}>
          <View style={styles.labelContainer}>
            <View
              style={[styles.bulletDot, { backgroundColor: accentTextColor }]}
            />
            <Text style={styles.traitLabel}>{label}</Text>
          </View>
          <Text style={[styles.traitPercentage, { color: accentTextColor }]}>
            {formattedScore} <Text style={styles.traitScoreMax}>/ 5</Text>
          </Text>
        </View>
        <View style={styles.barTrack}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${percentage}%` }]}
          />
        </View>
      </View>
    );
  };

  const renderSection = (
    title: string,
    dataObj: Record<string, number | undefined>,
    labelsMap: Record<string, string>,
    iconName: keyof typeof Ionicons.glyphMap,
  ) => {
    const entries = Object.entries(dataObj || {})
      .filter(([, val]) => typeof val === 'number' && val > 0)
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .slice(0, 3);

    if (entries.length === 0) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleIconContainer}>
            <Ionicons name={iconName} size={18} color={theme.colors.primary} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {entries.map(([key, score], idx) =>
          renderTraitBar(labelsMap[key] || key, score, idx),
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* 1. Premium Hero Persona Card with Natural Top-Right Reanalyze Button */}
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={['#EEF2FF', '#F5F3FF', '#F0FDFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}>
          {onReanalyze && (
            <TouchableOpacity
              testID='btn-reanalyze-icon'
              style={styles.topRightScrollButton}
              onPress={onReanalyze}
              activeOpacity={0.75}>
              <Ionicons
                name='refresh-outline'
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}

          <View style={styles.heroIconBadge}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIconGradient}>
              <Ionicons name='sparkles' size={24} color='#FFFFFF' />
            </LinearGradient>
          </View>

          <Text style={styles.heroSubtitle}>AI 취향 분석 리포트</Text>
          <Text style={styles.heroTitle}>나의 시그니처 여행 스타일</Text>
        </LinearGradient>
      </View>

      {/* 2. Unified Core Travel Keywords Section (Friendly Title) */}
      {(() => {
        const EXCLUDED_KEYS = [
          'solo',
          'moderate',
          'medium',
          '혼자 여행형',
          '중간소비형',
          '중간 소비형',
        ];

        const rawKeywords: { key: string; label: string }[] = [];

        if (profile.travelPaceDensity) {
          rawKeywords.push({
            key: profile.travelPaceDensity,
            label:
              PACE_LABELS[profile.travelPaceDensity] ||
              profile.travelPaceDensity,
          });
        }
        if (profile.companionType) {
          rawKeywords.push({
            key: profile.companionType,
            label:
              COMPANION_LABELS[profile.companionType] || profile.companionType,
          });
        }
        if (profile.spendingTendency) {
          rawKeywords.push({
            key: profile.spendingTendency,
            label:
              SPENDING_LABELS[profile.spendingTendency] ||
              profile.spendingTendency,
          });
        }
        if (Array.isArray(profile.seasonalEnvironmentPreference)) {
          profile.seasonalEnvironmentPreference.forEach((item) => {
            rawKeywords.push({
              key: item,
              label: SEASON_LABELS[item] || item,
            });
          });
        }

        const validKeywords = rawKeywords.filter(
          (k) =>
            !EXCLUDED_KEYS.includes(k.key) && !EXCLUDED_KEYS.includes(k.label),
        );

        if (validKeywords.length === 0) return null;

        return (
          <View style={styles.summaryCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleIconContainer}>
                <Ionicons
                  name='sparkles-outline'
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.cardTitle}>한눈에 보는 나의 취향</Text>
            </View>

            <View style={styles.badgeRow}>
              {validKeywords.map((item, idx) => {
                if (idx % 3 === 0) {
                  return (
                    <LinearGradient
                      key={`${item.key}-${idx}`}
                      colors={['#8B5CF6', '#6366F1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.badgePillGradientPrimary}>
                      <Text style={styles.badgeTextLight}>{item.label}</Text>
                    </LinearGradient>
                  );
                }
                if (idx % 3 === 1) {
                  return (
                    <LinearGradient
                      key={`${item.key}-${idx}`}
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.badgePillGradientSecondary}>
                      <Text style={styles.badgeTextLight}>{item.label}</Text>
                    </LinearGradient>
                  );
                }
                return (
                  <View
                    key={`${item.key}-${idx}`}
                    style={styles.badgeOutlinePill}>
                    <Text style={styles.badgeOutlineText}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })()}

      {/* 3. Trait Bars Sections with Friendly UX Copywriting */}
      {renderSection(
        '내가 여행을 떠나는 이유',
        profile.travelPurpose as Record<string, number | undefined>,
        PURPOSE_LABELS,
        'flag-outline',
      )}

      {renderSection(
        '마음이 끌리는 공간',
        profile.preferredLocationType as Record<string, number | undefined>,
        LOCATION_LABELS,
        'map-outline',
      )}

      {renderSection(
        '즐거운 미식 스펙트럼',
        profile.foodPreference as Record<string, number | undefined>,
        FOOD_LABELS,
        'restaurant-outline',
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 16,
  },

  heroWrapper: {
    marginBottom: 4,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
    position: 'relative',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  topRightScrollButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  heroIconBadge: {
    marginBottom: 12,
  },
  heroIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  summaryCard: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePillGradientPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  badgePillGradientSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeTextLight: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  badgeOutlinePill: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border.active,
  },
  badgeOutlineText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitleIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  card: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  traitRow: {
    marginBottom: 14,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  traitLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  traitPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  traitScoreMax: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.subtle,
  },
  barTrack: {
    height: 10,
    backgroundColor: '#F0F4F9',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 9999,
  },
});
