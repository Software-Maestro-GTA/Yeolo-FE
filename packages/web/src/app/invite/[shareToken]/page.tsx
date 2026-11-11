/**
 * @file page.tsx
 * @description 여행 코스 초대 수신 랜딩 페이지 및 딥링크/스토어 브릿지, SEO/GEO 최적화 (/invite/[shareToken])
 */

import React from 'react';
import type { Metadata } from 'next';
import { getShareLinkApi } from '@yeolo/common';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { InviteContent, InviteErrorState } from '@/components/Invite';
import { DEFAULT_SHARE_IMAGE } from '@/lib/share-image';

interface PageProps {
  params: Promise<{
    shareToken: string;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const INVITE_DESCRIPTION = '여로에서 함께할 여행 코스를 확인해 보세요';

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shareToken } = await params;

  try {
    const data = await getShareLinkApi(API_URL, shareToken);
    const inviterName = data.inviter.displayName || '친구';
    const courseTitle = data.course.title;
    const title = `[초대] ${inviterName}님이 ‘${courseTitle}’에 초대했습니다`;

    return {
      title,
      description: INVITE_DESCRIPTION,
      openGraph: {
        title,
        description: INVITE_DESCRIPTION,
        type: 'website',
        url: `/invite/${shareToken}`,
        siteName: '여로 (Yeolo)',
        locale: 'ko_KR',
        images: [DEFAULT_SHARE_IMAGE],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: INVITE_DESCRIPTION,
        images: [DEFAULT_SHARE_IMAGE.url],
      },
    };
  } catch {
    return {
      title: '여행 코스 초대 | 여로 (Yeolo)',
      description: INVITE_DESCRIPTION,
      openGraph: {
        title: '여행 코스 초대 | 여로 (Yeolo)',
        description: INVITE_DESCRIPTION,
        siteName: '여로 (Yeolo)',
        locale: 'ko_KR',
        images: [DEFAULT_SHARE_IMAGE],
      },
      twitter: {
        card: 'summary_large_image',
        title: '여행 코스 초대 | 여로 (Yeolo)',
        description: INVITE_DESCRIPTION,
        images: [DEFAULT_SHARE_IMAGE.url],
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
    <div className='invite-page min-h-screen flex flex-col'>
      {jsonLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <Header />

      <main id='main-content' tabIndex={-1} className='invite-main'>
        {inviteData ? (
          <InviteContent data={inviteData} shareToken={shareToken} />
        ) : (
          <InviteErrorState status={errorStatus} message={errorMessage} />
        )}
      </main>

      <Footer />
    </div>
  );
}
