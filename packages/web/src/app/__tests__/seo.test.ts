/**
 * @file seo.test.ts
 * @description SEO robots.txt 및 sitemap.xml 생성 로직 검증 테스트
 */

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('SEO Configuration', () => {
  it('robots() returns proper crawler rules and sitemap reference', () => {
    const robotsConfig = robots();
    expect(robotsConfig.rules).toBeDefined();
    expect(robotsConfig.sitemap).toContain('/sitemap.xml');
  });

  it('sitemap() returns core route entries including home, terms, and privacy', () => {
    const sitemapEntries = sitemap();
    const urls = sitemapEntries.map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith('/'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/terms'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/privacy'))).toBe(true);
  });
});
