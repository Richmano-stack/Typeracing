"use client"

import React, { useState } from 'react';
import { History, Brain, Trophy } from 'lucide-react';

// Mock data to simulate fetching user stats
interface UserStats {
    bestWpm: number | null;
}

const PracticePage: React.FC = () => {
    // Use state to simulate fetching the user's best WPM
    // For the prototype, let's assume the user has no best WPM initially (null).
    const [userStats, setUserStats] = useState<UserStats>({ bestWpm: null }); 
    
    // Derived state to check if a challenge exists
    const hasChallenge = userStats.bestWpm !== null;
    
    // Function to start the race (placeholder)
    const startPracticeRace = () => {
        // In the final app, this would push the user to the race UI with practice mode settings
        alert(`Starting practice race. Challenge: ${hasChallenge ? userStats.bestWpm + ' WPM' : 'None'}`);
    };
    
    // Function to simulate saving a new record after the first race (for future testing)
    const simulateFirstRaceWin = () => {
        setUserStats({ bestWpm: 75 }); // Simulate winning a race with 75 WPM
    };


    return (
        <div className="container mx-auto p-8 text-center min-h-[80vh]">
            <h1 className="text-4xl font-extrabold mb-4" style={{ color: 'var(--accent)' }}><Brain size={40} className="inline mr-3" /> Practice Yourself</h1>
            <p className="text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>Focus on improving your speed and challenging your personal bests.</p>

            {/* Practice Controls and Challenge Display */}
            <div className="w-full max-w-4xl mx-auto ui-card p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
                
                {/* Challenge Status */}
                <div className="mb-6">
                    {hasChallenge ? (
                        <>
                            <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                <Trophy className="inline text-yellow-500 mr-2" size={24} /> Beat Your Ghost!
                            </h2>
                            <p className="text-lg mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Your best score to beat is <strong style={{ color: 'var(--accent)' }}>{userStats.bestWpm} WPM</strong>.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Welcome to Practice Mode!
                            </h2>
                            <p className="text-lg mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Complete your first race to set a challenge for your next session.
                            </p>
                            {/* Button for testing purposes only */}
                             <button 
                                onClick={simulateFirstRaceWin}
                                className="mt-2 text-xs hover:underline"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                [Simulate First Race Win (75 WPM)]
                            </button>
                        </>
                    )}
                </div>

                <button 
                    onClick={startPracticeRace}
                    className="w-full font-bold py-3 rounded-lg transition transform hover:scale-105"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}
                >
                    {hasChallenge ? 'Start Practice Race (Challenge Mode)' : 'Start First Practice Race'}
                </button>
                
            </div>
        </div>
    );
};

export default PracticePage;