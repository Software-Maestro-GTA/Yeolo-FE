/**
 * @file CourseListScreen.tsx
 * @description Screen component for viewing previously generated courses with Bento Grid, search bar component, and AI generation CTA.
 * @requirements REQ-9, REQ-11, REQ-22
 * @functional FUN-7, FUN-GA4
 * @api API-FB-10
 * @author Antigravity Agent
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
import {
  CourseCard,
  CreateCourseCtaCard,
  CourseSearchBar,
} from '../components/course';
import { useCourseListQuery } from '../hooks/queries';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';
import type { CourseSummary } from '@yeolo/common';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface CourseListScreenProps {
  onSelectCourse?: (courseId: string) => void;
  onCreateCourse?: () => void;
}

export function CourseListScreen({ onSelectCourse, onCreateCourse }: CourseListScreenProps) {
  useGA4ScreenTracking('CourseListScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: courses = [], isLoading, error, refetch } = useCourseListQuery();
  const errorMessage = error?.message || null;

  const handleSelectCourse = useCallback(
    (courseId: string) => {
      trackButtonClick('btn_select_course', 'Select Course Card', { course_id: courseId });
      if (onSelectCourse) {
        onSelectCourse(courseId);
      }
    },
    [courses, onSelectCourse, trackButtonClick]
  );

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase().trim();
    return courses.filter(
      (course) =>
        course.destinationCountry.toLowerCase().includes(query) ||
        course.destinationCity.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  const renderHeader = useCallback(
    () => (
      <View>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{UI_STRINGS.COURSE_LIST.TITLE}</Text>
          <View style={styles.sectionRightHeader}>
            <TouchableOpacity
              testID="view-toggle-button"
              style={styles.viewToggleButton}
              onPress={() => {
                const nextMode = viewMode === 'grid' ? 'list' : 'grid';
                trackButtonClick('btn_course_view_toggle', `Toggle View Mode to ${nextMode}`);
                setViewMode(nextMode);
              }}
            >
              <Text style={styles.viewToggleText}>
                {viewMode === 'grid' ? UI_STRINGS.COURSE_LIST.VIEW_LIST : UI_STRINGS.COURSE_LIST.VIEW_GRID}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Course Generation CTA Card */}
        {onCreateCourse && (
          <CreateCourseCtaCard
            onPress={() => {
              trackButtonClick('btn_course_list_create_cta', 'Create Course List CTA');
              onCreateCourse();
            }}
          />
        )}
      </View>
    ),
    [onCreateCourse, viewMode, trackButtonClick]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{UI_STRINGS.COURSE_LIST.LOADING}</Text>
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
            <Text style={styles.retryButtonText}>{UI_STRINGS.COURSE_DETAIL.RETRY_BUTTON}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (courses.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🧭</Text>
          <Text style={styles.emptyTitle}>{UI_STRINGS.COURSE_LIST.EMPTY_TITLE}</Text>
          <Text style={styles.emptySubtitle}>{UI_STRINGS.COURSE_LIST.EMPTY_SUBTITLE}</Text>
          {onCreateCourse && (
            <TouchableOpacity
              testID="empty-create-button"
              style={styles.emptyCreateButton}
              onPress={() => {
                trackButtonClick('btn_course_list_empty_create', 'First Create Course Button');
                onCreateCourse();
              }}
            >
              <Text style={styles.emptyCreateButtonText}>{UI_STRINGS.COURSE_LIST.FIRST_CREATE_BUTTON}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>{UI_STRINGS.COURSE_LIST.SEARCH_EMPTY_TITLE}</Text>
        <Text style={styles.emptySubtitle}>
          '{searchQuery}'{UI_STRINGS.COURSE_LIST.SEARCH_EMPTY_SUBTITLE_SUFFIX}
        </Text>
      </View>
    );
  }, [isLoading, errorMessage, courses.length, onCreateCourse, searchQuery, refetch, trackButtonClick]);

  const renderItem = useCallback(
    ({ item }: { item: CourseSummary }) => (
      <View style={viewMode === 'grid' ? styles.gridItemWrapper : styles.listItemWrapper}>
        <CourseCard course={item} viewMode={viewMode} onPress={handleSelectCourse} />
      </View>
    ),
    [handleSelectCourse, viewMode]
  );

  return (
    <View style={styles.container}>
      {/* Top Header with Course Search Bar Component */}
      <View style={styles.header}>
        <CourseSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Main Virtualized List */}
      <FlatList
        key={viewMode}
        data={filteredCourses}
        keyExtractor={(item) => item.courseId}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.bg.screen,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  sectionRightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewToggleButton: {
    backgroundColor: theme.colors.bg.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.subtle,
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.status.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.text.subtle,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCreateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCreateButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: 700,
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  gridItemWrapper: {
    flex: 1,
    maxWidth: '48.5%',
    marginBottom: 12,
  },
  listItemWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
});
