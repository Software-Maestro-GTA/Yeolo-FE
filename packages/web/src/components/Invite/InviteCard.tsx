/**
 * @file InviteCard.tsx
 * @description 초대한 사람, 여행 코스와 일정, 링크 유효기간을 보여주는 초대 카드
 */
import Image from 'next/image';
import {
  formatYYYYMMDD,
  type ShareLinkDetailResponseData,
} from '@yeolo/common';
import { MapPinIcon, CalendarCheckIcon } from '@/components/Icons';

export interface InviteCardProps {
  data: ShareLinkDetailResponseData;
  className?: string;
}

/** 전달받은 초대 정보를 제목과 일정 중심의 여행 카드로 표시합니다. */
export function InviteCard({ data, className = '' }: InviteCardProps) {
  const { course, inviter, expiresAt } = data;
  const inviterName = inviter.displayName || '여행자';

  return (
    <article
      className={`invite-card ${className}`}
      aria-labelledby='invite-course-title'>
      <div className='invite-card-top'>
        <div className='invite-sender'>
          <div className='invite-avatar'>
            {inviter.profileImageUrl ? (
              <Image
                src={inviter.profileImageUrl}
                alt={inviterName}
                fill
                sizes='44px'
              />
            ) : (
              <span aria-hidden='true'>{inviterName.charAt(0)}</span>
            )}
          </div>
          <div>
            <span className='invite-label'>당신에게 도착한 여행 초대</span>
            <p>
              {inviter.displayName
                ? `${inviter.displayName}님이 여행 코스에 초대했습니다!`
                : '여행 코스에 초대받았습니다!'}
            </p>
          </div>
        </div>
      </div>
      <div className='invite-card-body'>
        <span className='invite-label'>함께 떠날 여행</span>
        <h1 id='invite-course-title'>{course.title}</h1>
        <p className='invite-destination'>
          <MapPinIcon size={18} aria-hidden='true' />
          <span>
            {course.destinationCountry} {course.destinationCity}
          </span>
        </p>
        <dl className='invite-facts'>
          <div>
            <dt>
              <CalendarCheckIcon size={17} aria-hidden='true' />
              출발일
            </dt>
            <dd>{course.startDate}</dd>
          </div>
          <div>
            <dt>여행 기간</dt>
            <dd>
              {course.totalDays}일<span>의 새로운 발견</span>
            </dd>
          </div>
        </dl>
        <div className='invite-card-note'>
          <span>YOUR NEXT JOURNEY</span>
          <span aria-hidden='true'>함께라서 더 좋은 여행</span>
        </div>
      </div>
      {expiresAt && (
        <p className='invite-expiry'>
          이 초대 링크는{' '}
          <time dateTime={expiresAt}>{formatYYYYMMDD(expiresAt)}</time>까지
          유효해요.
        </p>
      )}
    </article>
  );
}
