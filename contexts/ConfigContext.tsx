import React, { createContext, useState, ReactNode } from 'react';

export type VehicleType = 'two-wheeler' | 'car';

export interface AppConfig {
  baseRate: number;
  gracePeriod: number;
  penaltyMultiplier: number;
  calculateParkingFee: (type: VehicleType, hours: number) => number;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
}

export const ConfigContext = createContext<AppConfig | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default configuration
  const [configState, setConfigState] = useState({
    baseRate: 50.00,
    gracePeriod: 15,
    penaltyMultiplier: 1.5
  });

  const calculateParkingFee = (type: VehicleType, hours: number): number => {
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
        // Example: 13 hours = 400 (base max) + 400 (penalty) = 800
        // Logic: 400 for first 12h + (ceil((hours-12)/12) * 400)
        const penaltyBlocks = Math.ceil((hours - 12) / 12);
        fee = 400 + (penaltyBlocks * 400);
      }
    }
    
    return fee;
  };

  const updateConfig = (newConfig: Partial<typeof configState>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <ConfigContext.Provider value={{ ...configState, calculateParkingFee, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};