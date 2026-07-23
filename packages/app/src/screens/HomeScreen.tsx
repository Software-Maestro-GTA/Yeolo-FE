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
import { AuthContext } from '../context/AuthContext';

export interface HomeScreenProps {
  onNavigateToCreate?: () => void;
  onNavigateToExplore?: () => void;
  onNavigateToProfile?: () => void;
}

export default function HomeScreen({
  onNavigateToCreate,
  onNavigateToExplore,
  onNavigateToProfile,
}: HomeScreenProps) {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const displayName = user?.displayName || '여행자';

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
              반가워요, <Text style={styles.highlightName}>{displayName}님!</Text> 👋
            </Text>
            <Text style={styles.greetingSubtitle}>
              오늘 어떤 특별한 여행을 떠나볼까요?
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
                <Ionicons name="person" size={20} color="#4648D4" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Banner Card: AI Course Generation CTA */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color="#4648D4" />
            <Text style={styles.heroBadgeText}>AI 초개인화 엔진</Text>
          </View>

          <Text style={styles.heroTitle}>나만을 위한 맞춤 코스 생성</Text>
          <Text style={styles.heroDescription}>
            여행 성향과 목적지에 맞춰 최적의 일정 및 경로를 실시간으로 설계해 드려요.
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={onNavigateToCreate}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" style={styles.heroButtonIcon} />
            <Text style={styles.heroButtonText}>AI 여행 코스 만들기</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Shortcut Buttons Grid */}
        <Text style={styles.sectionTitle}>빠른 추천 서비스</Text>
        <View style={styles.shortcutGrid}>
          {/* 1. AI 코스 탐색 */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={onNavigateToExplore}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="compass-outline" size={24} color="#4648D4" />
            </View>
            <Text style={styles.shortcutTitle}>코스 둘러보기</Text>
            <Text style={styles.shortcutSub}>인기 추천 일정 탐색</Text>
          </TouchableOpacity>

          {/* 2. 내 취향 프로필 */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={onNavigateToProfile}
            activeOpacity={0.7}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="options-outline" size={24} color="#0284C7" />
            </View>
            <Text style={styles.shortcutTitle}>내 여행 취향</Text>
            <Text style={styles.shortcutSub}>AI 취향 정보 관리</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#030612',
    marginBottom: 4,
  },
  highlightName: {
    color: '#4648D4',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#64748B',
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
    borderColor: '#4648D4',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#4648D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4648D4',
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#030612',
    marginBottom: 6,
  },
  heroDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 18,
  },
  heroButton: {
    backgroundColor: '#4648D4',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4648D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  heroButtonIcon: {
    marginRight: 6,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#030612',
    marginBottom: 12,
  },
  shortcutGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
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
    color: '#030612',
    marginBottom: 2,
  },
  shortcutSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  themeCardList: {
    gap: 12,
  },
  themeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  themeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeTagPrimary: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  themeTagPrimaryText: {
    color: '#4648D4',
    fontSize: 11,
    fontWeight: '700',
  },
  themeTagSecondary: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  themeTagSecondaryText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  themeDuration: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  themeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#030612',
    marginBottom: 4,
  },
  themeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
