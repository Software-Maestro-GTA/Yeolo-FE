/**
 * @file privacy.test.tsx
 * @description 개인정보처리방침(/privacy) 페이지 렌더링 검증 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivacyPolicyPage from '@/app/privacy/page';

describe('PrivacyPolicyPage Component', () => {
  it('renders title banner and implementation date', () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText('여로 서비스 이용 약관 & 정책')).toBeInTheDocument();
    expect(screen.getByText('시행일: 2026년 7월 30일')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '개인정보처리방침' })).toBeInTheDocument();
  });

  it('renders all privacy policy articles from 1 to 6 and appendix', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByText('제1조 (수집하는 개인정보 항목 및 수집방법)')).toBeInTheDocument();
    expect(screen.getByText('제2조 (개인정보의 수집 및 이용 목적)')).toBeInTheDocument();
    expect(screen.getByText('제3조 (개인정보의 보유 및 이용 기간)')).toBeInTheDocument();
    expect(screen.getByText('제4조 (개인정보의 제3자 제공 및 처리위탁)')).toBeInTheDocument();
    expect(screen.getByText('제5조 (이용자 및 법정대리인의 권리와 그 행사방법)')).toBeInTheDocument();
    expect(screen.getByText('제6조 (개인정보 보호책임자 및 문의처)')).toBeInTheDocument();
    expect(screen.getByText('부칙')).toBeInTheDocument();
  });

  it('displays customer support email in article 6', () => {
    render(<PrivacyPolicyPage />);
    const emailLinks = screen.getAllByRole('link', { name: 'ksk85628781@gmail.com' });
    expect(emailLinks.length).toBeGreaterThan(0);
    expect(emailLinks[0]).toHaveAttribute('href', 'mailto:ksk85628781@gmail.com');
  });
});
