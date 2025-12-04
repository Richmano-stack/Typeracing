"use client";

import React from 'react';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    glow?: boolean;
}

const CyberButton: React.FC<CyberButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    glow = true,
    ...props
}) => {
    const baseStyles = "relative font-bold uppercase tracking-wider transition-all duration-200 group clip-path-polygon-[0_0,100%_0,100%_70%,85%_100%,0_100%]";

    const variants = {
        primary: "text-white bg-transparent border border-[var(--primary)] hover:bg-[var(--bg-primary-hover)]",
        secondary: "text-white bg-transparent border border-[var(--accent)] hover:bg-[var(--bg-secondary-hover)]",
        danger: "text-white bg-transparent border border-[var(--error)] hover:bg-[var(--bg-danger-hover)]",
    };

    const sizes = {
        sm: "px-4 py-1 text-xs",
        md: "px-8 py-3 text-sm",
        lg: "px-10 py-4 text-lg",
    };

    const glowEffect = glow ? {
        primary: "hover:shadow-[0_0_20px_rgba(0,243,255,0.5)]",
        secondary: "hover:shadow-[0_0_20px_rgba(188,19,254,0.5)]",
        danger: "hover:shadow-[0_0_20px_rgba(255,0,85,0.5)]",
    } : { primary: "", secondary: "", danger: "" };

    return (
        <button
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${glowEffect[variant]}
                ${className}
            `}
            style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%)'
            }}
            {...props}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>

            {/* Glitch/Scanline overlay effect on hover could go here */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
        </button>
    );
};

export default CyberButton;
