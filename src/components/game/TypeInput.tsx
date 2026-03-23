'use client';

import React, { useRef, useEffect } from 'react';
import { useRaceStore } from '@/store/useRaceStore';

interface TypeInputProps {
  promptText: string;
}

export function TypeInput({ promptText }: TypeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  
  const startTime = useRef<number | null>(null);
  const lastReportedProgress = useRef<number>(0);
  const wordIndex = useRef<number>(0);

  const state = useRaceStore((s) => s.state);
  const isInputDisabled = useRaceStore((s) => s.isInputDisabled);
  const updateMetrics = useRaceStore((s) => s.updateMetrics);

  const rawKeystrokes = useRef<number>(0);
  const validKeystrokes = useRef<number>(0);
  const lastDispatchTime = useRef<number>(0);

  useEffect(() => {
    if (state === 'IN_PROGRESS') {
      inputRef.current?.focus();
      if (!startTime.current) {
        startTime.current = Date.now();
        // Position caret immediately
        setTimeout(handleInput, 0);
      }
    } else {
      inputRef.current?.blur();
      if (state === 'LOBBY' || state === 'COUNTDOWN') {
         // Reset on new race
         if (inputRef.current) inputRef.current.value = '';
         startTime.current = null;
         lastReportedProgress.current = 0;
         wordIndex.current = 0;
         rawKeystrokes.current = 0;
         validKeystrokes.current = 0;
         lastDispatchTime.current = 0;
         setTimeout(handleInput, 0); // Reset UI
      }
    }
  }, [state]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (state !== 'IN_PROGRESS' || isInputDisabled) return;

    // Filter for "Meaningful Keystrokes"
    // Include: Any key where event.key.length === 1 (alphanumeric, symbols, space)
    // Exclude: Backspace, Enter, Tab, Escape, and all Modifier keys
    if (e.key.length === 1) {
      rawKeystrokes.current++;

      const currentPos = inputRef.current?.value.length || 0;
      const expectedChar = promptText[currentPos];

      if (e.key === expectedChar) {
        validKeystrokes.current++;
      }
    }
  };

  const handleInput = () => {
    const value = inputRef.current?.value || '';
    
    // Prevent typing beyond the promptText length
    if (value.length > promptText.length && inputRef.current) {
      inputRef.current.value = promptText.substring(0, promptText.length);
      return;
    }

    const chars = textContainerRef.current?.querySelectorAll('.prompt-char');
    if (!chars) return;

    let correctCount = 0;
    let currentWordIdx = 0;

    for (let i = 0; i < promptText.length; i++) {
        const span = chars[i] as HTMLSpanElement;
        
        // Count words
        if (i < value.length && promptText[i] === ' ') {
            currentWordIdx++;
        }

        if (i < value.length) {
            if (value[i] === promptText[i]) {
                span.className = "prompt-char text-emerald-400";
                correctCount++;
            } else {
                const isSpace = promptText[i] === ' ';
                span.className = `prompt-char text-rose-500 ${isSpace ? 'bg-rose-500/40 inline-block w-[0.5em]' : 'bg-rose-500/20'} rounded-[2px]`;
            }
        } else {
            span.className = "prompt-char text-neutral-500";
        }
    }
    
    wordIndex.current = currentWordIdx;

    // Caret positioning
    const activeIndex = Math.min(value.length, promptText.length - 1);
    const activeSpan = chars[activeIndex] as HTMLSpanElement;

    if (activeSpan && caretRef.current && textContainerRef.current) {
        // Hide caret if finished
        if (value.length === promptText.length) {
            caretRef.current.style.opacity = '0'; 
        } else {
            caretRef.current.style.opacity = '1';
            caretRef.current.style.transform = `translate(${activeSpan.offsetLeft - 1.5}px, ${activeSpan.offsetTop}px)`;
            caretRef.current.style.height = `${activeSpan.offsetHeight}px`;
            
            // Scroll container if needed
            const containerHeight = textContainerRef.current.clientHeight;
            const containerScroll = textContainerRef.current.scrollTop;
            const relativeTop = activeSpan.offsetTop - containerScroll;
            
            if (relativeTop < 0 || relativeTop > containerHeight - activeSpan.offsetHeight) {
                // Not in view, smooth scroll
                activeSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // WPM & Progress Logic
    if (state !== 'IN_PROGRESS' || isInputDisabled) return;
    if (!startTime.current) startTime.current = Date.now();
    
    const progress = (value.length / promptText.length) * 100;
    const elapsedMinutes = (Date.now() - startTime.current) / 60000;
    const wpm = elapsedMinutes > 0 ? (correctCount / 5) / elapsedMinutes : 0;

    // Throttle store updates: dispatch when a word is completed or every 2 seconds or finished
    const now = Date.now();
    const isWordComplete = value[value.length - 1] === ' ';
    const isFinished = value.length === promptText.length;
    const isTwoSecondsPassed = now - lastDispatchTime.current >= 2000;

    if (isWordComplete || isFinished || isTwoSecondsPassed) {
        updateMetrics(
            rawKeystrokes.current,
            validKeystrokes.current,
            Math.round(wpm),
            Number(progress.toFixed(2))
        );
        lastReportedProgress.current = progress;
        lastDispatchTime.current = now;
    }
  };

  const focusInput = () => {
     if (state === 'IN_PROGRESS') {
        inputRef.current?.focus();
     }
  };

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto bg-neutral-900/40 p-6 md:p-8 rounded-2xl border border-neutral-800/50 shadow-2xl overflow-hidden cursor-text min-h-[12rem] flex flex-col items-start justify-start group"
      onClick={focusInput}
    >
      {/* Hidden native input for mobile device keyboard support and capture */}
      <input
        ref={inputRef}
        type="text"
        className="absolute inset-0 w-full h-full opacity-0 cursor-text -z-10 focus:z-10"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        disabled={state !== 'IN_PROGRESS' || isInputDisabled}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        data-gramm="false"
      />

      {/* Floating Caret (absolute to relative text container) */}
      <div className="relative w-full text-2xl md:text-3xl font-mono leading-relaxed transition-opacity" style={{ opacity: state === 'IN_PROGRESS' || state === 'COUNTDOWN' ? 1 : 0.5 }}>
        
        <div 
            ref={caretRef}
            className="absolute left-0 top-0 w-[3px] bg-yellow-400 animate-pulse transition-transform duration-[50ms] ease-out rounded-full z-10"
            style={{ height: '32px' }} // Default height, updated dynamically
            aria-hidden="true"
        />

        <div 
          ref={textContainerRef} 
          className="relative w-full max-h-[16rem] overflow-y-auto overflow-x-hidden break-words [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ scrollBehavior: 'smooth' }}
        >
          {promptText.split('').map((char, i) => (
            <span
              key={i}
              className="prompt-char text-neutral-500 transition-colors duration-75"
            >
              {char}
            </span>
          ))}
        </div>
      </div>
      
      {/* Overlay to show when waiting or finished */}
      {state === 'LOBBY' && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 transition-all">
            <span className="text-neutral-300 font-medium tracking-wide">Waiting for players to ready up...</span>
         </div>
      )}
      {(state === 'FINISHED' || state === 'ABANDONED' || isInputDisabled) && state !== 'LOBBY' && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-20 transition-all">
            <span className={`text-xl font-black uppercase tracking-widest ${state === 'ABANDONED' ? 'text-rose-500' : 'text-emerald-400'}`}>
                {state === 'ABANDONED' ? 'RACE ABANDONED' : 'SYSTEM LOCKED'}
            </span>
         </div>
      )}
    </div>
  );
}
