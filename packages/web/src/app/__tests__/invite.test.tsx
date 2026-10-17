/**
 * @file invite.test.tsx
 * @description 여행 코스 초대 랜딩 페이지 및 딥링크/스토어 브릿지 컴포넌트 단위/통합 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { InviteContent } from '@/components/Invite/InviteContent';
import { InviteCard } from '@/components/Invite/InviteCard';
import { InviteErrorState } from '@/components/Invite/InviteErrorState';
import { DeepLinkBridge } from '@/components/Invite/DeepLinkBridge';
import { StoreDownloadCTA } from '@/components/Invite/StoreDownloadCTA';
import type { ShareLinkDetailResponseData } from '@yeolo/common';

describe('InviteCard Component', () => {
  const mockData: ShareLinkDetailResponseData = {
    course: {
      title: '제주 에메랄드 힐링 투어',
      destinationCountry: '대한민국',
      destinationCity: '제주도',
      coverImageUrl: 'https://example.com/courses/jeju.jpg',
      startDate: '2026-09-01',
      totalDays: 3,
    },
    inviter: {
      displayName: '성유',
      profileImageUrl: 'https://example.com/profile.jpg',
    },
    expiresAt: '2026-09-10T00:00:00.000Z',
  };

  it('renders course information and inviter profile correctly', () => {
    render(<InviteCard data={mockData} />);

    expect(screen.getByText('제주 에메랄드 힐링 투어')).toBeInTheDocument();
    expect(screen.getByText(/대한민국 제주도/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-09-01/i)).toBeInTheDocument();
    expect(screen.getByText(/3일/i)).toBeInTheDocument();
    expect(
      screen.getByText(/성유님이 여행 코스에 초대했습니다/i),
    ).toBeInTheDocument();
  });

  it('omits the expiration notice when the link has no expiry', () => {
    render(<InviteCard data={{ ...mockData, expiresAt: null }} />);
    expect(screen.queryByText(/까지 유효해요/)).not.toBeInTheDocument();
  });

  it('shows the course and app actions together in the invitation layout', () => {
    render(<InviteContent data={mockData} shareToken='shared-course' />);
    expect(
      screen.getByRole('heading', { level: 1, name: mockData.course.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '여로 앱에서 열기' }),
    ).toHaveAttribute('href', 'yeolo://invite/shared-course');
    expect(
      screen.getByText('앱을 설치한 뒤 이 초대 링크를 다시 열어주세요.'),
    ).toBeInTheDocument();
  });

  it('renders fallback when inviter displayName is null', () => {
    const dataWithoutInviter: ShareLinkDetailResponseData = {
      ...mockData,
      inviter: {
        displayName: null,
        profileImageUrl: null,
      },
    };

    render(<InviteCard data={dataWithoutInviter} />);
    expect(screen.getByText(/여행 코스에 초대받았습니다/i)).toBeInTheDocument();
  });
});

describe('InviteErrorState Component', () => {
  it('renders 404 invalid link error message and home button', () => {
    render(
      <InviteErrorState
        status={404}
        message='유효하지 않은 공유 링크입니다.'
      />,
    );

    expect(screen.getByText('유효하지 않은 링크')).toBeInTheDocument();
    expect(
      screen.getByText('유효하지 않은 공유 링크입니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '여로 홈으로 이동' }),
    ).toHaveAttribute('href', '/');
  });

  it('explains a temporary error without calling the invitation expired', () => {
    render(<InviteErrorState status={500} />);
    expect(
      screen.getByRole('heading', { level: 1, name: '일시적인 오류 발생' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/잠시 후 다시 시도/)).toBeInTheDocument();
    expect(screen.queryByText('만료된 공유 링크')).not.toBeInTheDocument();
  });

  it('renders 410 expired link error message and guidance', () => {
    render(
      <InviteErrorState
        status={410}
        message='만료된 공유 링크입니다. 친구에게 다시 초대를 요청해주세요.'
      />,
    );

    expect(screen.getByText('만료된 공유 링크')).toBeInTheDocument();
    expect(
      screen.getByText(
        '만료된 공유 링크입니다. 친구에게 다시 초대를 요청해주세요.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '여로 홈으로 이동' }),
    ).toHaveAttribute('href', '/');
  });
});

describe('DeepLinkBridge & StoreDownloadCTA Component', () => {
  const shareToken = 'test-token-1234';

  it('renders deep link open app button with custom scheme', () => {
    render(<DeepLinkBridge shareToken={shareToken} />);
    expect(
      screen.getByRole('link', { name: '여로 앱에서 열기' }),
    ).toHaveAttribute('href', 'yeolo://invite/test-token-1234');
  });

  it('encodes the invitation token as a single deep-link path segment', () => {
    render(<DeepLinkBridge shareToken='token/with?reserved#characters' />);
    expect(
      screen.getByRole('link', { name: '여로 앱에서 열기' }),
    ).toHaveAttribute(
      'href',
      'yeolo://invite/token%2Fwith%3Freserved%23characters',
    );
  });

  it('renders store download CTA with store buttons on desktop', () => {
    render(<StoreDownloadCTA shareToken={shareToken} userAgent='desktop' />);

    expect(screen.getByText('Google Play')).toBeInTheDocument();
    expect(screen.getByText('App Store')).toBeInTheDocument();
  });

  it('renders iOS smart banner when userAgent is iOS', () => {
    render(<StoreDownloadCTA shareToken={shareToken} userAgent='ios' />);

    expect(screen.getByText('App Store에서 다운로드')).toBeInTheDocument();
  });

  it('renders Android smart banner when userAgent is Android', () => {
    render(<StoreDownloadCTA shareToken={shareToken} userAgent='android' />);

    expect(screen.getByText('Google Play에서 다운로드')).toBeInTheDocument();
  });
});
