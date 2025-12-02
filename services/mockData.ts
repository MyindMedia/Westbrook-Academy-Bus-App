import { Bus, Student, CompletedTrip, RouteType, StudentStatus, Incident } from "../types";

export const BUSES: Bus[] = [
  { 
    id: "BUS-A", 
    name: "Bus A - High School", 
    driverName: "John Smith",
    endpointAddress: "1700 W 46th St, Los Angeles, CA 90062"
  },
  { 
    id: "BUS-B", 
    name: "Bus B - Middle School", 
    driverName: "Jane Doe",
    endpointAddress: "1700 W 46th St, Los Angeles, CA 90062"
  },
  { 
    id: "BUS-C", 
    name: "Bus C - Bell High", 
    driverName: "Robert Johnson",
    endpointAddress: "4206 Gage Ave, Bell, CA 90201"
  },
];

export const SCHOOL_ADDRESS = "2340 Firestone Blvd, South Gate, CA 90280";

// Placeholder images using picsum
export const STUDENTS: Student[] = [
  {
    id: "S001",
    name: "Alex Johnson",
    grade: 11,
    photoUrl: "https://picsum.photos/200/200?random=1",
    busId: "BUS-A",
    parentPhone: "555-0101"
  },
  {
    id: "S002",
    name: "Sarah Williams",
    grade: 10,
    photoUrl: "https://picsum.photos/200/200?random=2",
    busId: "BUS-A",
    parentPhone: "555-0102"
  },
  {
    id: "S003",
    name: "Michael Brown",
    grade: 12,
    photoUrl: "https://picsum.photos/200/200?random=3",
    busId: "BUS-A",
    parentPhone: "555-0103"
  },
  {
    id: "S004",
    name: "Emily Davis",
    grade: 7,
    photoUrl: "https://picsum.photos/200/200?random=4",
    busId: "BUS-B",
    parentPhone: "555-0104"
  },
  {
    id: "S005",
    name: "David Wilson",
    grade: 8,
    photoUrl: "https://picsum.photos/200/200?random=5",
    busId: "BUS-B",
    parentPhone: "555-0105"
  },
   {
    id: "S006",
    name: "Jessica Miller",
    grade: 6,
    photoUrl: "https://picsum.photos/200/200?random=6",
    busId: "BUS-B",
    parentPhone: "555-0106"
  },
  {
    id: "S007",
    name: "Daniel Martinez",
    grade: 9,
    photoUrl: "https://picsum.photos/200/200?random=7",
    busId: "BUS-C",
    parentPhone: "555-0107"
  }
];

export const getStudentsForBus = (busId: string): Student[] => {
  return STUDENTS.filter(s => s.busId === busId);
};

export const getStudentById = (id: string): Student | undefined => {
  return STUDENTS.find(s => s.id.toLowerCase() === id.toLowerCase() || s.name.toLowerCase().includes(id.toLowerCase()));
};

// --- MOCK HISTORY DATA FOR DASHBOARD ---

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
    description: "Student S005 refused to sit down while bus was in motion.",
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
    logs: [
      { studentId: "S001", status: StudentStatus.ON_BUS, timestamp: new Date(Date.now() - 20000000).toISOString(), location: { lat: 0, lng: 0 } },
      { studentId: "S002", status: StudentStatus.ON_BUS, timestamp: new Date(Date.now() - 19800000).toISOString(), location: { lat: 0, lng: 0 } },
      { studentId: "S003", status: StudentStatus.ABSENT, timestamp: new Date(Date.now() - 19000000).toISOString(), location: { lat: 0, lng: 0 } },
    ]
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
    logs: [
      { studentId: "S004", status: StudentStatus.ON_BUS, timestamp: new Date(Date.now() - 18000000).toISOString(), location: { lat: 0, lng: 0 } },
      { studentId: "S005", status: StudentStatus.ON_BUS, timestamp: new Date(Date.now() - 17900000).toISOString(), location: { lat: 0, lng: 0 } },
      { studentId: "S006", status: StudentStatus.ON_BUS, timestamp: new Date(Date.now() - 17800000).toISOString(), location: { lat: 0, lng: 0 } },
    ]
  }
];
