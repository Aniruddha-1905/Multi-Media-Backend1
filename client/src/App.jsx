import React, { useContext, useEffect } from 'react';
import { ThemeContext } from './context/ThemeContext';
import Allroutes from './Allroutes';
// ... other imports

function App() {
    const { isWhiteTheme } = useContext(ThemeContext);

    useEffect(() => {
        // Apply theme to body
        document.body.className = isWhiteTheme ? 'white-theme' : 'dark-theme';
    }, [isWhiteTheme]);

    return (
        <div className={`App ${isWhiteTheme ? 'white-theme' : 'dark-theme'}`}>
            {/* Your existing app content */}
            <Allroutes />
        </div>
    );
}

export default App;