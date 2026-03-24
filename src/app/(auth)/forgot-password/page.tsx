"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';

export default function ForgotPasswordPage() {
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
                        <div className="text-sm text-[var(--text-secondary)] text-center mb-4">
                            Enter your email address and we'll send you a link to reset your password.
                        </div>

                        <CyberInput
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            required
                        />

                        <CyberButton
                            className="w-full"
                            variant="primary"
                            glow
                        >
                            Send Reset Link
                        </CyberButton>

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
