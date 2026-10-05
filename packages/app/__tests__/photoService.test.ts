/**
 * @file photoService.test.ts
 * @description Representative photo metadata selection and bounded native library access regressions.
 */
import { requestPermissionsAsync } from 'expo-media-library';
import { fetchPhotosWithExifData } from '../src/services/photoService';

const mockQueries: {
  start: number;
  end: number;
  offset: number;
  limit: number;
}[] = [];
let mockAssets: ReturnType<typeof asset>[] = [];

jest.mock('expo-media-library', () => {
  class Query {
    start = -Infinity;
    end = Infinity;
    skip = 0;
    count = Infinity;
    eq() {
      return this;
    }
    orderBy() {
      return this;
    }
    gte(_field: string, value: number) {
      this.start = value;
      return this;
    }
    lt(_field: string, value: number) {
      this.end = value;
      return this;
    }
    offset(value: number) {
      this.skip = value;
      return this;
    }
    limit(value: number) {
      this.count = value;
      return this;
    }
    async exe() {
      mockQueries.push({
        start: this.start,
        end: this.end,
        offset: this.skip,
        limit: this.count,
      });
      return mockAssets
        .filter((a) => a.time >= this.start && a.time < this.end)
        .sort((a, b) => b.time - a.time)
        .slice(this.skip, this.skip + this.count);
    }
  }
  return {
    Query,
    requestPermissionsAsync: jest.fn(),
    AssetField: { MEDIA_TYPE: 'mediaType', CREATION_TIME: 'creationTime' },
    MediaType: { IMAGE: 'photo' },
  };
});

const NOW = Date.parse('2026-10-03T12:00:00Z');
const DAY = 86_400_000;
function asset(
  id: string,
  daysAgo: number,
  lat = 37.5,
  lon = 127,
  minutes = 0,
) {
  const time = NOW - daysAgo * DAY + minutes * 60_000;
  return {
    id,
    time,
    getCreationTime: jest.fn().mockResolvedValue(time),
    getLocation: jest.fn().mockResolvedValue({ latitude: lat, longitude: lon }),
  };
}
function diverse() {
  return Array.from({ length: 6 }, (_, i) =>
    asset(`visit-${i}`, 2 + i * 40, 37.5 + i * 0.01),
  );
}

