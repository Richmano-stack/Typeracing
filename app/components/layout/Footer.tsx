"use client"

import React from 'react';
import Link from 'next/link';
import { Terminal, Twitter, Facebook, Github } from 'lucide-react';

// Definition of legal and support links
const legalLinks = [
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Support', href: '/support' },
];

const socialLinks = [
  { name: 'Twitter/X', href: 'https://twitter.com', icon: Twitter },
  { name: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { name: 'GitHub', href: 'https://github.com', icon: Github },
];

const Footer: React.FC = () => {
  return (
    <footer className="py-12 mt-16 border-t border-[var(--border)] bg-[var(--bg-surface)] relative z-10">
      <div className="container mx-auto px-4">

        <div className="flex flex-col md:flex-row justify-between items-center pb-8 mb-8 border-b border-[var(--border)]">

          {/* Logo/Brand */}
          <Link href="/" className="group flex items-center gap-2 mb-4 md:mb-0">
            <div className="p-2 border border-[var(--primary)] rounded-sm group-hover:bg-[rgba(0,243,255,0.1)] transition-colors">
              <Terminal size={24} className="text-[var(--primary)]" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase group-hover:text-[var(--primary)] transition-colors">
              Type<span className="text-[var(--primary)]">Race</span>
            </span>
          </Link>

          {/* Social Media Icons */}
          <div className="flex space-x-6">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors hover:scale-110 transform duration-200"
                aria-label={link.name}
              >
                <link.icon size={24} />
              </a>
            ))}
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-mono">
          {/* Copyright Text */}
          <p className="text-[var(--text-muted)]">
            &copy; 2025 Richmano NASY. ALL RIGHTS RESERVED.
          </p>

          {/* Secondary Section: Legal Links */}
          <div className="flex space-x-6">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[var(--text-secondary)] hover:text-white transition-colors uppercase tracking-wider"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;