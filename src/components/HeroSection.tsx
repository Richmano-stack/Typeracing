"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Users, Brain, TrendingUp, Zap, Terminal, Loader2 } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import CyberCard from '@/components/ui/CyberCard';
import { multiplayerApi } from '@/services/multiplayerApi';
import { toast } from 'sonner';

const actionCards = [
  {
    title: 'SOLO_PROTOCOL',
    description: "Server-authoritative high-speed performance test. Every keystroke is monitored.",
    href: '/solo-race',
    icon: Zap,
    isPrimary: true,
  },
  {
    title: 'PRIVATE_LOBBY',
    description: "Encrypted 1v1 duels. Challenge a specific pilot to a localized race.",
    href: '#',
    icon: Users,
    isPrimary: false,
    isLocked: false,
  },
];

const HeroSection: React.FC = () => {
    const router = useRouter();
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreateRoom = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isCreating) return;

        setIsCreating(true);
        const toastId = toast.loading("Initializing private protocol...");
        try {
            const { roomId } = await multiplayerApi.createRoom();
            toast.success("Lobby encrypted and ready.", { id: toastId });
            router.push(`/race/${roomId}`);
        } catch (error: any) {
            toast.error(error.message || "Protocol failure.", { id: toastId });
            setIsCreating(false);
        }
    };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-12 pb-12 px-4 text-center relative z-10">

      {/* Hero Content */}
      <div className="max-w-5xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[var(--primary)] bg-[var(--bg-primary-hover)] text-[var(--primary)] font-mono text-xs mb-6">
          <Terminal size={12} />
          <span>SYSTEM ONLINE // READY FOR INPUT</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-4 text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          Master the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-[0_0_10px_rgba(0,243,255,0.3)]">
            Digital Flow
          </span>
        </h1>

        <p className="text-lg sm:text-xl font-mono text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
          The ultimate competitive typing protocol. <br />
          <span className="text-white">Speed is your only currency.</span>
        </p>
      </div>

      {/* Feature Grid - Now Primary Action Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mb-12">
        {actionCards.map((card) => (
          <Link 
            key={card.title} 
            href={card.href} 
            className={`group ${card.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => {
                if (card.isLocked) {
                    e.preventDefault();
                } else if (card.title === 'PRIVATE_LOBBY') {
                    handleCreateRoom(e);
                }
            }}
          >
            <CyberCard className="h-full transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_30px_rgba(0,243,255,0.1)]">
              <div className="flex flex-col items-center text-center h-full relative">
                {card.isLocked && (
                    <div className="absolute -top-2 -right-2 bg-[var(--border)] text-[var(--text-secondary)] px-2 py-0.5 text-[8px] font-bold tracking-widest border border-[var(--border)] rounded-sm">
                        LOCKED_PROTOCOL
                    </div>
                )}
                <div className={`p-4 rounded-full mb-4 ${card.isPrimary ? 'bg-[var(--primary)] text-black' : 'bg-[rgba(255,255,255,0.05)] text-[var(--primary)]'}`}>
                  {isCreating && card.title === 'PRIVATE_LOBBY' ? <Loader2 size={32} className="animate-spin" /> : <card.icon size={32} />}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-wider text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-[var(--text-secondary)] font-mono text-sm">
                  {card.description}
                </p>
                {card.isLocked && (
                    <p className="mt-4 text-[8px] text-[var(--primary)] font-bold tracking-[0.3em] uppercase opacity-60">
                         Coming Soon
                    </p>
                )}
              </div>
            </CyberCard>
          </Link>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6">
          <Link href="/register" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-mono text-xs uppercase tracking-[0.2em]">
            <span>[ Initialize Personal Profile_ ]</span>
          </Link>

          {/* Stats Bar - Subliminal footer of hero */}
          <div className="flex items-center gap-4 text-[var(--text-secondary)] font-mono text-[10px] bg-black/40 px-6 py-2 rounded-full border border-[var(--border)] backdrop-blur-sm opacity-60">
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className="text-[var(--success)]" />
              <span className="text-white font-bold">128</span>
              <span>ACTIVE PILOTS</span>
            </div>
            <span className="text-[var(--border)]">|</span>
            <div>
              RECORD: <span className="text-[var(--primary)] font-bold">150 WPM</span>
            </div>
          </div>
      </div>

    </section>
  );
};

export default HeroSection;