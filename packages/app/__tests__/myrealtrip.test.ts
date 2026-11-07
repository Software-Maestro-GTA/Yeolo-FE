/**
 * @jest-environment node
 * @file myrealtrip.test.ts
 * @description Verifies authenticated Yeolo MRT contracts, pagination, cancellation and safe affiliate links using MSW.
 */
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import {
  createMyRealTripClient,
  isMyRealTripUrl,
  setAcceptLanguage,
  setTokenGetter,
  setUnauthorizedHandler,
} from '@yeolo/common';

const baseUrl = 'https://api.yeolo.test';
const base = `${baseUrl}/api/myrealtrip`;
const server = setupServer();
const client = createMyRealTripClient(baseUrl);
const product = {
  itemName: '제주 입장권',
  salePrice: 10000,
  productUrl: 'https://experiences.myrealtrip.com/products/123',
};
const envelope = (data: unknown) => ({ status: 200, message: '성공', data });
const page = (items: unknown[] = [product], current = 1, hasMore = false) => ({
  items,
  page: current,
  totalCount: hasMore ? 21 : items.length,
  hasMore,
});
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  setTokenGetter(async () => ({ accessToken: 'yeolo-access-token' }));
  setUnauthorizedHandler(() => undefined);
  setAcceptLanguage('ko');
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('투어 검색과 상품 링크 생성은 Yeolo 인증으로 서버에 요청한다', async () => {
  const requests: unknown[] = [];
  server.use(
    http.get(`${base}/tickets`, ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(
        'Bearer yeolo-access-token',
      );
      expect(request.headers.get('Accept-Language')).toBe('ko');
      requests.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(envelope(page()));
    }),
    http.post(`${base}/links`, async ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(
        'Bearer yeolo-access-token',
      );
      requests.push(await request.json());
      return HttpResponse.json(
        envelope({ url: 'https://myrealt.rip/ticket123' }),
      );
    }),
  );
  const items = await client.searchTickets(' 제주 ');
  expect(await client.createLink(items[0].productUrl)).toBe(
    'https://myrealt.rip/ticket123',
  );
  expect(requests).toEqual([
    { keyword: '제주', page: '1' },
    { targetUrl: product.productUrl },
  ]);
});

test('투어 카드 정보와 서버가 반환한 1-based 페이지 메타데이터를 유지한다', async () => {
  const ticket = {
    ...product,
    description: '제주 · 액티비티',
    reviewScore: 4.8,
    reviewCount: 42,
    tags: ['즉시 확정'],
    imageUrl: null,
  };
  const requests: unknown[] = [];
  server.use(
    http.get(`${base}/tickets`, ({ request }) => {
      const query = Object.fromEntries(new URL(request.url).searchParams);
      requests.push(query);
      return HttpResponse.json(
        envelope({
          ...page([ticket], Number(query.page)),
          totalCount: 21,
          hasMore: query.page === '1',
        }),
      );
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
    { keyword: '제주', page: '1' },
    { keyword: '제주', page: '2' },
  ]);
});

test('서버 hasMore가 false면 전체 건수로 다음 페이지를 임의로 만들지 않는다', async () => {
  server.use(
    http.get(`${base}/tickets`, () =>
      HttpResponse.json(
        envelope({ ...page(), totalCount: 21, hasMore: false }),
      ),
    ),
  );
  expect(await client.searchTicketPage('제주')).toMatchObject({
    totalCount: 21,
    hasMore: false,
  });
});

test.each(['tickets', 'hotels'] as const)(
  '전체 건수 미제공 시 %s의 null과 hasMore를 유지한다',
  async (endpoint) => {
    const result = { ...page(), totalCount: null, hasMore: true };
    server.use(
      http.get(`${base}/${endpoint}`, () =>
        HttpResponse.json(envelope(result)),
      ),
    );
    const pending =
      endpoint === 'tickets'
        ? client.searchTicketPage('제주')
        : client.searchHotels({
            regionId: 777,
            checkIn: '2030-12-30',
            checkOut: '2031-01-02',
            adultCount: 2,
          });
    expect(await pending).toEqual(result);
  },
);

test('지역 검색과 숙소 조회는 쿼리로 조건을 전달하고 숙소 페이지는 1부터 시작한다', async () => {
  const query = {
    regionId: 777,
    checkIn: '2030-12-30',
    checkOut: '2031-01-02',
    adultCount: 2,
  };
  const hotel = {
    ...product,
    starRating: 4,
    reviewScore: '4.8',
    reviewCount: 42,
  };
  const requests: unknown[] = [];
  server.use(
    http.get(`${base}/regions`, ({ request }) => {
      expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
        keyword: '제주',
        isDomestic: 'true',
      });
      return HttpResponse.json(
        envelope({ regions: [{ regionId: 777, name: '제주' }] }),
      );
    }),
    http.get(`${base}/hotels`, ({ request }) => {
      const params = Object.fromEntries(new URL(request.url).searchParams);
      requests.push(params);
      return HttpResponse.json(
        envelope(page([hotel], Number(params.page), params.page === '1')),
      );
    }),
  );
  const [region] = await client.searchRegions(' 제주 ', true);
  expect(region).toEqual({ regionId: 777, name: '제주' });
  expect(await client.searchHotels(query)).toEqual(page([hotel], 1, true));
  expect(await client.searchHotels({ ...query, page: 2 })).toEqual(
    page([hotel], 2, false),
  );
  expect(requests).toEqual(
    [1, 2].map((current) => ({
      regionId: '777',
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      adultCount: '2',
      page: String(current),
    })),
  );
});

