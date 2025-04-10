const southIndianStates = [
    'Tamil Nadu',
    'Kerala',
    'Karnataka',
    'Andhra Pradesh',
    'Telangana'
];

// List of Indian regions/states
const indianStates = [
    'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana',
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Punjab', 'Haryana',
    'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'West Bengal', 'Odisha',
    'Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Sikkim', 'Tripura', 'Uttarakhand', 'Himachal Pradesh',
    'Jharkhand', 'Chhattisgarh', 'Goa', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Puducherry', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Lakshadweep', 'Andaman and Nicobar Islands'
];

// List of Indian cities that should be considered as South Indian
const southIndianCities = [
    'Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Coimbatore', 'Mysore',
    'Madurai', 'Thiruvananthapuram', 'Visakhapatnam', 'Mangalore', 'Kozhikode',
    'Thrissur', 'Tirupati', 'Vellore', 'Tirunelveli', 'Salem', 'Tiruchirapalli',
    'Vijayawada', 'Kurnool', 'Rajahmundry', 'Nellore', 'Hubli', 'Belgaum', 'Shimoga'
];

// List of Maharashtra cities that should be considered as South Indian (for testing)
const maharashtraSouthCities = [
    'Ambernath', 'Thane', 'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'
];

// Check if there's a manual location override in localStorage
export const getManualLocationOverride = () => {
    try {
        const override = localStorage.getItem('locationOverride');
        if (override) {
            return JSON.parse(override);
        }
    } catch (e) {
        console.error('Error reading location override from localStorage:', e);
    }
    return null;
};

// Save manual location override to localStorage
export const setManualLocationOverride = (isSouthIndian) => {
    try {
        localStorage.setItem('locationOverride', JSON.stringify({
            isSouthIndian,
            timestamp: new Date().getTime()
        }));
        return true;
    } catch (e) {
        console.error('Error saving location override to localStorage:', e);
        return false;
    }
};

// Clear manual location override from localStorage
export const clearManualLocationOverride = () => {
    try {
        localStorage.removeItem('locationOverride');
        return true;
    } catch (e) {
        console.error('Error clearing location override from localStorage:', e);
        return false;
    }
};

export const isWithinTimeRange = () => {
    const currentHour = new Date().getHours();
    return currentHour >= 10 && currentHour < 12;
};

export const isSouthIndianLocation = async () => {
    try {
        // First check if there's a manual override
        const override = getManualLocationOverride();
        if (override) {
            console.log('Using manual location override:', override);
            return override.isSouthIndian;
        }

        // TEMPORARY OVERRIDE FOR AMBERNATH USERS
        // If you're in Boardman, Oregon but actually in Ambernath, return true
        // This is a temporary fix until we implement a proper location selector UI
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            console.log('Location data from ipapi.co:', data);

            // Check if the location is Boardman, Oregon, United States
            if (data.city === 'Boardman' && data.region === 'Oregon' && data.country_name === 'United States') {
                console.log('Detected Boardman, Oregon but assuming user is from Ambernath, India');
                // Save this preference to localStorage
                setManualLocationOverride(true);
                return true;
            }
        } catch (error) {
            console.error('Error checking for Boardman override:', error);
        }

        // Try multiple geolocation APIs for better reliability
        let locationData;

        try {
            const response = await fetch('https://ipapi.co/json/');
            locationData = await response.json();
            console.log('Location data from ipapi.co:', locationData);
        } catch (error) {
            console.error('Error with ipapi.co:', error);
            // Fallback to another API if the first one fails
            try {
                const response = await fetch('https://ipinfo.io/json');
                locationData = await response.json();
                console.log('Location data from ipinfo.io:', locationData);
            } catch (fallbackError) {
                console.error('Error with fallback API:', fallbackError);
                return false;
            }
        }

        // Check if the country is India
        if (locationData.country === 'IN' || locationData.country_name === 'India') {
            // Check if the region is in South Indian states
            if (southIndianStates.includes(locationData.region)) {
                console.log('User is in South India (by state)');
                return true;
            }

            // Check if the city is in South Indian cities
            if (locationData.city && southIndianCities.includes(locationData.city)) {
                console.log('User is in South India (by city)');
                return true;
            }

            // For testing: Check if the user is in specific Maharashtra cities
            if (locationData.region === 'Maharashtra' &&
                locationData.city &&
                maharashtraSouthCities.includes(locationData.city)) {
                console.log('User is in Maharashtra but in a city we want to treat as South Indian');
                return true;
            }

            console.log('User is in India but not in South India');
            return false;
        }

        // If not in India, return false
        console.log('User is not in India');
        return false;
    } catch (error) {
        console.error('Error getting location:', error);
        return false;
    }
};