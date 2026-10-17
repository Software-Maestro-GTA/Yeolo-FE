/**
 * @file BookingReelAsset.tsx
 * @description 빌드 시 변환한 SVG를 고유 크기로 표시하는 예약·릴스 자산 렌더러.
 */
import BackSvg from '../../../assets/images/figma-course/back.svg';
import BackEditorSvg from '../../../assets/figma-v3/booking-reels/back-editor.svg';
import CloseSvg from '../../../assets/figma-v3/booking-reels/close.svg';
import CalendarSvg from '../../../assets/figma-v3/booking-reels/calendar.svg';
import PlaneSvg from '../../../assets/figma-v3/booking-reels/plane.svg';
import PlaneTicketSvg from '../../../assets/figma-v3/booking-reels/plane-ticket.svg';
import PersonSvg from '../../../assets/figma-v3/booking-reels/person.svg';
import PlusSvg from '../../../assets/figma-v3/booking-reels/plus.svg';
import MinusSvg from '../../../assets/figma-v3/booking-reels/minus.svg';
import GiftSvg from '../../../assets/figma-v3/booking-reels/gift.svg';
import CopySvg from '../../../assets/figma-v3/booking-reels/copy.svg';
import CopyCircleSvg from '../../../assets/figma-v3/booking-reels/copy-circle.svg';
import PhotoSvg from '../../../assets/figma-v3/booking-reels/photo.svg';
import VideoSvg from '../../../assets/figma-v3/booking-reels/video.svg';
import SearchSvg from '../../../assets/images/figma-course/search.svg';
import DepartureSvg from '../../../assets/figma-v3/booking-reels/departure.svg';
import ArrivalSvg from '../../../assets/figma-v3/booking-reels/arrival.svg';
import InfoSvg from '../../../assets/figma-v3/booking-reels/info.svg';
import StarSvg from '../../../assets/figma-v3/booking-reels/star.svg';
import DestinationDividerSvg from '../../../assets/figma-v3/booking-reels/destination-divider.svg';
import HotelOverlaySvg from '../../../assets/figma-v3/booking-reels/hotel-overlay.svg';
import TicketOverlaySvg from '../../../assets/figma-v3/booking-reels/ticket-overlay.svg';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from '../common/Typography';
import { BOOKING_REEL_UI } from '../../constants/bookingReelUiStrings';
import { palette } from '../../theme/colors';
const assets = {
  back: BackSvg,
  backEditor: BackEditorSvg,
  close: CloseSvg,
  calendar: CalendarSvg,
  plane: PlaneSvg,
  planeTicket: PlaneTicketSvg,
  person: PersonSvg,
  plus: PlusSvg,
  minus: MinusSvg,
  gift: GiftSvg,
  copy: CopySvg,
  copyCircle: CopyCircleSvg,
  photo: PhotoSvg,
  video: VideoSvg,
  search: SearchSvg,
  departure: DepartureSvg,
  arrival: ArrivalSvg,
  info: InfoSvg,
  caret: BackSvg,
  star: StarSvg,
  destinationDivider: DestinationDividerSvg,
  hotelOverlay: HotelOverlaySvg,
  ticketOverlay: TicketOverlaySvg,
};
/** Displays a downloaded vector without overriding its intrinsic root dimensions. */
export function BookingReelAsset({ name }: { name: keyof typeof assets }) {
  const Vector = assets[name];
  return <Vector />;
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
