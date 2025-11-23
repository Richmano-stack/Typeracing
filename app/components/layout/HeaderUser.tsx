
"use client";

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { User } from 'lucide-react';
import { faKeyboard } from '@fortawesome/free-solid-svg-icons';
import { useSession, signOut } from 'next-auth/react';

const secondaryLinks = [
    { name: 'Dashboard', href: '/dashboard' }, // Nouveau pour l'utilisateur
    { name: 'Stats', href: '/stats' },
    { name: 'Discord', href: 'https://discord.gg/your_invite' },
];

const HeaderUser: React.FC = () => {
    const { data: session } = useSession();
    const user = session?.user;
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        signOut({ callbackUrl: '/' });
    };

    return (
        <header
            className="fixed top-0 w-full z-50 shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(var(--bg-surface-rgb), 0.9)', borderBottom: '1px solid var(--border)' }}
        >
            <div className="container mx-auto flex justify-between items-center p-4">

                {/* Logo/Brand */}
                <Link href="/" passHref>
                    <span
                        className="text-3xl font-extrabold cursor-pointer transition duration-150 flex items-center"
                        style={{ color: 'var(--accent)' }}
                    >
                        <FontAwesomeIcon icon={faKeyboard} size='lg' /> <span className="ml-2">TypeRace</span>
                    </span>
                </Link>

                {/* ACTIONS CONTAINER */}
                <div className="flex items-center space-x-4 md:space-x-6">

                    {/* Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/race" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            Play
                        </Link>
                        <Link href="/leaderboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            Leaderboard
                        </Link>

                        {/* User Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition duration-200 focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg-base)] overflow-hidden">
                                    {user?.image ? (
                                        <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} />
                                    )}
                                </div>
                                <div className="flex flex-col text-sm leading-none items-start">
                                    <span className="font-semibold text-[var(--text-primary)]">{user?.name || 'User'}</span>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-md shadow-lg py-1 z-50">
                                    <Link href="/account" className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface)]" onClick={() => setIsDropdownOpen(false)}>
                                        Account
                                    </Link>
                                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface)]" onClick={() => setIsDropdownOpen(false)}>
                                        Dashboard
                                    </Link>
                                    <Link href="/settings" className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface)]" onClick={() => setIsDropdownOpen(false)}>
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-surface)]"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeaderUser;