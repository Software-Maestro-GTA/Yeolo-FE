/**
 * @file CourseListScreen.tsx
 * @description Screen component for viewing previously generated courses with Bento Grid, search bar component, and AI generation CTA.
 * @requirements REQ-9, REQ-11
 * @functional FUN-7
 * @api API-FB-10
 * @author Antigravity Agent
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCourseListApi, ApiError, DEFAULT_API_URL, type CourseSummary } from '@yeolo/common';
import {
  CourseCard,
  CreateCourseCtaCard,
  CourseSearchBar,
} from '../components/course';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';

export interface CourseListScreenProps {
  onSelectCourse?: (courseId: string) => void;
  onCreateCourse?: () => void;
}

export function CourseListScreen({ onSelectCourse, onCreateCourse }: CourseListScreenProps) {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

  const fetchCourseList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = (await AsyncStorage.getItem('accessToken')) || '';
      const data = await getCourseListApi(API_URL, token);
      setCourses(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      if (err instanceof ApiError) {
        setError(err.message || UI_STRINGS.COURSE_LIST.ERROR_DEFAULT);
      } else {
        setError(errorObj?.message || UI_STRINGS.COURSE_LIST.ERROR_DEFAULT);
      }
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchCourseList();
  }, [fetchCourseList]);

  const handleSelectCourse = (courseId: string) => {
    const targetCourse = courses.find((c) => c.courseId === courseId);
    if (!targetCourse) {
      Alert.alert(UI_STRINGS.COMMON.NOTICE, UI_STRINGS.COURSE_LIST.UNAUTHORIZED_OR_DELETED);
      return;
    }
    if (onSelectCourse) {
      onSelectCourse(courseId);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      course.destinationCountry.toLowerCase().includes(query) ||
      course.destinationCity.toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Header with Course Search Bar Component */}
      <View style={styles.header}>
        <CourseSearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{UI_STRINGS.COURSE_LIST.TITLE}</Text>
          <View style={styles.sectionRightHeader}>
            <TouchableOpacity
              testID="view-toggle-button"
              style={styles.viewToggleButton}
              onPress={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
            >
              <Text style={styles.viewToggleText}>
                {viewMode === 'grid' ? UI_STRINGS.COURSE_LIST.VIEW_LIST : UI_STRINGS.COURSE_LIST.VIEW_GRID}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Course Generation CTA Card */}
        {onCreateCourse && <CreateCourseCtaCard onPress={onCreateCourse} />}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{UI_STRINGS.COURSE_LIST.LOADING}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity testID="retry-button" style={styles.retryButton} onPress={fetchCourseList}>
              <Text style={styles.retryButtonText}>{UI_STRINGS.COURSE_DETAIL.RETRY_BUTTON}</Text>
            </TouchableOpacity>
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🧭</Text>
            <Text style={styles.emptyTitle}>{UI_STRINGS.COURSE_LIST.EMPTY_TITLE}</Text>
            <Text style={styles.emptySubtitle}>{UI_STRINGS.COURSE_LIST.EMPTY_SUBTITLE}</Text>
            {onCreateCourse && (
              <TouchableOpacity
                testID="empty-create-button"
                style={styles.emptyCreateButton}
                onPress={onCreateCourse}
              >
                <Text style={styles.emptyCreateButtonText}>{UI_STRINGS.COURSE_LIST.FIRST_CREATE_BUTTON}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : filteredCourses.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>{UI_STRINGS.COURSE_LIST.SEARCH_EMPTY_TITLE}</Text>
            <Text style={styles.emptySubtitle}>
              '{searchQuery}'{UI_STRINGS.COURSE_LIST.SEARCH_EMPTY_SUBTITLE_SUFFIX}
            </Text>
          </View>
        ) : (
          /* Bento Grid Layout */
          <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.courseId}
                course={course}
                viewMode={viewMode}
                onPress={handleSelectCourse}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 100,
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
    fontWeight: '700',
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
});
