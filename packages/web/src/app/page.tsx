/**
 * @file page.tsx
 * @description Yeolo 메인 웹 랜딩 페이지
 */

import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { DestinationsSection } from '@/components/DestinationsSection';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main id='main-content' tabIndex={-1} className='flex-1'>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DestinationsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
