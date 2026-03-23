'use client';

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useRaceStore } from '@/store/useRaceStore';
import { Car } from 'lucide-react';
import { authClient } from "@/lib/auth-client";

export const PlayerCar = React.memo(function PlayerCar() {
  const localProgress = useRaceStore((s) => s.localProgress);
  const state = useRaceStore((s) => s.state);
  const { data: session } = authClient.useSession();

  const playerName = session?.user?.name || session?.user?.email?.split('@')[0] || 'You';

  const progressTarget = useMotionValue(localProgress);
  const smoothProgress = useSpring(progressTarget, {
    stiffness: 50,
    damping: 20,
  });

  const leftPos = useTransform(smoothProgress, [0, 100], ['0%', '100%']);

  useEffect(() => {
    progressTarget.set(localProgress);
  }, [localProgress, progressTarget]);

  if (state === 'LOBBY' || state === 'ABANDONED') return null;

  return (
    <div className="relative w-full h-24 bg-neutral-900/60 rounded-2xl border border-neutral-800 shadow-inner overflow-hidden mb-6 px-4 md:px-8 flex items-center">
      {/* Track Base */}
      <div className="absolute top-1/2 left-8 right-8 h-1.5 bg-neutral-800 -translate-y-1/2 rounded-full overflow-hidden shadow-inner">
         {/* Render past progress line */}
         <motion.div className="h-full bg-emerald-500/30" style={{ width: leftPos }} />
      </div>

      <div className="absolute top-0 bottom-0 left-8 right-8 pointer-events-none">
         <motion.div
           style={{ left: leftPos, x: '-50%' }}
           className="absolute top-0 bottom-0 flex flex-col items-center justify-center transition-opacity duration-300 opacity-100"
         >
           <div className="bg-neutral-800 text-neutral-300 text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full shadow border border-neutral-700/50 mb-1.5 whitespace-nowrap flex items-center gap-1.5 z-10 relative shrink-0">
             <span className="max-w-[80px] truncate">{playerName}</span>
             <span className="text-emerald-400 ml-1">{Math.round(localProgress)}%</span>
           </div>
           
           <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-900 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] relative z-10 shrink-0 group">
              <div className="absolute -left-2 top-1/2 w-4 h-[2px] bg-emerald-500/40 -translate-y-1/2 blur-[1px]" />
              <Car className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
           </div>
         </motion.div>
      </div>
    </div>
  );
});
