"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signIn } from 'next-auth/react';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get error from URL (if redirected from failed auth)
  const urlError = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setIsLoading(false);
      } else {
        // Successful login - redirect to profile
        router.push('/profile');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn(provider, {
        callbackUrl: '/profile',
      });
    } catch (err) {
      setError(`Failed to sign in with ${provider}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">

      <div
        className="w-full max-w-md ui-card p-8 md:p-10 text-center"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >

        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
          <LogIn className="inline mr-2" size={30} /> Sign In
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Welcome back, racer.
        </p>

        {/* Error Message */}
        {(error || urlError) && (
          <div
            className="mb-6 p-3 rounded-lg border"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#ef4444'
            }}
          >
            {error || 'Authentication failed. Please try again.'}
          </div>
        )}

        {/* --- EMAIL/PASSWORD FORM --- */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email Input */}
          <div>
            <label className="sr-only" htmlFor="email">Email</label>
            <div
              className="flex items-center p-3 rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <Mail size={20} className="mr-3" style={{ color: 'var(--text-muted)' }} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email Address"
                required
                disabled={isLoading}
                className="w-full bg-transparent focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="sr-only" htmlFor="password">Password</label>
            <div
              className="flex items-center p-3 rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <Lock size={20} className="mr-3" style={{ color: 'var(--text-muted)' }} />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
                disabled={isLoading}
                className="w-full bg-transparent focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-extrabold py-3 rounded-lg transition transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Link to Registration */}
        <p className="mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link href="/register" passHref>
            <span className="font-semibold cursor-pointer hover:underline" style={{ color: 'var(--accent)' }}>
              Sign Up here
            </span>
          </Link>
        </p>

        {/* --- SOCIAL LOGIN OPTIONS --- */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t" style={{ borderColor: 'var(--border)' }}></div>
          <span className="mx-4 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
            Or continue with
          </span>
          <div className="flex-grow border-t" style={{ borderColor: 'var(--border)' }}></div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 rounded-lg font-semibold border transition duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#24292e', color: 'white', borderColor: 'transparent' }}
          >
            <FontAwesomeIcon icon={faGithub} size="lg" className="mr-2" />
            GitHub
          </button>
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 rounded-lg font-semibold border transition duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#4285F4', color: 'white', borderColor: 'transparent' }}
          >
            <FontAwesomeIcon icon={faGoogle} size="lg" className="mr-2" />
            Google
          </button>
        </div>

      </div>

    </div>
  );
};

export default LoginPage;