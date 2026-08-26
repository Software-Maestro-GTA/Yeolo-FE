/**
 * @file page.tsx
 * @description 여행 코스 초대 수신 랜딩 페이지 및 딥링크/스토어 브릿지, SEO/GEO 최적화 (/invite/[shareToken])
 */

import React from 'react';
import type { Metadata } from 'next';
import { getShareLinkApi } from '@yeolo/common';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  InviteCard,
  DeepLinkBridge,
  StoreDownloadCTA,
  InviteErrorState,
} from '@/components/Invite';

interface PageProps {
  params: Promise<{
    shareToken: string;
  }>;
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const API_URL =
  rawApiUrl && !rawApiUrl.includes('api.yeolo.site')
    ? rawApiUrl
    : 'https://d1eicq4gephyts.cloudfront.net';

function getDestinationOgImage(
  city?: string,
  country?: string,
): { url: string; width: number; height: number } {
  const combined = `${city || ''} ${country || ''}`.toLowerCase();
  if (combined.includes('제주') || combined.includes('jeju')) {
    return { url: '/images/dest-jeju.png', width: 1536, height: 672 };
  }
  if (combined.includes('교토') || combined.includes('kyoto')) {
    return { url: '/images/dest-kyoto.png', width: 1536, height: 672 };
  }
  if (combined.includes('발리') || combined.includes('bali')) {
    return { url: '/images/dest-bali.png', width: 1536, height: 672 };
  }
  if (combined.includes('파리') || combined.includes('paris')) {
    return { url: '/images/dest-paris.png', width: 1536, height: 672 };
  }
  if (combined.includes('방콕') || combined.includes('bangkok')) {
    return { url: '/images/dest-bangkok.png', width: 1536, height: 672 };
  }
  if (combined.includes('바르셀로나') || combined.includes('barcelona')) {
    return { url: '/images/dest-barcelona.png', width: 1536, height: 672 };
  }
  return { url: '/images/hero-travel.png', width: 1024, height: 1024 };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shareToken } = await params;

  try {
    const data = await getShareLinkApi(API_URL, shareToken);
    const inviterName = data.inviter.displayName || '친구';
    const courseTitle = data.course.title;
    const location = `${data.course.destinationCountry} ${data.course.destinationCity}`;
    const title = `[초대] ${inviterName}님이 '${courseTitle}' 여행에 초대했습니다 | 여로`;
    const description = `${location} · ${data.course.totalDays}일 여행 코스를 확인하고 함께 여행을 계획해보세요.`;
    const ogImage = getDestinationOgImage(
      data.course.destinationCity,
      data.course.destinationCountry,
    );

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `/invite/${shareToken}`,
        siteName: '여로 (Yeolo)',
        locale: 'ko_KR',
        images: [
          {
            url: ogImage.url,
            width: ogImage.width,
            height: ogImage.height,
            alt: courseTitle,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage.url],
      },
    };
  } catch {
    return {
      title: '여행 코스 초대 | 여로 (Yeolo)',
      description:
        '초개인화 여행 플랫폼 여로(Yeolo)의 여행 코스 초대 링크입니다.',
      openGraph: {
        title: '여행 코스 초대 | 여로 (Yeolo)',
        description:
          '초개인화 여행 플랫폼 여로(Yeolo)의 여행 코스 초대 링크입니다.',
        siteName: '여로 (Yeolo)',
        locale: 'ko_KR',
        images: [
          {
            url: '/images/hero-travel.png',
            width: 1024,
            height: 1024,
            alt: '여로 AI 맞춤 여행',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: '여행 코스 초대 | 여로 (Yeolo)',
        description:
          '초개인화 여행 플랫폼 여로(Yeolo)의 여행 코스 초대 링크입니다.',
        images: ['/images/hero-travel.png'],
      },
    };
  }
}

export default async function InvitePage({ params }: PageProps) {
  const { shareToken } = await params;

  let inviteData = null;
  let errorStatus = 200;
  let errorMessage = '';

  try {
    inviteData = await getShareLinkApi(API_URL, shareToken);
  } catch (err: any) {
    errorStatus = err?.status || err?.statusCode || 404;
    errorMessage = err?.message || '유효하지 않은 공유 링크입니다.';
  }

  // Schema.org/TouristTrip JSON-LD Structured Data for GEO (Generative Engine Optimization)
  const jsonLd = inviteData
    ? {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: inviteData.course.title,
        description: `${inviteData.course.destinationCountry} ${inviteData.course.destinationCity} ${inviteData.course.totalDays}일 AI 맞춤 여행 코스`,
        touristType: 'AI 맞춤 여행',
        provider: {
          '@type': 'Organization',
          name: '여로 (Yeolo)',
          url: 'https://yeolo.site',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KRW',
          availability: 'https://schema.org/InStock',
        },
        itinerary: {
          '@type': 'ItemList',
          numberOfItems: inviteData.course.totalDays,
          itemListElement: Array.from(
            { length: inviteData.course.totalDays },
            (_, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: `Day ${i + 1} - ${inviteData.course.destinationCity} 여행 코스`,
            }),
          ),
        },
      }
    : null;

  return (
    <div className='min-h-screen flex flex-col bg-[#f5faf8] text-[#0d2137]'>
      {jsonLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <Header />

      <main className='flex-1 flex flex-col items-center justify-center py-12 sm:py-16 px-6'>
        <div className='w-full max-w-lg flex flex-col items-center gap-8'>
          {inviteData ? (
            <>
              {/* Course Detail Card */}
              <InviteCard data={inviteData} />

              {/* Deep Link Open App Bridge */}
              <DeepLinkBridge shareToken={shareToken} />

              {/* Store Download CTA & QR Code */}
              <StoreDownloadCTA shareToken={shareToken} />
            </>
          ) : (
            <InviteErrorState status={errorStatus} message={errorMessage} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
