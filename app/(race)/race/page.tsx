import React from 'react';

/**
 * @component QuickRacePage
 * @description The main component for the Quick Multiplayer Race interface.
 * This is where the core typing game logic will reside.
 */
const QuickRacePage: React.FC = () => {
    // --- State and Logic Hooks will go here in the future ---
    // const [currentText, setCurrentText] = useState("The quick brown fox...");
    // const [userInput, setUserInput] = useState("");
    // const [time, setTime] = useState(0);

    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col items-center min-h-[80vh]">
            
            {/* 🏁 Race Status and Metrics */}
            <div className="w-full max-w-4xl flex justify-between items-end mb-8" style={{ color: 'var(--text-secondary)' }}>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Quick Race</h1>
                
                {/* Placeholder for Timer, WPM, and Accuracy */}
                <div className="flex space-x-6 text-xl">
                    <span className="font-medium">Time: <strong style={{ color: 'var(--accent)' }}>0:58</strong></span>
                    <span>WPM: <strong>0</strong></span>
                    <span>Accuracy: <strong>100%</strong></span>
                </div>
            </div>

            {/* 📝 Typing Text Area (The Sentence to Type) */}
            <div 
                className="w-full max-w-4xl p-8 rounded-lg shadow-xl mb-8 text-2xl leading-relaxed"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
                {/* Placeholder for the text being typed. Each word/character will be mapped and styled later. */}
                <p>
                    <span className="current-word">Hello</span> world, this is the text you need to type to win the race against your competitors.
                </p>
            </div>

            {/* ⌨️ User Input Field */}
            <input 
                type="text"
                placeholder="Start typing here..."
                className="w-full max-w-4xl p-4 text-xl rounded-lg focus:outline-none focus:ring-4 transition duration-200"
                style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)',
                    border: '1px solid var(--border)',
                    // Focus ring uses accent color
                    boxShadow: '0 0 0 3px rgba(0, 255, 166, 0.4)', 
                }}
            />

            {/* 🏎️ Racer Visualization (Placeholder) */}
            <div className="w-full max-w-4xl mt-10">
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Racers</h2>
                
                {/* Progress Bar Visualization Example */}
                <div className="space-y-4">
                    {/* Your Racer */}
                    <div className="flex items-center space-x-3">
                        <span className="font-bold w-16" style={{ color: 'var(--accent)' }}>You (0%)</span>
                        <div className="progress-bar w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-surface)' }}>
                            <div 
                                className="h-full rounded-full" 
                                style={{ width: '0%', backgroundColor: 'var(--accent)' }}
                            ></div>
                        </div>
                    </div>
                    {/* Opponent 1 */}
                    <div className="flex items-center space-x-3" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-16">Opponent 1 (5%)</span>
                        <div className="progress-bar w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-card)' }}>
                            <div 
                                className="h-full rounded-full bg-blue-500" 
                                style={{ width: '5%' }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default QuickRacePage;