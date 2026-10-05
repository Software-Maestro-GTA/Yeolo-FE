/**
 * @file TicketCouponPack.tsx
 * @description Expandable MyRealTrip overseas tour coupon codes with one-tap copying.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { UI_STRINGS } from '../../constants/strings';
import { palette } from '../../theme/colors';

const S = UI_STRINGS.BOOKING;

export function TicketCouponPack() {
  const [expanded, setExpanded] = useState(false);
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
          <Ionicons name='gift-outline' size={20} color={palette.purple} />
          <View style={styles.headingText}>
            <Text style={styles.title}>{S.COUPON_TITLE}</Text>
            <Text style={styles.summary}>
              {expanded ? S.COUPON_HIDE : S.COUPON_SUMMARY}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={palette.purple}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.coupons}>
          {APP_CONFIG.MYREALTRIP_TICKET_COUPONS.map((coupon) => (
            <View key={coupon.code} style={styles.coupon}>
              <View style={styles.couponInfo}>
                <Text style={styles.discount}>
                  ₩{coupon.discount.toLocaleString()} {S.COUPON_DISCOUNT}
                </Text>
                <Text style={styles.condition}>
                  ₩{coupon.minimumPrice.toLocaleString()} {S.COUPON_CONDITION}
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
                <Text style={styles.copyText}>
                  {copiedCode === coupon.code ? S.COUPON_COPIED : S.COUPON_COPY}
                </Text>
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
    backgroundColor: palette.white,
    borderColor: palette.gray200,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headingText: { flex: 1, gap: 3 },
  title: { color: palette.deepNavy, fontSize: 14, fontWeight: '700' },
  summary: { color: palette.purple, fontSize: 12, fontWeight: '600' },
  coupons: { gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  coupon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.softMint,
  },
  couponInfo: { flex: 1, gap: 3 },
  discount: { color: palette.deepNavy, fontSize: 15, fontWeight: '800' },
  condition: { color: palette.subText, fontSize: 12 },
  code: { color: palette.purple, fontSize: 12, fontWeight: '700' },
  copyButton: {
    minWidth: 60,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: palette.lightTeal,
  },
  copyText: { color: palette.darkTeal, fontSize: 12, fontWeight: '700' },
  note: { color: palette.mutedText, fontSize: 11, lineHeight: 17 },
});
