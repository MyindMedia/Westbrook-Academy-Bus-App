
import React, { useEffect, useState } from 'react';
import { MOCK_TRIPS, MOCK_INCIDENTS } from '../services/mockData';
import { CompletedTrip, Student } from '../types';
import { PowerSchoolService, PowerSchoolDiagnostics } from '../services/powerSchool';
import { LiveTrackingService, LiveTripState } from '../services/liveTracking';
import MapView from './MapView';
import UserAvatar from './UserAvatar';
import PowerSchoolHelp from './PowerSchoolHelp';
import { Clock, AlertTriangle, X, User, RefreshCw, Check, Database, Radio, ArrowUpRight, HelpCircle, Search, ChevronDown, List, Server, ShieldCheck, Activity } from 'lucide-react';

interface DashboardProps {
    isDevMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isDevMode = false }) => {
  const [selectedTrip, setSelectedTrip] = useState<CompletedTrip | null>(null);
  
  // PowerSchool State
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [showPSHelp, setShowPSHelp] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<PowerSchoolDiagnostics | null>(null);
  
  // Student Database Dropdown State
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [dbSearch, setDbSearch] = useState("");
  const [isDbOpen, setIsDbOpen] = useState(false);
  
  // LIVE TRACKING STATE
  const [activeTrips, setActiveTrips] = useState<Record<string, LiveTripState>>({});

  const psService = PowerSchoolService.getInstance();
  const liveService = LiveTrackingService.getInstance();

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('IDLE');
    try {
        const result = await psService.syncStudents();
        setAllStudents(result.students);
        setLastSync(new Date());
        setSyncStatus('SUCCESS');
        setTimeout(() => setSyncStatus('IDLE'), 3000);
    } catch (e: any) {
        console.error("Sync error in UI:", e);
        setSyncStatus('ERROR');
        // Auto-open diagnostics if it's a connection error
        runDiagnostics();
        setShowDiagnostics(true);
    } finally {
        setSyncing(false);
    }
  };

  const runDiagnostics = async () => {
      const results = await psService.getDiagnostics();
      setDiagnostics(results);
  };

  // Initial Data Load
  useEffect(() => {
      const cached = psService.getCachedStudents();
      if (cached.length > 0) {
          setAllStudents(cached);
          setLastSync(psService.getLastSyncTime());
      } else {
          // Attempt silent sync on load
          handleSync();
      }
      // Also run diagnostics to check server status
      runDiagnostics();
  }, []);

  // Poll for Live Data
  useEffect(() => {
    const fetchLive = () => {
       const trips = liveService.getAllTrips();
       const activeOnly = Object.entries(trips).reduce((acc, [key, val]) => {
          if (val.status === 'ACTIVE') acc[key] = val;
          return acc;
       }, {} as Record<string, LiveTripState>);
       setActiveTrips(activeOnly);
    };

    fetchLive();
    const interval = setInterval(fetchLive, 2000); 
    const handleStorage = () => fetchLive();
    window.addEventListener('storage', handleStorage);
    
    return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const filteredStudents = allStudents.filter(s => 
      s.name.toLowerCase().includes(dbSearch.toLowerCase()) || 
      s.id.toLowerCase().includes(dbSearch.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-start mb-8">
        <div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Operations Dashboard</h1>
           <p className="text-gray-500 mt-1">Real-time fleet monitoring and student safety system</p>
        </div>
        
        <div className="flex items-center gap-4">
             {/* PowerSchool Status Pill */}
            <button 
                onClick={() => { runDiagnostics(); setShowDiagnostics(true); }}
                className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
                <div className="flex flex-col items-end mr-2 text-right">
                    <span className="text-xs font-bold text-gray-700">PowerSchool SIS</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                        {diagnostics?.authenticated ? 'Connected' : 'Offline'}
                    </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                    !diagnostics?.backendUp ? 'bg-red-500' :
                    !diagnostics?.authenticated ? 'bg-yellow-400' : 
                    'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                }`}></div>
            </button>

            {/* Admin Avatar */}
            <UserAvatar isDevMode={isDevMode} size="md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        
        {/* PowerSchool Sync Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="w-10 h-10 bg-blue-50 text-westbrook-blue rounded-xl flex items-center justify-center mb-4">
                        <RefreshCw size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                        Data Sync
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Refresh student manifest from SIS.</p>
                </div>
                <button onClick={() => setShowPSHelp(true)} className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors">
                    <HelpCircle size={18} />
                </button>
            </div>
             
             <div className="mt-auto space-y-2">
                 {syncStatus === 'ERROR' && (
                     <div className="text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100 mb-2">
                         Connection Failed. Checking Status...
                     </div>
                 )}
                 <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                        syncStatus === 'SUCCESS' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : syncStatus === 'ERROR'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md'
                    }`}
                 >
                    {syncing ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Syncing...
                        </>
                    ) : syncStatus === 'SUCCESS' ? (
                        <>
                           <Check size={16} />
                           Synced
                        </>
                    ) : (
                        <>
                           <RefreshCw size={16} />
                           {syncStatus === 'ERROR' ? 'Retry Sync' : 'Sync Now'}
                        </>
                    )}
                 </button>
            </div>
        </div>

        {/* Database Dropdown Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <Database size={20} />
                </div>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded">
                    {allStudents.length} Records
                </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">District Database</h3>
            <p className="text-xs text-gray-500 mb-4">View entire PowerSchool roster.</p>
            
            <div className="relative mt-auto">
                <div 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDbOpen(!isDbOpen)}
                >
                    <span className="text-sm font-medium text-gray-600">Select Student...</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDbOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDbOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[300px] animate-in slide-in-from-top-2">
                        <div className="p-2 border-b border-gray-100">
                             <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-lg">
                                <Search size={14} className="text-gray-400" />
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="bg-transparent text-sm w-full outline-none placeholder-gray-400"
                                    placeholder="Search name or ID..."
                                    value={dbSearch}
                                    onChange={(e) => setDbSearch(e.target.value)}
                                />
                             </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                            {filteredStudents.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-400">
                                    {allStudents.length === 0 ? "No data. Check connection." : "No matching students."}
                                </div>
                            ) : (
                                filteredStudents.map(student => (
                                    <div key={student.id} className="p-2 hover:bg-blue-50 rounded-lg flex items-center gap-3 cursor-default">
                                         <img src={student.photoUrl} className="w-8 h-8 rounded-full bg-gray-100 object-cover" alt="" />
                                         <div className="overflow-hidden">
                                             <p className="text-sm font-bold text-gray-800 truncate">{student.name}</p>
                                             <p className="text-xs text-gray-500">
                                                ID: {student.id} • Grade {student.grade}
                                             </p>
                                         </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Live Map Card */}
        <div className="bg-white p-0 rounded-3xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col overflow-hidden relative min-h-[300px]">
          <div className="absolute top-5 left-5 z-[500] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
             <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Live Fleet View</span>
          </div>
          <MapView activeTrips={activeTrips} />
        </div>
      </div>
      
      {/* ... Rest of Dashboard (Tables, Incidents, etc) ... */}
      
      {/* Connection Diagnostics Modal */}
      {showDiagnostics && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <div className="flex items-center gap-2">
                          <Activity size={20} className="text-westbrook-blue" />
                          <h2 className="text-lg font-bold text-gray-900">Connection Diagnostics</h2>
                      </div>
                      <button onClick={() => setShowDiagnostics(false)} className="p-2 hover:bg-gray-200 rounded-full">
                          <X size={20} className="text-gray-500" />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      {/* Step 1: Backend */}
                      <div className="flex items-start gap-4">
                          <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center ${diagnostics?.backendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {diagnostics?.backendUp ? <Check size={14} /> : <X size={14} />}
                          </div>
                          <div>
                              <h4 className="text-sm font-bold text-gray-900">Backend Server</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                  {diagnostics?.backendUp 
                                    ? "Server responding on http://localhost:3001" 
                                    : "Server unreachable. Run 'npm run server' in terminal."}
                              </p>
                          </div>
                      </div>

                      {/* Step 2: Auth */}
                      <div className="flex items-start gap-4">
                          <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center ${diagnostics?.authenticated ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                              {diagnostics?.authenticated ? <Check size={14} /> : <AlertTriangle size={14} />}
                          </div>
                          <div>
                              <h4 className="text-sm font-bold text-gray-900">PowerSchool Authorization</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                  {diagnostics?.authenticated
                                    ? "OAuth token is valid."
                                    : diagnostics?.backendUp 
                                        ? "No access token. Click 'Setup Guide' -> 'Connect'."
                                        : "Waiting for server..."}
                              </p>
                          </div>
                      </div>
                      
                      {/* Step 3: Config */}
                      {diagnostics?.config && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Config</h5>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-600 truncate"><span className="font-bold">Base URL:</span> {diagnostics.config.baseUrl}</p>
                                <p className="text-xs text-gray-600 truncate"><span className="font-bold">Redirect URI:</span> {diagnostics.config.redirectUri}</p>
                            </div>
                        </div>
                      )}

                      {!diagnostics?.authenticated && diagnostics?.backendUp && (
                          <button 
                            onClick={() => { setShowDiagnostics(false); setShowPSHelp(true); }}
                            className="w-full py-3 bg-westbrook-blue text-white rounded-xl font-bold text-sm hover:bg-blue-700"
                          >
                              Open Setup Guide
                          </button>
                      )}
                      
                      {!diagnostics?.backendUp && (
                          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-xs font-mono">
                              Error: Backend unreachable. <br/>
                              Make sure you started the backend server with: <br/>
                              <span className="font-bold">npm run server</span> (or tsx server/server.ts)
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* PowerSchool Help Modal */}
      {showPSHelp && (
          <PowerSchoolHelp onClose={() => setShowPSHelp(false)} />
      )}

    </div>
  );
};

export default Dashboard;
