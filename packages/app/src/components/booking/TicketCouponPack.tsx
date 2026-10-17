/**
 * @file TicketCouponPack.tsx
 * @description Expandable MyRealTrip overseas tour coupon codes with one-tap copying.
 */
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../common/Typography';
import Clipboard from '@react-native-clipboard/clipboard';
import { BookingReelAsset } from './BookingReelAsset';
import { BOOKING_REEL_UI } from '../../constants/bookingReelUiStrings';
import { APP_CONFIG } from '../../constants/config';
import { UI_STRINGS } from '../../constants/strings';
import { palette } from '../../theme/colors';

const S = UI_STRINGS.BOOKING;

export function TicketCouponPack() {
  const [expanded, setExpanded] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  return (
    <View testID='ticket-coupon-pack' style={styles.container}>
      <TouchableOpacity
        testID='ticket-coupon-toggle'
        accessibilityRole='button'
        accessibilityLabel={S.COUPON_TITLE}
        accessibilityState={{ expanded }}
        activeOpacity={0.8}
        onPress={() => setExpanded((value) => !value)}
        style={styles.toggle}>
        <View style={styles.heading}>
          <BookingReelAsset name='gift' />
          <View style={styles.headingText}>
            <Text style={styles.title}>
              {BOOKING_REEL_UI.BOOKING.COUPON_TITLE}
            </Text>
            <Text style={styles.summary}>
              {BOOKING_REEL_UI.BOOKING.COUPON_NOTE}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.coupons}>
          {APP_CONFIG.MYREALTRIP_TICKET_COUPONS.map((coupon) => (
            <View key={coupon.code} style={styles.coupon}>
              <View style={styles.couponInfo}>
                <Text style={styles.discount}>
                  {coupon.discount.toLocaleString()}원
                </Text>
                <Text style={styles.condition}>
                  {coupon.minimumPrice.toLocaleString()}원 {S.COUPON_CONDITION}
                </Text>
                <Text style={styles.code}>{coupon.code}</Text>
              </View>
              <TouchableOpacity
                testID={`ticket-coupon-copy-${coupon.code}`}
                accessibilityRole='button'
                accessibilityLabel={`${coupon.code} ${S.COUPON_COPY}`}
                onPress={() => {
                  Clipboard.setString(coupon.code);
                  setCopiedCode(coupon.code);
                }}
                style={styles.copyButton}>
                <View style={StyleSheet.absoluteFill} pointerEvents='none'>
                  <BookingReelAsset name='copyCircle' />
                </View>
                {copiedCode === coupon.code ? (
                  <Text style={styles.copyText}>{S.COUPON_COPIED}</Text>
                ) : (
                  <BookingReelAsset name='copy' />
                )}
              </TouchableOpacity>
            </View>
          ))}
          <Text style={styles.note}>{S.COUPON_NOTE}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 7,
    backgroundColor: palette.gray100,
    borderRadius: 24,
    overflow: 'hidden',
  },
  toggle: {
    paddingHorizontal: 19,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headingText: { flex: 1, gap: 3 },
  title: {
    color: palette.deepNavy,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -1,
  },
  summary: {
    color: palette.gray500,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: -1,
  },
  coupons: { gap: 12, paddingHorizontal: 19, paddingBottom: 24 },
  coupon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    minHeight: 94,
    borderRadius: 16,
    backgroundColor: palette.white,
  },
  couponInfo: { flex: 1, gap: 3 },
  discount: {
    color: palette.deepNavy,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -1,
  },
  condition: { color: palette.mutedText, fontSize: 14, letterSpacing: -1 },
  code: { color: palette.mutedText, fontSize: 10, fontWeight: '700' },
  copyButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: palette.primary,
  },
  copyText: { color: palette.white, fontSize: 12, fontWeight: '600' },
  note: { color: palette.mutedText, fontSize: 11, lineHeight: 17 },
});
