"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, LogOut, User, ChevronDown } from 'lucide-react';
import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import Image from 'next/image';

import { useQuery } from '@tanstack/react-query';

interface HeaderAuthenticatedProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    }
}

const HeaderAuthenticated: React.FC<HeaderAuthenticatedProps> = ({ user }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = authClient.useSession();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['user-telemetry'],
        queryFn: async () => {
            const res = await fetch('/api/user/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
        staleTime: 30000,
        enabled: !!session?.user,
    });

    // Fallback values
    const bestWpm = stats?.bestWpm ?? 0;
    const recentAvgWpm = stats?.recentAvgWpm ?? 0;
    const totalRaces = stats?.totalRaces ?? 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/"; // Redirect after successful logout
                },
                onRequest: () => {
                    setIsPending(true);
                },
                onError: (ctx) => {
                    setIsPending(false);
                    console.error("Logout failed:", ctx.error.message);
                }
            },
        });
    };

    const isDashboard = pathname === '/';

    return (
        <header
            className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-[var(--border)]"
            style={{
                backgroundColor: 'rgba(5, 5, 5, 0.8)',
            }}
        >
            <div className="container mx-auto flex justify-between items-center h-16 px-4">

                {/* Logo/Brand */}
                <Link href="/dashboard" className="group flex items-center gap-2">
                    <div className="p-2 border border-[var(--primary)] rounded-sm group-hover:bg-[rgba(0,243,255,0.1)] transition-colors">
                        <Terminal size={20} className="text-[var(--primary)]" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white uppercase group-hover:text-[var(--primary)] transition-colors">
                        Type<span className="text-[var(--primary)]">Race</span>
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {isDashboard ? (
                        <div className="flex items-center gap-6 bg-[rgba(255,255,255,0.03)] px-4 py-2 border border-[var(--border)] rounded-sm">
                            {/* Segment 1: BEST_WPM */}
                            <div className="flex flex-col items-center min-w-[60px] font-mono">
                                <span className="text-[8px] text-[var(--text-secondary)] uppercase tracking-tighter opacity-70">Best_WPM</span>
                                <span className="text-sm font-bold text-[var(--primary)] tabular-nums">
                                    {isLoading ? '---' : Math.round(bestWpm)}
                                </span>
                            </div>

                            <div className="w-[1px] h-4 bg-[var(--border)] opacity-30" />

                            {/* Segment 2: AVG_10 */}
                            <div className="flex flex-col items-center min-w-[60px] font-mono">
                                <span className="text-[8px] text-[var(--text-secondary)] uppercase tracking-tighter opacity-70">Avg_10</span>
                                <span className="text-sm font-bold text-[#00f3ff] tabular-nums">
                                    {isLoading ? '---' : recentAvgWpm}
                                </span>
                            </div>

                            <div className="w-[1px] h-4 bg-[var(--border)] opacity-30" />

                            {/* Segment 3: SYNC_COUNT */}
                            <div className="flex flex-col items-center min-w-[60px] font-mono">
                                <span className="text-[8px] text-[var(--text-secondary)] uppercase tracking-tighter opacity-70">Sync_Count</span>
                                <span className="text-sm font-bold text-white tabular-nums">
                                    {isLoading ? '---' : totalRaces}
                                </span>
                            </div>
                        </div>
                    ) : (
                        ['Leaderboard', 'Profile'].map((item) => (
                            <Link
                                key={item}
                                href={`/${item.toLowerCase()}`}
                                className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-white transition-colors relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all group-hover:w-full" />
                            </Link>
                        ))
                    )}
                </nav>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors"
                        disabled={isPending}
                    >
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-bold text-white">{user.name || user.email?.split('@')[0] || 'Racer'}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{isPending ? 'Logging out...' : 'Online'}</span>
                        </div>

                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--card-bg)]">
                            {user.image ? (
                                <Image
                                    src={user.image}
                                    alt={user.name || 'User'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)]">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                        <ChevronDown size={16} className={`text-[var(--text-secondary)] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-[var(--border)]">
                                <p className="text-sm font-bold text-white truncate">{user.name || user.email?.split('@')[0] || 'Racer'}</p>
                                <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                            </div>

                            <div className="p-2">
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <User size={16} />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    disabled={isPending}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50"
                                >
                                    <LogOut size={16} />
                                    {isPending ? 'Logging out...' : 'Logout'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

export default HeaderAuthenticated;
