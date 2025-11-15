"use client"

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Rocket } from 'lucide-react';
import { faKeyboard } from '@fortawesome/free-solid-svg-icons';

// Navigation links
const secondaryLinks = [
  { name: 'Stats', href: '/stats' },
  { name: 'About', href: '/about' },
  { name: 'Discord', href: 'https://discord.gg/your_invite' }, 
];

const Header: React.FC = () => {
  // const [isMenuOpen, setIsMenuOpen] = React.useState(false); // State for mobile menu, if needed

  return (
    // Fixed positioning using Tailwind and theme variables for styling
    <header 
      className="fixed top-0 w-full z-50 shadow-lg"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container mx-auto flex justify-between items-center p-4">
        
        {/* Logo/Brand (Uses accent color for brand consistency) */}
        <Link href="/" passHref>
          <span 
            className="text-3xl font-extrabold cursor-pointer transition duration-150"
            style={{ color: 'var(--accent)' }}
          >
            <FontAwesomeIcon icon={faKeyboard} size='lg' /> <span className="ml-2">TypeRacer</span>
          </span>
        </Link>

        {/* ACTIONS CONTAINER (Links + Buttons) */}
        <div className="flex items-center space-x-4 md:space-x-6">
          
          {/* Section A: Navigation and Authentication (Hidden on small screens) */}
          <div className="hidden md:flex items-center space-x-6">

            {/* Secondary Navigation Links */}
           {secondaryLinks.map((link) => (
            <Link key={link.name} href={link.href} passHref>
                <span
                className="relative text-lg cursor-pointer text-[var(--text-secondary)] hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-white after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
                >
                {link.name}
                </span>
            </Link>
            ))}

            
            {/* Authentication Buttons (Login/Register) */}
            <div className="flex items-center space-x-4">

                <Link href="/login" passHref>
                    <button
                    className="
                        font-semibold py-1 px-3 rounded-md transition 
                        duration-200 border cursor-pointer
                        hover:bg-[var(--text-primary)]
                        hover:text-[var(--bg-card)]
                        bg-[var(--bg-card)]
                        text-[var(--text-primary)]
                        border-[var(--border)]
                    "
                    >
                    Sign In
                    </button>
                </Link>

                <Link href="/register" passHref>
                    <button
                    className="
                        font-semibold py-1 px-3 rounded-md transition 
                        duration-200 border cursor-pointer
                        hover:bg-[var(--text-primary)]
                        hover:text-[var(--bg-card)]
                        bg-[var(--bg-card)]
                        text-[var(--text-primary)]
                        border-[var(--border)]
                    "
                    >
                    Sign Up
                    </button>
                </Link>

            </div>



          </div>

          {/* Section B: Primary Call To Action (CTA) - Always visible */}
          <Link href="/race" passHref>
            <button
              className="font-extrabold py-3 px-4 rounded-md shadow-lg transition duration-150 transform hover:scale-105 flex items-center justify-center" 
                style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: 'var(--bg-base)', 
                }}
            >
              <Rocket size={30} className="mr-2" /> <span className="ml-2 text-xl">Start Racing</span>
            </button>
          </Link>
          
        </div>
      </div>
    </header>
  );
};

export default Header;