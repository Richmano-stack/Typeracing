"use client"

import React from 'react';
import Link from 'next/link';
import { Rocket, Terminal } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';

const HeaderGuest: React.FC = () => {
  return (
    <header
      className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-[var(--border)]"
      style={{
        backgroundColor: 'rgba(5, 5, 5, 0.8)',
      }}
    >
      <div className="container mx-auto flex justify-between items-center h-16 px-4">

        {/* Logo/Brand */}
        <Link href="/" className="group flex items-center gap-2">
          <div className="p-2 border border-[var(--primary)] rounded-sm group-hover:bg-[rgba(0,243,255,0.1)] transition-colors">
            <Terminal size={20} className="text-[var(--primary)]" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase group-hover:text-[var(--primary)] transition-colors">
            Type<span className="text-[var(--primary)]">Race</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {['Leaderboard', 'About'].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase()}`}
              className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-white transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register">
            <CyberButton size="sm" glow={false}>
              Join Grid
            </CyberButton>
          </Link>
        </div>

      </div>
    </header>
  );
};

export default HeaderGuest;