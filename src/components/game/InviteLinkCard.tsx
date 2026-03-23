"use client";

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InviteLinkCardProps {
    roomId: string;
}

export const InviteLinkCard: React.FC<InviteLinkCardProps> = ({ roomId }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        const url = `${window.location.origin}/race/${roomId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            toast.success("Invite link copied!");
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            toast.error("Failed to copy link");
        });
    };

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Challenge Link
                </span>
                <div className="bg-[#00f3ff]/10 text-[#00f3ff] text-[9px] font-bold px-2 py-0.5 rounded border border-[#00f3ff]/20 uppercase tracking-widest">
                    Private Room
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-white/60 truncate">
                    {window.location.origin}/race/{roomId}
                </div>
                <button 
                    onClick={handleCopy}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl transition-all group"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <Copy className="w-4 h-4 text-white group-hover:text-[#00f3ff] transition-colors" />
                    )}
                </button>
            </div>
            
            <p className="text-[10px] text-white/30 italic">
                Share this link with a friend to start the duel.
            </p>
        </div>
    );
};
