/**
 * @file CourseListScreen.tsx
 * @description UI v3 최근 코스 목록과 편집·삭제 확인을 실제 코스 API 및 최근 코스 상태에 연결합니다.
 */
import React, { useState, useMemo, useCallback, useContext } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger, type CourseSummary } from '@yeolo/common';
import { CourseDeleteModal } from '../components/course/CourseDeleteModal';
import { CourseCard } from '../components/course/CourseCard';
import { FigmaAsset } from '../components/common/FigmaAsset';
import { Text } from '../components/common/Typography';
import { useCourseListQuery, useCourseDeleteMutation } from '../hooks/queries';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { COURSE_UI } from '../constants/courseUiStrings';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { AuthContext } from '../context/AuthContext';

export interface CourseListScreenProps {
  onBack?: () => void;
  onSelectCourse?: (courseId: string) => void;
  onCreateCourse?: () => void;
  onDeleted?: (courseId: string) => void;
}

/** Deletes only after confirmation and clears a matching recent-course reference only on API success. */
export function CourseListScreen({
  onBack,
  onSelectCourse,
  onCreateCourse,
  onDeleted,
}: CourseListScreenProps) {
  useGA4ScreenTracking('CourseListScreen');
  const insets = useSafeAreaInsets();
  const safeAreaStyles = StyleSheet.create({
    list: { paddingBottom: insets.bottom + 16 },
  });
  const { trackButtonClick } = useGA4ButtonClick();
  const auth = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseSummary | null>(
    null,
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useCourseListQuery();
  const deleteCourseMutation = useCourseDeleteMutation();
  const visibleCourses = useMemo(
    () => courses.filter((course) => !deletedIds.includes(course.courseId)),
    [courses, deletedIds],
  );

  const openDelete = useCallback(
    (course: CourseSummary) => {
      trackButtonClick('btn_open_delete_modal', 'Open Delete Confirm Modal', {
        course_id: course.courseId,
      });
      setEditing(true);
      setDeleteError(null);
      setCourseToDelete(course);
    },
    [trackButtonClick],
  );

  const handleConfirmDelete = () => {
    if (!courseToDelete || deleteCourseMutation.isPending) return;
    const courseId = courseToDelete.courseId;
    trackButtonClick('btn_confirm_delete_course', 'Confirm Delete Course', {
      course_id: courseId,
    });
    setDeleteError(null);
    deleteCourseMutation.mutate(courseId, {
      onSuccess: async () => {
        setDeletedIds((ids) => [...ids, courseId]);
        setCourseToDelete(null);
        if (auth?.recentCourseId === courseId) auth.setRecentCourseId?.(null);
        try {
          if ((await AsyncStorage.getItem('recentCourseId')) === courseId) {
            await AsyncStorage.removeItem('recentCourseId');
          }
        } catch (storageError) {
          logger.warn(
            'Deleted course could not be removed from local recent history',
            storageError,
          );
        }
        onDeleted?.(courseId);
      },
      onError: (failure) =>
        setDeleteError(failure.message || COURSE_UI.DELETE_ERROR),
    });
  };

  const renderEmpty = () => {
    if (isLoading)
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={palette.primary} />
          <Text style={styles.body}>{UI_STRINGS.COURSE_LIST.LOADING_TEXT}</Text>
        </View>
      );
    if (error)
      return (
        <View style={styles.empty}>
          <Text style={styles.error}>{error.message}</Text>
          <Pressable
            testID='retry-button'
            accessibilityRole='button'
            style={styles.createButton}
            onPress={() => refetch()}>
            <Text style={styles.createText}>
              {UI_STRINGS.COURSE_LIST.RETRY_BUTTON}
            </Text>
          </Pressable>
        </View>
      );
    return (
      <View style={styles.empty} testID='empty-state'>
        <Text style={styles.emptyTitle}>
          {UI_STRINGS.COURSE_LIST.EMPTY_TITLE}
        </Text>
        <Text style={styles.body}>{UI_STRINGS.COURSE_LIST.EMPTY_SUBTITLE}</Text>
        {onCreateCourse && (
          <Pressable
            testID='empty-create-button'
            accessibilityRole='button'
            style={styles.createButton}
            onPress={onCreateCourse}>
            <Text style={styles.createText}>
              {UI_STRINGS.COURSE_LIST.CREATE_NEW_BUTTON}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container} testID='course-list-screen'>
      <View style={styles.header}>
        <Pressable
          testID='course-list-back'
          accessibilityRole='button'
          accessibilityLabel={COURSE_UI.BACK}
          onPress={onBack}
          style={styles.backButton}>
          <FigmaAsset
            source={require('../../assets/images/figma-course/back.svg')}
            width={24}
            height={24}
          />
        </Pressable>
        <Text style={styles.title}>{COURSE_UI.LIST_TITLE}</Text>
        <View style={styles.backButton} />
      </View>
      {visibleCourses.length > 0 && (
        <View style={styles.toolbar}>
          <Pressable
            testID='toggle-course-edit'
            accessibilityRole='button'
            accessibilityState={{ selected: editing }}
            style={styles.editButton}
            onPress={() => setEditing((value) => !value)}>
            <Text style={styles.editText}>
              {editing ? COURSE_UI.DONE : COURSE_UI.EDIT}
            </Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={visibleCourses}
        keyExtractor={(item) => item.courseId}
        contentContainerStyle={[styles.list, safeAreaStyles.list]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {editing && (
              <Pressable
                testID={`delete-course-${item.courseId}`}
                accessibilityRole='button'
                accessibilityLabel={`${item.title} ${COURSE_UI.DELETE}`}
                style={styles.deleteButton}
                onPress={() => openDelete(item)}>
                <FigmaAsset
                  source={require('../../assets/images/figma-course/delete.svg')}
                  width={13.5}
                  height={14.5}
                />
              </Pressable>
            )}
            <View style={editing ? styles.shiftedCard : styles.cardWrapper}>
              <CourseCard
                item={item}
                onPress={editing ? undefined : onSelectCourse}
                onLongPress={openDelete}
              />
            </View>
          </View>
        )}
      />
      <CourseDeleteModal
        visible={Boolean(courseToDelete)}
        course={courseToDelete}
        pending={deleteCourseMutation.isPending}
        errorMessage={deleteError}
        onClose={() => {
          if (!deleteCourseMutation.isPending) setCourseToDelete(null);
        }}
        onConfirmDelete={handleConfirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.white, overflow: 'hidden' },
  header: {
    height: 61,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -1,
    textAlign: 'center',
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  editButton: {
    height: 36,
    minWidth: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.gray300,
    backgroundColor: palette.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  editText: { fontSize: 16, fontWeight: '500', color: palette.deepNavy },
  list: { flexGrow: 1, paddingHorizontal: 20 },
  row: {
    position: 'relative',
    marginBottom: 16,
    minHeight: 107,
    justifyContent: 'center',
  },
  cardWrapper: { width: '100%' },
  shiftedCard: { width: '100%', transform: [{ translateX: 60 }] },
  deleteButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.red500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.deepNavy,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: palette.gray600,
    textAlign: 'center',
    lineHeight: 24,
  },
  error: { fontSize: 16, color: palette.red500, textAlign: 'center' },
  createButton: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  createText: { fontSize: 18, fontWeight: '500', color: palette.white },
});
