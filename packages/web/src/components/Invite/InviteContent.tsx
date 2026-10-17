/**
 * @file InviteContent.tsx
 * @description 초대 코스와 앱 열기·설치 안내를 배치하는 반응형 초대 조회 콘텐츠
 */
import type { ShareLinkDetailResponseData } from '@yeolo/common';
import { InviteCard } from './InviteCard';
import { DeepLinkBridge } from './DeepLinkBridge';
import { StoreDownloadCTA } from './StoreDownloadCTA';

interface InviteContentProps {
  data: ShareLinkDetailResponseData;
  shareToken: string;
}

/** 조회된 코스와 해당 초대 토큰을 받아 앱에서 이어갈 수 있는 화면을 구성합니다. */
export function InviteContent({ data, shareToken }: InviteContentProps) {
  return (
    <div className='invite-layout'>
      <InviteCard data={data} />
      <aside className='invite-actions' aria-labelledby='invite-action-title'>
        <div className='invite-action-intro'>
          <h2 id='invite-action-title'>
            설레는 여행,
            <br />
            여로에서 함께해요.
          </h2>
          <p>
            앱에서 여행 코스를 확인하고
            <br />
            함께할 여정을 준비해 보세요.
          </p>
        </div>
        <DeepLinkBridge shareToken={shareToken} />
        <p className='invite-app-hint'>
          여로 앱이 설치되어 있다면 바로 열 수 있어요.
        </p>
        <StoreDownloadCTA shareToken={shareToken} />
      </aside>
    </div>
  );
}
