export enum UserRole {
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  NONE = 'NONE'
}

export enum RouteType {
  AM_PICKUP = 'AM_PICKUP',
  PM_DROPOFF = 'PM_DROPOFF'
}

export enum StudentStatus {
  PENDING = 'PENDING',
  ON_BUS = 'ON_BUS',
  DROPPED_OFF = 'DROPPED_OFF',
  ABSENT = 'ABSENT'
}

export interface Student {
  id: string;
  name: string;
  grade: number;
  photoUrl: string;
  busId: string; // The bus they are assigned to
  parentPhone: string;
}

export interface Bus {
  id: string;
  name: string; // e.g., "Bus A"
  driverName: string;
  endpointAddress: string; // The remote location (High School, Middle School, etc.)
  endpointLocation: { lat: number; lng: number }; // Coordinate for map
}

export interface AttendanceLog {
  studentId: string;
  status: StudentStatus;
  timestamp: string;
  location: { lat: number; lng: number };
}

export interface GeoPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface Incident {
  id: string;
  busId: string;
  driverName: string;
  timestamp: string;
  type: 'Behavior' | 'Mechanical' | 'Medical' | 'Delay' | 'Other';
  description: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface CompletedTrip {
  id: string;
  busId: string;
  busName: string;
  driverName: string;
  routeType: RouteType;
  date: string;
  startTime: string;
  endTime: string;
  logs: AttendanceLog[];
  incidents: Incident[];
  startLocation?: GeoPoint;
  endLocation?: GeoPoint;
}