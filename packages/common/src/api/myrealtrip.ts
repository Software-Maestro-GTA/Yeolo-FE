/**
 * @file myrealtrip.ts
 * @description MyRealTrip partner API transport, product discovery and affiliate link creation.
 */
export type BookingKind = 'flight' | 'hotel' | 'ticket';
export interface BookingProduct {
  itemName: string;
  productUrl: string;
  salePrice: number;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  priceDisplay?: string | null;
  starRating?: number | null;
  reviewScore?: string | number | null;
  reviewCount?: number | null;
  imageUrl?: string | null;
}
export interface BookingHotelPage {
  items: BookingProduct[];
  page: number;
  totalCount: number;
  hasMore: boolean;
}
export interface BookingTicketPage extends BookingHotelPage {}
export interface BookingRegion {
  regionId: number;
  name: string;
  subName?: string;
}
export interface BookingAirport {
  airport: { code: string; koName?: string; enName?: string };
}
export class MyRealTripError extends Error {
  constructor(
    public readonly code: 'configuration' | 'response' | 'request',
    public readonly status?: number,
  ) {
    super(`MyRealTrip ${code}`);
    this.name = 'MyRealTripError';
  }
}

/** Only HTTPS links on MRT-owned hosts may leave the app or become affiliate targets. */
export function isMyRealTripUrl(
  value: unknown,
  shortLink = false,
): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      (shortLink
        ? url.hostname === 'myrealt.rip'
        : url.hostname === 'myrealtrip.com' ||
          url.hostname.endsWith('.myrealtrip.com'))
    );
  } catch {
    return false;
  }
}

/** Creates an isolated MRT client. Never uses Yeolo's bearer token or logs credentials. */
export function createMyRealTripClient(apiKey: string) {
  async function post<T>(
    path: string,
    body: object,
    signal?: AbortSignal,
  ): Promise<T> {
    if (!apiKey.trim()) throw new MyRealTripError('configuration');
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort);
    const timer = setTimeout(abort, 15000);
    try {
      const response = await fetch(
        `https://partner-ext-api.myrealtrip.com/v1/${path}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new MyRealTripError('request', response.status);
      const json = await response.json();
      if (
        !json ||
        json.data == null ||
        (json.result?.status !== undefined && json.result.status !== 200)
      ) {
        throw new MyRealTripError('response');
      }
      return json.data as T;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
  async function createLink(
    targetUrl: string,
    signal?: AbortSignal,
  ): Promise<string> {
    if (!isMyRealTripUrl(targetUrl)) throw new MyRealTripError('response');
    const data = await post<{ mylink: string }>(
      'mylink',
      { targetUrl },
      signal,
    );
    if (!isMyRealTripUrl(data.mylink, true))
      throw new MyRealTripError('response');
    return data.mylink;
  }
  function products(data: { items: BookingProduct[] }): BookingProduct[] {
    if (!Array.isArray(data.items)) throw new MyRealTripError('response');
    return data.items.filter(
      (item) =>
        item &&
        typeof item.itemName === 'string' &&
        isMyRealTripUrl(item.productUrl) &&
        Number.isFinite(item.salePrice) &&
        item.salePrice >= 0,
    );
  }
  async function searchTicketPage(
    keyword: string,
    page = 1,
    signal?: AbortSignal,
  ): Promise<BookingTicketPage> {
    const size = 20;
    const data = await post<{
      items: BookingProduct[];
      totalCount?: number;
    }>('products/tna/search', { keyword: keyword.trim(), page, size }, signal);
    const items = products(data);
    const totalCount =
      Number.isSafeInteger(data.totalCount) && data.totalCount! >= 0
        ? data.totalCount!
        : (page - 1) * size +
          data.items.length +
          (data.items.length === size ? 1 : 0);
    return {
      items,
      page,
      totalCount,
      hasMore: page * size < totalCount,
    };
  }
  return {
    createLink,
    searchTicketPage,
    async searchAirports(
      keyword: string,
      signal?: AbortSignal,
    ): Promise<BookingAirport[]> {
      const data = await post<{ airports: BookingAirport[] }>(
        'products/flight/airport-autocomplete',
        { keyword: keyword.trim(), size: 10 },
        signal,
      );
      if (!Array.isArray(data.airports)) throw new MyRealTripError('response');
      return data.airports.filter((item) =>
        /^[A-Z]{3}$/.test(item?.airport?.code),
      );
    },
    async searchRegions(
      keyword: string,
      isDomestic: boolean,
      signal?: AbortSignal,
    ): Promise<BookingRegion[]> {
      const data = await post<{ regions: BookingRegion[] }>(
        'products/accommodation/region-autocomplete',
        { keyword: keyword.trim(), isDomestic },
        signal,
      );
      if (!Array.isArray(data.regions)) throw new MyRealTripError('response');
      return data.regions.filter(
        (item) =>
          item &&
          Number.isSafeInteger(item.regionId) &&
          typeof item.name === 'string',
      );
    },
    async searchHotels(
      input: {
        regionId: number;
        checkIn: string;
        checkOut: string;
        adultCount: number;
        page?: number;
      },
      signal?: AbortSignal,
    ): Promise<BookingHotelPage> {
      const page = input.page ?? 0;
      const size = 20;
      const data = await post<{
        items: BookingProduct[];
        totalCount?: number;
        page?: number;
      }>('products/accommodation/search', { ...input, page, size }, signal);
      const items = products(data);
      const totalCount =
        Number.isSafeInteger(data.totalCount) && data.totalCount! >= 0
          ? data.totalCount!
          : page * size +
            data.items.length +
            (data.items.length === size ? 1 : 0);
      return {
        items,
        page,
        totalCount,
        hasMore: (page + 1) * size < totalCount,
      };
    },
    async searchTickets(keyword: string, signal?: AbortSignal) {
      return (await searchTicketPage(keyword, 1, signal)).items;
    },
    async createFlightLink(
      input: {
        depAirportCd: string;
        arrAirportCd: string;
        depDate: string;
        arrDate: string;
        adult: number;
      },
      signal?: AbortSignal,
    ) {
      const target = await post<string>(
        'products/flight/fare-query-landing-url',
        { ...input, tripTypeCd: 'RT' },
        signal,
      );
      return createLink(target, signal);
    },
  };
}
