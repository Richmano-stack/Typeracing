"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: resetError } = await authClient.requestPasswordReset({
                email,
                redirectTo: "/reset-password",
            });

            if (resetError) {
                setError(resetError.message || 'Something went wrong. Please try again.');
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            {/* Return to Hub — top-left corner */}
            <div className="fixed top-6 left-6 z-20">
                <Link href="/">
                    <CyberButton variant="secondary" size="sm" glow>
                        <Home size={14} />
                        RETURN TO HUB
                    </CyberButton>
                </Link>
            </div>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2"
                        style={{ textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>
                        Recovery
                    </h1>
                    <p className="text-[var(--text-secondary)] font-mono text-sm">
                        RESET ACCESS CREDENTIALS
                    </p>
                </div>

                <CyberCard>
                    <div className="space-y-4">
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="p-3 bg-green-500/10 border border-green-500/50 rounded text-green-400 text-sm">
                                    Password reset link has been generated. Please check the server console to proceed.
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="text-sm text-[var(--text-secondary)] text-center mb-4">
                                    Enter your email address and we'll log a reset link to the console for you.
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <CyberInput
                                    label="Email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <CyberButton
                                    type="submit"
                                    className="w-full"
                                    variant="primary"
                                    disabled={isLoading}
                                    glow
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </CyberButton>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </CyberCard>
            </div>
        </div>
    );
}
