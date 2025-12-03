
import { Student } from '../types';

export interface PowerSchoolDiagnostics {
    backendUp: boolean;
    authenticated: boolean;
    tokenExpired: boolean;
    config?: {
        baseUrl: string;
        clientIdProvided: boolean;
        redirectUri: string;
    };
    lastError?: string;
}

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

  // New diagnostic method
  public async getDiagnostics(): Promise<PowerSchoolDiagnostics> {
      try {
          // Short timeout for diagnostics check to prevent UI hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); 

          const response = await fetch('/api/powerschool/status', { signal: controller.signal });
          clearTimeout(timeoutId);

          if (response.ok) {
              const data = await response.json();
              return {
                  backendUp: true,
                  authenticated: data.authenticated,
                  tokenExpired: data.tokenExpired,
                  config: data.config
              };
          } else {
              return { backendUp: true, authenticated: false, tokenExpired: false, lastError: `HTTP ${response.status}` };
          }
      } catch (e) {
          return { backendUp: false, authenticated: false, tokenExpired: false, lastError: "Backend unreachable" };
      }
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
            const errorText = await response.text();
            console.error("Backend returned error:", response.status, errorText);
            throw new Error(response.status === 401 ? "NOT_AUTHENTICATED" : "API_ERROR");
        }
    } catch (e: any) {
        console.error("PowerSchool Sync Failed:", e);
        this.isConnected = false;
        
        // Re-throw specific errors for UI handling
        if (e.message === "NOT_AUTHENTICATED") throw e;
        throw e;
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
