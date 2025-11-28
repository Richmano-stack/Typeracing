"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberInput from '@/components/ui/CyberInput';
import CyberButton from '@/components/ui/CyberButton';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate registration delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2"
            style={{ textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>
            New Pilot
          </h1>
          <p className="text-[var(--text-secondary)] font-mono text-sm">
            REGISTER FOR GRID ACCESS
          </p>
        </div>

        <CyberCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CyberInput
              label="Pilot Callsign (Name)"
              type="text"
              placeholder="Maverick"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <CyberInput
              label="Identity (Email)"
              type="email"
              placeholder="pilot@grid.net"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <CyberInput
              label="Passcode"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <div className="pt-4">
              <CyberButton
                type="submit"
                className="w-full"
                disabled={isLoading}
                glow
              >
                {isLoading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Create Profile</span>
                  </>
                )}
              </CyberButton>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              Already have access?{' '}
              <Link href="/login" className="text-[var(--primary)] hover:text-white transition-colors font-bold uppercase tracking-wider">
                Sign In
              </Link>
            </p>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}