test('항공은 공항 코드를 전송하고 서버에서 완성한 최종 제휴 링크를 연다', async () => {
  const input = {
    depAirportCd: 'ICN',
    arrAirportCd: 'CJU',
    depDate: '2030-12-30',
    arrDate: '2031-01-02',
    adult: 2,
  };
  server.use(
    http.get(`${base}/airports`, ({ request }) => {
      expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
        keyword: '서울',
      });
      return HttpResponse.json(
        envelope({
          airports: [
            { airport: { code: 'ICN' } },
            { airport: { code: 'invalid' } },
          ],
        }),
      );
    }),
    http.post(`${base}/flights/link`, async ({ request }) => {
      expect(await request.json()).toEqual(input);
      return HttpResponse.json(
        envelope({ url: 'https://myrealt.rip/flight123' }),
      );
    }),
  );
  expect(await client.searchAirports(' 서울 ')).toEqual([
    { airport: { code: 'ICN' } },
  ]);
  expect(await client.createFlightLink(input)).toBe(
    'https://myrealt.rip/flight123',
  );
});

test('쿠폰은 서버의 활성 목록과 표시 순서를 사용하며 빈 목록도 허용한다', async () => {
  const coupons = [
    { code: 'EXAMPLE1000', minimumPrice: 50000, discount: 1000 },
  ];
  server.use(
    http.get(`${base}/coupons`, ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(
        'Bearer yeolo-access-token',
      );
      expect(new URL(request.url).search).toBe('');
      return HttpResponse.json(envelope({ coupons }));
    }),
  );
  expect(await client.getCoupons()).toEqual(coupons);
  server.use(
    http.get(`${base}/coupons`, () =>
      HttpResponse.json(envelope({ coupons: [] })),
    ),
  );
  expect(await client.getCoupons()).toEqual([]);
});

test.each([400, 401, 429, 500, 502, 504])(
  'HTTP %s 오류를 호출자에게 전달한다',
  async (status) => {
    server.use(
      http.get(`${base}/tickets`, () =>
        HttpResponse.json({ status, message: '실패', data: null }, { status }),
      ),
    );
    await expect(client.searchTickets('제주')).rejects.toMatchObject({
      code: 'request',
      status,
    });
  },
);

test.each([
  'https://evil.example/',
  'https://myrealtrip.com.evil.example/',
  'http://www.myrealtrip.com/',
  'javascript:alert(1)',
  'https://user:pass@www.myrealtrip.com/',
  'https://www.myrealtrip.com:443/',
])('잘못된 링크 %s는 네트워크 요청 전에 거부한다', async (url) => {
  expect(isMyRealTripUrl(url)).toBe(false);
  await expect(client.createLink(url)).rejects.toMatchObject({
    code: 'response',
  });
});

test('잘못된 상품과 링크 응답을 그대로 열지 않는다', async () => {
  server.use(
    http.get(`${base}/tickets`, () =>
      HttpResponse.json(
        envelope(
          page([{ ...product, productUrl: 'https://evil.example' }, product]),
        ),
      ),
    ),
    http.post(`${base}/links`, () =>
      HttpResponse.json(envelope({ url: 'https://evil.example' })),
    ),
  );
  expect(await client.searchTickets('제주')).toEqual([product]);
  await expect(client.createLink(product.productUrl)).rejects.toMatchObject({
    code: 'response',
  });
});

test.each([
  { data: null },
  envelope({ ...page(), items: null }),
  envelope({ ...page(), page: 0 }),
  envelope({ ...page(), hasMore: 'false' }),
  envelope({ ...page(), totalCount: -1 }),
  { ...envelope(page()), status: '200' },
])('비정상 응답은 실패 처리한다', async (body) => {
  server.use(http.get(`${base}/tickets`, () => HttpResponse.json(body)));
  await expect(client.searchTickets('제주')).rejects.toMatchObject({
    code: 'response',
  });
});

test('HTTP 성공이어도 실패 상태 envelope는 요청 실패로 처리한다', async () => {
  server.use(
    http.get(`${base}/tickets`, () =>
      HttpResponse.json({ status: 502, message: '실패', data: null }),
    ),
  );
  await expect(client.searchTickets('제주')).rejects.toMatchObject({
    code: 'request',
    status: 502,
  });
});

test('취소한 요청은 결과를 반환하지 않는다', async () => {
  server.use(
    http.get(`${base}/tickets`, async () => {
      await delay(50);
      return HttpResponse.json(envelope(page([])));
    }),
  );
  const controller = new AbortController();
  const pending = client.searchTickets('제주', controller.signal);
  controller.abort();
  await expect(pending).rejects.toThrow();
});
