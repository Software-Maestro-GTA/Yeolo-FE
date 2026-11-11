/**
 * @file BookingAirportSheet.tsx
 * @description 예약 API에서 검색한 출발·도착 공항을 선택하는 UI v3 하단 시트.
 */
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSheetEntrance } from '../../hooks/useSheetEntrance';
import { Text, TextInput } from '../common/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOOKING_REEL_UI } from '../../constants/bookingReelUiStrings';
import { hexToRgba, palette } from '../../theme/colors';
import { BookingReelAsset } from './BookingReelAsset';

const S = BOOKING_REEL_UI.BOOKING;
type AirportChoice = { id: string; label: string };

/** Keeps search and booking state in the parent while presenting selectable airport results. */
export function BookingAirportSheet({
  target,
  query,
  choices,
  onChange,
  onSelect,
  onClose,
}: {
  target: 'departure' | 'arrival';
  query: string;
  choices: AirportChoice[];
  onChange: (query: string) => void;
  onSelect: (airport: AirportChoice) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const entranceStyle = useSheetEntrance(true);
  const insetStyle = StyleSheet.create({
    bottom: { paddingBottom: insets.bottom + 16 },
  });
  return (
    <Modal visible transparent animationType='fade' onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel={S.CLOSE}
          onPress={onClose}
        />
        <Animated.View
          style={[styles.sheet, entranceStyle]}
          accessibilityViewIsModal>
          <View style={styles.heading}>
            <Text style={styles.title}>
              {target === 'departure' ? S.DEPARTURE_TITLE : S.ARRIVAL_TITLE}
            </Text>
            <Pressable
              testID='airport-sheet-close'
              accessibilityRole='button'
              accessibilityLabel={S.CLOSE}
              hitSlop={10}
              onPress={onClose}>
              <BookingReelAsset name='close' />
            </Pressable>
          </View>
          <View style={styles.search}>
            <View style={styles.searchIcon}>
              <BookingReelAsset name='search' />
            </View>
            <TextInput
              testID='airport-sheet-search'
              accessibilityLabel={S.AIRPORT_SEARCH}
              value={query}
              onChangeText={onChange}
              placeholder={S.AIRPORT_SEARCH}
              placeholderTextColor={palette.mutedText}
              style={styles.input}
              autoCapitalize='none'
              returnKeyType='search'
            />
          </View>
          <View style={styles.divider} />
          <Text style={styles.caption}>
            {query.trim() ? S.AIRPORT_RESULTS : S.AIRPORT_HINT}
          </Text>
          <View testID='airport-suggestion-viewport' style={styles.viewport}>
            <FlatList
              testID='airport-suggestion-list'
              data={choices}
              keyExtractor={(item) => item.id}
              contentContainerStyle={insetStyle.bottom}
              scrollIndicatorInsets={{ bottom: insets.bottom }}
              scrollEnabled
              keyboardShouldPersistTaps='handled'
              keyboardDismissMode='on-drag'
              renderItem={({ item }) => (
                <Pressable
                  testID={`airport-suggestion-${item.id}`}
                  accessibilityRole='button'
                  accessibilityLabel={item.label}
                  style={styles.row}
                  onPress={() => onSelect(item)}>
                  <View style={styles.airportIcon}>
                    <BookingReelAsset name={target} />
                  </View>
                  <Text style={styles.airportName}>
                    {item.label.replace(/ \([A-Z]{3}\)$/, '')}{' '}
                    <Text style={styles.code}>{item.id}</Text>
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: palette.white,
    overflow: 'hidden',
  },
  heading: {
    minHeight: 65,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -1,
  },
  search: {
    marginHorizontal: 20,
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.gray100,
  },
  searchIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: palette.deepNavy,
    fontSize: 16,
    letterSpacing: -1,
    paddingVertical: 12,
  },
  divider: { height: 1, backgroundColor: palette.gray100, marginTop: 20 },
  caption: {
    fontSize: 14,
    color: palette.mutedText,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 3,
    letterSpacing: -1,
  },
  viewport: { flex: 1, overflow: 'hidden' },
  row: {
    minHeight: 58,
    paddingHorizontal: 24,
    gap: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  airportIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airportName: {
    flex: 1,
    fontSize: 16,
    color: palette.deepNavy,
    letterSpacing: -1,
  },
  code: { color: palette.mutedText },
});
