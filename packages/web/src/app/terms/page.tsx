/**
 * @file page.tsx
 * @description 여로(Yeolo) 서비스 이용약관 페이지
 */

import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: '서비스 이용약관 | 여로 (Yeolo)',
  description:
    '초개인화 여행 플랫폼 여로(Yeolo)의 서비스 이용약관 안내 페이지입니다.',
};

export default function TermsOfServicePage() {
  const articles = [
    {
      id: 'article-1',
      title: '제1조 (목적)',
      content: (
        <p className='text-[14px] text-[#64748b] leading-[1.75]'>
          본 약관은 여로(Yeolo, 이하 &quot;회사&quot;)가 제공하는 초개인화 여행
          코스 추천 및 일정 관리 서비스(이하 &quot;서비스&quot;)의 이용과
          관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로
          합니다.
        </p>
      ),
    },
    {
      id: 'article-2',
      title: '제2조 (용어의 정의)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            1. &quot;서비스&quot;란 회사가 제공하는 여행 취향 분석, 맞춤 코스
            추천, 일정 보관 및 관리 등 제반 기능을 의미합니다.
          </p>
          <p>
            2. &quot;이용자&quot;란 본 약관에 동의하고 회사가 제공하는 서비스를
            이용하는 회원을 의미합니다.
          </p>
          <p>
            3. &quot;계정&quot;이란 이용자의 식별과 서비스 이용을 위하여 Google
            등 소셜 계정 연동을 통해 생성된 계정을 의미합니다.
          </p>
        </div>
      ),
    },
    {
      id: 'article-3',
      title: '제3조 (약관의 효력 및 개정)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
            공지함으로써 효력이 발생합니다.
          </p>
          <p>
            2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수
            있으며, 개정 시 적용일자 및 개정 사유를 명시하여 최소 7일 전
            공지합니다.
          </p>
        </div>
      ),
    },
    {
      id: 'article-4',
      title: '제4조 (서비스의 제공 및 변경)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>1. 회사는 이용자에게 다음과 같은 서비스를 제공합니다:</p>
          <ul className='list-disc pl-5 space-y-1'>
            <li>AI 기반 여행 취향 및 사진 메타데이터 분석</li>
            <li>맞춤형 여행 일정 및 데이별 여행 코스 자동 생성</li>
            <li>여행지 정보 탐색, 코스 보관 및 공유 기능</li>
            <li>외부 여행 예약(항공권, 숙소, 교통 등) 연계 지원</li>
          </ul>
          <p className='mt-1'>
            2. 서비스는 연중무휴, 1일 24시간 제공을 원칙으로 하되, 시스템
            정기점검 등 기술상의 필요에 따라 일시 중단될 수 있습니다.
          </p>
        </div>
      ),
    },
    {
      id: 'article-5',
      title: '제5조 (이용자의 의무 및 금지사항)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>이용자는 서비스 이용 시 다음 각 호의 행위를 하여서는 안 됩니다:</p>
          <ul className='list-disc pl-5 space-y-1'>
            <li>타인의 계정 정보를 도용하거나 부정하게 사용하는 행위</li>
            <li>
              회사의 서비스를 방해하거나 서버 및 시스템에 부하를 유발하는 행위
            </li>
            <li>
              회사의 지식재산권을 침해하거나 기타 관계 법령을 위반하는 행위
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'article-6',
      title: '제6조 (계약 해지 및 이용 제한)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            1. 이용자는 언제든지 서비스 내 회원 탈퇴 메뉴를 통해 이용 계약을
            해지할 수 있습니다.
          </p>
          <p>
            2. 이용자가 본 약관의 의무를 위반한 경우, 회사는 사전 통보 후 서비스
            이용을 제한하거나 계약을 해지할 수 있습니다.
          </p>
        </div>
      ),
    },
    {
      id: 'article-7',
      title: '제7조 (면책 조항)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
            제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
          </p>
          <p>
            2. 서비스에서 제공하는 여행 코스 및 장소 정보는 AI 분석 및 공공/제휴
            데이터 기반으로 추천되는 정보이며, 현지 사정(영업시간, 기상, 교통
            등)에 따라 변동될 수 있으므로 회사는 이에 대해 고의 또는 중과실이
            없는 한 책임을 지지 않습니다.
          </p>
        </div>
      ),
    },
    {
      id: 'article-8',
      title: '제8조 (분쟁의 해결 및 관할 법원)',
      content: (
        <div className='flex flex-col gap-2 text-[14px] text-[#64748b] leading-[1.75]'>
          <p>
            1. 회사와 이용자 간에 발생한 전자상거래 및 서비스 이용 관련 분쟁에
            대해서는 대한민국 법률을 적용합니다.
          </p>
          <p>
            2. 서비스 이용과 관련하여 소송이 제기될 경우 회사의 본점 소재지를
            관할하는 법원을 전속 관할법원으로 합니다.
          </p>
        </div>
      ),
    },
    {
      id: 'appendix',
      title: '부칙',
      content: (
        <p className='text-[14px] text-[#64748b] leading-[1.75]'>
          본 서비스 이용약관은 2026년 7월 30일부터 적용됩니다.
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
              서비스 이용약관
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
                여로(Yeolo) 서비스를 이용해 주셔서 감사합니다. 본 약관은
                이용자가 여로 서비스를 이용함에 있어 필요한 기본 사항들을
                규정하고 있으니 주의 깊게 확인해 주시기 바랍니다.
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
