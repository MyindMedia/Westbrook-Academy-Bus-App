
import { Bus, Student, CompletedTrip, RouteType, StudentStatus, Incident } from "../types";

export const BUSES: Bus[] = [
  { 
    id: "BUS-A", 
    name: "Bus A - High School", 
    driverName: "John Smith",
    endpointAddress: "1700 W 46th St, Los Angeles, CA 90062",
    endpointLocation: { lat: 34.003500, lng: -118.306000 }
  },
  { 
    id: "BUS-B", 
    name: "Bus B - Middle School", 
    driverName: "Jane Doe",
    endpointAddress: "1700 W 46th St, Los Angeles, CA 90062",
    endpointLocation: { lat: 34.003500, lng: -118.306000 }
  },
  { 
    id: "BUS-C", 
    name: "Bus C - Bell High", 
    driverName: "Robert Johnson",
    endpointAddress: "4206 Gage Ave, Bell, CA 90201",
    endpointLocation: { lat: 33.973800, lng: -118.196000 }
  },
];

export const SCHOOL_ADDRESS = "2340 Firestone Blvd, South Gate, CA 90280";
export const SCHOOL_LOCATION = { lat: 33.947236, lng: -118.215324 };

// --- STUDENTS CLEARED (Use PowerSchool Service) ---
export const STUDENTS: Student[] = [];

// --- GLOBAL DB CLEARED ---
const GLOBAL_STUDENT_DB: Student[] = [];

// Helper to look up student by ID (Now relies on the service or passed context primarily)
export const getStudentById = (id: string): Student | undefined => {
  return GLOBAL_STUDENT_DB.find(s => s.id.toLowerCase() === id.toLowerCase());
};

export const searchGlobalStudents = (query: string): Student[] => {
    // This is now a fallback that returns empty if no cached data exists
    return [];
};

// --- MOCK HISTORY DATA FOR DASHBOARD (Kept for visual layout of charts/tables only) ---

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-001",
    busId: "BUS-A",
    driverName: "John Smith",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: "Delay",
    description: "Heavy traffic on I-110 caused 15 min delay.",
    severity: "Low"
  },
  {
    id: "INC-002",
    busId: "BUS-B",
    driverName: "Jane Doe",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: "Behavior",
    description: "Student refused to sit down while bus was in motion.",
    severity: "Medium"
  }
];

export const MOCK_TRIPS: CompletedTrip[] = [
  {
    id: "TRIP-1001",
    busId: "BUS-A",
    busName: "Bus A - High School",
    driverName: "John Smith",
    routeType: RouteType.AM_PICKUP,
    date: new Date().toLocaleDateString(),
    startTime: "07:15 AM",
    endTime: "08:05 AM",
    incidents: [],
    logs: []
  },
  {
    id: "TRIP-1002",
    busId: "BUS-B",
    busName: "Bus B - Middle School",
    driverName: "Jane Doe",
    routeType: RouteType.AM_PICKUP,
    date: new Date().toLocaleDateString(),
    startTime: "07:30 AM",
    endTime: "08:15 AM",
    incidents: [MOCK_INCIDENTS[1]],
    logs: []
  }
];
