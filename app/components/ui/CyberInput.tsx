import React from 'react';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const CyberInput: React.FC<CyberInputProps> = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className="w-full mb-4 group">
            {label && (
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 group-focus-within:text-[var(--primary)] transition-colors">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    className={`
                        w-full bg-[rgba(0,0,0,0.3)] border border-[var(--border)] 
                        text-[var(--text-primary)] py-3 outline-none
                        focus:border-[var(--primary)] focus:shadow-[0_0_10px_rgba(0,243,255,0.2)]
                        transition-all duration-200
                        placeholder-[var(--text-muted)]
                        ${icon ? 'pl-10 pr-4' : 'px-4'}
                        ${error ? 'border-[var(--error)]' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {/* Decorative corner for input */}
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--text-secondary)] group-focus-within:border-[var(--primary)] transition-colors" />
            </div>
            {error && (
                <p className="text-[var(--error)] text-xs mt-1 font-mono">{`> ${error}`}</p>
            )}
        </div>
    );
};

export default CyberInput;
