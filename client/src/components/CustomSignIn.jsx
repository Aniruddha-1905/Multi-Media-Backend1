import React, { useEffect, useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { isSouthIndianLocation } from '../utils/themeUtils';

const CustomSignIn = () => {
    const { signIn, setActive } = useSignIn();
    const [verificationMethod, setVerificationMethod] = useState(null);

    useEffect(() => {
        const checkLocation = async () => {
            const isInSouthIndia = await isSouthIndianLocation();
            setVerificationMethod(isInSouthIndia ? 'email' : 'phone');
        };
        checkLocation();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Start the sign-in process
            const signInAttempt = await signIn.create({
                identifier: e.target.identifier.value,
                strategy: verificationMethod === 'email' ? 'email_code' : 'phone_code',
            });

            // Send the verification code
            await signInAttempt.prepareFirstFactor(
                verificationMethod === 'email' 
                    ? { strategy: 'email_code' }
                    : { strategy: 'phone_code' }
            );

            // Set this instance as the active session
            await setActive({ session: signInAttempt.createdSessionId });

        } catch (err) {
            console.error('Error during sign in:', err);
        }
    };

    if (!verificationMethod) return <div>Loading...</div>;

    return (
        <div className="sign-in-container">
            <form onSubmit={handleSubmit}>
                <input
                    type={verificationMethod === 'email' ? 'email' : 'tel'}
                    name="identifier"
                    placeholder={verificationMethod === 'email' ? 'Email' : 'Phone Number'}
                    required
                />
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
};

export default CustomSignIn;