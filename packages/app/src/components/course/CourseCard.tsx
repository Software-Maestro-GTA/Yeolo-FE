/**
 * @file CourseCard.tsx
 * @description UI v3의 가로형 최근 코스 카드에 실제 목적지·날짜·사진과 방문지 또는 태그를 표시합니다.
 */
import PlacePinSvg from '../../../assets/images/figma-course/place-pin.svg';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import type { CourseSummary } from '@yeolo/common';
import { getDestinationImageUrl } from '../../services';
import { palette } from '../../theme/colors';
import { formatCourseDateRange } from '../../utils/courseDateRange';
import { FigmaAsset } from '../common/FigmaAsset';
import { CachedImage } from '../common/CachedImage';
import { Text } from '../common/Typography';

export interface CourseCardProps {
  item: CourseSummary;
  onPress?: (courseId: string) => void;
  placeNames?: readonly string[];
  testID?: string;
  selected?: boolean;
}

/** Summary-only cards use their real tags; callers with a detail response may provide real place names. */
export const CourseCard: React.FC<CourseCardProps> = ({
  item,
  onPress,
  placeNames,
  testID,
  selected,
}) => {
  const imageUrl =
    item.coverImageUrl ||
    getDestinationImageUrl(item.destinationCountry, item.destinationCity);
  const places = placeNames?.filter(Boolean).slice(0, 2) ?? [];
  const chips = places.length
    ? places
    : (item.tags ?? []).slice(0, 2).map((tag) => `#${tag.replace(/^#/, '')}`);
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected !== undefined && styles.selectable,
        selected && styles.selected,
      ]}
      activeOpacity={0.9}
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityState={
        selected === undefined ? undefined : { checked: selected }
      }
      accessibilityLabel={item.title}
      onPress={() => onPress?.(item.courseId)}
      testID={testID ?? `course-card-${item.courseId}`}>
      <View style={styles.details}>
        <View style={styles.destination}>
          <Text style={styles.destinationText} numberOfLines={1}>
            {item.destinationCountry}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.destinationText} numberOfLines={1}>
            {item.destinationCity}
          </Text>
        </View>
        <Text style={styles.date} numberOfLines={1}>
          {formatCourseDateRange(item)}
        </Text>
        <View style={styles.chips}>
          {chips.map((chip, index) => (
            <View key={`${index}-${chip}`} style={styles.chip}>
              {places.length > 0 && (
                <FigmaAsset source={PlacePinSvg} width={14} height={14} />
              )}
              <Text style={styles.chipText} numberOfLines={1}>
                {chip}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <CachedImage
        source={{ uri: imageUrl }}
        style={styles.thumbnail}
        contentFit='cover'
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  selectable: { borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: palette.primary },
  card: {
    width: '100%',
    minHeight: 107,
    backgroundColor: palette.white,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 12,
    shadowColor: palette.black,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  details: { flex: 1, minWidth: 0, alignSelf: 'stretch', paddingTop: 4 },
  destination: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  destinationText: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.deepNavy,
    letterSpacing: -1,
    flexShrink: 1,
  },
  divider: { width: 2, height: 16, backgroundColor: palette.gray200 },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.gray600,
    marginTop: 4,
    letterSpacing: -0.4,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 1,
    backgroundColor: palette.gray100,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.gray600,
    flexShrink: 1,
  },
  thumbnail: {
    width: 120,
    height: 83,
    borderRadius: 12,
    backgroundColor: palette.gray100,
  },
});
