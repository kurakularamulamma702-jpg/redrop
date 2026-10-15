import { EmergencyRequest } from '../types/blood';

export interface CityPreset {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const POPULAR_CITIES: CityPreset[] = [
  { name: 'Current GPS Location', country: 'Auto-detected', latitude: 37.7749, longitude: -122.4194 },
  { name: 'Hyderabad', country: 'India', latitude: 17.3850, longitude: 78.4867 },
  { name: 'New York City', country: 'USA', latitude: 40.7128, longitude: -74.0060 },
  { name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Bengaluru', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 }
];

export const INITIAL_EMERGENCY_REQUESTS: EmergencyRequest[] = [];
