"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ClockContextType {
  clockOffsetMs: number | null;
  updateOffset: (serverNowMs: number) => void;
  getAdjustedNow: () => number;
  isSynced: boolean;
}

const ClockContext = createContext<ClockContextType | undefined>(undefined);

export function ClockProvider({ children }: { children: React.ReactNode }) {
  const [clockOffsetMs, setClockOffsetMs] = useState<number | null>(null);

  const updateOffset = useCallback((serverNowMs: number) => {
    // Recomputed on every sync response to handle drift or manual clock changes.
    const newOffset = serverNowMs - Date.now();
    setClockOffsetMs(newOffset);
  }, []);

  const getAdjustedNow = useCallback(() => {
    if (clockOffsetMs === null) return Date.now();
    return Date.now() + clockOffsetMs;
  }, [clockOffsetMs]);

  return (
    <ClockContext.Provider value={{ clockOffsetMs, updateOffset, getAdjustedNow, isSynced: clockOffsetMs !== null }}>
      {children}
    </ClockContext.Provider>
  );
}

export function useClock() {
  const context = useContext(ClockContext);
  if (context === undefined) {
    throw new Error('useClock must be used within a ClockProvider');
  }
  return context;
}
