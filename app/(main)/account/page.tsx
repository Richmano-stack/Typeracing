"use client"

import React from 'react';
import { User, Calendar, Clock, Mail } from 'lucide-react';

export default function AccountPage() {
    // Frontend-only: Use mock user data
    const user = {
        name: 'Demo Racer',
        email: 'demo@typeracing.com',
        image: null,
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date(),
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-[var(--bg-surface)] shadow-xl rounded-lg overflow-hidden border border-[var(--border)]">

                    {/* Header / Banner */}
                    <div className="bg-[var(--accent)] h-32 w-full relative">
                        <div className="absolute -bottom-16 left-8">
                            <div className="h-32 w-32 rounded-full border-4 border-[var(--bg-surface)] bg-[var(--bg-card)] overflow-hidden flex items-center justify-center">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name || 'User'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User size={64} className="text-[var(--text-muted)]" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="pt-20 pb-8 px-8">
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                            {user.name || 'Anonymous Racer'}
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">
                            @{user.email?.split('@')[0] || 'username'}
                        </p>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Email */}
                            <div className="flex items-center p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                                <div className="p-3 rounded-full bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] mr-4">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">Email Address</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>

                            {/* Account Created */}
                            <div className="flex items-center p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                                <div className="p-3 rounded-full bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] mr-4">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">Member Since</p>
                                    <p className="font-medium">
                                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Last Login */}
                            <div className="flex items-center p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                                <div className="p-3 rounded-full bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] mr-4">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--text-secondary)]">Last Login</p>
                                    <p className="font-medium">
                                        {user.lastLogin
                                            ? new Date(user.lastLogin).toLocaleString(undefined, {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })
                                            : 'Never'}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
