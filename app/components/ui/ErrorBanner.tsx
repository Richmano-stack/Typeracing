import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
    message: string;
    onClose?: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
    return (
        <div 
            className="p-4 rounded-lg flex items-center justify-between shadow-lg"
            // Using custom colors for a distinct error look
            style={{ 
                backgroundColor: '#3b0d0d', // Dark red background
                border: '1px solid #7c1a1a', 
                color: '#ffcccc' // Light red text
            }}
        >
            <div className="flex items-center">
                <AlertTriangle size={24} className="mr-3" />
                <p className="font-medium text-sm md:text-base">
                    **Error:** {message}
                </p>
            </div>
            
            {onClose && (
                <button 
                    onClick={onClose} 
                    className="ml-4 transition hover:opacity-75" 
                    aria-label="Close error message"
                >
                    <X size={20} />
                </button>
            )}
        </div>
    );
};

export default ErrorBanner;