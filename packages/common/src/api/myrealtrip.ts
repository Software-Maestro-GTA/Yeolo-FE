/**
 * @file myrealtrip.ts
 * @description Authenticated Yeolo MRT API transport, booking data and validated affiliate links.
 */
import { createHttpClient } from './kyClient';

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
  totalCount: number | null;
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
export interface BookingCoupon {
  code: string;
  minimumPrice: number;
  discount: number;
}
export interface BookingHotelQuery {
  regionId: number;
  checkIn: string;
  checkOut: string;
  adultCount: number;
  page?: number;
}
export interface BookingFlightQuery {
  depAirportCd: string;
  arrAirportCd: string;
  depDate: string;
  arrDate: string;
  adult: number;
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
    // URL.port drops an explicit default :443, so also inspect the authority.
    const authority = value.match(/^https:\/\/([^/?#]+)/i)?.[1];
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      !!authority &&
      !authority.includes(':') &&
      (shortLink
        ? url.hostname === 'myrealt.rip'
        : url.hostname === 'myrealtrip.com' ||
          url.hostname.endsWith('.myrealtrip.com'))
    );
  } catch {
    return false;
  }
}

/**
 * Creates an authenticated Yeolo client for the seven server-managed MRT APIs.
 * @param baseUrl Yeolo backend base URL; no partner credential is accepted.
 * @returns Booking searches, affiliate link creation and active coupon lookup.
 * @throws MyRealTripError for request failures or malformed response data.
 */
export function createMyRealTripClient(baseUrl: string) {
  const client = createHttpClient(baseUrl, { timeout: 15000, retry: 0 });

  async function request<T>(
    path: string,
    method: 'GET' | 'POST',
    input?: Record<string, string | number | boolean>,
    signal?: AbortSignal,
  ): Promise<T> {
    if (!baseUrl.trim()) throw new MyRealTripError('configuration');
    const response = await client(`api/myrealtrip/${path}`, {
      method,
      ...(method === 'GET' ? { searchParams: input } : { json: input }),
      signal: signal ?? null,
    });
    const result = (await response.json().catch(() => null)) as {
      status?: number;
      data?: T;
    } | null;
    if (
      !response.ok ||
      (typeof result?.status === 'number' && result.status !== 200)
    ) {
      throw new MyRealTripError(
        'request',
        response.ok ? result!.status : response.status,
      );
    }
    if (
      !result ||
      result.status !== 200 ||
      !result.data ||
      typeof result.data !== 'object'
    ) {
      throw new MyRealTripError('response');
    }
    return result.data;
  }

  function affiliateUrl(data: { url: string }): string {
    if (!isMyRealTripUrl(data.url, true)) throw new MyRealTripError('response');
    return data.url;
  }

  async function createLink(
    targetUrl: string,
    signal?: AbortSignal,
  ): Promise<string> {
    if (!isMyRealTripUrl(targetUrl)) throw new MyRealTripError('response');
    return affiliateUrl(
      await request<{ url: string }>('links', 'POST', { targetUrl }, signal),
    );
  }

  function productPage(data: BookingHotelPage): BookingHotelPage {
    if (
      !Array.isArray(data.items) ||
      !Number.isSafeInteger(data.page) ||
      data.page < 1 ||
      (data.totalCount !== null &&
        (!Number.isSafeInteger(data.totalCount) || data.totalCount < 0)) ||
      typeof data.hasMore !== 'boolean'
    ) {
      throw new MyRealTripError('response');
    }
    return {
      items: data.items.filter(
        (item) =>
          item &&
          typeof item.itemName === 'string' &&
          isMyRealTripUrl(item.productUrl) &&
          Number.isFinite(item.salePrice) &&
          item.salePrice >= 0,
      ),
      page: data.page,
      totalCount: data.totalCount,
      hasMore: data.hasMore,
    };
  }

  async function searchTicketPage(
    keyword: string,
    page = 1,
    signal?: AbortSignal,
  ): Promise<BookingTicketPage> {
    return productPage(
      await request<BookingTicketPage>(
        'tickets',
        'GET',
        { keyword: keyword.trim(), page },
        signal,
      ),
    );
  }

  return {
    createLink,
    searchTicketPage,
    async searchAirports(
      keyword: string,
      signal?: AbortSignal,
    ): Promise<BookingAirport[]> {
      const data = await request<{ airports: BookingAirport[] }>(
        'airports',
        'GET',
        { keyword: keyword.trim() },
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
      const data = await request<{ regions: BookingRegion[] }>(
        'regions',
        'GET',
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
      input: BookingHotelQuery,
      signal?: AbortSignal,
    ): Promise<BookingHotelPage> {
      return productPage(
        await request<BookingHotelPage>(
          'hotels',
          'GET',
          { ...input, page: input.page ?? 1 },
          signal,
        ),
      );
    },
    async searchTickets(keyword: string, signal?: AbortSignal) {
      return (await searchTicketPage(keyword, 1, signal)).items;
    },
    async createFlightLink(
      input: BookingFlightQuery,
      signal?: AbortSignal,
    ): Promise<string> {
      return affiliateUrl(
        await request<{ url: string }>(
          'flights/link',
          'POST',
          { ...input },
          signal,
        ),
      );
    },
    async getCoupons(signal?: AbortSignal): Promise<BookingCoupon[]> {
      const data = await request<{ coupons: BookingCoupon[] }>(
        'coupons',
        'GET',
        undefined,
        signal,
      );
      if (!Array.isArray(data.coupons)) throw new MyRealTripError('response');
      const seen = new Set<string>();
      return data.coupons.filter((coupon) => {
        if (
          !coupon ||
          typeof coupon.code !== 'string' ||
          !coupon.code.trim() ||
          seen.has(coupon.code) ||
          !Number.isSafeInteger(coupon.minimumPrice) ||
          coupon.minimumPrice < 0 ||
          !Number.isSafeInteger(coupon.discount) ||
          coupon.discount < 0
        )
          return false;
        seen.add(coupon.code);
        return true;
      });
    },
  };
}
