/**
 * @file Sections.test.tsx
 * @description UI v3 웹 섹션과 단계 선택·다운로드·지원 링크의 사용자 동작 검증
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { DestinationsSection } from '@/components/DestinationsSection';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';

it('offers both stores directly from the hero with a labelled service overview', () => {
  render(<HeroSection />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    '내 안의 여행 취향.',
  );
  expect(screen.getByRole('link', { name: /App Store/ })).toHaveAttribute(
    'href',
    'https://apps.apple.com/kr/app/id6796231811',
  );
  expect(screen.getByRole('link', { name: /Google Play/ })).toHaveAttribute(
    'href',
    'https://play.google.com/store/apps/details?id=com.yeolo.app',
  );
  expect(
    screen.getByRole('img', { name: /여로 서비스 소개/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /여로와 여행하는 방법/ }),
  ).toHaveAttribute('href', '#how-it-works');
});

it('introduces discovery, course planning and memories', () => {
  render(<FeaturesSection />);
  expect(screen.getAllByRole('article')).toHaveLength(3);
  expect(
    screen.getByRole('heading', { name: /나의 여행 취향/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /하나의 코스로/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /계속되는 설렘/ }),
  ).toBeInTheDocument();
});

it('switches guide content and selection state when choosing a step', () => {
  render(<HowItWorksSection />);
  const steps = screen.getAllByRole('button');
  expect(steps).toHaveLength(3);
  expect(steps[0]).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: /목적지·일정 설정/ }));
  expect(steps[0]).toHaveAttribute('aria-pressed', 'false');
  expect(steps[1]).toHaveAttribute('aria-pressed', 'true');
  expect(
    screen.getByRole('heading', { name: '복잡한 계획은 가볍게.' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: '여행의 시작은, 나로부터.' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /일정 확인 & 공유/ }));
  expect(steps[2]).toHaveAttribute('aria-pressed', 'true');
  expect(
    screen.getByRole('heading', { name: '설렘은 함께, 기억은 오래.' }),
  ).toBeInTheDocument();
});

it('offers six destination ideas with an app download route', () => {
  render(<DestinationsSection />);
  for (const name of ['제주도', '교토', '발리', '파리', '방콕', '바르셀로나']) {
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: `${name} 여행을 위한 앱 다운로드 안내`,
      }),
    ).toHaveAttribute('href', '#download');
  }
});

it('provides FAQs and another direct store choice at the end', () => {
  render(<CTASection />);
  expect(
    screen.getByText('여로는 어떤 앱인가요?').closest('details'),
  ).not.toHaveAttribute('open');
  expect(
    screen.getByRole('heading', { name: /조금 더 나답게/ }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /App Store/ })).toHaveAttribute(
    'href',
    'https://apps.apple.com/kr/app/id6796231811',
  );
  expect(screen.getByRole('link', { name: /Google Play/ })).toHaveAttribute(
    'href',
    'https://play.google.com/store/apps/details?id=com.yeolo.app',
  );
});

it('preserves support, partnership and policy navigation in the footer', () => {
  render(<Footer />);
  for (const label of ['제휴 제안', '고객센터']) {
    expect(
      screen.getByRole('link', { name: label }).getAttribute('href'),
    ).toContain('mailto:ksk85628781@gmail.com');
  }
  expect(screen.getByRole('link', { name: '서비스 이용약관' })).toHaveAttribute(
    'href',
    '/terms',
  );
  expect(
    screen.getByRole('link', { name: '개인정보처리방침' }),
  ).toHaveAttribute('href', '/privacy');
  expect(screen.queryByText('위치정보약관')).not.toBeInTheDocument();
  expect(screen.getByText(/2026 여로 \(Yeolo\) Inc\./)).toBeInTheDocument();
});
