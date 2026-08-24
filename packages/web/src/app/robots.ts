/**
 * @file robots.ts
 * @description 검색 엔진(Google, Naver, SearchGPT, Perplexity 등) 크롤러 수집 정책 설정
 */

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yeolo.site';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
