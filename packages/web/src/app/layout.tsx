/**
 * @file layout.tsx
 * @description Yeolo 웹 루트 레이아웃 컴포넌트
 */

import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { DEFAULT_SHARE_IMAGE } from '@/lib/share-image';
import '@/styles/globals.css';

const pretendard = localFont({
  src: [
    { path: '../fonts/Pretendard-Regular.otf', weight: '400', style: 'normal' },
    { path: '../fonts/Pretendard-Medium.otf', weight: '500', style: 'normal' },
    {
      path: '../fonts/Pretendard-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    { path: '../fonts/Pretendard-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-pretendard',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yeolo.app',
  ),
  title: '여로 - 초개인화 여행 플랫폼',
  description:
    '당신의 취향, MBTI를 분석해 세상에 단 하나뿐인 최적의 여행 코스를 실시간으로 설계하는 초개인화 여행 플랫폼 여로(Yeolo)입니다.',
  keywords: [
    '여로',
    'Yeolo',
    '여행 코스 추천',
    'AI 여행',
    '초개인화 여행',
    '여행 일정',
  ],
  icons: {
    icon: {
      url: '/branding/favicon-rounded.png',
      type: 'image/png',
      sizes: '512x512',
    },
    apple: {
      url: '/branding/apple-touch-icon.png',
      type: 'image/png',
      sizes: '180x180',
    },
  },
  openGraph: {
    title: '여로 - 초개인화 여행 플랫폼',
    description:
      '당신의 취향, MBTI를 분석해 세상에 단 하나뿐인 최적의 여행 코스를 실시간으로 설계합니다.',
    siteName: '여로 (Yeolo)',
    locale: 'ko_KR',
    type: 'website',
    images: [DEFAULT_SHARE_IMAGE],
  },
  verification: {
    other: {
      'naver-site-verification': 'ca292c86b14febd51d46b46cb73272f3beafddab',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='ko'
      data-scroll-behavior='smooth'
      className={`${pretendard.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <a className='skip-link' href='#main-content'>
          본문으로 바로가기
        </a>
        {children}
      </body>
    </html>
  );
}
