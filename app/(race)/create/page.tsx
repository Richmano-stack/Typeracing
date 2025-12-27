"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Share2, Lock, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';

const CreateRacePage: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roomCode, setRoomCode] = useState<string | null>(null);

    const generateLink = async () => {
        setIsCreating(true);
        setError(null);
        setIsCopied(false);

        try {
            // For guests, prompt for name
            let guestName: string | undefined;
            if (!session?.user) {
                guestName = prompt('Enter your name:') || 'Guest';
                if (!guestName || guestName.trim() === '') {
                    guestName = 'Guest';
                }
            }

            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    maxPlayers: 10,
                    guestName: guestName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to create room');
            }

            const data = await response.json();
            setInviteLink(data.inviteLink);
            setRoomCode(data.roomCode);
            setIsCreating(false);

            // Redirect to lobby after a short delay
            setTimeout(() => {
                router.push(`/race/room/${data.roomCode}`);
            }, 2000);
        } catch (err) {
            console.error('Error creating room:', err);
            setError(err instanceof Error ? err.message : 'Failed to create room');
            setIsCreating(false);
        }
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

                <CyberCard className="border-[var(--accent)]">
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

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
                                        <AlertCircle size={18} />
                                        <span className="text-sm font-mono">{error}</span>
                                    </div>
                                )}

                                <CyberButton
                                    onClick={generateLink}
                                    variant="secondary"
                                    size="lg"
                                    glow
                                    disabled={isCreating}
                                    className="w-full text-xl py-6"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            <span>Creating Room...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Share2 size={24} />
                                            <span>Generate Invite Link</span>
                                        </>
                                    )}
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

                                {roomCode && (
                                    <div className="p-4 bg-[var(--bg-primary-subtle)] border border-[var(--border)] rounded-lg">
                                        <p className="text-sm text-[var(--text-secondary)] font-mono text-center mb-2">
                                            Room Code: <span className="text-[var(--accent)] font-bold">{roomCode}</span>
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] font-mono text-center">
                                            Redirecting to lobby...
                                        </p>
                                    </div>
                                )}

                                <div className="p-4 bg-[var(--bg-primary-subtle)] border border-[var(--border)] rounded-lg">
                                    <p className="text-sm text-[var(--text-secondary)] font-mono text-center">
                                        Send this link to your friends to start the private race session
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CyberCard>

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