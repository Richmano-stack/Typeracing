'use client'

import { useState, useEffect, useRef } from 'react'
import { TYPING_TEXTS } from '../lib/texts'

interface RaceScreenProps {
  onComplete: () => void
}

export function RaceScreen({ onComplete }: RaceScreenProps) {
  const [textIndex] = useState(Math.floor(Math.random() * TYPING_TEXTS.length))
  const [text] = useState(TYPING_TEXTS[textIndex])
  const [input, setInput] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [isActive, setIsActive] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Timer effect
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      if (timeRemaining <= 0) {
        setIsActive(false)
        sessionStorage.setItem(
          'raceData',
          JSON.stringify({
            input,
            text,
            timeRemaining: 0,
            wpm: calculateWPM(input, 60),
            accuracy: calculateAccuracy(input, text),
          })
        )
        onComplete()
      }
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, timeRemaining, input, text, onComplete])

  const handleInputChange = (e: string) => {
    if (!startTime && e.length > 0) {
      setStartTime(Date.now())
    }
    setInput(e)
  }

  const calculateWPM = (typed: string, seconds: number) => {
    if (seconds <= 0) return 0
    const words = typed.trim().length / 5
    const minutes = seconds / 60
    return Math.round(words / minutes)
  }

  const calculateAccuracy = (typed: string, original: string) => {
    if (original.length === 0) return 0
    let correct = 0
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === original[i]) correct++
    }
    return Math.round((correct / original.length) * 100)
  }

  const wpm = calculateWPM(input, 60 - timeRemaining)
  const accuracy = calculateAccuracy(input, text)

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
              {accuracy}%
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="text-sm text-muted-foreground mb-1">Chars</div>
            <div className="text-3xl font-bold text-foreground">{input.length}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(input.length / text.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Text Display */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8 font-mono text-lg leading-relaxed min-h-40">
          {text.split('').map((char, i) => {
            let charClass = 'text-muted-foreground'
            if (i < input.length) {
              if (input[i] === char) {
                charClass = 'char-correct'
              } else {
                charClass = 'char-incorrect'
              }
            } else if (i === input.length) {
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
          value={input}
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
