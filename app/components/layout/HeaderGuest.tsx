"use client"

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Rocket } from 'lucide-react';
import { faKeyboard } from '@fortawesome/free-solid-svg-icons';

const HeaderGuest: React.FC = () => {
  return (
    <header
      className="fixed top-0 w-full z-50 shadow-sm backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(var(--bg-surface-rgb), 0.8)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container mx-auto flex justify-between items-center p-4">

        {/* Logo/Brand */}
        <Link href="/" passHref>
          <span
            className="text-3xl font-extrabold cursor-pointer transition duration-150 flex items-center"
            style={{ color: 'var(--accent)' }}
          >
            <FontAwesomeIcon icon={faKeyboard} size='lg' /> <span className="ml-2">TypeRace</span>
          </span>
        </Link>

        {/* ACTIONS CONTAINER */}
        <div className="flex items-center space-x-4 md:space-x-6">

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
              Home
            </Link>
            <Link href="/leaderboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
              Leaderboard
            </Link>
            <Link href="/about" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/login" passHref>
              <button
                className="font-semibold py-2 px-4 rounded-md transition duration-200 hover:text-[var(--accent)] text-[var(--text-secondary)]"
              >
                Login
              </button>
            </Link>
            <Link href="/register" passHref>
              <button
                className="font-bold py-2 px-5 rounded-md shadow-md transition duration-150 transform hover:scale-105"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}
              >
                Sign Up
              </button>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
};

export default HeaderGuest;