const southIndianStates = [
    'Tamil Nadu',
    'Kerala',
    'Karnataka',
    'Andhra Pradesh',
    'Telangana'
];

export const isWithinTimeRange = () => {
    const currentHour = new Date().getHours();
    // 10 AM to 12 PM: hours 10, 11
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