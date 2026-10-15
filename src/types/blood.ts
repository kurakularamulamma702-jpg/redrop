export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  phone: string;
  email?: string;
  latitude: number;
  longitude: number;
  city?: string;
  area?: string;
  isAvailable: boolean;
  isEmergencyReady: boolean;
  verified: boolean;
  isPhoneVerified?: boolean;
  lastDonationDate?: string;
  totalDonations?: number;
  distanceKm?: number;
  responseTimeMinutes?: number;
  notes?: string;
}

export type UrgencyLevel = 'IMMEDIATE' | 'WITHIN_2_HOURS' | 'TODAY';

export interface EmergencyRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  hospitalName: string;
  hospitalAddress: string;
  city: string;
  latitude: number;
  longitude: number;
  contactPerson: string;
  contactPhone: string;
  urgency: UrgencyLevel;
  timestamp: number;
  status: 'OPEN' | 'FULFILLED' | 'IN_PROGRESS';
  notes?: string;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationName: string;
  isAutoDetected: boolean;
}
