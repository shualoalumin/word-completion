
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'app-dark-mode';

interface ThemeContextType {
    darkMode: boolean;
    toggle: () => void;
    enable: () => void;
    disable: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage first
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== null) {
                return stored === 'true';
            }
            // Check system preference
            if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
                return true;
            }
        }
        return false;
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(darkMode));
    }, [darkMode]);

    const toggle = useCallback(() => {
        setDarkMode(prev => !prev);
    }, []);

    const enable = useCallback(() => {
        setDarkMode(true);
    }, []);

    const disable = useCallback(() => {
        setDarkMode(false);
    }, []);

    const value = {
        darkMode,
        toggle,
        enable,
        disable,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
