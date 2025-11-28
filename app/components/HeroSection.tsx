"use client";

import React from 'react';
import Link from 'next/link';
import { Play, Users, Brain, TrendingUp, Zap, Terminal } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import CyberCard from '@/components/ui/CyberCard';

const actionCards = [
  {
    title: 'Quick Race',
    description: "Compete against the grid instantly.",
    href: '/race',
    icon: Zap,
    isPrimary: true,
  },
  {
    title: 'Private Lobby',
    description: "Challenge friends to a duel.",
    href: '/create',
    icon: Users,
    isPrimary: false,
  },
  {
    title: 'Solo Drill',
    description: "Hone your reflexes in isolation.",
    href: '/practice',
    icon: Brain,
    isPrimary: false,
  },
];

const HeroSection: React.FC = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-20 pb-20 px-4 text-center relative z-10">

      {/* Hero Content */}
      <div className="max-w-5xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[var(--primary)] bg-[rgba(0,243,255,0.1)] text-[var(--primary)] font-mono text-xs mb-6 animate-pulse">
          <Terminal size={12} />
          <span>SYSTEM ONLINE // READY FOR INPUT</span>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none mb-6 text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          Master the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-[0_0_10px_rgba(0,243,255,0.3)]">
            Digital Flow
          </span>
        </h1>

        <p className="text-xl sm:text-2xl font-mono text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
          The ultimate competitive typing protocol. <br />
          <span className="text-white">Speed is your only currency.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/race">
            <CyberButton size="lg" glow className="text-xl px-12 py-6">
              <Play size={24} />
              <span>Initiate Race</span>
            </CyberButton>
          </Link>

          <Link href="/register">
            <CyberButton variant="secondary" size="lg" className="text-xl px-12 py-6">
              <span>Create Profile</span>
            </CyberButton>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-[var(--text-secondary)] font-mono text-sm mb-20 bg-black/40 px-6 py-3 rounded-full border border-[var(--border)] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--success)]" />
          <span className="text-white font-bold">128</span>
          <span>ACTIVE PILOTS</span>
        </div>
        <span className="text-[var(--border)]">|</span>
        <div>
          RECORD: <span className="text-[var(--primary)] font-bold">150 WPM</span>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {actionCards.map((card) => (
          <Link key={card.title} href={card.href} className="group">
            <CyberCard className="h-full transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_30px_rgba(0,243,255,0.1)]">
              <div className="flex flex-col items-center text-center h-full">
                <div className={`p-4 rounded-full mb-4 ${card.isPrimary ? 'bg-[var(--primary)] text-black' : 'bg-[rgba(255,255,255,0.05)] text-[var(--primary)]'}`}>
                  <card.icon size={32} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-wider text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-[var(--text-secondary)] font-mono text-sm">
                  {card.description}
                </p>
              </div>
            </CyberCard>
          </Link>
        ))}
      </div>

    </section>
  );
};

export default HeroSection;