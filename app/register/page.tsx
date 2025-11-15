"use client"

import React from 'react';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const RegisterPage: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Registration attempted!');
  };

  const handleGoogleLogin = () => alert('Continuing with Google...');
  const handleFacebookLogin = () => alert('Continuing with Facebook...');

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

        {/* --- EMAIL/PASSWORD FORM (PRIORITIZED) --- */}
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
                type="text"
                placeholder="Username"
                required
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
                type="email"
                placeholder="Email Address"
                required
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
                type="password"
                placeholder="Password"
                required
                className="w-full bg-transparent focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full font-extrabold py-3 rounded-lg transition transform hover:scale-[1.01]"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}
          >
            Sign Up
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
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center py-3 rounded-lg font-semibold border transition duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                style={{ backgroundColor: '#7D1F17', color: 'white', borderColor: 'transparent' }}
            >
                <FontAwesomeIcon icon={faGoogle} size="lg" className="mr-2" />
                Google
            </button>
            <button
                onClick={handleFacebookLogin}
                className=" w-full flex items-center justify-center py-3 rounded-lg font-semibold border transition duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                style={{ backgroundColor: '#0F3B95', color: 'white', borderColor: 'transparent' }}
            >
                <FontAwesomeIcon icon={faFacebook} size="lg" className="mr-2" />
                Facebook
            </button>
        </div>
        </div>
        
      </div>
      
  );
};

export default RegisterPage;