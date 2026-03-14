"use client";

import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2"
                        style={{ textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>
                        New Recruit
                    </h1>
                    <p className="text-[var(--text-secondary)] font-mono text-sm">
                        INITIATE REGISTRATION
                    </p>
                </div>

                <RegisterForm />
            </div>
        </div>
    );
}
