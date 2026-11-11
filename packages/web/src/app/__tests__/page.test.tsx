/**
 * @file page.test.tsx
 * @description UI v3 홈페이지의 주요 콘텐츠·공통 브랜드 및 본문 접근성 통합 검증
 */
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

it('renders the complete UI v3 web journey and accessible main landmark', () => {
  render(<HomePage />);
  for (const logo of screen.getAllByAltText('여로 (Yeolo)')) {
    expect(logo).toHaveAttribute('src', '/branding/yeolo-logo.svg');
  }
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  for (const name of [
    /내 안의 여행 취향/,
    /내가 좋아할 여행/,
    /이렇게 쉬워져요/,
    /어디에서 찾을까요/,
    /궁금한 이야기/,
    /조금 더 나답게/,
  ]) {
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  }
  expect(screen.getByText(/2026 여로 \(Yeolo\) Inc\./)).toBeInTheDocument();
});
