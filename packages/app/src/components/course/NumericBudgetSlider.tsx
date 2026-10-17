/**
 * @file NumericBudgetSlider.tsx
 * @description 고정된 화면 좌표로 연속 드래그하고 손을 놓을 때 폼 예산을 확정하는 슬라이더.
 */
import BudgetSvg from '../../../assets/images/figma-course/budget.svg';
import ThumbSvg from '../../../assets/images/figma-course/thumb.svg';
import { Text } from '../common/Typography';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type GestureResponderEvent,
  StyleSheet,
  View,
} from 'react-native';
import { FigmaAsset } from '../common/FigmaAsset';
import { UI_STRINGS } from '../../constants';
import { COURSE_UI } from '../../constants/courseUiStrings';
import { hexToRgba, palette } from '../../theme/colors';

interface NumericBudgetSliderProps {
  value: number;
  onChange: (value: number) => void;
}
const MIN_BUDGET = 500000;
const MAX_BUDGET = 10000000;
const BUDGET_STEP = 100000;

function budgetFraction(value: number) {
  return Math.min(
    1,
    Math.max(0, (value - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)),
  );
}

/** Returns the selected KRW budget, bounded from 50 to 1,000만원 in 10만원 increments. */
export function NumericBudgetSlider({
  value,
  onChange,
}: NumericBudgetSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [displayValue, setDisplayValue] = useState(value);
  const draftValue = useRef(value);
  const dragStart = useRef<{ pageX: number; localX: number } | null>(null);
  const position = useRef(new Animated.Value(budgetFraction(value))).current;

  useEffect(() => {
    if (dragStart.current) return;
    draftValue.current = value;
    setDisplayValue(value);
    position.setValue(budgetFraction(value));
  }, [value, position]);

  const positionStyles = useMemo(
    () => ({
      fill: {
        width: position.interpolate({
          inputRange: [0, 1],
          outputRange: [0, trackWidth],
        }),
      },
      thumb: {
        transform: [
          {
            translateX: position.interpolate({
              inputRange: [0, 1],
              outputRange: [-16, trackWidth - 16],
            }),
          },
        ],
      },
    }),
    [position, trackWidth],
  );
  const updatePosition = (localX: number) => {
    if (trackWidth <= 0) return;
    const fraction = Math.min(1, Math.max(0, localX / trackWidth));
    // The thumb follows every pixel; only the displayed amount snaps to 10만원.
    position.setValue(fraction);
    const budget =
      MIN_BUDGET +
      Math.round((fraction * (MAX_BUDGET - MIN_BUDGET)) / BUDGET_STEP) *
        BUDGET_STEP;
    draftValue.current = budget;
    setDisplayValue(budget);
  };
  const startDrag = (event: GestureResponderEvent) => {
    if (trackWidth <= 0) return;
    const { pageX, locationX } = event.nativeEvent;
    dragStart.current = { pageX, localX: locationX };
    updatePosition(locationX);
  };
  const moveDrag = (event: GestureResponderEvent) => {
    if (!dragStart.current) return;
    const { pageX, locationX } = event.nativeEvent;
    // locationX can change with the native touch target on Android. Keep the
    // starting track coordinate and add the finger's movement in page space.
    const localX =
      Number.isFinite(pageX) && Number.isFinite(dragStart.current.pageX)
        ? dragStart.current.localX + pageX - dragStart.current.pageX
        : locationX;
    updatePosition(localX);
  };
  const finishDrag = (event?: GestureResponderEvent) => {
    if (!dragStart.current) return;
    if (event) moveDrag(event);
    dragStart.current = null;
    position.setValue(budgetFraction(draftValue.current));
    onChange(draftValue.current);
  };
  const amount = Math.round(displayValue / 10000).toLocaleString();
  const amountLabel = `${COURSE_UI.BUDGET_TOTAL} ${amount}${COURSE_UI.BUDGET_UNIT}`;
  return (
    <View style={styles.card} testID='budget-card'>
      <View style={styles.heading}>
        <FigmaAsset source={BudgetSvg} width={14.5} height={14.4984} />
        <Text style={styles.title}>
          {UI_STRINGS.COURSE_CREATE.BUDGET_TITLE}
        </Text>
        <Text style={styles.perPerson}>{COURSE_UI.BUDGET_PER_PERSON}</Text>
      </View>
      <View style={styles.sliderPanel}>
        <View
          style={styles.amountRow}
          testID='budget-amount-text'
          accessible
          accessibilityLabel={amountLabel}>
          <Text style={styles.amount}>{COURSE_UI.BUDGET_TOTAL}</Text>
          <View>
            <Text
              accessible={false}
              style={[
                styles.amount,
                styles.amountDigits,
                styles.amountMeasure,
              ]}>
              {Math.round(MAX_BUDGET / 10000).toLocaleString()}
            </Text>
            <Text
              style={[styles.amount, styles.amountDigits, styles.amountValue]}>
              {amount}
            </Text>
          </View>
          <Text style={styles.amount}>{COURSE_UI.BUDGET_UNIT}</Text>
        </View>
        <View style={styles.labels}>
          <Text style={styles.rangeText}>
            {UI_STRINGS.COURSE_CREATE.BUDGET_MIN_LABEL}
          </Text>
          <Text style={styles.rangeText}>
            {UI_STRINGS.COURSE_CREATE.BUDGET_MAX_LABEL}
          </Text>
        </View>
        <View
          testID='budget-slider'
          accessibilityRole='adjustable'
          accessibilityLabel={COURSE_UI.BUDGET_ADJUST}
          accessibilityHint={COURSE_UI.BUDGET_HINT}
          accessibilityValue={{
            min: MIN_BUDGET,
            max: MAX_BUDGET,
            now: displayValue,
            text: amountLabel,
          }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => {
            const nextValue = Math.min(
              MAX_BUDGET,
              Math.max(
                MIN_BUDGET,
                draftValue.current +
                  (event.nativeEvent.actionName === 'increment'
                    ? BUDGET_STEP
                    : -BUDGET_STEP),
              ),
            );
            draftValue.current = nextValue;
            setDisplayValue(nextValue);
            position.setValue(budgetFraction(nextValue));
            onChange(nextValue);
          }}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          style={styles.sliderTouchArea}
          onStartShouldSetResponder={() => trackWidth > 0}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={startDrag}
          onResponderMove={moveDrag}
          onResponderRelease={finishDrag}
          onResponderTerminate={() => finishDrag()}
          onResponderTerminationRequest={() => false}
          hitSlop={{ left: 16, right: 16 }}>
          <View style={styles.track} pointerEvents='none'>
            <Animated.View style={[styles.fill, positionStyles.fill]} />
          </View>
          <Animated.View
            style={[styles.thumb, positionStyles.thumb]}
            pointerEvents='none'>
            <View style={styles.thumbShadow} />
            <FigmaAsset source={ThumbSvg} width={32} height={32} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingHorizontal: 26,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: palette.gray100,
  },
  heading: {
    minHeight: 37,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.7,
    color: palette.deepNavy,
  },
  perPerson: { fontSize: 12, color: palette.mutedText, letterSpacing: -0.5 },
  sliderPanel: {
    backgroundColor: palette.white,
    borderRadius: 11,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountDigits: { fontVariant: ['tabular-nums'] },
  amountMeasure: { opacity: 0 },
  amountValue: { position: 'absolute', right: 0, top: 0 },
  amount: { fontSize: 16, fontWeight: '600', color: palette.deepNavy },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeText: { fontSize: 12, color: palette.mutedText },
  sliderTouchArea: { height: 38, justifyContent: 'center' },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.gray200,
    width: '100%',
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: palette.gray400 },
  thumb: { position: 'absolute', left: 0, top: 3, width: 32, height: 32 },
  // SVGR drops SVG filters. Match the asset's 24px circle and two Figma
  // shadows natively; SVG Gaussian stdDeviation maps to half the blur radius.
  thumbShadow: {
    position: 'absolute',
    left: 4,
    top: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.white,
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 1,
        blurRadius: 4,
        color: hexToRgba(palette.black, 0.25),
      },
      {
        offsetX: 0,
        offsetY: 1,
        blurRadius: 1,
        color: hexToRgba(palette.black, 0.15),
      },
    ],
  },
});
