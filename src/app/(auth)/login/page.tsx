"use client";

import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import CyberButton from '@/components/ui/CyberButton';

export default function LoginPage() {
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
            System Access
          </h1>
          <p className="text-[var(--text-secondary)] font-mono text-sm">
            AUTHENTICATE IDENTITY
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}