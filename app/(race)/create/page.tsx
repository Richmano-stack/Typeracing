"use client"

import React, { useState } from 'react';
import { Share2, Lock, Copy } from 'lucide-react';

const CreateRacePage: React.FC = () => {
    // State to hold the generated link
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    // Placeholder function for generating the link
    const generateLink = () => {
        // In a real app, this would call an API to create a unique race ID
        const uniqueId = Math.random().toString(36).substring(2, 10);
        setInviteLink(`${window.location.origin}/race/invite/${uniqueId}`);
        setIsCopied(false);
    };
    
    // Function to copy the link to the clipboard
    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset button after 2 seconds
        }
    };

    return (
        <div className="container mx-auto p-8 text-center min-h-[80vh]">
            <h1 className="text-4xl font-extrabold mb-4" style={{ color: 'var(--accent)' }}><Lock size={40} className="inline mr-3" /> Create Private Race</h1>
            <p className="text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
                Generate a unique link to race against your invited friends using a **random text**.
            </p>

            {/* Link Generation and Display */}
            <div className="w-full max-w-xl mx-auto ui-card p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
                
                {!inviteLink ? (
                    // Button to generate the link
                    <button
                        onClick={generateLink}
                        className="w-full font-bold py-3 rounded-lg transition transform hover:scale-105"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}
                    >
                        <Share2 className="inline mr-2" size={20} /> Generate Invite Link
                    </button>
                ) : (
                    // Display the generated link
                    <>
                        <p className="text-xl mb-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Share this link:</p>
                        <div 
                            className="flex items-center justify-between p-3 rounded-lg border"
                            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                        >
                            <span className="truncate text-sm md:text-base" style={{ color: 'var(--accent)' }}>
                                {inviteLink}
                            </span>
                            <button
                                onClick={copyLink}
                                className={`ml-3 px-4 py-2 rounded-lg font-semibold text-sm transition ${isCopied ? 'bg-green-500' : 'hover:opacity-80'}`}
                                style={{ 
                                    backgroundColor: isCopied ? '#10B981' : 'var(--text-primary)', 
                                    color: isCopied ? 'white' : 'var(--bg-base)' 
                                }}
                            >
                                {isCopied ? 'Copied!' : <Copy size={16} />}
                            </button>
                        </div>
                        <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
                            Link generated! Send it to your friends to start the private race.
                        </p>
                    </>
                )}
                
            </div>
            
        </div>
    );
};

export default CreateRacePage;