/**
 * @file Sections.test.tsx
 * @description 랜딩 페이지 각 섹션(Hero, Features, HowItWorks, Destinations, CTA, Footer) 렌더링 검증 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { DestinationsSection } from '@/components/DestinationsSection';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';

describe('HeroSection Component', () => {
  it('renders hero titles, subtitle and CTA button', () => {
    render(<HeroSection />);
    expect(
      screen.getByText('AI 기반 초개인화 여행 플랫폼'),
    ).toBeInTheDocument();
    expect(screen.getByText(/여행의 새로운 시작/i)).toBeInTheDocument();
    expect(screen.getByText(/나만의 여행 시작하기/i)).toBeInTheDocument();
    expect(screen.getByAltText('여로 여행 맞춤 코스 뷰')).toBeInTheDocument();
  });
});

describe('FeaturesSection Component', () => {
  it('renders 3 key features cards properly', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('KEY FEATURES')).toBeInTheDocument();
    expect(
      screen.getByText('더 스마트하고 완벽한 여정을 위한 제안'),
    ).toBeInTheDocument();
    expect(screen.getByText('AI 사진 취향 분석')).toBeInTheDocument();
    expect(screen.getByText('맞춤 코스 자동 생성')).toBeInTheDocument();
    expect(screen.getByText('일정 관리 & 예약 통합')).toBeInTheDocument();
  });
});

describe('HowItWorksSection Component', () => {
  it('renders 3-step guide properly', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('HOW IT WORKS')).toBeInTheDocument();
    expect(screen.getByText('오직 나만을 위한 여행 코스')).toBeInTheDocument();
    expect(screen.getByText('여행 취향 분석')).toBeInTheDocument();
    expect(screen.getByText('목적지·일정 설정')).toBeInTheDocument();
    expect(screen.getByText('일정 확인 & 공유')).toBeInTheDocument();
  });
});

describe('DestinationsSection Component', () => {
  it('renders 6 trending destinations', () => {
    render(<DestinationsSection />);
    expect(screen.getByText('TRENDING DESTINATIONS')).toBeInTheDocument();
    expect(
      screen.getByText('여로 이용자들이 선택한 인기 탐험지'),
    ).toBeInTheDocument();

    const destinations = [
      '제주도',
      '교토',
      '발리',
      '파리',
      '방콕',
      '바르셀로나',
    ];
    destinations.forEach((dest) => {
      expect(screen.getByText(dest)).toBeInTheDocument();
    });
  });
});

describe('CTASection Component', () => {
  it('renders download buttons and store links', () => {
    render(<CTASection />);
    expect(screen.getByText(/지금 다운로드하고/i)).toBeInTheDocument();
    expect(screen.getByText('Google Play')).toBeInTheDocument();
    expect(screen.getByText('App Store')).toBeInTheDocument();
    expect(screen.getByAltText('Yeolo App Screen Preview')).toBeInTheDocument();
  });
});

describe('Footer Component', () => {
  it('renders footer brand info and company links', () => {
    render(<Footer />);
    expect(
      screen.getByText(/초개인화 기술로 새로운 형태의 여행을 설계하는 플랫폼/i),
    ).toBeInTheDocument();
    expect(screen.getByText('회사 소개')).toBeInTheDocument();
    expect(screen.getByText('제휴 제안').getAttribute('href')).toContain(
      'mailto:ksk85628781@gmail.com',
    );
    expect(screen.getByText('서비스 이용약관')).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByText('개인정보처리방침')).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(screen.queryByText('위치정보약관')).not.toBeInTheDocument();
    expect(screen.getByText('고객센터').getAttribute('href')).toContain(
      'mailto:ksk85628781@gmail.com',
    );
    expect(screen.getByText(/2026 여로 \(Yeolo\) Inc\./i)).toBeInTheDocument();
  });
});