describe('representative photo collection', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    mockQueries.length = 0;
    mockAssets = diverse();
    (requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      accessPrivileges: 'all',
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('searches past a GPS-less latest page and retains older periods', async () => {
    const recent = Array.from({ length: 100 }, (_, i) => {
      const a = asset(`no-gps-${i}`, 1, 37.5, 127, i);
      a.getLocation.mockResolvedValue(null);
      return a;
    });
    mockAssets = [...recent, ...diverse(), asset('last-year', 330, 35)];
    const result = await fetchPhotosWithExifData();
    expect(result).toHaveLength(7);
    expect(result.map((a) => a.sourceImageId)).toContain('last-year');
    expect(mockQueries.some((q) => q.offset > 0)).toBe(true);
  });

  it('collapses a burst with GPS jitter to one representative', async () => {
    mockAssets.push(
      ...Array.from({ length: 80 }, (_, i) =>
        asset(`burst-${i}`, 2, 37.50001, 127, i / 10),
      ),
    );
    const result = await fetchPhotosWithExifData();
    expect(result).toHaveLength(6);
    expect(result.filter((a) => a.latitude < 37.501)).toHaveLength(1);
  });

  it('retains repeated visits on different dates and a later return to the same place', async () => {
    mockAssets = Array.from({ length: 5 }, (_, i) =>
      asset(`repeat-${i}`, 2 + i),
    );
    mockAssets.push(asset('return', 2, 37.5, 127, 180));
    expect(await fetchPhotosWithExifData()).toHaveLength(6);
  });

  it('limits each day to five representatives and spreads a capped payload across periods', async () => {
    mockAssets = Array.from({ length: 40 }, (_, i) =>
      asset(`busy-${i}`, 2, 37 + i * 0.01),
    );
    mockAssets.push(...diverse().slice(1));
    const result = await fetchPhotosWithExifData(6);
    expect(result).toHaveLength(6);
    expect(
      result.filter((a) => a.capturedAt.startsWith('2026-10-01')),
    ).toHaveLength(1);
    expect(
      (await fetchPhotosWithExifData()).filter((a) =>
        a.capturedAt.startsWith('2026-10-01'),
      ),
    ).toHaveLength(5);
  });

  it('rejects non-finite/out-of-range coordinates, invalid times and old/future records', async () => {
    const invalidTime = asset('invalid-time', 1);
    invalidTime.getCreationTime.mockResolvedValue(NaN);
    mockAssets.push(
      asset('nan', 1, NaN),
      asset('bad-lat', 1, 91),
      asset('bad-lon', 1, 37, -181),
      invalidTime,
      asset('old', 366),
      asset('future', -1),
    );
    expect(
      (await fetchPhotosWithExifData()).map((a) => a.sourceImageId).sort(),
    ).toEqual(
      diverse()
        .map((a) => a.id)
        .sort(),
    );
  });

  it('deduplicates asset IDs and continues after a per-asset native failure', async () => {
    const broken = asset('broken', 1);
    broken.getLocation.mockRejectedValue(new Error('unavailable'));
    mockAssets.push(mockAssets[0], broken);
    expect(await fetchPhotosWithExifData()).toHaveLength(6);
  });

  it('does not treat zero latitude/longitude as missing', async () => {
    mockAssets.push(asset('equator', 10, 0, 0));
    expect(
      (await fetchPhotosWithExifData()).some(
        (a) => a.sourceImageId === 'equator',
      ),
    ).toBe(true);
  });

  it('fails before querying when permission is denied', async () => {
    (requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    await expect(fetchPhotosWithExifData()).rejects.toThrow();
    expect(mockQueries).toHaveLength(0);
  });

  it('distinguishes an empty library from records without GPS', async () => {
    mockAssets = [];
    await expect(fetchPhotosWithExifData()).rejects.toThrow(/최근 1년/);
    mockAssets = diverse();
    mockAssets.forEach((a) => a.getLocation.mockResolvedValue(null));
    await expect(fetchPhotosWithExifData()).rejects.toThrow(/위치와 시간/);
  });

  it('caps oversized requested payloads at 100 and covers all 12 periods', async () => {
    mockAssets = Array.from({ length: 360 }, (_, i) =>
      asset(`day-${i}`, 1 + i, 37 + (i % 5) * 0.01),
    );
    const result = await fetchPhotosWithExifData(1000);
    expect(result).toHaveLength(100);
    expect(result.every((a) => a.timezone === 'UTC')).toBe(true);
    for (const q of mockQueries) {
      expect(
        result.some(
          (a) =>
            Date.parse(a.capturedAt) >= q.start &&
            Date.parse(a.capturedAt) < q.end,
        ),
      ).toBe(true);
    }
    expect(mockQueries).toHaveLength(12);
  });

  it('includes exactly the lookback boundary and now without duplicate period boundaries', async () => {
    mockAssets.push(asset('cutoff', 365), asset('now', 0));
    const result = await fetchPhotosWithExifData();
    expect(result.map((a) => a.sourceImageId)).toEqual(
      expect.arrayContaining(['cutoff', 'now']),
    );
    expect(new Set(result.map((a) => a.sourceImageId)).size).toBe(
      result.length,
    );
    const sortedWindows = [...mockQueries].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sortedWindows.length; i++)
      expect(sortedWindows[i - 1].end).toBe(sortedWindows[i].start);
  });

  it('keeps metadata reads bounded to four concurrent assets', async () => {
    let active = 0;
    let peak = 0;
    mockAssets = Array.from({ length: 20 }, (_, i) =>
      asset(`parallel-${i}`, 1 + i, 37 + i * 0.01),
    );
    mockAssets.forEach((a) =>
      a.getLocation.mockImplementation(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 1));
        active--;
        return { latitude: 37, longitude: 127 };
      }),
    );
    await fetchPhotosWithExifData();
    expect(peak).toBe(4);
    expect(active).toBe(0);
  });

  it('rejects a single-day burst rather than sending a misleading tiny sample', async () => {
    mockAssets = Array.from({ length: 100 }, (_, i) =>
      asset(`burst-${i}`, 2, 37 + i * 0.01),
    );
    await expect(fetchPhotosWithExifData()).rejects.toThrow(/여러 날짜/);
  });

  it('uses only accessible assets under limited permission', async () => {
    (requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      accessPrivileges: 'limited',
    });
    expect(await fetchPhotosWithExifData()).toHaveLength(6);
    mockAssets = [asset('only-one', 2)];
    await expect(fetchPhotosWithExifData()).rejects.toThrow(/선택한 사진/);
  });

  it('bounds dense-library reads to 250 candidates per period', async () => {
    mockAssets = Array.from({ length: 400 }, (_, i) =>
      asset(`dense-${i}`, 1 + i / 500, 37 + i / 10000),
    );
    mockAssets.push(...diverse().slice(1));
    await fetchPhotosWithExifData();
    expect(
      mockQueries
        .filter((q) => q.start > NOW - 31 * DAY)
        .reduce((sum, q) => sum + q.limit, 0),
    ).toBe(250);
    expect(
      mockAssets.filter(
        (a) => a.id.startsWith('dense-') && a.getLocation.mock.calls.length,
      ),
    ).toHaveLength(250);
  });
});
