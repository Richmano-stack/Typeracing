import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12">
            {/* The 'animate-spin' utility creates the rotation effect */}
            <Loader2 
                size={48} 
                className="animate-spin" 
                style={{ color: 'var(--accent)' }} 
            />
            <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
                Loading race data...
            </p>
        </div>
    );
};

export default LoadingSpinner;