import React from "react";

export type DarkModeContextType = {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
};

export const DarkModeContext = React.createContext<DarkModeContextType | null>(null);

export const useDarkMode = (): DarkModeContextType => {
    const context = React.useContext(DarkModeContext);
    if (!context) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
};

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [darkMode, setDarkMode] = React.useState(false);
    const value = React.useMemo(() => ({ darkMode, setDarkMode }), [darkMode]);
    return (
        <DarkModeContext.Provider value={value}>
            {children}
        </DarkModeContext.Provider>
    );
}