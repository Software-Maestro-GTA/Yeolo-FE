/**
 * @file CourseListScreen.tsx
 * @description Screen component for viewing previously generated courses with Bento Grid, search bar, and AI generation CTA (FUN-7, DOM-2, API-FB-10).
 * @requirements REQ-9, REQ-11
 * @functional FUN-7
 * @api API-FB-10
 * @author Antigravity Agent
 */
import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCourseListApi, ApiError, DEFAULT_API_URL, type CourseSummary } from '@yeolo/common';
import { CourseCard } from '../components/course/CourseCard';
import { CreateCourseCtaCard } from '../components/course/CreateCourseCtaCard';

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
        setError(err.message || '코스 목록을 불러오지 못했습니다.');
      } else {
        setError(errorObj?.message || '코스 목록을 불러오지 못했습니다.');
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
      Alert.alert('알림', '접근 권한이 없거나 삭제된 코스입니다.');
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
      {/* Top Header */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              testID="search-input"
              style={styles.searchInput}
              placeholder="목적지 검색 (국가, 도시)"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>당신의 여로</Text>
          <View style={styles.sectionRightHeader}>
            <TouchableOpacity
              testID="view-toggle-button"
              style={styles.viewToggleButton}
              onPress={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
            >
              <Text style={styles.viewToggleText}>{viewMode === 'grid' ? '☰ 리스트' : '⊞ 그리드'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Course Generation CTA Card */}
        {onCreateCourse && <CreateCourseCtaCard onPress={onCreateCourse} />}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4648d4" />
            <Text style={styles.loadingText}>여행 코스를 불러오는 중입니다...</Text>
          </View>
        ) : error ? (
          /* Error State */
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity testID="retry-button" style={styles.retryButton} onPress={fetchCourseList}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : courses.length === 0 ? (
          /* Total Empty State (No courses generated yet) */
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🧭</Text>
            <Text style={styles.emptyTitle}>아직 생성된 여행 코스가 없습니다</Text>
            <Text style={styles.emptySubtitle}>AI와 함께 당신만의 특별한 여로를 설계해보세요.</Text>
            {onCreateCourse && (
              <TouchableOpacity
                testID="empty-create-button"
                style={styles.emptyCreateButton}
                onPress={onCreateCourse}
              >
                <Text style={styles.emptyCreateButtonText}>첫 코스 생성하기</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : filteredCourses.length === 0 ? (
          /* Search Empty State (No matching search results) */
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
            <Text style={styles.emptySubtitle}>'{searchQuery}'에 해당하는 목적지를 찾을 수 없습니다.</Text>
          </View>
        ) : (
          /* Bento Grid Layout */
          <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
            {filteredCourses.map((course) => (
              <View
                key={course.courseId}
                style={viewMode === 'grid' ? styles.gridItem : styles.listItem}
              >
                <CourseCard course={course} onPress={handleSelectCourse} viewMode={viewMode} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default CourseListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4648d4',
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  viewToggleButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  filterButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionRightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionCount: {
    fontSize: 13,
    color: '#64748b',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  listContainer: {
    flexDirection: 'column',
  },
  listItem: {
    width: '100%',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4648d4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCreateButton: {
    backgroundColor: '#4648d4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCreateButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});
