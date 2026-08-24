'use client';

/**
 * @file Header.tsx
 * @description Yeolo 상단 글로벌 네비게이션 바 컴포넌트
 */

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MenuIcon, CloseIcon } from '@/components/Icons';

export interface HeaderProps {
  className?: string;
}

export function Header({ className = '' }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: '주요 기능', href: '/#features' },
    { label: '이용 방법', href: '/#how-it-works' },
    { label: '인기 여행지', href: '/#destinations' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-12 lg:px-20 h-[85px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-[7px] overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <Image
              src="/images/logo-mark.png"
              alt="Yeolo Logo"
              width={32}
              height={32}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <span className="font-extrabold text-[22px] tracking-tight text-[#0d2137]">
            여로
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#0d2137]">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[#2d7dd2] text-[#0d2137]/90 py-1"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Header CTA */}
        <div className="hidden md:flex items-center">
          <Link
            href="/#download"
            className="bg-[#2d7dd2] hover:bg-[#236dbb] active:scale-95 text-white font-bold text-[14px] px-5 py-2.5 rounded-[20px] transition-all shadow-sm shadow-[#2d7dd2]/20"
          >
            앱 다운로드
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg focus:outline-none"
          aria-label="메뉴 열기/닫기"
        >
          {isMobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-[15px] font-medium text-[#0d2137] hover:text-[#2d7dd2] py-2"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/#download"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center bg-[#2d7dd2] hover:bg-[#236dbb] text-white font-bold text-[14px] px-5 py-2.5 rounded-[20px] transition-colors"
            >
              앱 다운로드
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
