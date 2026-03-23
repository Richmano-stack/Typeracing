"use client";

import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Github, Chrome, Mail, Lock } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';

export default function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading('credentials');
        setError(null);

        try {
            const { data, error: loginError } = await authClient.signIn.email({
                email: formData.email,
                password: formData.password,
                callbackURL: "/dashboard",
            });

            if (loginError) {
                setError('Invalid email or password');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(null);
        }
    };

    const handleSocialLogin = async (provider: any) => {
        setIsLoading(provider);
        try {
            await authClient.signIn.social({
                provider,
                callbackURL: '/dashboard'
            });
        } catch (error) {
            console.error('Login error:', error);
            setIsLoading(null);
        }
    };

    return (
        <CyberCard>
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
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
                    value={formData.email}
                    onChange={handleChange}
                    icon={<Mail size={16} />}
                    required
                />

                <div className="space-y-1">
                    <CyberInput
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        icon={<Lock size={16} />}
                        required
                    />
                    <div className="flex justify-end">
                        <Link
                            href="/forgot-password"
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <CyberButton
                    type="submit"
                    className="w-full flex items-center justify-center gap-2"
                    disabled={!!isLoading}
                    variant="primary"
                    glow
                >
                    {isLoading === 'credentials' ? 'Authenticating...' : 'Login'}
                </CyberButton>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--border-primary)] opacity-30"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[var(--background)] px-2 text-[var(--text-secondary)]">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <CyberButton
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        className="w-full flex items-center justify-center gap-2"
                        disabled={!!isLoading}
                        variant="secondary"
                    >
                        <Chrome size={18} />
                        <span>Google</span>
                    </CyberButton>

                    <CyberButton
                        type="button"
                        onClick={() => handleSocialLogin('github')}
                        className="w-full flex items-center justify-center gap-2"
                        disabled={!!isLoading}
                        variant="secondary"
                    >
                        <Github size={18} />
                        <span>GitHub</span>
                    </CyberButton>
                </div>

                <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-[var(--primary)] hover:underline">
                        Register
                    </Link>
                </div>
            </form>
        </CyberCard>
    );
}
