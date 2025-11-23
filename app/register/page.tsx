"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signIn } from 'next-auth/react';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    try {
      // Call registration API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
          name: username, // Use username as display name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Registration successful - auto login
      setSuccess(true);

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but login failed - redirect to login page
        router.push('/login?message=Registration successful. Please log in.');
      } else {
        // Both registration and login succeeded - redirect to profile
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
          <UserPlus className="inline mr-2" size={30} /> Create Account
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Join thousands of other competitive typists.
        </p>

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-3 rounded-lg border"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#ef4444'
            }}
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            className="mb-6 p-3 rounded-lg border"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderColor: 'rgba(34, 197, 94, 0.3)',
              color: '#22c55e'
            }}
          >
            Account created successfully! Logging you in...
          </div>
        )}

        {/* --- EMAIL/PASSWORD FORM --- */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Username Input */}
          <div>
            <label className="sr-only" htmlFor="username">Username</label>
            <div
              className="flex items-center p-3 rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <User size={20} className="mr-3" style={{ color: 'var(--text-muted)' }} />
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Username"
                required
                disabled={isLoading}
                className="w-full bg-transparent focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

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
                placeholder="Password (min 8 characters)"
                required
                minLength={8}
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
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Link to Login */}
        <p className="mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" passHref>
            <span className="font-semibold cursor-pointer hover:underline" style={{ color: 'var(--accent)' }}>
              Sign In here
            </span>
          </Link>
        </p>

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

export default RegisterPage;