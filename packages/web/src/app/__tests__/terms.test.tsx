/**
 * @file terms.test.tsx
 * @description 서비스 이용약관(/terms) 페이지 렌더링 검증 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import TermsOfServicePage from '@/app/terms/page';

describe('TermsOfServicePage Component', () => {
  it('renders title banner and implementation date', () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByText('여로 서비스 이용 약관 & 정책'),
    ).toBeInTheDocument();
    expect(screen.getByText('시행일: 2026년 7월 30일')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: '서비스 이용약관' }),
    ).toBeInTheDocument();
  });

  it('renders all terms articles from 1 to 8 and appendix', () => {
    render(<TermsOfServicePage />);

    expect(screen.getByText('제1조 (목적)')).toBeInTheDocument();
    expect(screen.getByText('제2조 (용어의 정의)')).toBeInTheDocument();
    expect(screen.getByText('제3조 (약관의 효력 및 개정)')).toBeInTheDocument();
    expect(
      screen.getByText('제4조 (서비스의 제공 및 변경)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('제5조 (이용자의 의무 및 금지사항)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('제6조 (계약 해지 및 이용 제한)'),
    ).toBeInTheDocument();
    expect(screen.getByText('제7조 (면책 조항)')).toBeInTheDocument();
    expect(
      screen.getByText('제8조 (분쟁의 해결 및 관할 법원)'),
    ).toBeInTheDocument();
    expect(screen.getByText('부칙')).toBeInTheDocument();
  });
});
