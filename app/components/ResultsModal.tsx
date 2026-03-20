"use client";

import React from 'react';
import { Trophy, BarChart3, RefreshCw, UserPlus, ExternalLink, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { FinishResponse } from '@/services/raceApi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ResultsModalProps {
    isOpen: boolean;
    isLoading: boolean;
    results: FinishResponse | null;
    onReset: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ isOpen, isLoading, results, onReset }) => {
    if (!isOpen) return null;
    const router = useRouter();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 font-mono">
            <div
                className={`max-w-2xl w-full bg-[#0a0a0a] p-8 md:p-12 relative overflow-hidden border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]
                    ${results?.saved === false ? 'border-[#ffdf00]' : 'border-[#00ff41]/30'}
                `}
            >
                {/* Glitch Overlay for background */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <div className="relative">
                            <Loader2 className="animate-spin text-[#00ff41]" size={64} />
                            <div className="absolute inset-0 animate-pulse bg-[#00ff41]/20 blur-xl rounded-full" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-[#00ff41] animate-pulse text-center">
                            Decrypting Results...
                        </h2>
                        <div className="w-48 h-1 bg-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[#00ff41] animate-[loading_2s_infinite]" />
                        </div>
                        <style jsx>{`
                            @keyframes loading {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(100%); }
                            }
                        `}</style>
                    </div>
                ) : results ? (
                    <>
                        {/* Header */}
                        <header className="mb-10 relative">
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                                        Session <span className="text-[#00ff41]">Terminated</span>
                                    </h2>
                                    <p className="text-[10px] tracking-[0.4em] opacity-40 mt-1 uppercase">
                                        Data Retrieval: Successful
                                    </p>
                                </div>
                                {results.saved ? (
                                    <div className="bg-[#00ff41]/10 border border-[#00ff41] px-3 py-1 text-[#00ff41] text-[10px] font-bold tracking-widest uppercase">
                                        Stats Synchronized
                                    </div>
                                ) : (
                                    <div className="bg-[#ffdf00]/10 border border-[#ffdf00] px-3 py-1 text-[#ffdf00] text-[10px] font-bold tracking-widest uppercase animate-pulse text-center">
                                        Unregistered
                                    </div>
                                )}
                            </div>
                        </header>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-6 mb-10">
                            <div className="bg-white/5 p-6 border-l-4 border-[#00ff41]">
                                <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2 flex items-center gap-2">
                                    <Zap size={10} /> Net Speed
                                </div>
                                <div className="text-5xl font-black text-[#00ff41] italic">
                                    {Math.round(results.wpm)}<span className="text-sm font-normal opacity-40 ml-1 not-italic">WPM</span>
                                </div>
                            </div>
                            <div className="bg-white/5 p-6 border-l-4 border-[#00ff41]">
                                <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2 flex items-center gap-2">
                                    <Trophy size={10} /> Precision
                                </div>
                                <div className={`text-5xl font-black italic ${results.accuracy >= 90 ? 'text-[#00ff41]' : 'text-[#ff003c]'}`}>
                                    {results.accuracy.toFixed(1)}<span className="text-sm font-normal opacity-40 ml-1 not-italic">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Session Status Box */}
                        {!results.saved && (
                            <div className="mb-10 p-6 bg-[#ffdf00]/5 border border-[#ffdf00]/30 relative group">
                                <div className="absolute top-0 right-0 p-2 text-[#ffdf00] opacity-20">
                                    <AlertTriangle size={40} />
                                </div>
                                <h3 className="text-[#ffdf00] text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <BarChart3 size={16} /> Unregistered Session
                                </h3>
                                <p className="text-xs opacity-60 leading-relaxed mb-6 max-w-md">
                                    Your metrics were calculated, but this session remains anonymous. To climb the global leaderboard and track your evolution, synchronize your neural profile.
                                </p>
                                <Link
                                    href="/register"
                                    className="w-full py-4 bg-[#ffdf00] text-black font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    <UserPlus size={16} /> SIGN UP TO TRACK YOUR PROGRESS
                                </Link>
                            </div>
                        )}

                        {results.saved && (
                            <div className="mb-10 text-right">
                                <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] text-[#00ff41] hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">
                                    View Detailed Analytics <ExternalLink size={12} />
                                </Link>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={onReset}
                                className="flex-1 py-4 bg-[#00ff41] text-black font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} /> Re-Initialize
                            </button>
                             <Link
                                href="/dashboard"
                                className="px-8 py-4 border border-white/20 hover:bg-white/5 transition-all uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 flex items-center justify-center"
                            >
                                Terminate
                            </Link>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default ResultsModal;
