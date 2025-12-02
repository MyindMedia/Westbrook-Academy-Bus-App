
import { Student } from '../types';
import { STUDENTS } from './mockData';

// Types representing PowerSchool API responses
export interface PowerSchoolCredentials {
  clientId: string;
  clientSecret: string;
  url: string;
}

interface PSStudent {
  id: string; // DCID
  local_id: number;
  name: {
    first: string;
    last: string;
  };
  grade_level: number;
  school_id: number;
  contact: {
    guardian_phone: string;
  };
  transportation: {
    bus_assignment: string;
  };
}

// Simulated "New" students that appear after a sync
const NEW_STUDENTS_FROM_PS: Student[] = [
  {
    id: "S008",
    name: "New Student (Synced)",
    grade: 10,
    photoUrl: "https://picsum.photos/200/200?random=8",
    busId: "BUS-A",
    parentPhone: "555-0108"
  },
  {
    id: "S009",
    name: "Transfer Student",
    grade: 11,
    photoUrl: "https://picsum.photos/200/200?random=9",
    busId: "BUS-C",
    parentPhone: "555-0109"
  }
];

export class PowerSchoolService {
  private static instance: PowerSchoolService;
  private isConnected: boolean = false;
  private lastSync: Date | null = null;

  private constructor() {}

  public static getInstance(): PowerSchoolService {
    if (!PowerSchoolService.instance) {
      PowerSchoolService.instance = new PowerSchoolService();
    }
    return PowerSchoolService.instance;
  }

  // Simulate OAuth2 Flow
  public async authenticate(creds: PowerSchoolCredentials): Promise<boolean> {
    console.log(`Connecting to PowerSchool at ${creds.url}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple validation simulation
    if (creds.clientId && creds.clientSecret) {
      this.isConnected = true;
      return true;
    }
    return false;
  }

  public async syncStudents(): Promise<{ added: number, updated: number, students: Student[] }> {
    if (!this.isConnected) {
      // Auto-connect for demo purposes if not explicitly connected
      await new Promise(resolve => setTimeout(resolve, 800));
      this.isConnected = true;
    }

    console.log("Fetching /ws/v1/district/student...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.lastSync = new Date();

    // Return current mock students + the "new" simulated ones
    // In a real app, this maps JSON response -> Student Interface
    return {
      added: 2,
      updated: 5,
      students: [...STUDENTS, ...NEW_STUDENTS_FROM_PS]
    };
  }

  public getLastSyncTime(): Date | null {
    return this.lastSync;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
