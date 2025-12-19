"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';

export default function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Registration failed');
            }

            // Login immediately after registration
            await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            router.push('/dashboard');
            router.refresh();
        } catch (error: any) {
            setError(error.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CyberCard>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <CyberInput
                    label="Username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    icon={<User size={16} />}
                    required
                />

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
