/**
 * @file HomeScreen.tsx
 * @description Main dashboard landing screen displaying AI course recommendations, quick feature shortcuts, and user greeting.
 * @requirements REQ-11, REQ-9
 * @functional FUN-1, FUN-3, FUN-4
 * @author Antigravity Agent
 */
import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';

export interface HomeScreenProps {
  onNavigateToCreate?: () => void;
  onNavigateToExplore?: () => void;
  onNavigateToProfile?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToCreate,
  onNavigateToExplore,
  onNavigateToProfile,
}) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const displayName = user?.displayName || UI_STRINGS.HOME.GUEST;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greetingTitle}>
              {UI_STRINGS.HOME.GREETING} <Text style={styles.highlightName}>{displayName}{UI_STRINGS.HOME.HONORIFIC_NIM}</Text> 👋
            </Text>
            <Text style={styles.greetingSubtitle}>
              {UI_STRINGS.HOME.GREETING_SUBTITLE}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onNavigateToProfile}
            activeOpacity={0.8}
          >
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Banner Card: AI Course Generation CTA */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
            <Text style={styles.heroBadgeText}>{UI_STRINGS.HOME.HERO_BADGE}</Text>
          </View>

          <Text style={styles.heroTitle}>{UI_STRINGS.HOME.CREATE_BUTTON}</Text>
          <Text style={styles.heroDescription}>
            {UI_STRINGS.HOME.HERO_DESCRIPTION}
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={onNavigateToCreate}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color={theme.colors.text.inverse} style={styles.heroButtonIcon} />
            <Text style={styles.heroButtonText}>{UI_STRINGS.HOME.HERO_BUTTON}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Shortcut Buttons Grid */}
        <Text style={styles.sectionTitle}>{UI_STRINGS.HOME.SECTION_TITLE}</Text>
        <View style={styles.shortcutGrid}>
          {/* 1. AI 코스 탐색 */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={onNavigateToExplore}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <Ionicons name="compass-outline" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.shortcutTitle}>{UI_STRINGS.HOME.SHORTCUT_EXPLORE_TITLE}</Text>
            <Text style={styles.shortcutSub}>{UI_STRINGS.HOME.SHORTCUT_EXPLORE_SUB}</Text>
          </TouchableOpacity>

          {/* 2. 내 취향 프로필 */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={onNavigateToProfile}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <Ionicons name="options-outline" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.shortcutTitle}>{UI_STRINGS.HOME.SHORTCUT_PROFILE_TITLE}</Text>
            <Text style={styles.shortcutSub}>{UI_STRINGS.HOME.SHORTCUT_PROFILE_SUB}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.input,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextGroup: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  highlightName: {
    color: theme.colors.primary,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: theme.colors.text.subtle,
    fontWeight: '500',
  },
  avatarButton: {
    marginLeft: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border.active,
  },
  heroCard: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  heroDescription: {
    fontSize: 13,
    color: theme.colors.text.subtle,
    lineHeight: 19,
    marginBottom: 18,
  },
  heroButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  heroButtonIcon: {
    marginRight: 6,
  },
  heroButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  shortcutGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: theme.colors.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  shortcutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  shortcutSub: {
    fontSize: 12,
    color: theme.colors.text.placeholder,
  },
  themeCardList: {
    gap: 12,
  },
  themeCard: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  themeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeTagPrimary: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  themeTagPrimaryText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  themeTagSecondary: {
    backgroundColor: theme.colors.status.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  themeTagSecondaryText: {
    color: theme.colors.status.success,
    fontSize: 11,
    fontWeight: '700',
  },
  themeDuration: {
    fontSize: 12,
    color: theme.colors.text.placeholder,
    fontWeight: '500',
  },
  themeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  themeSubtitle: {
    fontSize: 13,
    color: theme.colors.text.subtle,
    lineHeight: 18,
  },
});
