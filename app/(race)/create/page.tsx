"use client"

import React, { useState } from 'react';
import { Share2, Lock, Copy, Check } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';

const CreateRacePage: React.FC = () => {
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const generateLink = () => {
        // In a real app, this would call an API to create a unique race ID
        const uniqueId = Math.random().toString(36).substring(2, 10);
        setInviteLink(`${window.location.origin}/race/invite/${uniqueId}`);
        setIsCopied(false);
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative z-10">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Lock size={48} className="text-[var(--accent)]" style={{ filter: 'drop-shadow(0 0 10px rgba(188, 19, 254, 0.5))' }} />
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white mb-3"
                        style={{ textShadow: '0 0 20px rgba(188, 19, 254, 0.3)' }}>
                        Private Lobby
                    </h1>
                    <p className="text-xl text-[var(--text-secondary)] font-mono max-w-lg mx-auto">
                        GENERATE SECURE LINK // INVITE FRIENDS // RANDOM TEXT PROTOCOL
                    </p>
                </div>

                {/* Main Card */}
                <CyberCard className="border-[var(--accent)]">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--accent)]" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--accent)]" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--accent)]" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--accent)]" />

                    <div className="p-8">
                        {!inviteLink ? (
                            <div className="text-center space-y-6">
                                <div className="space-y-3 mb-8">
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                                        Initialize Private Session
                                    </h2>
                                    <p className="text-[var(--text-secondary)] font-mono text-sm">
                                        Create a unique invite link for your friends
                                    </p>
                                </div>

                                <CyberButton
                                    onClick={generateLink}
                                    variant="secondary"
                                    size="lg"
                                    glow
                                    className="w-full text-xl py-6"
                                >
                                    <Share2 size={24} />
                                    <span>Generate Invite Link</span>
                                </CyberButton>

                                <div className="mt-8 p-4 bg-[var(--bg-primary-subtle)] border border-[var(--border)] rounded-lg">
                                    <p className="text-xs text-[var(--text-muted)] font-mono">
                                        NOTE: Link will use randomized text for fair competition
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-primary-hover)] border border-[var(--primary)] mb-4">
                                        <Check size={18} className="text-[var(--success)]" />
                                        <span className="text-[var(--success)] font-bold font-mono text-sm">LINK GENERATED</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                                        Share With Friends
                                    </h2>
                                </div>

                                <div
                                    className="flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm"
                                    style={{
                                        backgroundColor: 'var(--bg-surface)',
                                        borderColor: 'var(--border)'
                                    }}
                                >
                                    <span className="flex-1 truncate text-sm md:text-base font-mono text-[var(--accent)] break-all">
                                        {inviteLink}
                                    </span>
                                    <button
                                        onClick={copyLink}
                                        className={`flex-shrink-0 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${isCopied
                                                ? 'bg-[var(--success)] text-black'
                                                : 'bg-white text-black hover:bg-[var(--primary)] hover:text-black'
                                            }`}
                                    >
                                        {isCopied ? (
                                            <span className="flex items-center gap-1.5">
                                                <Check size={16} /> Copied!
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5">
                                                <Copy size={16} /> Copy
                                            </span>
                                        )}
                                    </button>
                                </div>

                                <div className="p-4 bg-[var(--bg-primary-subtle)] border border-[var(--border)] rounded-lg">
                                    <p className="text-sm text-[var(--text-secondary)] font-mono text-center">
                                        Send this link to your friends to start the private race session
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <CyberButton
                                        onClick={() => {
                                            setInviteLink(null);
                                            setIsCopied(false);
                                        }}
                                        variant="primary"
                                        className="w-full"
                                    >
                                        Generate New Link
                                    </CyberButton>
                                </div>
                            </div>
                        )}
                    </div>
                </CyberCard>

                {/* Info Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                        SYSTEM: PRIVATE_LOBBY_v2.1 | STATUS: OPERATIONAL
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateRacePage;