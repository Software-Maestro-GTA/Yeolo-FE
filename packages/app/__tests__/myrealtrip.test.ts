/**
 * @jest-environment node
 * @file myrealtrip.test.ts
 * @description Verifies MRT's documented HTTP contracts and safe affiliate links using MSW.
 */
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { createMyRealTripClient, isMyRealTripUrl } from '@yeolo/common';

const base = 'https://partner-ext-api.myrealtrip.com/v1';
const server = setupServer();
const client = createMyRealTripClient('test-partner-key');
const product = {
  itemName: '제주 입장권',
  salePrice: 10000,
  productUrl: 'https://experiences.myrealtrip.com/products/123',
};
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('투어 keyword/1-based 페이지, 상품 URL, Bearer 인증으로 제휴 단축 링크를 생성한다', async () => {
  const requests: unknown[] = [];
  server.use(
    http.post(`${base}/products/tna/search`, async ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(
        'Bearer test-partner-key',
      );
      requests.push(await request.json());
      return HttpResponse.json({ data: { items: [product] } });
    }),
    http.post(`${base}/mylink`, async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json({
        data: { mylink: 'https://myrealt.rip/ticket123' },
      });
    }),
  );
  const items = await client.searchTickets(' 제주 ');
  expect(await client.createLink(items[0].productUrl)).toBe(
    'https://myrealt.rip/ticket123',
  );
  expect(requests).toEqual([
    { keyword: '제주', page: 1, size: 20 },
    { targetUrl: product.productUrl },
  ]);
});

test('투어 상품 카드 정보와 1-based 다음 페이지 메타데이터를 유지한다', async () => {
  const requests: unknown[] = [];
  const ticket = {
    ...product,
    description: '제주 · 액티비티',
    reviewScore: 4.8,
    reviewCount: 42,
    tags: ['즉시 확정'],
    imageUrl: 'https://example.com/ticket.jpg',
  };
  server.use(
    http.post(`${base}/products/tna/search`, async ({ request }) => {
      const body = (await request.json()) as { page: number };
      requests.push(body);
      return HttpResponse.json({
        data: {
          items: [ticket],
          totalCount: 21,
          page: body.page,
          perPage: 20,
          // 실 API는 totalCount가 21이어도 첫 페이지에서 false를 보낼 수 있다.
          hasNextPage: false,
        },
      });
    }),
  );
  expect(await client.searchTicketPage(' 제주 ', 1)).toEqual({
    items: [ticket],
    page: 1,
    totalCount: 21,
    hasMore: true,
  });
  expect(await client.searchTicketPage('제주', 2)).toEqual({
    items: [ticket],
    page: 2,
    totalCount: 21,
    hasMore: false,
  });
  expect(requests).toEqual([
    { keyword: '제주', page: 1, size: 20 },
    { keyword: '제주', page: 2, size: 20 },
  ]);
});

test('숙소 지역 ID와 날짜/성인 인원을 0-based 검색에 전달한다', async () => {
  server.use(
    http.post(
      `${base}/products/accommodation/region-autocomplete`,
      async ({ request }) => {
        expect(await request.json()).toEqual({
          keyword: '제주',
          isDomestic: true,
        });
        return HttpResponse.json({
          data: { regions: [{ regionId: 777, name: '제주' }] },
        });
      },
    ),
    http.post(`${base}/products/accommodation/search`, async ({ request }) => {
      expect(await request.json()).toEqual({
        regionId: 777,
        checkIn: '2030-12-30',
        checkOut: '2031-01-02',
        adultCount: 2,
        page: 0,
        size: 20,
      });
      return HttpResponse.json({
        data: { items: [], totalCount: 0, page: 0, size: 20 },
      });
    }),
  );
  const [region] = await client.searchRegions('제주', true);
  expect(
    await client.searchHotels({
      regionId: region.regionId,
      checkIn: '2030-12-30',
      checkOut: '2031-01-02',
      adultCount: 2,
    }),
  ).toEqual({ items: [], page: 0, totalCount: 0, hasMore: false });
});

