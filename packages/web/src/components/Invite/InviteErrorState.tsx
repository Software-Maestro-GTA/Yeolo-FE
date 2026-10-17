/**
 * @file InviteErrorState.tsx
 * @description 공유 링크 404, 410 및 에러 발생 시 사용자 친화적인 안내 화면 컴포넌트
 */

import Link from 'next/link';

export interface InviteErrorStateProps {
  status?: number;
  message?: string;
  className?: string;
}

export function InviteErrorState({
  status = 404,
  message,
  className = '',
}: InviteErrorStateProps) {
  let title = '유효하지 않은 링크';
  let defaultDesc = '유효하지 않은 공유 링크입니다.';

  if (status === 410) {
    title = '만료된 공유 링크';
    defaultDesc = '만료된 공유 링크입니다. 친구에게 다시 초대를 요청해주세요.';
  } else if (status >= 500) {
    title = '일시적인 오류 발생';
    defaultDesc =
      '공유 링크를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const description = message || defaultDesc;

  return (
    <section
      className={`invite-error ${className}`}
      aria-labelledby='invite-error-title'>
      <span className='invite-label'>여로 여행 초대</span>
      <h1 id='invite-error-title'>{title}</h1>
      <p>{description}</p>
      {status < 500 && status !== 410 && (
        <p className='invite-error-help'>
          초대한 분에게 새로운 링크를 받아 다시 방문해 주세요.
        </p>
      )}
      <Link href='/' className='invite-primary-button'>
        여로 홈으로 이동
      </Link>
    </section>
  );
}
