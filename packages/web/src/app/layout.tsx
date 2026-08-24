/**
 * @file layout.tsx
 * @description Yeolo 웹 루트 레이아웃 컴포넌트
 */

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://yeolo.site',
  ),
  title: '여로 (Yeolo) | AI 기반 초개인화 맞춤 여행 플랫폼',
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
    icon: '/images/logo-mark.png',
    apple: '/images/logo-mark.png',
  },
  openGraph: {
    title: '여로 (Yeolo) | AI 기반 초개인화 맞춤 여행 플랫폼',
    description:
      '당신의 취향, MBTI를 분석해 세상에 단 하나뿐인 최적의 여행 코스를 실시간으로 설계합니다.',
    siteName: '여로 (Yeolo)',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/images/hero-travel.png',
        width: 1024,
        height: 1024,
        alt: '여로 (Yeolo) AI 맞춤 여행',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
