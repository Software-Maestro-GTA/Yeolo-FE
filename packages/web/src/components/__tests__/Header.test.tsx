/**
 * @file Header.test.tsx
 * @description Header 컴포넌트 렌더링 및 인터랙션 테스트
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Header } from '@/components/Header';

describe('Header Component', () => {
  it('renders brand logo and title correctly', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: '여로 홈페이지' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByAltText('여로 (Yeolo)')).toHaveAttribute(
      'src',
      '/branding/yeolo-logo.svg',
    );
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('주요 기능')).toHaveAttribute('href', '/#features');
    expect(screen.getByText('이용 방법')).toHaveAttribute(
      'href',
      '/#how-it-works',
    );
    expect(screen.getByText('여행의 발견')).toHaveAttribute(
      'href',
      '/#destinations',
    );
  });

  it('provides one device-aware download link without opening the menu', () => {
    render(<Header />);
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: '앱 다운로드' })).toHaveAttribute(
      'href',
      '/download',
    );
    expect(
      header.queryByRole('link', { name: /App Store/ }),
    ).not.toBeInTheDocument();
    expect(
      header.queryByRole('link', { name: /Google Play/ }),
    ).not.toBeInTheDocument();
  });

  it('closes the expanded mobile menu on Escape and restores focus', () => {
    render(<Header />);
    const toggle = screen.getByRole('button', { name: '메뉴 열기/닫기' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
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
