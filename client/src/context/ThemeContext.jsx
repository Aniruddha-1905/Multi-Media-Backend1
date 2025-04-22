import React, { createContext, useState } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isLightTheme] = useState(false); // Always dark theme

    return (
        <ThemeContext.Provider value={{ isLightTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
