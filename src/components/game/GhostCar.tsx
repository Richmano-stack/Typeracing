'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useRaceStore } from '@/store/useRaceStore';
import { Car, Loader2 } from 'lucide-react';

interface GhostCarProps {
  opponentName?: string;
}

export const GhostCar = React.memo(function GhostCar({ opponentName = 'Opponent' }: GhostCarProps) {
  // Use atomic selectors to prevent unnecessary re-renders when local player types
  const opponentProgress = useRaceStore((s) => s.opponentProgress);
  const opponentWpm = useRaceStore((s) => s.opponentWpm);
  const opponentLastActive = useRaceStore((s) => s.opponentLastActive);
  const state = useRaceStore((s) => s.state);
  const clockOffsetMs = useRaceStore((s) => s.clockOffsetMs) || 0;

  // Motion value for the raw target progress
  const progressTarget = useMotionValue(opponentProgress);

  // Smooth interpolation using framer-motion spring
  const smoothProgress = useSpring(progressTarget, {
    stiffness: 50,
    damping: 20,
  });

  // Map progress (0-100) to left percentage
  const leftPos = useTransform(smoothProgress, [0, 100], ['0%', '100%']);

  // Update target when the store receives a new sync
  useEffect(() => {
    progressTarget.set(opponentProgress);
  }, [opponentProgress, progressTarget]);

  // Predictive Drift & Stalemate Visuals
  const [isLagging, setIsLagging] = useState(false);

  useEffect(() => {
    if (state !== 'IN_PROGRESS') {
      setIsLagging(false);
      return;
    }

    let lastTime = performance.now();
    let frameId: number;

    const tick = () => {
      const now = performance.now();
      const dtElapsed = now - lastTime;
      lastTime = now;

      // 1. Check for stalemate (>2s delay)
      if (opponentLastActive) {
        const serverNow = Date.now() + clockOffsetMs;
        const delay = serverNow - opponentLastActive;
        
        // Update lagging state safely
        const isCurrentlyLagging = delay > 2500; // 2s + 500ms network jitter buffer
        setIsLagging((prev) => {
          if (prev !== isCurrentlyLagging) return isCurrentlyLagging;
          return prev;
        });

        // 2. Predictive Drift
        // Only drift if the opponent is currently active (seen in the last 1.5s)
        if (opponentWpm > 0 && delay < 1500) {
           // WPM to generic % progress drift. 
           // Assuming average text is 250 chars. 50 WPM = 250 chars / min = 100% / 60000ms.
           const driftRatePerMs = (opponentWpm / 60000) * (100 / 250); 
           const currentTarget = progressTarget.get();
           
           // Cap drift at 100% and don't drift further than +3% from last known truth
           if (currentTarget < 100 && currentTarget < opponentProgress + 3) {
             progressTarget.set(currentTarget + (driftRatePerMs * dtElapsed));
           }
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [state, opponentWpm, opponentLastActive, clockOffsetMs, opponentProgress, progressTarget]);

  // Don't render until lobby transitions
  if (state === 'LOBBY' || state === 'ABANDONED') return null;

  return (
    <div className="relative w-full h-24 bg-neutral-900/60 rounded-2xl border border-neutral-800 shadow-inner overflow-hidden mb-6 px-4 md:px-8 flex items-center">
      {/* Track Base */}
      <div className="absolute top-1/2 left-8 right-8 h-1.5 bg-neutral-800 -translate-y-1/2 rounded-full overflow-hidden shadow-inner">
         {/* Render past progress line */}
         <motion.div className="h-full bg-indigo-500/30" style={{ width: leftPos }} />
      </div>

      {/* Track container for the car to move within bounds perfectly */}
      <div className="absolute top-0 bottom-0 left-8 right-8 pointer-events-none">
         {/* The Car */}
         <motion.div
           style={{ left: leftPos, x: '-50%' }}
           className={`absolute top-0 bottom-0 flex flex-col items-center justify-center transition-opacity duration-300 ${
             isLagging ? 'opacity-50' : 'opacity-100'
           }`}
         >
           <div className="bg-neutral-800 text-neutral-300 text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full shadow border border-neutral-700/50 mb-1.5 whitespace-nowrap flex items-center gap-1.5 z-10 relative shrink-0">
             {isLagging && <Loader2 className="w-3 h-3 animate-spin text-rose-400" />}
             <span className="max-w-[80px] truncate">{opponentName}</span>
             {!isLagging && <span className="text-indigo-400 ml-1">{Math.round(opponentProgress)}%</span>}
           </div>
           
           <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-900 rounded-full flex items-center justify-center border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] relative z-10 shrink-0 group">
              {/* Fake tire tracks underneath */}
              <div className="absolute -left-2 top-1/2 w-4 h-[2px] bg-indigo-500/40 -translate-y-1/2 blur-[1px]" />
              <Car className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
           </div>
         </motion.div>
      </div>
    </div>
  );
});
