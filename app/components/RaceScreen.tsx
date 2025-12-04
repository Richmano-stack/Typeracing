'use client'

import { useEffect, useRef } from 'react'
import { TYPING_TEXTS } from '../lib/texts'
import { useRaceStore } from '../lib/useRaceStore'
import { useTimerStore } from '../lib/useTimerStore'

interface RaceScreenProps {
  onComplete: () => void
}

export function RaceScreen({ onComplete }: RaceScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Race store
  const {
    text,
    userInput,
    wpm,
    accuracy,
    status,
    initializeRace,
    setUserInput,
    startRace,
  } = useRaceStore()

  // Timer store
  const {
    elapsed,
    startTimer,
    resetTimer,
    tick,
  } = useTimerStore()

  const timeRemaining = Math.max(0, 60 - elapsed)
  const isActive = status === 'running'

  // Initialize race on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * TYPING_TEXTS.length)
    initializeRace(TYPING_TEXTS[randomIndex], randomIndex.toString(), 'race')
    startRace()
    resetTimer()
    startTimer()
  }, [initializeRace, startRace, resetTimer, startTimer])

  // Timer effect
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      if (timeRemaining <= 0 && status !== 'finished') {
        sessionStorage.setItem(
          'raceData',
          JSON.stringify({
            input: userInput,
            text,
            timeRemaining: 0,
            wpm,
            accuracy,
          })
        )
        onComplete()
      }
      return
    }

    const timer = setInterval(() => {
      tick()
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, timeRemaining, userInput, text, wpm, accuracy, onComplete, tick, status])

  const handleInputChange = (e: string) => {
    setUserInput(e)
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Race</h1>
          <div className="text-right">
            <div className="text-5xl font-bold text-primary mb-2">{timeRemaining}s</div>
            <div className="text-sm text-muted-foreground">Time Remaining</div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="text-sm text-muted-foreground mb-1">WPM</div>
            <div className="text-3xl font-bold text-accent">{wpm}</div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
            <div className={`text-3xl font-bold ${accuracy >= 95 ? 'text-accent' : accuracy >= 80 ? 'text-primary' : 'text-destructive'}`}>
              {Math.round(accuracy)}%
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="text-sm text-muted-foreground mb-1">Chars</div>
            <div className="text-3xl font-bold text-foreground">{userInput.length}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(userInput.length / text.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Text Display */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8 font-mono text-lg leading-relaxed min-h-40">
          {text.split('').map((char, i) => {
            let charClass = 'text-muted-foreground'
            if (i < userInput.length) {
              if (userInput[i] === char) {
                charClass = 'char-correct'
              } else {
                charClass = 'char-incorrect'
              }
            } else if (i === userInput.length) {
              charClass = 'char-current'
            }
            return (
              <span key={i} className={charClass}>
                {char}
              </span>
            )
          })}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={!isActive}
          placeholder="Type here to start..."
          className="w-full bg-input border border-border text-foreground placeholder-muted-foreground p-4 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          autoFocus
        />
      </div>
    </main>
  )
}
