'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRaceStore } from '@/store/useRaceStore';
import { multiplayerApi } from '@/services/multiplayerApi';
import { authClient } from '@/lib/auth-client';
import {
  Loader2, Users, Crown, Wifi, Copy, CheckCheck,
  Zap, Clock, Shield,
} from 'lucide-react';

interface LobbyPhaseProps {
  roomId: string;
  userId: string | null;
}

// ─────────────────────────────────────────────────────────────
// Root Component
// ─────────────────────────────────────────────────────────────
export function LobbyPhase({ roomId, userId }: LobbyPhaseProps) {
  const role      = useRaceStore((s) => s.role);
  const gameState = useRaceStore((s) => s.state);
  const hostReady = useRaceStore((s) => s.hostReady);
  const guestReady = useRaceStore((s) => s.guestReady);
  const opponentName = useRaceStore((s) => s.opponentName);
  const isReady   = useRaceStore((s) => s.isReady);
  const setGameState = useRaceStore((s) => s.setGameState);
  const { data: session } = authClient.useSession();

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || (role === 'guest' ? 'Guest (You)' : 'Host (You)');

  // ── Guest Auto-Join (one-shot) ─────────────────────────────
  const hasJoined = useRef(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (role !== 'guest') return;
    if (roomId === 'test') return;
    if (hasJoined.current) return;

    hasJoined.current = true;
    setIsJoining(true);

    multiplayerApi
      .joinRoom(roomId, userId)
      .then((res) => {
        console.log('[LobbyPhase] Guest joined room:', roomId);
        // Optimistic Sync: update store immediately from join response
        setGameState({
          state: res.room.state as any,
          opponentName: res.room.host_id, // For Guest, the host is the opponent
          hostReady: res.room.host_ready,
          guestReady: res.room.guest_ready,
        });
      })
      .catch((err) => {
        console.error('[LobbyPhase] Guest join failed:', err);
        setJoinError(err?.message ?? 'Failed to join room.');
        hasJoined.current = false; // allow retry
      })
      .finally(() => setIsJoining(false));
  }, [role, roomId, userId]);

  // ── Auto-Start Watcher ─────────────────────────────────────
  // page.tsx phase-switch handles unmounting — we just clean local state here.
  useEffect(() => {
    if (gameState === 'COUNTDOWN' || gameState === 'IN_PROGRESS') {
      // nothing to clean up in this component specifically,
      // but guard any future side-effects here.
    }
  }, [gameState]);

  // ── Derived state ──────────────────────────────────────────
  const isWaitingForGuest = gameState === 'WAITING_FOR_GUEST';
  const isLobbyFull       = gameState === 'LOBBY_FULL' || gameState === 'READY_CHECK';

  // Which ready flag belongs to "me" and which to "them"?
  const myReady       = role === 'host' ? hostReady : guestReady;
  const opponentReady = role === 'host' ? guestReady : hostReady;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">

      {/* ── Section title ─────────────────────────────────── */}
      <div className="text-center">
        <p className="text-[#00f3ff]/40 font-mono text-[10px] tracking-[0.4em] uppercase mb-1">
          Multiplayer Lobby
        </p>
        <div className="flex items-center gap-2 justify-center">
          {role === 'host'
            ? <Crown className="w-4 h-4 text-yellow-400" />
            : <Users className="w-4 h-4 text-[#00f3ff]" />}
          <h1 className="text-lg font-bold tracking-widest uppercase text-white font-mono">
            {role === 'host' ? 'You are the Host' : role === 'guest' ? 'You are the Guest' : 'Connecting...'}
          </h1>
        </div>
      </div>

      {/* ── Join error banner ─────────────────────────────── */}
      {joinError && (
        <div className="w-full text-red-400 font-mono text-xs text-center bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
          ⚠ {joinError}
        </div>
      )}

      {/* ── Invite Card (host only) ───────────────────────── */}
      {role === 'host' && <InviteCard roomId={roomId} />}

      {/* ── Player Deck ───────────────────────────────────── */}
      <div className="w-full flex flex-col gap-3">
        <PlayerCard
          label={role === 'host' ? 'You (Host)' : 'Host'}
          name={role === 'host' ? userName : (opponentName ?? null)}
          icon={<Crown className="w-4 h-4 text-yellow-400" />}
          isConnected={true}
          isReady={role === 'host' ? myReady : opponentReady}
          isSelf={role === 'host'}
          isJoining={false}
        />
        <PlayerCard
          label={role === 'guest' ? 'You (Guest)' : 'Guest'}
          name={role === 'guest' ? userName : (opponentName ?? null)}
          icon={<Users className="w-4 h-4 text-[#00f3ff]" />}
          isConnected={role === 'guest' ? true : isLobbyFull}
          isReady={role === 'guest' ? myReady : opponentReady}
          isSelf={role === 'guest'}
          isJoining={role === 'guest' && isJoining}
        />
      </div>

      {/* ── Room status pill ──────────────────────────────── */}
      <StatusPill
        isWaitingForGuest={isWaitingForGuest}
        isLobbyFull={isLobbyFull}
        gameState={gameState}
      />

      {/* ── Ready Button ──────────────────────────────────── */}
      {role && (
        <ReadyButton
          roomId={roomId}
          userId={userId}
          role={role}
          isAlreadyReady={myReady}
          opponentReady={opponentReady}
          opponentName={opponentName}
          isLobbyFull={isLobbyFull}
          setGameState={setGameState}
        />
      )}

      {/* ── Polling indicator ─────────────────────────────── */}
      <div className="flex items-center gap-2 text-gray-700 mt-1">
        <Wifi className="w-3 h-3 animate-pulse" />
        <span className="font-mono text-[9px] tracking-[0.3em] uppercase">Syncing every 1s</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// InviteCard (Host only)
