import React, { useEffect } from 'react';
import { isSouthIndianLocation } from '../utils/themeUtils';

const LocationBasedAuth = () => {
    const manipulateClerkDOM = (isEmailOnly) => {
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
                            phoneOption.style.display = 'none';
                        }
                    } else {
                        // Hide email option for other users
                        const emailOption = document.querySelector('[data-identifier-type="email_address"]');
                        if (emailOption) {
                            emailOption.style.display = 'none';
                        }
                    }
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    const checkLocationAndSetAuth = async () => {
        const isInSouthIndia = await isSouthIndianLocation();
        manipulateClerkDOM(isInSouthIndia);
    };

    useEffect(() => {
        checkLocationAndSetAuth();

        // Handle page refreshes
        window.addEventListener('load', checkLocationAndSetAuth);
        return () => window.removeEventListener('load', checkLocationAndSetAuth);
    }, []);

    return null; // This component doesn't render anything
};

export default LocationBasedAuth;