test('숙소 페이지 메타데이터와 카드 정보를 유지하고 다음 페이지를 요청한다', async () => {
  const calls: unknown[] = [];
  const hotel = {
    ...product,
    starRating: 4,
    reviewScore: '4.8',
    reviewCount: 42,
    imageUrl: 'https://example.com/hotel.jpg',
  };
  server.use(
    http.post(`${base}/products/accommodation/search`, async ({ request }) => {
      const body = (await request.json()) as { page: number };
      calls.push(body);
      return HttpResponse.json({
        data: { items: [hotel], totalCount: 21, page: body.page, size: 20 },
      });
    }),
  );
  const query = {
    regionId: 777,
    checkIn: '2030-12-30',
    checkOut: '2031-01-02',
    adultCount: 2,
  };
  expect(await client.searchHotels(query)).toEqual({
    items: [hotel],
    page: 0,
    totalCount: 21,
    hasMore: true,
  });
  expect(await client.searchHotels({ ...query, page: 1 })).toEqual({
    items: [hotel],
    page: 1,
    totalCount: 21,
    hasMore: false,
  });
  expect(calls).toEqual([
    { ...query, page: 0, size: 20 },
    { ...query, page: 1, size: 20 },
  ]);
});

test('항공은 airport.code를 사용하고 랜딩 응답을 mylink API로 변환한다', async () => {
  const landing = 'https://air-web.myrealtrip.com/results?trip=sample';
  server.use(
    http.post(`${base}/products/flight/airport-autocomplete`, () =>
      HttpResponse.json({
        data: {
          airports: [{ airport: { code: 'ICN' }, city: { code: 'SEL' } }],
        },
      }),
    ),
    http.post(
      `${base}/products/flight/fare-query-landing-url`,
      async ({ request }) => {
        expect(await request.json()).toEqual({
          depAirportCd: 'ICN',
          arrAirportCd: 'CJU',
          tripTypeCd: 'RT',
          depDate: '2030-12-30',
          arrDate: '2031-01-02',
          adult: 2,
        });
        return HttpResponse.json({ data: landing });
      },
    ),
    http.post(`${base}/mylink`, async ({ request }) => {
      expect(await request.json()).toEqual({ targetUrl: landing });
      return HttpResponse.json({
        data: { mylink: 'https://myrealt.rip/flight123' },
      });
    }),
  );
  const [departure] = await client.searchAirports('서울');
  expect(
    await client.createFlightLink({
      depAirportCd: departure.airport.code,
      arrAirportCd: 'CJU',
      depDate: '2030-12-30',
      arrDate: '2031-01-02',
      adult: 2,
    }),
  ).toBe('https://myrealt.rip/flight123');
});

test.each([401, 403, 429, 500])(
  'HTTP %s 오류를 호출자에게 전달한다',
  async (status) => {
    server.use(
      http.post(
        `${base}/products/tna/search`,
        () => new HttpResponse(null, { status }),
      ),
    );
    await expect(client.searchTickets('제주')).rejects.toMatchObject({
      status,
    });
  },
);

test('설정 누락은 네트워크 요청 없이 구분한다', async () => {
  await expect(
    createMyRealTripClient('').searchTickets('제주'),
  ).rejects.toMatchObject({ code: 'configuration' });
});

test.each([
  'https://evil.example/',
  'https://myrealtrip.com.evil.example/',
  'http://www.myrealtrip.com/',
  'javascript:alert(1)',
  'https://user:pass@www.myrealtrip.com/',
])('잘못된 링크 %s는 거부한다', async (url) => {
  expect(isMyRealTripUrl(url)).toBe(false);
  await expect(client.createLink(url)).rejects.toMatchObject({
    code: 'response',
  });
});

test('잘못된 상품/링크 응답을 그대로 열지 않는다', async () => {
  server.use(
    http.post(`${base}/products/tna/search`, () =>
      HttpResponse.json({
        data: {
          items: [{ ...product, productUrl: 'https://evil.example' }, product],
        },
      }),
    ),
    http.post(`${base}/mylink`, () =>
      HttpResponse.json({ data: { mylink: 'https://evil.example' } }),
    ),
  );
  expect(await client.searchTickets('제주')).toEqual([product]);
  await expect(client.createLink(product.productUrl)).rejects.toMatchObject({
    code: 'response',
  });
});

test.each([
  { data: null },
  { data: { items: null } },
  { data: { items: [] }, result: { status: 401 } },
])('비정상 응답은 실패 처리한다', async (body) => {
  server.use(
    http.post(`${base}/products/tna/search`, () => HttpResponse.json(body)),
  );
  await expect(client.searchTickets('제주')).rejects.toMatchObject({
    code: 'response',
  });
});

test('취소한 요청은 링크를 생성하지 않는다', async () => {
  server.use(
    http.post(`${base}/products/tna/search`, async () => {
      await delay(50);
      return HttpResponse.json({ data: { items: [] } });
    }),
  );
  const controller = new AbortController();
  const pending = client.searchTickets('제주', controller.signal);
  controller.abort();
  await expect(pending).rejects.toThrow();
});
