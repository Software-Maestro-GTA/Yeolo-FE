/**
 * @file CourseListScreen.tsx
 * @description Screen component for viewing previously generated course list (API-COURSE-3), searching, long-press deletion modal, and deleting saved itineraries (API-COURSE-4).
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CourseSearchBar,
  CourseDeleteModal,
  CourseCard,
} from '../components/course';
import { useCourseListQuery, useCourseDeleteMutation } from '../hooks/queries';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import type { CourseSummary } from '@yeolo/common';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface CourseListScreenProps {
  onSelectCourse?: (courseId: string) => void;
  onCreateCourse?: () => void;
}

export function CourseListScreen({
  onSelectCourse,
  onCreateCourse,
}: CourseListScreenProps) {
  useGA4ScreenTracking('CourseListScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [courseToDelete, setCourseToDelete] = useState<CourseSummary | null>(
    null,
  );

  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useCourseListQuery();
  const deleteCourseMutation = useCourseDeleteMutation();
  const errorMessage = error?.message || null;

  const handleSelectCourse = useCallback(
    (courseId: string) => {
      trackButtonClick('btn_select_course', 'Select Course Card', {
        course_id: courseId,
      });
      if (onSelectCourse) {
        onSelectCourse(courseId);
      }
    },
    [onSelectCourse, trackButtonClick],
  );

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase().trim();
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.destinationCountry.toLowerCase().includes(query) ||
        course.destinationCity.toLowerCase().includes(query),
    );
  }, [courses, searchQuery]);

  const handleDeletePress = useCallback(
    (course: CourseSummary) => {
      trackButtonClick('btn_open_delete_modal', 'Open Delete Confirm Modal', {
        course_id: course.courseId,
      });
      setCourseToDelete(course);
    },
    [trackButtonClick],
  );

  const handleConfirmDelete = useCallback(() => {
    if (courseToDelete) {
      trackButtonClick('btn_confirm_delete_course', 'Confirm Delete Course', {
        course_id: courseToDelete.courseId,
      });
      deleteCourseMutation.mutate(courseToDelete.courseId);
      setCourseToDelete(null);
    }
  }, [courseToDelete, deleteCourseMutation, trackButtonClick]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerSection}>
        {/* Compact CTA */}
        {onCreateCourse && (
          <View style={styles.compactCtaCard} testID='compact-cta'>
            <View style={styles.compactCtaLeft}>
              <Ionicons name='sparkles' size={18} color={palette.primary} />
              <Text style={styles.compactCtaTitle}>
                {UI_STRINGS.COURSE_LIST.COMPACT_CTA_TITLE}
              </Text>
            </View>
            <TouchableOpacity
              testID='compact-cta-button'
              style={styles.compactCtaBtn}
              activeOpacity={0.8}
              onPress={() => {
                trackButtonClick(
                  'btn_course_list_create_cta',
                  'Create Course Compact CTA',
                );
                onCreateCourse();
              }}>
              <Text style={styles.compactCtaBtnText}>
                {UI_STRINGS.COURSE_LIST.CREATE_NEW_BUTTON}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [onCreateCourse, trackButtonClick],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size='large' color={palette.primary} />
          <Text style={styles.loadingText}>
            {UI_STRINGS.COURSE_LIST.LOADING_TEXT}
          </Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            testID='retry-button'
            style={styles.retryButton}
            onPress={() => {
              trackButtonClick(
                'btn_course_list_retry',
                'Retry Fetch Course List',
              );
              refetch();
            }}>
            <Text style={styles.retryButtonText}>
              {UI_STRINGS.COURSE_LIST.RETRY_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Empty state
    if (courses.length === 0) {
      return (
        <View style={styles.emptyStateContainer} testID='empty-state'>
          <View style={styles.illustrationCircle}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
          </View>
          <Text style={styles.emptyTitle}>
            {UI_STRINGS.COURSE_LIST.EMPTY_TITLE}
          </Text>
          <Text style={styles.emptySubTitle}>
            {UI_STRINGS.COURSE_LIST.EMPTY_SUBTITLE}
          </Text>
          {onCreateCourse && (
            <TouchableOpacity
              testID='empty-create-button'
              style={styles.emptyCtaButton}
              activeOpacity={0.85}
              onPress={() => {
                trackButtonClick(
                  'btn_course_list_empty_create',
                  'First Create Course Button',
                );
                onCreateCourse();
              }}>
              <Text style={styles.emptyCtaButtonText}>
                {UI_STRINGS.COURSE_LIST.CREATE_NEW_BUTTON}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>
          {UI_STRINGS.COURSE_LIST.SEARCH_EMPTY_TITLE}
        </Text>
        <Text style={styles.emptySubTitle}>
          {UI_STRINGS.COURSE_LIST.SEARCH_EMPTY_SUBTITLE_PREFIX}
          {searchQuery}
          {UI_STRINGS.COURSE_LIST.SEARCH_EMPTY_SUBTITLE_SUFFIX}
        </Text>
      </View>
    );
  }, [
    isLoading,
    errorMessage,
    courses.length,
    onCreateCourse,
    searchQuery,
    refetch,
    trackButtonClick,
  ]);

  const renderItem = useCallback(
    ({ item }: { item: CourseSummary }) => (
      <CourseCard
        item={item}
        onPress={handleSelectCourse}
        onLongPress={handleDeletePress}
      />
    ),
    [handleSelectCourse, handleDeletePress],
  );

  return (
    <View style={styles.container} testID='course-list-screen'>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 76,
  },
  headerSection: {
    marginBottom: 16,
  },
  compactCtaCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
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
    color: palette.deepNavy,
  },
  compactCtaBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactCtaBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.white,
  },
  centerContainer: {
    flex: 1,
    paddingVertical: 32,
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
    color: palette.red500,
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
    flex: 1,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.lightTeal,
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
    color: palette.subText,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCtaButton: {
    backgroundColor: palette.primary,
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
