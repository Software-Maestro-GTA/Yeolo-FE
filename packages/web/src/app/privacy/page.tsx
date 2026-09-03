/**
 * @file page.tsx
 * @description 여로(Yeolo) 개인정보처리방침 페이지
 */

import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 여로 (Yeolo)',
  description:
    '초개인화 여행 플랫폼 여로(Yeolo)의 개인정보처리방침 안내 페이지입니다.',
};

export default function PrivacyPolicyPage() {
  const articles = [
    {
      id: 'article-1',
      title: '제1조 (수집하는 개인정보 항목 및 수집방법)',
      content: (
        <div className='flex flex-col gap-3 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            회사는 회원가입, 맞춤형 여행 코스 추천 서비스 제공을 위해 아래와
            같은 개인정보를 수집하고 있습니다.
          </p>
          <div>
            <p className='font-bold text-[#0d2137]'>1. 수집 항목:</p>
            <ul className='list-disc pl-5 space-y-1'>
              <li>
                <span className='font-medium text-[#0d2137]'>필수항목:</span>{' '}
                Google 계정 정보 (이메일 주소, 이름, 프로필 사진, 고유 식별자)
              </li>
              <li>
                <span className='font-medium text-[#0d2137]'>
                  서비스 이용 과정에서 수집될 수 있는 항목:
                </span>{' '}
                여행 취향 설문 응답 데이터, 사진/미디어 메타데이터 (촬영 시간 및
                장소 위치 정보), 서비스 이용 기록, 접속 로그, 쿠키
              </li>
            </ul>
          </div>
          <div>
            <p className='font-bold text-[#0d2137]'>2. 수집 방법:</p>
            <ul className='list-disc pl-5 space-y-1'>
              <li>Google OAuth 소셜 로그인을 통한 자동 수집</li>
              <li>
                이용자의 서비스 이용 과정(설문 및 사진 메타데이터 분석
                기능)에서의 동의를 통한 수집
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'article-2',
      title: '제2조 (개인정보의 수집 및 이용 목적)',
      content: (
        <div className='flex flex-col gap-3 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
          <ol className='list-decimal pl-5 space-y-1.5'>
            <li>
              <span className='font-bold text-[#0d2137]'>회원 관리:</span> 소셜
              로그인 본인 확인, 개인 식별, 불량 회원의 부정 이용 방지, 가입 의사
              확인, 회원 탈퇴 처리
            </li>
            <li>
              <span className='font-bold text-[#0d2137]'>
                AI 맞춤형 서비스 제공:
              </span>{' '}
              이용자의 여행 성향 및 위치 메타데이터 분석을 통한 초개인화 여행
              코스 추천 및 일정 보관 기능 제공
            </li>
            <li>
              <span className='font-bold text-[#0d2137]'>
                서비스 개선 및 신규 서비스 개발:
              </span>{' '}
              이용 기록 분석을 통한 서비스 기능 개선 및 맞춤형 콘텐츠 제공
            </li>
          </ol>
        </div>
      ),
    },
    {
      id: 'article-3',
      title: '제3조 (개인정보의 보유 및 이용 기간)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            1. 회사는 이용자의 개인정보를 원칙적으로 회원 탈퇴 시까지 보유 및
            이용합니다.
          </p>
          <p>
            2. 회원 탈퇴 요청 시 수집된 개인정보는 재생할 수 없는 방법에 의해
            즉시 완전 파기됩니다.
          </p>
          <p>
            3. 단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 법령에서
            정한 일정 기간 동안 회원 정보를 보관합니다.
          </p>
        </div>
      ),
    },
    {
      id: 'article-4',
      title: '제4조 (개인정보의 제3자 제공 및 처리위탁)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            1. 회사는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다.
          </p>
          <p>
            2. 향후 원활한 서비스 제공을 위해 업무 위탁이 필요한 경우, 미리 위탁
            대상자와 위탁 업무 내용을 공지하고 동의를 구합니다.
          </p>
        </div>
      ),
    },
    {
      id: 'article-5',
      title: '제5조 (이용자 및 법정대리인의 권리와 그 행사방법)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            1. 이용자는 언제든지 서비스 내 설정 메뉴를 통해 자신의 개인정보를
            조회하거나 수정할 수 있으며, 회원 탈퇴(가입해제)를 요청할 수
            있습니다.
          </p>
          <p>
            2. 이용자가 개인정보의 오류에 대한 정정을 요청하신 경우에는 정정을
            완료하기 전까지 당해 개인정보를 이용 또는 제공하지 않습니다.
          </p>
        </div>
      ),
    },
    {
      id: 'article-6',
      title: '제6조 (개인정보 보호책임자 및 문의처)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            회사는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을
            처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className='bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 mt-2'>
            <p className='font-bold text-[#0d2137]'>
              개인정보 보호책임자 / 담당자
            </p>
            <p className='mt-1'>소속: 여로(Yeolo) 개발팀</p>
            <p>
              문의 이메일:{' '}
              <a
                href='mailto:ksk85628781@gmail.com'
                className='text-[#2d7dd2] underline font-medium'>
                ksk85628781@gmail.com
              </a>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'appendix',
      title: '부칙',
      content: (
        <p className='text-[14px] text-[#64748b] leading-[1.75]'>
          본 개인정보 처리방침은 2026년 7월 30일부터 적용됩니다.
        </p>
      ),
    },
  ];

  return (
    <div className='min-h-screen flex flex-col bg-white text-[#0d2137]'>
      <Header />

      <main className='flex-1 flex flex-col'>
        {/* Title Banner */}
        <section className='w-full bg-[#f5faf8] border-b border-slate-100 py-16 px-6 text-center'>
          <div className='max-w-4xl mx-auto flex flex-col items-center gap-4'>
            <div className='inline-flex items-center px-3.5 py-1.5 rounded-[20px] bg-[#e0f7f1]'>
              <span className='text-[#2d7dd2] text-[13px] font-bold tracking-tight'>
                여로 서비스 이용 약관 &amp; 정책
              </span>
            </div>
            <h1 className='text-[32px] sm:text-[40px] font-extrabold text-[#0d2137] tracking-tight'>
              개인정보처리방침
            </h1>
            <p className='text-[14px] font-medium text-[#64748b]'>
              시행일: 2026년 7월 30일
            </p>
          </div>
        </section>

        {/* Content Box */}
        <section className='w-full py-16 sm:py-20 px-6'>
          <div className='max-w-4xl mx-auto flex flex-col gap-10'>
            {/* Intro */}
            <div className='flex flex-col gap-6'>
              <p className='text-[15px] text-[#64748b] leading-[1.75]'>
                여로(Yeolo, 이하 &quot;회사&quot; 또는 &quot;서비스&quot;)는
                이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및
                「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련
                법령을 준수하고 있습니다. 본 개인정보 처리방침은 이용자가
                제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
                개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
              </p>
              <div className='w-full h-px bg-slate-200' />
            </div>

            {/* Articles */}
            {articles.map((item) => (
              <div key={item.id} className='flex flex-col gap-4'>
                <h2 className='text-[18px] font-bold text-[#0d2137] tracking-tight'>
                  {item.title}
                </h2>
                {item.content}
                <div className='w-full h-px bg-slate-200 mt-4' />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
