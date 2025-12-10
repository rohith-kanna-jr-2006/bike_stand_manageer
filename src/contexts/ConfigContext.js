import React, { createContext, useState } from 'react';

export const ConfigContext = createContext(undefined);

export const ConfigProvider = ({ children }) => {
    // Default configuration
    const [configState, setConfigState] = useState({
        baseRate: 50.00,
        gracePeriod: 15,
        penaltyMultiplier: 1.5
    });

    const calculateParkingFee = (type, hours) => {
        let fee = 0;

        if (type === 'two-wheeler') {
            // First 4 hours: ₹10 per hour
            const h1 = Math.min(hours, 4);
            fee += h1 * 10;

            // Next 8 hours (4 to 12): ₹20 per hour
            if (hours > 4) {
                const h2 = Math.min(hours - 4, 8);
                fee += h2 * 20;
            }

            // Above 12 hours: ₹25 per hour
            if (hours > 12) {
                const h3 = hours - 12;
                fee += h3 * 25;
            }
        } else {
            // Car Parking (Premium)
            // Slab based rates
            if (hours <= 1) fee = 50;
            else if (hours <= 2) fee = 100;
            else if (hours <= 4) fee = 200;
            else if (hours <= 8) fee = 300;
            else if (hours <= 12) fee = 400;
            else {
                // More than 12 hours: Not permitted. Penalty multiples of 400 for every 12h block or part
                const penaltyBlocks = Math.ceil((hours - 12) / 12);
                fee = 400 + (penaltyBlocks * 400);
            }
        }

        return fee;
    };

    const updateConfig = (newConfig) => {
        setConfigState(prev => ({ ...prev, ...newConfig }));
    };

    return (
        <ConfigContext.Provider value={{ ...configState, calculateParkingFee, updateConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};
