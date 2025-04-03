import React, { useState, useEffect } from 'react';
import { setManualLocationOverride, clearManualLocationOverride, getManualLocationOverride } from '../utils/themeUtils';

const LocationSelector = () => {
    const [showSelector, setShowSelector] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('ambernath'); // Default to Ambernath
    const [override, setOverride] = useState(null);

    useEffect(() => {
        // Check if there's already an override
        const existingOverride = getManualLocationOverride();
        if (existingOverride) {
            setOverride(existingOverride);
            setShowSelector(false);
        } else {
            // Show the selector after a short delay to allow the page to load
            const timer = setTimeout(() => {
                setShowSelector(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleLocationSelect = () => {
        const isSouthIndian = selectedLocation === 'ambernath';
        setManualLocationOverride(isSouthIndian);
        setOverride({ isSouthIndian });
        setShowSelector(false);
        
        // Reload the page to apply the changes
        window.location.reload();
    };

    const handleReset = () => {
        clearManualLocationOverride();
        setOverride(null);
        
        // Reload the page to apply the changes
        window.location.reload();
    };

    if (!showSelector && !override) {
        return null;
    }

    const selectorStyle = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#202124',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        zIndex: 9999,
        maxWidth: '300px',
        fontFamily: 'Arial, sans-serif'
    };

    const buttonStyle = {
        backgroundColor: '#8ab4f8',
        color: '#202124',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '8px',
        fontWeight: 'bold'
    };

    const selectStyle = {
        backgroundColor: '#333',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #555',
        marginBottom: '10px',
        width: '100%'
    };

    return (
        <div style={selectorStyle}>
            {override ? (
                <>
                    <h3 style={{ margin: '0 0 10px 0' }}>Location Override Active</h3>
                    <p>You are currently using a manual location override.</p>
                    <p>Current setting: {override.isSouthIndian ? 'Ambernath (South India)' : 'Other Location'}</p>
                    <button style={buttonStyle} onClick={handleReset}>
                        Reset Location
                    </button>
                </>
            ) : (
                <>
                    <h3 style={{ margin: '0 0 10px 0' }}>Select Your Location</h3>
                    <p>We detected your location as Boardman, Oregon. Please select your actual location:</p>
                    <select 
                        style={selectStyle}
                        value={selectedLocation} 
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="ambernath">Ambernath, Maharashtra</option>
                        <option value="other">Other Location</option>
                    </select>
                    <button style={buttonStyle} onClick={handleLocationSelect}>
                        Save Location
                    </button>
                </>
            )}
        </div>
    );
};

export default LocationSelector;
