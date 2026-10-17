/**
 * @file BookingReelAsset.tsx
 * @description Figma 원본 SVG의 고유 크기를 유지하는 예약·릴스 로컬 자산 렌더러.
 */
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from '../common/Typography';
import { SvgUri } from 'react-native-svg';
import { BOOKING_REEL_UI } from '../../constants/bookingReelUiStrings';
import { palette } from '../../theme/colors';
const assets = {
  back: require('../../../assets/images/figma-course/back.svg'),
  backEditor: require('../../../assets/figma-v3/booking-reels/back-editor.svg'),
  close: require('../../../assets/figma-v3/booking-reels/close.svg'),
  calendar: require('../../../assets/figma-v3/booking-reels/calendar.svg'),
  plane: require('../../../assets/figma-v3/booking-reels/plane.svg'),
  planeTicket: require('../../../assets/figma-v3/booking-reels/plane-ticket.svg'),
  person: require('../../../assets/figma-v3/booking-reels/person.svg'),
  plus: require('../../../assets/figma-v3/booking-reels/plus.svg'),
  minus: require('../../../assets/figma-v3/booking-reels/minus.svg'),
  gift: require('../../../assets/figma-v3/booking-reels/gift.svg'),
  copy: require('../../../assets/figma-v3/booking-reels/copy.svg'),
  copyCircle: require('../../../assets/figma-v3/booking-reels/copy-circle.svg'),
  photo: require('../../../assets/figma-v3/booking-reels/photo.svg'),
  video: require('../../../assets/figma-v3/booking-reels/video.svg'),
  search: require('../../../assets/images/figma-course/search.svg'),
  departure: require('../../../assets/figma-v3/booking-reels/departure.svg'),
  arrival: require('../../../assets/figma-v3/booking-reels/arrival.svg'),
  info: require('../../../assets/figma-v3/booking-reels/info.svg'),
  caret: require('../../../assets/images/figma-course/back.svg'),
  star: require('../../../assets/figma-v3/booking-reels/star.svg'),
  destinationDivider: require('../../../assets/figma-v3/booking-reels/destination-divider.svg'),
  hotelOverlay: require('../../../assets/figma-v3/booking-reels/hotel-overlay.svg'),
  ticketOverlay: require('../../../assets/figma-v3/booking-reels/ticket-overlay.svg'),
};
/** Displays a downloaded vector without overriding its intrinsic root dimensions. */
export function BookingReelAsset({ name }: { name: keyof typeof assets }) {
  return <SvgUri uri={Image.resolveAssetSource(assets[name]).uri} />;
}
/** Places the downloaded Figma shade over dynamic product photos at its original card edge. */
export function BookingProductShade({ kind }: { kind: 'hotel' | 'ticket' }) {
  const [width, setWidth] = useState(165);
  const shadeStyle = StyleSheet.create({
    hotel: { transform: [{ scaleX: width / 165 }] },
  });
  return (
    <View
      pointerEvents='none'
      style={StyleSheet.absoluteFill}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {kind === 'hotel' ? (
        <View style={[styles.hotelShade, shadeStyle.hotel]}>
          <BookingReelAsset name='hotelOverlay' />
        </View>
      ) : (
        <View style={styles.ticketShade}>
          <BookingReelAsset name='ticketOverlay' />
        </View>
      )}
    </View>
  );
}
/** Displays the partner wordmark using the exact crop specified by the Figma image layer. */
export function BookingPartner({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.partner}>
      <Text style={styles.partnerText}>{BOOKING_REEL_UI.BOOKING.PARTNER}</Text>
      <View style={[styles.logoCrop, compact && styles.compactCrop]}>
        <Image
          source={require('../../../assets/figma-v3/booking-reels/myrealtrip.png')}
          style={[styles.logo, compact && styles.compactLogo]}
          accessibilityLabel='MyRealTrip'
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  hotelShade: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: 165,
    height: 78,
  },
  ticketShade: {
    position: 'absolute',
    left: -9.5,
    top: 9.5,
    width: 179,
    height: 160,
    transform: [{ rotate: '90deg' }],
  },
  partner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  partnerText: { color: palette.mutedText, fontSize: 14, lineHeight: 27 },
  logoCrop: { width: 111, height: 30, overflow: 'hidden' },
  compactCrop: { width: 81, height: 18 },
  compactLogo: { top: -27.6, left: -15.12 },
  logo: {
    position: 'absolute',
    width: 111.24,
    height: 74.2,
    top: -21.6,
    left: -0.12,
  },
});
