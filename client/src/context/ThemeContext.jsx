import React, { createContext, useState, useEffect } from 'react';
import { isWithinTimeRange, isSouthIndianLocation } from '../utils/themeUtils';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isWhiteTheme, setIsWhiteTheme] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check device type, time, and location for theme
    useEffect(() => {
        const checkDeviceAndSetTheme = () => {
            const isMobileDevice = window.innerWidth <= 768;
            setIsMobile(isMobileDevice);
        };

        // Check time and location for theme
        const checkTimeAndLocation = async () => {
            try {
                // Check if current time is between 10 AM and 12 PM
                const isInTimeRange = isWithinTimeRange();

                // Check if user is in South India
                const isInSouthIndia = await isSouthIndianLocation();

                // Set white theme if either condition is true
                const shouldUseWhiteTheme = isInTimeRange || isInSouthIndia;
                setIsWhiteTheme(shouldUseWhiteTheme);

                console.log(`Theme set to: ${shouldUseWhiteTheme ? 'WHITE' : 'DARK'}`);
                console.log(`Time condition: ${isInTimeRange ? 'TRUE' : 'FALSE'}`);
                console.log(`Location condition: ${isInSouthIndia ? 'TRUE' : 'FALSE'}`);
            } catch (error) {
                console.error('Error determining theme:', error);
                // Default to dark theme on error
                setIsWhiteTheme(false);
            }
        };

        // Initial checks
        checkDeviceAndSetTheme();
        checkTimeAndLocation();

        // Add event listener for window resize
        window.addEventListener('resize', checkDeviceAndSetTheme);

        // Set up interval to check time every minute
        const timeInterval = setInterval(() => {
            checkTimeAndLocation();
        }, 60000); // Check every minute

        // Cleanup
        return () => {
            window.removeEventListener('resize', checkDeviceAndSetTheme);
            clearInterval(timeInterval);
        };
    }, []);

    return (
        <ThemeContext.Provider value={{ isWhiteTheme, isMobile }}>
            {children}
        </ThemeContext.Provider>
    );
};
