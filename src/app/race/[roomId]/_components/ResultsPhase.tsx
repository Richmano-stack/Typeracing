import React from 'react';
import { useRaceStore } from '@/store/useRaceStore';
import { Trophy, Frown, Loader2, CheckCircle2, XCircle, BarChart3, Target, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { multiplayerApi } from '@/services/multiplayerApi';

export function ResultsPhase() {
    const router = useRouter();
    const {
        winnerId,
        role,
        localWpm,
        localProgress,
        localAccuracy,
        opponentWpm,
        opponentProgress,
        opponentAccuracy,
        persistenceStatus
    } = useRaceStore();

    // Determine if we won using the role and winnerId (which is the user's ID)
    // Actually, winnerId is the userId. To check if we won, we might need to know if winnerId === our userId.
    // Wait, the store doesn't have `userId` explicitly, but it has `role` which we could use if we knew the host's ID vs guest's ID.
    // However, if we just want a "Winner" vs "Loser" text, we can determine the winner by who hit 100% first or has the higher WPM.
    // But since the server sets `winnerId`, if we don't have our own `userId` in `useRaceStore`, we can fallback to WPM comparison.
    // Let's rely on WPM/Progress comparison for the primary stat block if `winnerId` isn't directly matchable.
    // Actually, `useRaceStore` doesn't currently store `userId`. So let's calculate who won based on:
    const localWon = localProgress === 100 && (opponentProgress < 100 || localWpm >= opponentWpm);

    const isSaving = persistenceStatus === 'SAVING';
    const isSaved = persistenceStatus === 'SAVED' || persistenceStatus === 'ALREADY_SAVED';
    const isError = persistenceStatus === 'ERROR';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 py-10"
        >
            {/* Header: Trophy or Frown */}
            <div className="flex flex-col items-center gap-4">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-6 rounded-full border-2 ${localWon ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-neutral-700 bg-neutral-800/50'}`}
                >
                    {localWon ? <Trophy className="w-16 h-16 text-yellow-400" /> : <Frown className="w-16 h-16 text-neutral-400" />}
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-mono">
                    {localWon ? 'VICTORY' : 'DEFEAT'}
                </h1>

                {/* Persistence Badge */}
                <div className="flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800">
                    {isSaving && <><Loader2 className="w-3.5 h-3.5 animate-spin text-[#00f3ff]" /><span className="text-xs text-[#00f3ff] font-mono tracking-widest uppercase">Saving Result...</span></>}
                    {isSaved && <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs text-emerald-400 font-mono tracking-widest uppercase">Result Saved</span></>}
                    {isError && <><XCircle className="w-3.5 h-3.5 text-rose-400" /><span className="text-xs text-rose-400 font-mono tracking-widest uppercase">Failed to save</span></>}
                    {persistenceStatus === 'IDLE' && <span className="text-xs text-neutral-500 font-mono tracking-widest uppercase">Result processing...</span>}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Local Stats */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`relative p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-neutral-900/50 to-black/50 overflow-hidden ${localWon ? 'shadow-[0_0_40px_rgba(250,204,21,0.1)]' : ''}`}
                >
                    {localWon && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400" />}
                    <h3 className="text-sm font-mono tracking-widest uppercase text-[#00f3ff] mb-6">You</h3>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Gauge className="w-4 h-4" />
                                <span className="text-xs font-mono uppercase tracking-widest">Speed</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-mono font-bold text-white leading-none">{localWpm}</span>
                                <span className="text-xs font-mono text-neutral-500 mb-1">WPM</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Target className="w-4 h-4" />
                                <span className="text-xs font-mono uppercase tracking-widest">Accuracy</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-mono font-bold text-white leading-none">{localAccuracy}</span>
                                <span className="text-xs font-mono text-neutral-500 mb-1">%</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 col-span-2">
                            <div className="flex items-center justify-between text-neutral-400 mb-1">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="text-xs font-mono uppercase tracking-widest">Completion</span>
                                </div>
                                <span className="text-xs font-mono text-[#00f3ff]">{localProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                                <div className="h-full bg-[#00f3ff] transition-all duration-1000 ease-out" style={{ width: `${localProgress}%` }} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Opponent Stats */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-neutral-900/50 to-black/50 overflow-hidden opacity-80"
                >
                    {!localWon && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400" />}
                    <h3 className="text-sm font-mono tracking-widest uppercase text-[#7700ff] mb-6">Opponent</h3>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-neutral-500">
                                <Gauge className="w-4 h-4" />
                                <span className="text-xs font-mono uppercase tracking-widest">Speed</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-mono font-bold text-neutral-300 leading-none">{opponentWpm}</span>
                                <span className="text-xs font-mono text-neutral-600 mb-1">WPM</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-neutral-500">
                                <Target className="w-4 h-4" />
                                <span className="text-xs font-mono uppercase tracking-widest">Accuracy</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-mono font-bold text-neutral-300 leading-none">{opponentAccuracy}</span>
                                <span className="text-xs font-mono text-neutral-600 mb-1">%</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 col-span-2">
                            <div className="flex items-center justify-between text-neutral-500 mb-1">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="text-xs font-mono uppercase tracking-widest">Completion</span>
                                </div>
                                <span className="text-xs font-mono text-[#7700ff]">{opponentProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                                <div className="h-full bg-[#7700ff] transition-all duration-1000 ease-out" style={{ width: `${opponentProgress}%` }} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Actions */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 flex gap-4"
            >
                <button
                    onClick={() => router.push('/')}
                    className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-sm uppercase tracking-widest rounded-xl transition-colors border border-neutral-800"
                >
                    Leave Room
                </button>
                <button
                    onClick={async () => {
                        try {
                            // 1. Call your API to create the room
                            const { roomId } = await multiplayerApi.createRoom();

                            // 2. Navigate to the new room using the Next.js router
                            // Ensure you have: const router = useRouter(); at the top of your component
                            router.push(`/race/${roomId}`);
                        } catch (error) {
                            console.error("Failed to create race:", error);
                            // Add user feedback here (e.g., toast notification)
                        }
                    }}
                    className="px-8 py-3 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] font-mono text-sm uppercase tracking-widest rounded-xl transition-colors border border-[#00f3ff]/30 shadow-[0_0_20px_rgba(0,243,255,0.1)]"
                >
                    Play Again
                </button>
            </motion.div>
        </motion.div>
    );
}
