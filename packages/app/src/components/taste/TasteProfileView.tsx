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

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface TasteProfileViewProps {
  profile: TasteProfile;
}

const PACE_LABELS: Record<string, string> = UI_STRINGS.TASTE_LABELS.PACE;
const SPENDING_LABELS: Record<string, string> = UI_STRINGS.TASTE_LABELS.SPENDING;
const COMPANION_LABELS: Record<string, string> = UI_STRINGS.TASTE_LABELS.COMPANION;
const PURPOSE_LABELS: Record<string, string> = UI_STRINGS.TASTE_LABELS.PURPOSE;
const LOCATION_LABELS: Record<string, string> = UI_STRINGS.TASTE_LABELS.LOCATION;
const FOOD_LABELS: Record<string, string> = UI_STRINGS.TASTE_LABELS.FOOD;
const SEASON_LABELS: Record<string, string> = UI_STRINGS.TASTE_LABELS.SEASON;

export const TasteProfileView: React.FC<TasteProfileViewProps> = ({ profile }) => {
  const renderTraitBar = (label: string, score: number = 3, index: number) => {
    const percentage = Math.min(Math.max(Math.round((score / 5) * 100), 0), 100);
    // Alternate bar colors between purple (theme.colors.primary) and mint (#4EDEA3) per Figma design
    const barColor = index % 2 === 0 ? theme.colors.primary : '#4EDEA3';

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
          <Ionicons name="sparkles" size={28} color={theme.colors.primary} />
        </View>
      </View>

      {/* 2. Core Style Badges */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>{UI_STRINGS.COMPONENTS.CORE_KEYWORDS_TITLE}</Text>
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
        UI_STRINGS.COMPONENTS.TRAVEL_PURPOSE_TITLE,
        profile.travelPurpose as Record<string, number | undefined>,
        PURPOSE_LABELS
      )}

      {renderSection(
        UI_STRINGS.COMPONENTS.LOCATION_PREFERENCE_TITLE,
        profile.preferredLocationType as Record<string, number | undefined>,
        LOCATION_LABELS
      )}

      {renderSection(
        UI_STRINGS.COMPONENTS.FOOD_PREFERENCE_TITLE,
        profile.foodPreference as Record<string, number | undefined>,
        FOOD_LABELS
      )}

      {/* 4. Seasonal Tags */}
      {Array.isArray(profile.seasonalEnvironmentPreference) &&
        profile.seasonalEnvironmentPreference.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{UI_STRINGS.COMPONENTS.SEASON_ENVIRONMENT_TITLE}</Text>
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
    backgroundColor: theme.colors.bg.screen,
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
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  personaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },
  personaSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: theme.colors.bg.glass,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: theme.colors.shadow,
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
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgePrimaryText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  badgeSecondary: {
    backgroundColor: '#4EDEA3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeSecondaryText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  badgeAccent: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.active,
  },
  badgeAccentText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: theme.colors.bg.glass,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
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
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  traitPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: theme.colors.border.light,
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
    backgroundColor: theme.colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagBadgeText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
