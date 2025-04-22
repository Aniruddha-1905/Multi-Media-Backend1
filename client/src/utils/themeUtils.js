const southIndianStates = [
    'Tamil Nadu',
    'Kerala',
    'Karnataka',
    'Andhra Pradesh',
    'Telangana'
];

export const isWithinTimeRange = () => {
    const currentHour = new Date().getHours();
    return currentHour >= 10 && currentHour < 12;
};

export const isSouthIndianLocation = async () => {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return southIndianStates.includes(data.region);
    } catch (error) {
        console.error('Error getting location:', error);
        return false;
    }
};