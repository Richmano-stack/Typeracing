"use client"

import React from 'react';
import Link from 'next/link';
import { Moon, Sun } from 'lucide-react'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import ThemeToggleButton from '../ui/ThemeToggleButton';

// Definition of legal and support links
const legalLinks = [
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Support', href: '/support' },
];

const socialLinks = [

    { name: 'Twitter/X', href: 'https://twitter.com/your_account', icon: faTwitter},
    { name: 'Facebook', href: 'https://facebook.com/your_page', icon: faFacebook },
];

const Footer: React.FC = () => {
  return (
    <>
      <footer 
        className="py-10 mt-16" 
        style={{ 
            backgroundColor: 'var(--bg-surface)', 
            borderTop: '1px solid var(--border)' 
        }}
      >
        <div className="container mx-auto px-4 text-center">
          
          {/* Main Section: Logo, Copyright, and Social Links */}
          <div 
              className="flex flex-col md:flex-row justify-between items-center border-b pb-6 mb-6" 
              style={{ borderBottomColor: 'var(--border)' }}
          >
              
              {/* Logo/Brand */}
              <Link 
                  href="/" 
                  className="text-2xl font-extrabold cursor-pointer mb-4 md:mb-0" 
                  style={{ color: 'var(--accent)' }} 
              >
                  typeracing
              </Link>

              {/* Copyright Text */}
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  &copy; 2025 Richmano NASY. All rights reserved.
              </p>

              {/* Social Media Icons */}
              <div className="flex space-x-4 mt-4 md:mt-0">
                  {socialLinks.map((link) => (
                      <a 
                          key={link.name} 
                          href={link.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="transition hover:opacity-80"
                          style={{ color: 'var(--text-secondary)' }}
                          aria-label={link.name}
                      >
                          <FontAwesomeIcon icon={link.icon} size="lg" />
                      </a>
                  ))}
              </div>

          </div>

          {/* Secondary Section: Legal Links */}
          <div className="flex justify-center space-x-6">
            {legalLinks.map((link) => (
              <Link 
                  key={link.name} 
                  href={link.href} 
                  className="text-sm cursor-pointer hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
              >
                  {link.name}
              </Link>
            ))}
          </div>
        </div>
      </footer>
      
      {/* NEW: Theme Toggle Button Component (Outside main footer for fixed positioning) */}
      <ThemeToggleButton />
    </>
  );
};

export default Footer;