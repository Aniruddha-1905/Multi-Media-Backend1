import { useEffect, useState } from 'react';
import { isSouthIndianLocation } from '../utils/themeUtils';

const LocationBasedAuth = () => {
    const [locationStatus, setLocationStatus] = useState({
        checked: false,
        isSouthIndian: false,
        error: null
    });

    const manipulateClerkDOM = (isEmailOnly) => {
        console.log(`Setting auth method: ${isEmailOnly ? 'Email Only' : 'Phone Number Only'}`);

        // Wait for Clerk elements to be available
        const observer = new MutationObserver((mutations, obs) => {
            const signInEl = document.querySelector('.cl-sign-in-root');
            if (signInEl) {
                obs.disconnect();

                setTimeout(() => {
                    if (isEmailOnly) {
                        // Hide phone number option for South Indian users
                        const phoneOption = document.querySelector('[data-identifier-type="phone_number"]');
                        if (phoneOption) {
                            console.log('Found phone option, hiding it');
                            phoneOption.style.display = 'none';
                        } else {
                            console.log('Phone option not found');
                        }
                    } else {
                        // Hide email option for other users
                        const emailOption = document.querySelector('[data-identifier-type="email_address"]');
                        if (emailOption) {
                            console.log('Found email option, hiding it');
                            emailOption.style.display = 'none';
                        } else {
                            console.log('Email option not found');
                        }
                    }
                }, 300); // Increased timeout for better reliability
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    const checkLocationAndSetAuth = async () => {
        try {
            console.log('Checking location...');
            const isInSouthIndia = await isSouthIndianLocation();
            console.log('Location check result:', isInSouthIndia);

            setLocationStatus({
                checked: true,
                isSouthIndian: isInSouthIndia,
                error: null
            });

            manipulateClerkDOM(isInSouthIndia);
        } catch (error) {
            console.error('Error in checkLocationAndSetAuth:', error);
            setLocationStatus({
                checked: true,
                isSouthIndian: false, // Default to false on error
                error: error.message
            });

            // Default behavior on error
            manipulateClerkDOM(false);
        }
    };

    useEffect(() => {
        checkLocationAndSetAuth();

        // Handle page refreshes
        window.addEventListener('load', checkLocationAndSetAuth);
        return () => window.removeEventListener('load', checkLocationAndSetAuth);
    }, []);

    // This component doesn't render anything visible
    // But we can add a hidden debug element
    return (
        <div style={{ display: 'none' }} data-testid="location-auth-debug">
            {locationStatus.checked ?
                (locationStatus.isSouthIndian ? 'South Indian Location' : 'Non-South Indian Location') :
                'Checking location...'}
            {locationStatus.error && `Error: ${locationStatus.error}`}
        </div>
    );
};

export default LocationBasedAuth;