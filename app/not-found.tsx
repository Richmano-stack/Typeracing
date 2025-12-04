import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';
import React from 'react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 relative z-10">
            <CyberCard className="max-w-2xl w-full p-12 text-center border-[var(--error)] shadow-[0_0_50px_rgba(255,0,85,0.2)]">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--error)]" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--error)]" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--error)]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--error)]" />

                <AlertTriangle
                    size={100}
                    className="mx-auto mb-6 animate-pulse"
                    style={{ color: 'var(--error)', filter: 'drop-shadow(0 0 10px rgba(255, 0, 85, 0.5))' }}
                />

                <h1
                    className="text-8xl font-black mb-4 tracking-wider"
                    style={{
                        color: 'var(--error)',
                        textShadow: '0 0 20px rgba(255, 0, 85, 0.5)'
                    }}
                >
                    404
                </h1>

                <h2 className="text-3xl font-bold uppercase mb-6 tracking-widest text-white">
                    ROUTE NOT FOUND
                </h2>

                <p className="text-lg mb-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
                    ERROR: INVALID NAVIGATION PROTOCOL
                </p>

                <p className="max-w-md mx-auto mb-8" style={{ color: 'var(--text-muted)' }}>
                    The race track you were looking for doesn't seem to exist in this dimension.
                    Perhaps you took a wrong turn at the last checkpoint.
                </p>

                <div className="flex justify-center gap-4">
                    <Link href="/">
                        <CyberButton glow>
                            <Home size={18} /> RETURN TO HUB
                        </CyberButton>
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-[var(--border)]">
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        SYSTEM CODE: 404 | LOCATION: UNDEFINED | STATUS: LOST
                    </p>
                </div>
            </CyberCard>
        </div>
    );
};

export default NotFoundPage;