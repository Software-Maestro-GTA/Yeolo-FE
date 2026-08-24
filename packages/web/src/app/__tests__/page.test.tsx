/**
 * @file page.test.tsx
 * @description HomePage 전체 페이지 렌더링 통합 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('HomePage Component', () => {
  it('renders all sections within the landing page', () => {
    render(<HomePage />);

    // Header & Brand
    const brandElements = screen.getAllByText('여로');
    expect(brandElements.length).toBeGreaterThan(0);

    // Hero
    expect(screen.getByText(/여행의 새로운 시작/i)).toBeInTheDocument();

    // Features
    expect(
      screen.getByText('더 스마트하고 완벽한 여정을 위한 제안'),
    ).toBeInTheDocument();

    // How It Works
    expect(screen.getByText('오직 나만을 위한 여행 코스')).toBeInTheDocument();

    // Destinations
    expect(
      screen.getByText('여로 이용자들이 선택한 인기 탐험지'),
    ).toBeInTheDocument();

    // CTA
    expect(screen.getByText(/지금 다운로드하고/i)).toBeInTheDocument();

    // Footer
    expect(screen.getByText(/2026 여로 \(Yeolo\) Inc\./i)).toBeInTheDocument();
  });
});
