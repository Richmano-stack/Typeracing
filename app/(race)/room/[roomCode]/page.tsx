"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Copy, Check, Play, Users, Loader2, AlertCircle, Trophy, LogOut } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useRoomStore, type Participant } from '@/lib/useRoomStore';
import { useRaceStore } from '@/lib/useRaceStore';
import { useTimerStore } from '@/lib/useTimerStore';

const MAX_ERRORS = 10;

export default function RoomLobbyPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const roomCode = params.roomCode as string;

    const { socket, connected, emit, on, off } = useWebSocket();
    const { room, currentParticipant, isHost, setRoom, setCurrentParticipant, updateParticipant, addParticipant, removeParticipant, reset: resetRoomStore } = useRoomStore();
    const { text, userInput, status, wpm, accuracy, errors, initializeRace, setUserInput, startRace, finishRace } = useRaceStore();
    const { elapsed, startTimer, resetTimer, tick } = useTimerStore();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [raceResults, setRaceResults] = useState<any[] | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch room data
    useEffect(() => {
        if (!roomCode) return;

        const fetchRoom = async () => {
            try {
                const response = await fetch(`/api/rooms/${roomCode}`);
                if (!response.ok) {
                    throw new Error('Room not found');
                }
                const data = await response.json();
                setRoom(data);
                
                // Find current participant
                const userId = session?.user?.id;
                const participant = data.participants.find((p: Participant) => 
                    (userId && p.userId === userId) || (!userId && p.guestName)
                );
                setCurrentParticipant(participant || null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load room');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoom();
    }, [roomCode, session, setRoom, setCurrentParticipant]);

    // WebSocket: Join room
    useEffect(() => {
        if (!connected || !room || !currentParticipant) return;

        const userId = session?.user?.id;
        const guestName = !userId ? (currentParticipant.guestName || 'Guest') : undefined;

        emit('room:join', {
            roomCode,
            userId,
            guestName,
        });

        return () => {
            emit('room:leave', { roomCode });
        };
    }, [connected, room, currentParticipant, roomCode, session, emit]);

    // WebSocket: Listen for events
    useEffect(() => {
        if (!socket || !connected) return;

        const handleParticipantJoined = (data: { participant: Participant }) => {
            addParticipant(data.participant);
        };

        const handleParticipantLeft = (data: { participantId: string }) => {
            removeParticipant(data.participantId);
        };

        const handleParticipantReady = (data: { participant: Participant; participants: Participant[] }) => {
            updateParticipant(data.participant.id, data.participant);
            if (room) {
                setRoom({ ...room, participants: data.participants });
            }
        };

        const handleRaceStarting = (data: { countdown: number; text: string; textId: string; startTime: number }) => {
            setCountdown(data.countdown);
            initializeRace(data.text, data.textId, 'multiplayer');
            
            // Countdown animation
            let currentCountdown = data.countdown;
            const countdownInterval = setInterval(() => {
                currentCountdown--;
                if (currentCountdown > 0) {
                    setCountdown(currentCountdown);
                } else {
                    setCountdown(null);
                    clearInterval(countdownInterval);
                }
            }, 1000);
        };

        const handleRaceStarted = (data: { text: string; textId: string; startTime: number }) => {
            setCountdown(null);
            startRace();
            startTimer();
            resetTimer();
            if (inputRef.current) {
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        };

        const handleRaceProgress = (data: { participantId: string; progress: number; wpm: number; accuracy: number; errors: number }) => {
            if (data.participantId !== currentParticipant?.id) {
                updateParticipant(data.participantId, {
                    progress: data.progress,
                    wpm: data.wpm,
                    accuracy: data.accuracy,
                    errors: data.errors,
                });
            }
        };

        const handleRaceFinished = (data: { participantId: string; results: any }) => {
            if (data.participantId === currentParticipant?.id) {
                finishRace();
            }
        };

        const handleRaceResults = (data: { results: any[]; leaderboard: any[] }) => {
            setRaceResults(data.leaderboard);
        };

        const handleRoomError = (data: { error: string; message: string }) => {
            setError(data.message);
        };

        on('room:participant:joined', handleParticipantJoined);
        on('room:participant:left', handleParticipantLeft);
        on('room:participant:ready', handleParticipantReady);
        on('race:starting', handleRaceStarting);
        on('race:started', handleRaceStarted);
        on('race:progress', handleRaceProgress);
        on('race:finished', handleRaceFinished);
        on('race:results', handleRaceResults);
        on('room:error', handleRoomError);

        return () => {
            off('room:participant:joined', handleParticipantJoined);
            off('room:participant:left', handleParticipantLeft);
            off('room:participant:ready', handleParticipantReady);
            off('race:starting', handleRaceStarting);
            off('race:started', handleRaceStarted);
            off('race:progress', handleRaceProgress);
            off('race:finished', handleRaceFinished);
            off('race:results', handleRaceResults);
            off('room:error', handleRoomError);
        };
    }, [socket, connected, room, currentParticipant, on, off, addParticipant, removeParticipant, updateParticipant, setRoom, initializeRace, startRace, startTimer, resetTimer, finishRace]);

    // Timer tick
    useEffect(() => {
        if (status === 'running') {
            const interval = setInterval(() => {
                tick();
            }, 100);
            return () => clearInterval(interval);
        }
    }, [status, tick]);

    // Progress updates (throttled)
    useEffect(() => {
        if (status !== 'running' || !currentParticipant || !connected) {
            if (progressUpdateRef.current) {
                clearInterval(progressUpdateRef.current);
                progressUpdateRef.current = null;
            }
            return;
        }

        progressUpdateRef.current = setInterval(() => {
            const progress = text ? (userInput.length / text.length) * 100 : 0;
            
            emit('race:progress', {
                roomCode,
                progress,
                wpm,
                accuracy,
                errors,
                userId: session?.user?.id,
                guestName: !session?.user?.id ? (currentParticipant.guestName || 'Guest') : undefined,
            });

            // Update local participant
            updateParticipant(currentParticipant.id, {
                progress,
                wpm,
                accuracy,
                errors,
            });
        }, 500); // Throttle to 500ms

        return () => {
            if (progressUpdateRef.current) {
                clearInterval(progressUpdateRef.current);
                progressUpdateRef.current = null;
            }
        };
    }, [status, text, userInput, wpm, accuracy, errors, currentParticipant, roomCode, session, connected, emit, updateParticipant]);

    // Handle race completion
    useEffect(() => {
        if (status === 'finished' && text && userInput.length >= text.length && currentParticipant && connected) {
            const timeTakenMs = elapsed * 1000;
            
            emit('race:complete', {
                roomCode,
                wpm,
                accuracy,
                errors,
                timeTakenMs,
                userId: session?.user?.id,
                guestName: !session?.user?.id ? (currentParticipant.guestName || 'Guest') : undefined,
            });
        }
    }, [status, text, userInput, wpm, accuracy, errors, elapsed, currentParticipant, roomCode, session, connected, emit]);

    const handleReady = async () => {
        if (!currentParticipant || !connected) return;

        const newReadyStatus = !currentParticipant.isReady;
        
        try {
            const response = await fetch(`/api/rooms/${roomCode}/ready`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isReady: newReadyStatus,
                    guestName: !session?.user?.id ? (currentParticipant.guestName || 'Guest') : undefined,
                }),
            });

            if (response.ok) {
                emit('room:ready', {
                    roomCode,
                    isReady: newReadyStatus,
                    userId: session?.user?.id,
                    guestName: !session?.user?.id ? (currentParticipant.guestName || 'Guest') : undefined,
                });
            }
        } catch (err) {
            console.error('Error setting ready status:', err);
        }
    };

    const handleStartRace = async () => {
        if (!isHost || !connected) return;

        try {
            const response = await fetch(`/api/rooms/${roomCode}/start`, {
                method: 'POST',
            });

            if (response.ok) {
                emit('room:start', { roomCode });
            } else {
                const errorText = await response.text();
                setError(errorText || 'Failed to start race');
            }
        } catch (err) {
            console.error('Error starting race:', err);
            setError('Failed to start race');
        }
    };

    const handleLeaveRoom = async () => {
        try {
            await fetch(`/api/rooms/${roomCode}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestName: !session?.user?.id ? (currentParticipant?.guestName || 'Guest') : undefined,
                }),
            });
            
            resetRoomStore();
            router.push('/race/create');
        } catch (err) {
            console.error('Error leaving room:', err);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/race/invite/${roomCode}`;
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const readyParticipants = room?.participants.filter(p => p.isReady).length || 0;
    const canStart = isHost && readyParticipants >= 2 && room?.status === 'WAITING';

    const renderText = useMemo(() => {
        if (!text) return null;
        const textChars = text.split('');
        const inputChars = userInput.split('');
        return textChars.map((char, i) => {
            let className = 'transition-colors duration-75 ';
            if (i < inputChars.length) {
                className += inputChars[i] === char ? 'correct-char' : 'wrong-char';
            } else {
                className += 'untyped-char';
            }
            if (i === inputChars.length && status === 'running') {
                className += ' current-char-position';
            }
            return (
                <span key={i} className={className}>
                    {char}
                </span>
            );
        });
    }, [text, userInput, status]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    if (error && !room) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <CyberCard>
                    <div className="p-8 text-center space-y-4">
                        <AlertCircle size={48} className="text-red-500 mx-auto" />
                        <h2 className="text-2xl font-bold text-white">Error</h2>
                        <p className="text-red-400">{error}</p>
                        <CyberButton onClick={() => router.push('/race/create')}>
                            Create Room
                        </CyberButton>
                    </div>
                </CyberCard>
            </div>
        );
    }

    // Show race results
    if (raceResults && room?.status === 'FINISHED') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <CyberCard className="max-w-4xl w-full">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <Trophy size={48} className="text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-white uppercase">Race Results</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            {raceResults.map((result, index) => (
                                <div
                                    key={result.id}
                                    className={`p-4 rounded-lg border ${
                                        index === 0
                                            ? 'bg-yellow-500/10 border-yellow-500'
                                            : 'bg-[var(--bg-surface)] border-[var(--border)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold text-[var(--accent)]">
                                                #{index + 1}
                                            </span>
                                            <div>
                                                <p className="text-white font-bold">
                                                    {result.user?.username || result.guestName || 'Unknown'}
                                                </p>
                                                <p className="text-[var(--text-secondary)] text-sm">
                                                    {result.wpm} WPM • {result.accuracy.toFixed(1)}% accuracy • {result.errors} errors
                                                </p>
                                            </div>
                                        </div>
                                        {index === 0 && (
                                            <Trophy className="text-yellow-500" size={24} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            {isHost && (
                                <CyberButton
                                    onClick={async () => {
                                        // Reset room for new race
                                        await fetch(`/api/rooms/${roomCode}`, { method: 'PATCH' });
                                        setRaceResults(null);
                                        setRoom({ ...room!, status: 'WAITING', currentText: null });
                                    }}
                                    variant="primary"
                                    className="flex-1"
                                >
                                    Race Again
                                </CyberButton>
                            )}
                            <CyberButton
                                onClick={handleLeaveRoom}
                                variant="secondary"
                                className="flex-1"
                            >
                                <LogOut size={18} />
                                Leave Room
                            </CyberButton>
                        </div>
                    </div>
                </CyberCard>
            </div>
        );
    }

    // Show race screen
    if (room?.status === 'IN_PROGRESS' || room?.status === 'STARTING') {
        return (
            <div className="min-h-screen flex flex-col items-center p-4 md:p-8 relative z-10">
                {countdown !== null && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                        <div className="text-9xl font-black text-[var(--primary)]">
                            {countdown > 0 ? countdown : 'GO!'}
                        </div>
                    </div>
                )}

                <div className="w-full max-w-5xl">
                    <div className="mb-8 flex justify-between items-end border-b border-[var(--border)] pb-4">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-widest text-white">
                                Room: {roomCode}
                            </h1>
                            <p className="text-[var(--text-secondary)] text-xs font-mono">
                                STATUS: {status === 'running' ? 'ACTIVE' : status.toUpperCase()}
                            </p>
                        </div>

                        <div className="flex gap-8 font-mono text-xl">
                            <div className="text-center">
                                <span className="text-[var(--text-secondary)] text-xs block">WPM</span>
                                <span className="text-[var(--primary)]">{wpm}</span>
                            </div>
                            <div className="text-center">
                                <span className="text-[var(--text-secondary)] text-xs block">ACCURACY</span>
                                <span className={accuracy < 90 ? 'text-[var(--error)]' : 'text-[var(--success)]'}>
                                    {accuracy.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <CyberCard className="mb-8">
                        <div className="p-8">
                            <div className="text-lg font-mono text-white leading-relaxed mb-6 min-h-[200px]">
                                {renderText}
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                disabled={status !== 'running'}
                                className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-white font-mono focus:outline-none focus:border-[var(--accent)]"
                                placeholder="Start typing..."
                                autoFocus
                            />
                        </div>
                    </CyberCard>

                    {/* Live leaderboard */}
                    <CyberCard>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Users size={20} />
                                Live Leaderboard
                            </h3>
                            <div className="space-y-2">
                                {room.participants
                                    .sort((a, b) => b.progress - a.progress || b.wpm - a.wpm)
                                    .map((participant, index) => (
                                        <div
                                            key={participant.id}
                                            className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-[var(--accent)] font-bold">#{index + 1}</span>
                                                <span className="text-white">
                                                    {participant.user?.username || participant.guestName || 'Unknown'}
                                                </span>
                                                {participant.id === currentParticipant?.id && (
                                                    <span className="text-xs text-[var(--accent)]">(You)</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm font-mono">
                                                <span>{participant.progress.toFixed(0)}%</span>
                                                <span>{participant.wpm.toFixed(0)} WPM</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </CyberCard>
                </div>
            </div>
        );
    }

    // Show lobby
    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative z-10">
            <div className="w-full max-w-2xl">
                <CyberCard className="border-[var(--accent)]">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                                Room: {roomCode}
                            </h1>
                            <p className="text-[var(--text-secondary)] font-mono">
                                {isHost && '👑 You are the host'}
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 mb-6">
                                <AlertCircle size={18} />
                                <span className="text-sm font-mono">{error}</span>
                            </div>
                        )}

                        {/* Invite Link */}
                        <div className="mb-6">
                            <label className="text-sm font-mono text-[var(--text-secondary)] uppercase mb-2 block">
                                Invite Link
                            </label>
                            <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
                                <span className="flex-1 truncate text-sm font-mono text-[var(--accent)]">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/race/invite/${roomCode}` : ''}
                                </span>
                                <button
                                    onClick={copyInviteLink}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                        isCopied
                                            ? 'bg-[var(--success)] text-black'
                                            : 'bg-white text-black hover:bg-[var(--primary)]'
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
                        </div>

                        {/* Participants */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Users size={20} />
                                Participants ({room?.participants.length || 0}/{room?.maxPlayers || 10})
                            </h3>
                            <div className="space-y-2">
                                {room?.participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${
                                            participant.id === currentParticipant?.id
                                                ? 'bg-[var(--bg-primary-hover)] border-[var(--accent)]'
                                                : 'bg-[var(--bg-surface)] border-[var(--border)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-white font-bold">
                                                {participant.user?.username || participant.guestName || 'Unknown'}
                                            </span>
                                            {participant.id === currentParticipant?.id && (
                                                <span className="text-xs text-[var(--accent)]">(You)</span>
                                            )}
                                            {room.hostId === participant.userId && (
                                                <span className="text-xs text-yellow-500">👑 Host</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {participant.isReady ? (
                                                <span className="text-[var(--success)] text-sm font-mono">✓ Ready</span>
                                            ) : (
                                                <span className="text-[var(--text-muted)] text-sm font-mono">Not ready</span>
                                            )}
                                            {participant.id === currentParticipant?.id && (
                                                <CyberButton
                                                    onClick={handleReady}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    {currentParticipant.isReady ? 'Unready' : 'Ready'}
                                                </CyberButton>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            {isHost && (
                                <CyberButton
                                    onClick={handleStartRace}
                                    variant="primary"
                                    size="lg"
                                    disabled={!canStart || !connected}
                                    className="flex-1"
                                >
                                    <Play size={20} />
                                    Start Race
                                </CyberButton>
                            )}
                            <CyberButton
                                onClick={handleLeaveRoom}
                                variant="secondary"
                                className="flex-1"
                            >
                                <LogOut size={18} />
                                Leave Room
                            </CyberButton>
                        </div>

                        {!connected && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm font-mono text-center">
                                Connecting to server...
                            </div>
                        )}
                    </div>
                </CyberCard>
            </div>
        </div>
    );
}

