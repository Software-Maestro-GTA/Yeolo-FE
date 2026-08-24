/**
 * @file Header.test.tsx
 * @description Header 컴포넌트 렌더링 및 인터랙션 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/Header';

describe('Header Component', () => {
  it('renders brand logo and title correctly', () => {
    render(<Header />);
    expect(screen.getByText('여로')).toBeInTheDocument();
    expect(screen.getByAltText('Yeolo Logo')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('주요 기능')).toHaveAttribute('href', '/#features');
    expect(screen.getByText('이용 방법')).toHaveAttribute(
      'href',
      '/#how-it-works',
    );
    expect(screen.getByText('인기 여행지')).toHaveAttribute(
      'href',
      '/#destinations',
    );
  });

  it('renders download app CTA button', () => {
    render(<Header />);
    const ctaButtons = screen.getAllByText('앱 다운로드');
    expect(ctaButtons.length).toBeGreaterThan(0);
    expect(ctaButtons[0].closest('a')).toHaveAttribute('href', '/#download');
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(<Header />);
    const toggleButton = screen.getByLabelText('메뉴 열기/닫기');
    expect(toggleButton).toBeInTheDocument();

    // Click to open
    fireEvent.click(toggleButton);
    const mobileLinks = screen.getAllByText('주요 기능');
    expect(mobileLinks.length).toBe(2); // 1 desktop + 1 mobile dropdown

    // Click again to close
    fireEvent.click(toggleButton);
    expect(screen.getAllByText('주요 기능').length).toBe(1);
  });
});
