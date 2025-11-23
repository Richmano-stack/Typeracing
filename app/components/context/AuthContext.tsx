"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

interface UserData {
    name: string;
    wpm: number;
}

interface AuthContextType {
    isLoggedIn: boolean;
    user: UserData | null;
    login: (userData: UserData) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    // 💡 Suggestion : Vérifie l'état de connexion initial (localStorage/cookies)
    useEffect(() => {
        // Ici, tu peux ajouter ta logique pour vérifier les tokens ou cookies
        // Par exemple: const storedUser = localStorage.getItem('user');
        // if (storedUser) { login(JSON.parse(storedUser)); }

        // Set loading to false after initial check
        setLoading(false);
    }, []);

    const login = (userData: UserData) => {
        setIsLoggedIn(true);
        setUser(userData);
        // localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUser(null);
        // localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personnalisé pour l'utilisation facile par les autres composants
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Ceci garantit que le Hook n'est jamais utilisé en dehors du Provider
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};