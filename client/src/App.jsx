import React, { useContext, useEffect } from 'react';
import { ThemeContext } from './context/ThemeContext';
import Allroutes from './Allroutes';
// ... other imports

function App() {
    const { isLightTheme } = useContext(ThemeContext);

    useEffect(() => {
        // Apply theme to body
        document.body.className = isLightTheme ? 'light-theme' : 'dark-theme';
    }, [isLightTheme]);

    return (
        <div className={`App ${isLightTheme ? 'light-theme' : 'dark-theme'}`}>
            {/* Your existing app content */}
            <Allroutes />
        </div>
    );
}

export default App;