/**
 * @file TravelDateSheet.tsx
 * @description 여행 날짜를 연속 월 달력에서 선택하고 Figma의 하단 페이드로 확인 영역을 구분하는 UI v3 시트.
 */
import CloseSvg from '../../../assets/images/figma-course/close.svg';
import { useSheetEntrance } from '../../hooks/useSheetEntrance';
import { Text } from '../common/Typography';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateTotalDays } from '@yeolo/common';
import { InlineCalendarView } from '../common/InlineCalendarView';
import { FigmaAsset } from '../common/FigmaAsset';
import { CachedImage } from '../common/CachedImage';
import { COURSE_UI } from '../../constants/courseUiStrings';
import { palette, hexToRgba } from '../../theme/colors';

interface TravelDateSheetProps {
  visible: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onConfirm: (startDate: string, endDate: string) => void;
  maxDays?: number;
}

/** Keeps each month's date callback stable while the selected range changes. */
const TravelCalendarMonth = React.memo(function TravelCalendarMonth({
  month,
  startDate,
  endDate,
  maxDays,
  onSelectDate,
}: {
  month: { year: number; month: number };
  startDate: string;
  endDate: string;
  maxDays: number;
  onSelectDate: (date: string) => void;
}) {
  const selectDay = useCallback(
    (day: number) => {
      onSelectDate(
        `${month.year}-${String(month.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      );
    },
    [month, onSelectDate],
  );
  return (
    <InlineCalendarView
      currentYearMonth={month}
      startDate={startDate}
      endDate={endDate}
      maxDays={maxDays}
      hideMonthNavigation
      onPrevMonth={ignoreMonthNavigation}
      onNextMonth={ignoreMonthNavigation}
      onSelectDay={selectDay}
    />
  );
});
const ignoreMonthNavigation = () => {};

/** Keeps draft dates local until confirmation; closing the sheet preserves the saved range. */
export function TravelDateSheet({
  visible,
  onClose,
  startDate,
  endDate,
  onConfirm,
  maxDays = 29,
}: TravelDateSheetProps) {
  const [draft, setDraft] = useState({ start: startDate, end: endDate });
  const { start: draftStart, end: draftEnd } = draft;
  const insets = useSafeAreaInsets();
  const entranceStyle = useSheetEntrance(visible);
  useEffect(() => {
    if (visible) {
      setDraft({ start: startDate, end: endDate });
    }
  }, [visible, startDate, endDate]);
  const months = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 24 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() + index, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    });
  }, []);
  const selectDate = useCallback(
    (date: string) => {
      setDraft((current) => {
        if (!current.start || current.end || date < current.start) {
          return { start: date, end: '' };
        }
        const totalDays = calculateTotalDays(current.start, date);
        return totalDays && totalDays <= maxDays
          ? { start: current.start, end: date }
          : current;
      });
    },
    [maxDays],
  );
  const rangeLabel =
    draftStart && draftEnd
      ? `${draftStart.slice(2).replace(/-/g, '.')} - ${draftEnd.slice(2).replace(/-/g, '.')} ${COURSE_UI.DATE_CONFIRM}`
      : COURSE_UI.DATE_REQUIRED;
  const dynamicStyles = StyleSheet.create({
    footer: {
      paddingBottom:
        Math.max(insets.bottom, 16) + (Platform.OS === 'android' ? 20 : 0),
    },
  });
  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          testID='date-sheet-backdrop'
          accessibilityLabel={COURSE_UI.CLOSE}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[styles.sheet, entranceStyle]}
          testID='date-sheet'>
          <View style={styles.header}>
            <Text style={styles.title}>{COURSE_UI.DATE_TITLE}</Text>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={COURSE_UI.CLOSE}
              style={styles.closeButton}
              onPress={onClose}>
              <FigmaAsset source={CloseSvg} width={24} height={24} />
            </Pressable>
          </View>
          <FlatList
            data={months}
            keyExtractor={({ year, month }) => `${year}-${month}`}
            initialNumToRender={2}
            windowSize={3}
            maxToRenderPerBatch={2}
            renderItem={({ item }) => (
              <TravelCalendarMonth
                month={item}
                startDate={draftStart}
                endDate={draftEnd}
                maxDays={maxDays}
                onSelectDate={selectDate}
              />
            )}
          />
          <View style={[styles.footer, dynamicStyles.footer]}>
            <CachedImage
              source={require('../../../assets/images/figma-course/date-footer-shadow.png')}
              style={styles.footerShadow}
              contentFit='fill'
              pointerEvents='none'
              accessible={false}
            />
            <Pressable
              testID='confirm-travel-dates'
              accessibilityRole='button'
              accessibilityState={{ disabled: !draftStart || !draftEnd }}
              disabled={!draftStart || !draftEnd}
              style={[
                styles.confirmButton,
                (!draftStart || !draftEnd) && styles.disabledButton,
              ]}
              onPress={() => {
                onConfirm(draftStart, draftEnd);
                onClose();
              }}>
              <Text
                style={[
                  styles.confirmText,
                  (!draftStart || !draftEnd) && styles.disabledText,
                ]}>
                {rangeLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: hexToRgba(palette.deepNavy, 0.6),
  },
  sheet: {
    height: '82%',
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 25,
    paddingRight: 12,
  },
  title: { fontSize: 16, fontWeight: '600', color: palette.deepNavy },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: palette.white,
  },
  footerShadow: {
    position: 'absolute',
    top: -14,
    left: 0,
    right: 0,
    height: 14,
    transform: [{ scaleY: -1 }],
  },
  confirmButton: {
    minHeight: 62,
    backgroundColor: palette.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  disabledButton: { backgroundColor: palette.gray300 },
  disabledText: { color: palette.gray600 },
  confirmText: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
});
