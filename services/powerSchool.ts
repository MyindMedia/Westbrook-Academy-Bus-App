
import { Student } from '../types';

export class PowerSchoolService {
  private static instance: PowerSchoolService;
  private isConnected: boolean = false;
  private lastSync: Date | null = null;
  private cachedStudents: Student[] = [];

  private constructor() {}

  public static getInstance(): PowerSchoolService {
    if (!PowerSchoolService.instance) {
      PowerSchoolService.instance = new PowerSchoolService();
    }
    return PowerSchoolService.instance;
  }

  public getCachedStudents(): Student[] {
      return this.cachedStudents;
  }

  public async syncStudents(): Promise<{ added: number, updated: number, students: Student[] }> {
    console.log("Starting Sync with PowerSchool Backend...");
    
    try {
        const response = await fetch('/api/powerschool/students');
        
        if (response.ok) {
            const realData: Student[] = await response.json();
            console.log("Fetched real data from PowerSchool:", realData.length);
            
            this.isConnected = true;
            this.lastSync = new Date();
            this.cachedStudents = realData;
            
            return {
                added: realData.length,
                updated: 0,
                students: realData 
            };
        } else {
            console.error("Backend returned error:", response.statusText);
            throw new Error("Backend connection failed");
        }
    } catch (e) {
        console.error("PowerSchool Sync Failed:", e);
        // STRICT: Return empty array. No mock data.
        this.isConnected = false;
        return {
            added: 0,
            updated: 0,
            students: []
        };
    }
  }

  public async searchStudents(query: string): Promise<Student[]> {
      // 1. Search locally in cached data first
      if (this.cachedStudents.length > 0) {
          const lowerQ = query.toLowerCase();
          const localResults = this.cachedStudents.filter(s => 
            s.name.toLowerCase().includes(lowerQ) || 
            s.id.toLowerCase().includes(lowerQ)
          );
          if (localResults.length > 0) return localResults;
      }

      // 2. If no local results or cache empty, try backend search
      try {
          const response = await fetch(`/api/powerschool/students?search=${encodeURIComponent(query)}`);
          if (response.ok) {
              return await response.json();
          }
      } catch (e) {
          console.error("Search failed", e);
      }
      
      return [];
  }

  public getLastSyncTime(): Date | null {
    return this.lastSync;
  }
}
