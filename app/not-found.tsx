import Link from 'next/link';
import { Frown } from 'lucide-react';
import React from 'react';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8">
            <Frown size={80} className="mb-4" style={{ color: 'var(--accent)' }} />
            <h1 className="text-6xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>404</h1>
            <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-secondary)' }}>
                Page Not Found
            </h2>
            <p className="max-w-md mb-8" style={{ color: 'var(--text-muted)' }}>
                The race track you were looking for doesn't seem to exist. Perhaps you took a wrong turn at the last checkpoint.
            </p>
            
            <Link 
                href="/" 
                className="py-3 px-6 rounded-lg font-bold transition transform hover:scale-[1.05]"
                style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: 'var(--bg-base)' 
                }}
            >
                Return to the Start Line
            </Link>
        </div>
    );
};

export default NotFoundPage;