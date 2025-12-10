export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  PHONE = 'phone'
}

export interface PaymentMethod {
  id: string;
  method: 'card' | 'upi';
  type?: string;
  last4?: string;
  expiry?: string;
  upiId?: string;
  isDefault: boolean;
  holderName: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  role: UserRole;
  avatar?: string;
  provider: AuthProvider;
  isTwoFactorEnabled?: boolean;
  twoFactorMethod?: 'app' | 'sms';
  paymentMethods?: PaymentMethod[]; // Updated to use specific type
  vehicleNumber?: string;
  vehicleType?: 'two-wheeler' | 'car';
  vehicleModel?: string;
}

export interface BikeTicket {
  id: string;
  userId: string;
  bikeModel: string;
  checkInTime: string;
  status: 'active' | 'completed';
  spotNumber: string;
  cost?: number;
}

export interface RevenueData {
  date: string;
  amount: number;
}

export interface Stand {
  id: string;
  name: string;
  address?: string;
  location: {
    lat: number;
    lng: number;
  };
  capacity: number;
  availableSpots: number;
  status: 'active' | 'maintenance';
  ownerId?: string;
  contact?: {
    phone: string;
    email: string;
    license: string;
  };
  rates?: {
    bike: number;
    car: number;
  };
  createdAt?: any;
}

export interface Booking {
  id: string;
  ticketId?: string;
  userId: string;
  userName?: string;
  standId?: string;
  standName?: string;
  standOwnerId?: string; // CRITICAL: Links this booking to a specific Admin
  vehicleType: 'two-wheeler' | 'car';
  vehicleNumber?: string;
  vehicleModel?: string;
  startTime: any; // Firestore Timestamp
  endTime?: any; // Firestore Timestamp
  totalAmount?: number;
  paymentMethod?: string; // NEW: Stores which method was used
  status: 'active' | 'completed' | 'cancelled';
}