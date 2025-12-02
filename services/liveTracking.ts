
import { AttendanceLog, GeoPoint, StudentStatus } from "../types";

export interface LiveTripState {
  busId: string;
  driverName: string;
  routeType: string;
  startTime: string;
  lastUpdated: string;
  currentLocation: GeoPoint | null;
  logs: AttendanceLog[];
  studentCount: number;
  totalStudents: number;
  status: 'ACTIVE' | 'ENDED';
}

const STORAGE_KEY = 'westbrook_live_fleet';

export class LiveTrackingService {
  private static instance: LiveTrackingService;
  
  private constructor() {}

  public static getInstance(): LiveTrackingService {
    if (!LiveTrackingService.instance) {
      LiveTrackingService.instance = new LiveTrackingService();
    }
    return LiveTrackingService.instance;
  }

  // Save current trip state to shared storage
  public updateTripState(state: LiveTripState): void {
    const currentData = this.getAllTrips();
    currentData[state.busId] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
    
    // Dispatch a custom event for the current tab to catch immediately (if needed)
    window.dispatchEvent(new Event('storage'));
  }

  // Remove trip from active tracking (e.g., when ended)
  public endTrip(busId: string): void {
    const currentData = this.getAllTrips();
    if (currentData[busId]) {
      currentData[busId].status = 'ENDED';
      // We keep it briefly or remove it depending on preference. 
      // Let's keep it marked as ENDED for a moment so dashboard knows to remove it.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
    }
  }

  public getAllTrips(): Record<string, LiveTripState> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  // Helper to clear old data on app load if needed
  public clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
