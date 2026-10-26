/**
 * @file CourseGenerationStatusCard.tsx
 * @description 다른 기능을 사용하는 동안 생성 진행·완료·오류를 화면 하단의 별도 영역에 표시합니다.
 */
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../common/Typography';
import { UI_STRINGS } from '../../constants';
import { palette } from '../../theme/colors';

interface CourseGenerationStatusCardProps {
  status: 'generating' | 'complete' | 'error';
  title: string;
  message: string;
  onPress: () => void;
  onDismiss: () => void;
}

/** Keeps status and its destination action together without covering screen controls. */
export function CourseGenerationStatusCard({
  status,
  title,
  message,
  onPress,
  onDismiss,
}: CourseGenerationStatusCardProps) {
  const strings = UI_STRINGS.COURSE_GENERATING;
  const generating = status === 'generating';
  const action = generating
    ? strings.MINI_PROGRESS
    : status === 'complete'
      ? strings.MINI_RESULT
      : strings.MINI_ERROR_ACTION;
  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.card} testID='course-generation-status'>
        <Pressable
          testID='course-generation-status-action'
          style={styles.action}
          accessibilityRole='button'
          accessibilityLabel={`${title}. ${message}. ${action}`}
          accessibilityState={{ busy: generating }}
          onPress={onPress}>
          {generating ? (
            <ActivityIndicator color={palette.primary} size='small' />
          ) : (
            <Ionicons
              name={
                status === 'complete'
                  ? 'checkmark-circle'
                  : 'alert-circle-outline'
              }
              size={24}
              color={status === 'error' ? palette.red500 : palette.primary}
            />
          )}
          <View style={styles.content}>
            <Text
              style={styles.title}
              numberOfLines={1}
              accessibilityLiveRegion='polite'>
              {title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
          </View>
          <Text style={styles.actionText}>{action}</Text>
        </Pressable>
        {!generating && (
          <Pressable
            testID='course-generation-status-dismiss'
            style={styles.dismiss}
            accessibilityRole='button'
            accessibilityLabel={strings.MINI_DISMISS}
            onPress={onDismiss}>
            <Ionicons name='close' size={20} color={palette.subText} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.gray200,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.gray100,
    borderRadius: 16,
  },
  action: {
    flex: 1,
    minHeight: 68,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  content: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 14, fontWeight: '600', color: palette.deepNavy },
  message: { fontSize: 12, lineHeight: 16, color: palette.subText },
  actionText: { fontSize: 13, fontWeight: '600', color: palette.accent },
  dismiss: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
