"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle, Check, User } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const roomCode = params.roomCode as string;

    const [status, setStatus] = useState<'loading' | 'prompting' | 'joining' | 'error' | 'success'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [guestName, setGuestName] = useState('');
    const [showGuestInput, setShowGuestInput] = useState(false);

    useEffect(() => {
        if (!roomCode) {
            setError('Invalid room code');
            setStatus('error');
            return;
        }

        // Check if user is authenticated
        if (session?.user) {
            // Auto-join if authenticated
            joinRoom();
        } else {
            // Show guest name input
            setShowGuestInput(true);
            setStatus('prompting');
        }
    }, [roomCode, session]);

    const joinRoom = async (name?: string) => {
        setStatus('joining');
        setError(null);

        try {
            const finalGuestName = !session?.user ? (name || guestName || 'Guest') : undefined;

            const response = await fetch(`/api/rooms/${roomCode}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guestName: finalGuestName,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to join room';

                if (response.status === 404) {
                    errorMessage = 'Room not found';
                } else if (response.status === 403) {
                    if (errorText.includes('full')) {
                        errorMessage = 'Room is full';
                    } else if (errorText.includes('started')) {
                        errorMessage = 'Race has already started';
                    } else {
                        errorMessage = errorText || 'Cannot join room';
                    }
                } else {
                    errorMessage = errorText || 'Failed to join room';
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Redirect to lobby
            setStatus('success');
            setTimeout(() => {
                router.push(`/race/room/${roomCode}`);
            }, 1000);
        } catch (err) {
            console.error('Error joining room:', err);
            setError(err instanceof Error ? err.message : 'Failed to join room');
            setStatus('error');
        }
    };

    const handleGuestJoin = () => {
        if (!guestName.trim()) {
            setError('Please enter your name');
            return;
        }
        joinRoom(guestName.trim());
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative z-10">
            <div className="w-full max-w-2xl">
                <CyberCard className="border-[var(--accent)]">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--accent)]" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--accent)]" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--accent)]" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--accent)]" />

                    <div className="p-8">
                        {status === 'loading' && (
                            <div className="text-center space-y-4">
                                <Loader2 size={48} className="animate-spin text-[var(--accent)] mx-auto" />
                                <p className="text-[var(--text-secondary)] font-mono">Loading room...</p>
                            </div>
                        )}

                        {status === 'prompting' && showGuestInput && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-2">
                                        Join Private Race
                                    </h2>
                                    <p className="text-[var(--text-secondary)] font-mono text-sm">
                                        Room Code: <span className="text-[var(--accent)] font-bold">{roomCode}</span>
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
                                        <AlertCircle size={18} />
                                        <span className="text-sm font-mono">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-mono text-[var(--text-secondary)] uppercase">
                                        Enter Your Name
                                    </label>
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleGuestJoin();
                                            }
                                        }}
                                        placeholder="Your name"
                                        maxLength={20}
                                        className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-white font-mono focus:outline-none focus:border-[var(--accent)]"
                                        autoFocus
                                    />
                                </div>

                                <CyberButton
                                    onClick={handleGuestJoin}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                    disabled={!guestName.trim()}
                                >
                                    <User size={20} />
                                    <span>Join Room</span>
                                </CyberButton>
                            </div>
                        )}

                        {status === 'joining' && (
                            <div className="text-center space-y-4">
                                <Loader2 size={48} className="animate-spin text-[var(--accent)] mx-auto" />
                                <p className="text-[var(--text-secondary)] font-mono">Joining room...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="text-center space-y-4">
                                <Check size={48} className="text-[var(--success)] mx-auto" />
                                <p className="text-[var(--success)] font-mono font-bold">Successfully joined!</p>
                                <p className="text-[var(--text-secondary)] font-mono text-sm">Redirecting to lobby...</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-2">
                                        Failed to Join Room
                                    </h2>
                                    <p className="text-red-400 font-mono">{error}</p>
                                </div>

                                <div className="flex gap-4">
                                    <CyberButton
                                        onClick={() => {
                                            setError(null);
                                            setStatus('prompting');
                                            if (!session?.user) {
                                                setShowGuestInput(true);
                                            } else {
                                                joinRoom();
                                            }
                                        }}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Try Again
                                    </CyberButton>
                                    <CyberButton
                                        onClick={() => router.push('/race/create')}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Create Room
                                    </CyberButton>
                                </div>
                            </div>
                        )}
                    </div>
                </CyberCard>
            </div>
        </div>
    );
}

