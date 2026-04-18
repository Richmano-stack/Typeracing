"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';
import { authClient } from '@/lib/auth-client';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // @ts-ignore
            const { error: resetError } = await (authClient as any).resetPassword({
                newPassword: password,
                token: token || undefined, // explicitly pass token if present, better-auth sometimes grabs it from URL
            });

            if (resetError) {
                setError(resetError.message || 'Something went wrong. Please try again.');
            } else {
                setSuccess(true);
                // We will redirect to main page after a couple of seconds so user sees success state
                setTimeout(() => {
                    router.push('/login?reset_success=1');
                }, 2000);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2"
                        style={{ textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>
                        New Password
                    </h1>
                    <p className="text-[var(--text-secondary)] font-mono text-sm">
                        SECURE YOUR ACCOUNT
                    </p>
                </div>

                <CyberCard>
                    <div className="space-y-4">
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-green-500/10 border border-green-500/50 rounded flex flex-col items-center justify-center gap-3">
                                    <CheckCircle2 className="text-green-400" size={32} />
                                    <p className="text-green-400 text-sm font-medium">
                                        Password successfully updated.
                                    </p>
                                    <p className="text-xs text-green-400/70">
                                        Redirecting to login...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!token && (
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded text-yellow-400 text-xs text-center mb-4">
                                        Warning: No token found in URL. Make sure you clicked the exact link from your console.
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <CyberInput
                                    label="New Password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                <CyberInput
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />

                                <CyberButton
                                    type="submit"
                                    className="w-full"
                                    variant="primary"
                                    disabled={isLoading}
                                    glow
                                >
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </CyberButton>
                            </form>
                        )}

                        {!success && (
                            <div className="mt-6 text-center">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                                >
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back to Login
                                </Link>
                            </div>
                        )}
                    </div>
                </CyberCard>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
