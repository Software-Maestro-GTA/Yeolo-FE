/**
 * @file DestinationsSection.tsx
 * @description 인기 통계로 오인되지 않도록 예시 여행지로 소개하는 여행 영감 갤러리
 */
import Image from 'next/image';
import { ArrowRightIcon } from '@/components/Icons';
export interface DestinationsSectionProps {
  className?: string;
}
const DESTINATIONS = [
  {
    id: 'jeju',
    name: '제주도',
    country: '대한민국',
    caption: '바다를 따라, 느리게',
    tags: '자연 · 여유 · 로컬 카페',
  },
  {
    id: 'kyoto',
    name: '교토',
    country: '일본',
    caption: '골목마다 새로운 발견',
    tags: '문화 · 산책 · 전통',
  },
  {
    id: 'bali',
    name: '발리',
    country: '인도네시아',
    caption: '일상에서 한 걸음 멀리',
    tags: '휴양 · 서핑 · 자연',
  },
  {
    id: 'paris',
    name: '파리',
    country: '프랑스',
    caption: '취향이 머무는 순간',
    tags: '예술 · 미식 · 낭만',
  },
  {
    id: 'bangkok',
    name: '방콕',
    country: '태국',
    caption: '오감으로 만나는 도시',
    tags: '미식 · 야시장 · 도시',
  },
  {
    id: 'barcelona',
    name: '바르셀로나',
    country: '스페인',
    caption: '햇살 아래 색다른 영감',
    tags: '건축 · 지중해 · 예술',
  },
];
export function DestinationsSection({
  className = '',
}: DestinationsSectionProps) {
  return (
    <section
      id='destinations'
      className={`section-space ${className}`}
      aria-labelledby='destinations-title'>
      <div className='site-container'>
        <div className='section-heading'>
          <div>
            <span className='eyebrow'>WHERE TO NEXT?</span>
            <h2 id='destinations-title'>
              다음 여행의 힌트,
              <br />
              어디에서 찾을까요?
            </h2>
          </div>
          <p>
            같은 여행지도, 취향에 따라 다르게.
            <br />
            당신만의 여행을 상상해 보세요.
          </p>
        </div>
        <div className='destination-grid'>
          {DESTINATIONS.map((item) => (
            <article key={item.id} className='destination-card'>
              <div className='destination-image'>
                <Image
                  src={`/images/dest-${item.id}.png`}
                  alt={`${item.name} 여행 풍경`}
                  fill
                  sizes='(max-width: 600px) 85vw, (max-width: 900px) 45vw, 33vw'
                />
                <span>{item.country}</span>
              </div>
              <div className='destination-copy'>
                <span>{item.tags}</span>
                <h3>{item.name}</h3>
                <p>{item.caption}</p>
                <a
                  href='#download'
                  aria-label={`${item.name} 여행을 위한 앱 다운로드 안내`}
                  className='destination-link'>
                  <ArrowRightIcon size={22} aria-hidden='true' />
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className='section-note'>
          여행지 이미지는 여행의 영감을 위한 예시입니다. 나에게 맞는 코스는
          앱에서 만들 수 있어요.
        </p>
      </div>
    </section>
  );
}
