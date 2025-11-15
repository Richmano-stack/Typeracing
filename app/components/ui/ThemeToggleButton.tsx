import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggleButton: React.FC = () => {
    // 1. Initialize isDarkMode to the SSR default (true for Dark)
    const [isDarkMode, setIsDarkMode] = useState(true);
    // 2. NEW: State to track if the component has mounted on the client
    const [mounted, setMounted] = useState(false);

    // 3. useEffect to initialize the theme from localStorage and set mounted
    useEffect(() => {
        // Read theme from local storage ONLY on the client
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setIsDarkMode(storedTheme !== 'light');
        }
        
        // Signal that the component has mounted and client logic is safe
        setMounted(true);
    }, []);

    // 4. useEffect to apply the theme to the <html> element on state change
    useEffect(() => {
        if (!mounted) return; // Don't run theme application logic until mounted

        const root = document.documentElement;
        const newTheme = isDarkMode ? 'dark' : 'light';
        
        if (newTheme === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }
        
        localStorage.setItem('theme', newTheme);
    }, [isDarkMode, mounted]); // Dependency on mounted is important

    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    // 5. Conditional Rendering: Return null until mounted to prevent mismatch
    if (!mounted) {
        // Render a placeholder or nothing during SSR and initial client load
        // This ensures the server and client initial HTML match perfectly.
        return null; 
    }
    
    // --- Render logic runs only after mounting ---
    const Icon = isDarkMode ? Sun : Moon;
    const label = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';

    return (
        <button
            onClick={toggleTheme}
            aria-label={label}
            className="fixed bottom-6 right-6 p-3 rounded-full shadow-2xl transition duration-300 transform hover:scale-110"
            style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--bg-base)',
                boxShadow: '0 4px 15px rgba(0, 255, 166, 0.6)', 
            }}
        >
            <Icon size={24} />
        </button>
    );
};

export default ThemeToggleButton;