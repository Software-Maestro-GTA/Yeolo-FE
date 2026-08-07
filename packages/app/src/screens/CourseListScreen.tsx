/**
 * @file CourseListScreen.tsx
 * @description Screen component for viewing previously generated course list, searching, and managing saved itineraries.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CourseSearchBar,
  CourseDeleteModal,
} from '../components/course';
import { useCourseListQuery } from '../hooks/queries';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import type { CourseSummary } from '@yeolo/common';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface CourseListScreenProps {
  onSelectCourse?: (courseId: string) => void;
  onCreateCourse?: () => void;
}

const DEFAULT_CARD_BG = 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=800&q=80';

export function CourseListScreen({ onSelectCourse, onCreateCourse }: CourseListScreenProps) {
  useGA4ScreenTracking('CourseListScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [courseToDelete, setCourseToDelete] = useState<CourseSummary | null>(null);

  const { data: courses = [], isLoading, error, refetch } = useCourseListQuery();
  const errorMessage = error?.message || null;

  const handleSelectCourse = useCallback(
    (courseId: string) => {
      trackButtonClick('btn_select_course', 'Select Course Card', { course_id: courseId });
      if (onSelectCourse) {
        onSelectCourse(courseId);
      }
    },
    [onSelectCourse, trackButtonClick]
  );

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase().trim();
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.destinationCountry.toLowerCase().includes(query) ||
        course.destinationCity.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  const handleDeletePress = useCallback(
    (course: CourseSummary) => {
      trackButtonClick('btn_open_delete_modal', 'Open Delete Confirm Modal', { course_id: course.courseId });
      setCourseToDelete(course);
    },
    [trackButtonClick]
  );

  const handleConfirmDelete = useCallback(() => {
    if (courseToDelete) {
      trackButtonClick('btn_confirm_delete_course', 'Confirm Delete Course', { course_id: courseToDelete.courseId });
      setCourseToDelete(null);
      refetch();
    }
  }, [courseToDelete, refetch, trackButtonClick]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerSection}>
        {/* Compact CTA */}
        {onCreateCourse && (
          <View style={styles.compactCtaCard} testID="compact-cta">
            <View style={styles.compactCtaLeft}>
              <Ionicons name="sparkles" size={18} color={palette.primary} />
              <Text style={styles.compactCtaTitle}>
                {UI_STRINGS.COURSE_LIST?.COMPACT_CTA_TITLE || '새로운 맞춤형 일정이 필요할 땐?'}
              </Text>
            </View>
            <TouchableOpacity
              testID="compact-cta-button"
              style={styles.compactCtaBtn}
              activeOpacity={0.8}
              onPress={() => {
                trackButtonClick('btn_course_list_create_cta', 'Create Course Compact CTA');
                onCreateCourse();
              }}
            >
              <Text style={styles.compactCtaBtnText}>
                {UI_STRINGS.COURSE_LIST?.CREATE_NEW_BUTTON || '새 코스 생성'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [onCreateCourse, trackButtonClick]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>코스 목록을 불러오는 중...</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            testID="retry-button"
            style={styles.retryButton}
            onPress={() => {
              trackButtonClick('btn_course_list_retry', 'Retry Fetch Course List');
              refetch();
            }}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Empty state
    if (courses.length === 0) {
      return (
        <View style={styles.emptyStateContainer} testID="empty-state">
          <View style={styles.illustrationCircle}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
          </View>
          <Text style={styles.emptyTitle}>
            {UI_STRINGS.COURSE_LIST?.EMPTY_TITLE || '아직 저장된 코스가 없어요'}
          </Text>
          <Text style={styles.emptySubTitle}>
            {UI_STRINGS.COURSE_LIST?.EMPTY_SUBTITLE || 'AI가 추천하는 맞춤 여행 코스를\n생성해보세요'}
          </Text>
          {onCreateCourse && (
            <TouchableOpacity
              testID="empty-create-button"
              style={styles.emptyCtaButton}
              activeOpacity={0.85}
              onPress={() => {
                trackButtonClick('btn_course_list_empty_create', 'First Create Course Button');
                onCreateCourse();
              }}
            >
              <Text style={styles.emptyCtaButtonText}>
                {UI_STRINGS.COURSE_LIST?.CREATE_NEW_BUTTON || '새 코스 생성'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
        <Text style={styles.emptySubTitle}>'{searchQuery}'에 일치하는 코스가 없습니다.</Text>
      </View>
    );
  }, [isLoading, errorMessage, courses.length, onCreateCourse, searchQuery, refetch, trackButtonClick]);

  const renderItem = useCallback(
    ({ item }: { item: CourseSummary }) => {
      const summaryItem = item as any;
      const imageUrl = summaryItem.imageUrl || DEFAULT_CARD_BG;
      const summaryText = summaryItem.summary || `${item.destinationCity} 도심 속 자연과 문화 일상 추천`;
      const themeTag = summaryItem.theme || (item.tags && item.tags[0]) || '힐링';

      return (
        <TouchableOpacity
          style={styles.heroRouteCard}
          activeOpacity={0.9}
          onPress={() => handleSelectCourse(item.courseId)}
          onLongPress={() => handleDeletePress(item)}
          testID={`course-card-${item.courseId}`}
        >
          {/* Photo Area Header */}
          <ImageBackground
            source={{ uri: imageUrl }}
            style={styles.photoArea}
            resizeMode="cover"
          >
            <View style={styles.photoDimOverlay} />

            {/* Delete Action Button */}
            <TouchableOpacity
              style={styles.deleteIconBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                handleDeletePress(item);
              }}
              activeOpacity={0.7}
              testID={`btn-delete-${item.courseId}`}
            >
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Card Title & Meta Overlay */}
            <View style={styles.photoContentOverlay}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.destinationCountry} {item.destinationCity} • {item.startDate || '일정 미정'} • {item.totalDays || 3}일
              </Text>
            </View>
          </ImageBackground>

          {/* Hero Card Body */}
          <View style={styles.heroBody}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={palette.subText} />
              <Text style={styles.locationText} numberOfLines={1}>
                {summaryText}
              </Text>
            </View>

            <View style={styles.tagsRow}>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>#{themeTag}</Text>
              </View>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>#나홀로여행</Text>
              </View>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>#교육깊은여행</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelectCourse, handleDeletePress]
  );

  return (
    <View style={styles.container} testID="course-list-screen">
      {/* Top Search Bar Component */}
      <View style={styles.topHeader}>
        <CourseSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Main Virtualized List */}
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.courseId}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Course Delete Confirm Bottom Sheet Modal */}
      <CourseDeleteModal
        visible={!!courseToDelete}
        courseTitle={courseToDelete?.title}
        onClose={() => setCourseToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.softMint, // #F5FAF8
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: palette.softMint,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 76,
  },
  headerSection: {
    marginBottom: 16,
  },
  compactCtaCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: '#E0E5EB',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactCtaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.deepNavy, // #0D2137
  },
  compactCtaBtn: {
    backgroundColor: palette.primary, // #2D7DD2
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactCtaBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.white,
  },
  heroRouteCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  photoArea: {
    height: 160,
    justifyContent: 'space-between',
    padding: 12,
  },
  photoDimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13, 33, 55, 0.35)',
  },
  deleteIconBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  photoContentOverlay: {
    gap: 2,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroBody: {
    height: 85,
    padding: 16,
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: palette.subText,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#E0F7F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.primary, // #2D7DD2
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: palette.subText,
  },
  errorText: {
    fontSize: 15,
    color: '#EB4545',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyStateContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.deepNavy,
    textAlign: 'center',
  },
  emptySubTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#73808C',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCtaButton: {
    backgroundColor: palette.primary, // #2D7DD2
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCtaButtonText: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 15,
  },
});
