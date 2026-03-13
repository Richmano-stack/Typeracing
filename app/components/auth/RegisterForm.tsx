"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Lock } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';
import { authClient } from '@/lib/auth-client';

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        await authClient.signUp.email({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            callbackURL: "/dashboard",
        }, {
            onRequest: () => setIsLoading(true),
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setIsLoading(false);
            },
        });
    };

    return (
        <CyberCard>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/*                 <CyberInput
                    label="Username"
                    name="name"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.name}
                    onChange={handleChange}
                    icon={<User size={16} />}
                    required
                /> */}

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

                <CyberInput
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    icon={<Lock size={16} />}
                    required
                />

                <CyberButton
                    type="submit"
                    className="w-full flex items-center justify-center gap-2"
                    disabled={isLoading}
                    variant="primary"
                    glow
                >
                    {isLoading ? 'Creating Account...' : 'Register'}
                </CyberButton>

                <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[var(--primary)] hover:underline">
                        Login
                    </Link>
                </div>
            </form>
        </CyberCard>
    );
}
