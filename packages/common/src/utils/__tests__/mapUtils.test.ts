/**
 * @file mapUtils.test.ts
 * @description Unit tests for map calculations and coordinate validation utilities.
 */
import {
  isValidCoordinate,
  calculateRegion,
  getAdjustedCoordinates,
  getLeafletMapHtml,
} from '../mapUtils';

describe('mapUtils', () => {
  describe('isValidCoordinate', () => {
    it('유효한 위경도 좌표인 경우 true를 반환해야 한다', () => {
      expect(
        isValidCoordinate({ latitude: 33.5434, longitude: 126.6692 }),
      ).toBe(true);
      expect(isValidCoordinate({ latitude: 37.5665, longitude: 126.978 })).toBe(
        true,
      );
    });

    it('0, 0 (Null Island) 좌표는 유효하지 않은 것으로 간주해야 한다', () => {
      expect(isValidCoordinate({ latitude: 0, longitude: 0 })).toBe(false);
      expect(
        isValidCoordinate({ latitude: 0.0000001, longitude: 0.0000001 }),
      ).toBe(false);
    });

    it('null, undefined, NaN, 범위 외 좌표는 유효하지 않은 것으로 간주해야 한다', () => {
      expect(isValidCoordinate(null)).toBe(false);
      expect(isValidCoordinate(undefined)).toBe(false);
      expect(isValidCoordinate({ latitude: NaN, longitude: 126.5 })).toBe(
        false,
      );
      expect(isValidCoordinate({ latitude: 95, longitude: 126.5 })).toBe(false);
      expect(isValidCoordinate({ latitude: 33.5, longitude: 200 })).toBe(false);
    });
  });

  describe('calculateRegion', () => {
    it('유효하지 않은 좌표(0, 0 등)는 영역 계산에서 제외되어야 한다', () => {
      const stops = [
        { placeName: '정상 장소 1', latitude: 33.5, longitude: 126.5 },
        { placeName: '비정상 장소 (0,0)', latitude: 0, longitude: 0 },
        { placeName: '정상 장소 2', latitude: 33.6, longitude: 126.6 },
      ];

      const region = calculateRegion(stops);
      expect(region).toBeDefined();
      // 0,0이 포함되지 않고 33.5와 33.6 사이의 중심이어야 함
      expect(region!.latitude).toBeCloseTo(33.55, 2);
      expect(region!.longitude).toBeCloseTo(126.55, 2);
      expect(region!.latitudeDelta).toBeLessThan(1);
    });

    it('유효한 좌표가 하나도 없으면 undefined를 반환해야 한다', () => {
      const invalidStops = [
        { placeName: '비정상 장소 1', latitude: 0, longitude: 0 },
        { placeName: '비정상 장소 2', latitude: NaN, longitude: NaN },
      ];

      const region = calculateRegion(invalidStops);
      expect(region).toBeUndefined();
    });

    it('유효한 단일 좌표인 경우 해당 좌표 기준의 기본 delta를 반환해야 한다', () => {
      const stops = [
        { placeName: '정상 장소 1', latitude: 33.5434, longitude: 126.6692 },
        { placeName: '비정상 장소', latitude: 0, longitude: 0 },
      ];

      const region = calculateRegion(stops);
      expect(region).toBeDefined();
      expect(region!.latitude).toBe(33.5434);
      expect(region!.longitude).toBe(126.6692);
      expect(region!.latitudeDelta).toBe(0.05);
    });
  });

  describe('getAdjustedCoordinates', () => {
    it('유효하지 않은 좌표는 조정 목록에서 제외되어야 한다', () => {
      const stops = [
        { placeName: '정상 장소', latitude: 33.5, longitude: 126.5 },
        { placeName: '비정상 장소', latitude: 0, longitude: 0 },
      ];

      const adjusted = getAdjustedCoordinates(stops);
      expect(adjusted.length).toBe(1);
      expect(adjusted[0].placeName).toBe('정상 장소');
    });
  });

  describe('getLeafletMapHtml', () => {
    it('유효하지 않은 좌표만 있을 경우 빈 문자열을 반환해야 한다', () => {
      const html = getLeafletMapHtml([
        { placeName: '비정상', latitude: 0, longitude: 0 },
      ]);
      expect(html).toBe('');
    });
  });
});
