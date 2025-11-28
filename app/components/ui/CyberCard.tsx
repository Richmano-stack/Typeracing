import React from 'react';

interface CyberCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    icon?: React.ReactNode;
}

const CyberCard: React.FC<CyberCardProps> = ({ children, className = '', title, icon }) => {
    return (
        <div className={`cyber-card p-6 rounded-none ${className}`}>
            {/* Header if title exists */}
            {(title || icon) && (
                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-[var(--border)]">
                    {icon && <span className="text-[var(--primary)]">{icon}</span>}
                    {title && (
                        <h3 className="text-xl font-bold uppercase tracking-widest text-[var(--text-primary)]">
                            {title}
                        </h3>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Decorative Corner Accents (handled by CSS ::after, but we can add more specific ones here if needed) */}
        </div>
    );
};

export default CyberCard;