// ─────────────────────────────────────────────────────────────
function InviteCard({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/race/${roomId}`
      : `/race/${roomId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [inviteUrl]);

  return (
    <div className="w-full bg-gray-900/50 border border-[#00f3ff]/15 rounded-xl px-5 py-4 backdrop-blur-sm">
      <p className="font-mono text-[10px] text-[#00f3ff]/50 tracking-[0.3em] uppercase mb-3">
        Share this link with your opponent
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/50 truncate select-all">
          {inviteUrl}
        </div>
        <button
          id="invite-copy-btn"
          onClick={handleCopy}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase transition-all duration-200 ${
            copied
              ? 'bg-green-500/20 border border-green-500/40 text-green-400'
              : 'bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] hover:bg-[#00f3ff]/20 active:scale-95'
          }`}
        >
          {copied ? (
            <><CheckCheck className="w-3 h-3" /> Copied!</>
          ) : (
            <><Copy className="w-3 h-3" /> Copy</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PlayerCard
// ─────────────────────────────────────────────────────────────
interface PlayerCardProps {
  label: string;
  name: string | null;
  icon: React.ReactNode;
  isConnected: boolean;
  isReady: boolean;
  isSelf: boolean;
  isJoining: boolean;
}

function PlayerCard({ label, name, icon, isConnected, isReady, isSelf, isJoining }: PlayerCardProps) {
  const readyColor = isReady ? 'bg-green-400' : 'bg-yellow-400/60';

  return (
    <div
      className={`relative flex items-center justify-between rounded-xl px-5 py-4 border transition-all duration-300 overflow-hidden ${
        isConnected
          ? isReady
            ? 'bg-green-900/10 border-green-500/20'
            : 'bg-white/[0.03] border-white/10'
          : 'bg-gray-900/30 border-dashed border-white/10'
      }`}
    >
      {/* Ready glow strip */}
      {isConnected && isReady && (
        <div className="absolute inset-y-0 left-0 w-0.5 bg-green-400 rounded-full" />
      )}

      {/* Left: icon + name */}
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">{label}</p>
          {isConnected ? (
            <p className="font-mono text-sm text-white/90 tracking-wide">
              {name ?? <span className="text-gray-500 italic">Unknown</span>}
            </p>
          ) : isJoining ? (
            <div className="flex items-center gap-1.5 text-[#00f3ff]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="font-mono text-xs text-[#00f3ff]/60">Joining...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-2 rounded bg-gray-800 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Right: ready badge */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <span className={`w-2 h-2 rounded-full ${readyColor} ${isReady ? '' : 'animate-pulse'}`} />
            <span className={`font-mono text-xs tracking-widest uppercase ${isReady ? 'text-green-400' : 'text-yellow-400/60'}`}>
              {isReady ? 'Ready' : 'Not Ready'}
            </span>
          </>
        ) : (
          <span className="font-mono text-xs text-gray-600 tracking-widest uppercase">Empty</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatusPill
// ─────────────────────────────────────────────────────────────
function StatusPill({
  isWaitingForGuest,
  isLobbyFull,
  gameState,
}: {
  isWaitingForGuest: boolean;
  isLobbyFull: boolean;
  gameState: string;
}) {
  if (isWaitingForGuest) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20">
        <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />
        <span className="font-mono text-xs text-yellow-400 tracking-widest uppercase">Waiting for opponent...</span>
      </div>
    );
  }
  if (isLobbyFull) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-400/10 border border-green-400/20">
        <Shield className="w-3 h-3 text-green-400" />
        <span className="font-mono text-xs text-green-400 tracking-widest uppercase">Both players connected</span>
      </div>
    );
  }
  if (gameState === 'COUNTDOWN') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00f3ff]/10 border border-[#00f3ff]/20">
        <Zap className="w-3 h-3 text-[#00f3ff] animate-pulse" />
        <span className="font-mono text-xs text-[#00f3ff] tracking-widest uppercase">Race starting!</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
      <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
      <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Syncing...</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ReadyButton
// ─────────────────────────────────────────────────────────────
interface ReadyButtonProps {
  roomId: string;
  userId: string | null;
  role: 'host' | 'guest';
  isAlreadyReady: boolean;
  opponentReady: boolean;
  opponentName: string | null;
  isLobbyFull: boolean;
  setGameState: (data: any) => void;
}

function ReadyButton({
  roomId,
  userId,
  role,
  isAlreadyReady,
  opponentReady,
  opponentName,
  isLobbyFull,
  setGameState,
}: ReadyButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReady = isLobbyFull && !isAlreadyReady && !isPending;

  const handleReady = useCallback(async () => {
    if (!canReady || !userId) return;
    setIsPending(true);
    setError(null);

    try {
      const res = await multiplayerApi.readyUp(roomId, userId);
      console.log('[ReadyButton] Ready-up success:', res);
      
      const bothReady = res.room.host_ready && res.room.guest_ready;

      if (bothReady) {
        console.log('[ReadyButton] Both ready! Triggering race start...');
        const startRes = await multiplayerApi.startRace(roomId, userId);
        
        // Calculate clock offset based on server time
        const clockOffset = startRes.serverNowMs - Date.now();
        
        setGameState({
          state: 'COUNTDOWN' as any,
          targetStartMs: startRes.targetStartMs,
          clockOffsetMs: clockOffset,
          hostReady: true,
          guestReady: true,
          isReady: true,
        });
      } else {
        // Optimistic sync for partial ready
        setGameState(role === 'host' ? { hostReady: true, isReady: true } : { guestReady: true, isReady: true });
      }
    } catch (err: any) {
      console.error('[ReadyButton] Ready-up/Start failed:', err);
      setError(err?.message ?? 'Failed to ready up – try again.');
    } finally {
      setIsPending(false);
    }
  }, [canReady, userId, roomId, role, setGameState]);

  // ── Waiting for opponent to ready ──
  if (isAlreadyReady && !opponentReady) {
    const opponentLabel = opponentName ?? (role === 'host' ? 'Guest' : 'Host');
    return (
      <div className="w-full flex flex-col items-center gap-2">
        <div className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-green-900/20 border border-green-500/30 font-mono text-sm text-green-400 tracking-widest uppercase">
          <CheckCheck className="w-4 h-4" />
          Ready! Waiting for {opponentLabel}...
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-green-400/40 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Both ready ──
  if (isAlreadyReady && opponentReady) {
    return (
      <div className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 font-mono text-sm text-[#00f3ff] tracking-widest uppercase animate-pulse">
        <Zap className="w-4 h-4" />
        Race Starting...
      </div>
    );
  }

  // ── Waiting for guest to join before ready is available ──
  if (!isLobbyFull && !isAlreadyReady) {
    return (
      <button
        disabled
        className="w-full px-6 py-4 rounded-xl bg-gray-800/60 border border-gray-700/50 font-mono text-sm text-gray-600 tracking-widest uppercase cursor-not-allowed"
      >
        Waiting for opponent to join...
      </button>
    );
  }

  // ── Default: ready button ──
  return (
    <div className="w-full flex flex-col items-center gap-2">
      {error && (
        <p className="font-mono text-xs text-red-400 text-center">{error}</p>
      )}
      <button
        id="ready-btn"
        onClick={handleReady}
        disabled={!canReady}
        className={`group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-mono text-sm tracking-widest uppercase transition-all duration-200 ${
          isPending
            ? 'bg-[#00f3ff]/10 border border-[#00f3ff]/20 text-[#00f3ff]/50 cursor-wait'
            : 'bg-gradient-to-r from-[#00f3ff]/20 to-[#7700ff]/20 border border-[#00f3ff]/40 text-[#00f3ff] hover:from-[#00f3ff]/30 hover:to-[#7700ff]/30 hover:shadow-[0_0_20px_rgba(0,243,255,0.2)] active:scale-[0.98]'
        }`}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
        ) : (
          <><Zap className="w-4 h-4 group-hover:animate-pulse" /> I'm Ready</>
        )}
      </button>
    </div>
  );
}
