
import React, { useEffect, useState } from 'react';
import { BUSES, MOCK_TRIPS, MOCK_INCIDENTS, getStudentById } from '../services/mockData';
import { CompletedTrip, Incident } from '../types';
import { PowerSchoolService } from '../services/powerSchool';
import { LiveTrackingService, LiveTripState } from '../services/liveTracking';
import MapView from './MapView';
import UserAvatar from './UserAvatar';
import PowerSchoolHelp from './PowerSchoolHelp';
import { Clock, AlertTriangle, X, User, RefreshCw, Check, Database, Radio, ArrowUpRight, HelpCircle } from 'lucide-react';

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
  
  // LIVE TRACKING STATE
  const [activeTrips, setActiveTrips] = useState<Record<string, LiveTripState>>({});

  const psService = PowerSchoolService.getInstance();
  const liveService = LiveTrackingService.getInstance();

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('IDLE');
    try {
        await psService.syncStudents();
        setLastSync(new Date());
        setSyncStatus('SUCCESS');
        setTimeout(() => setSyncStatus('IDLE'), 3000);
    } catch (e) {
        setSyncStatus('ERROR');
    } finally {
        setSyncing(false);
    }
  };

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
    const interval = setInterval(fetchLive, 2000); // 2 sec poll
    
    // Also listen for event
    const handleStorage = () => fetchLive();
    window.addEventListener('storage', handleStorage);
    
    return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-start mb-8">
        <div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Operations Dashboard</h1>
           <p className="text-gray-500 mt-1">Real-time fleet monitoring and student safety system</p>
        </div>
        
        <div className="flex items-center gap-4">
             {/* PowerSchool Status Pill */}
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200">
            <div className="flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-gray-700">PowerSchool SIS</span>
                <span className="text-[10px] text-gray-400 font-mono">
                    {lastSync ? `Last Sync: ${lastSync.toLocaleTimeString()}` : 'System Connected'}
                </span>
            </div>
            <div className={`w-3 h-3 rounded-full ${syncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'}`}></div>
            </div>

            {/* Admin Avatar */}
            <UserAvatar isDevMode={isDevMode} size="md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        
        {/* PowerSchool Sync Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-60 pointer-events-none transition-transform group-hover:scale-110"></div>
            
            <div className="flex justify-between items-start">
                <div>
                    <div className="w-10 h-10 bg-blue-50 text-westbrook-blue rounded-xl flex items-center justify-center mb-4">
                        <Database size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                        Student Database
                    </h3>
                    <p className="text-xs text-gray-500 mb-6 leading-relaxed">Manage data sync between PowerSchool SIS and local fleet manifest.</p>
                </div>
                <button onClick={() => setShowPSHelp(true)} className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors">
                    <HelpCircle size={18} />
                </button>
            </div>

            <div className="space-y-3 relative z-10">
                 <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                     <span className="text-gray-500">API Status</span>
                     <span className="text-green-600 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Active</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                     <span className="text-gray-500">Version</span>
                     <span className="text-gray-800 font-mono text-xs">v2.4.0-prod</span>
                 </div>
                 
                 <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className={`w-full mt-2 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                        syncStatus === 'SUCCESS' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md'
                    }`}
                 >
                    {syncing ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Syncing Data...
                        </>
                    ) : syncStatus === 'SUCCESS' ? (
                        <>
                           <Check size={16} />
                           Sync Complete
                        </>
                    ) : (
                        <>
                           <RefreshCw size={16} />
                           Refresh Data
                        </>
                    )}
                 </button>
            </div>
        </div>

        {/* Live Map Card */}
        <div className="bg-white p-0 rounded-3xl shadow-sm border border-gray-200 lg:col-span-3 flex flex-col overflow-hidden relative min-h-[400px]">
          <div className="absolute top-5 left-5 z-[500] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
             <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Live Fleet View</span>
          </div>
          <div className="flex-1 w-full bg-gray-100 relative">
             <MapView activeTrips={activeTrips} />
          </div>
        </div>
      </div>
      
      {/* Active Trips Section */}
      {Object.keys(activeTrips).length > 0 && (
          <div className="mb-8">
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Radio className="text-red-500" /> Active Trips
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                 {(Object.values(activeTrips) as LiveTripState[]).map(trip => (
                     <div key={trip.busId} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group">
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">LIVE</span>
                                <h4 className="font-bold text-gray-800">{trip.busId}</h4>
                             </div>
                             
                             <p className="text-sm text-gray-500 flex items-center gap-1">
                                <User size={12} /> {trip.driverName}
                             </p>
                             
                             <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                 <Clock size={12} />
                                 <span>Started {new Date(trip.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="text-3xl font-black text-gray-800 group-hover:text-westbrook-blue transition-colors">
                                {trip.studentCount}
                                <span className="text-sm text-gray-300 font-medium ml-1">/{trip.totalStudents}</span>
                             </div>
                             <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mt-1">On Board</p>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trip History Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
             <div>
                <h3 className="text-lg font-bold text-gray-800">Completed Trips</h3>
                <p className="text-xs text-gray-500">History for {new Date().toLocaleDateString()}</p>
             </div>
             <button className="text-xs font-bold text-westbrook-blue hover:underline">View All History</button>
           </div>
           <div className="overflow-x-auto flex-1">
             <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-wider">
                 <tr>
                   <th className="px-6 py-4 font-semibold">Bus</th>
                   <th className="px-6 py-4 font-semibold">Route Type</th>
                   <th className="px-6 py-4 font-semibold">Driver</th>
                   <th className="px-6 py-4 font-semibold">Duration</th>
                   <th className="px-6 py-4 font-semibold">Status</th>
                   <th className="px-6 py-4 font-semibold"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 text-sm">
                 {MOCK_TRIPS.map(trip => (
                   <tr key={trip.id} className="hover:bg-blue-50/30 transition-colors group">
                     <td className="px-6 py-4 font-bold text-gray-800">{trip.busId}</td>
                     <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${trip.routeType.includes('AM') ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {trip.routeType === 'AM_PICKUP' ? 'AM Pickup' : 'PM Dropoff'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-gray-600">{trip.driverName}</td>
                     <td className="px-6 py-4 text-gray-500 font-mono text-xs">{trip.startTime} - {trip.endTime}</td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 w-fit px-2 py-1 rounded-md">
                           <Check size={12} strokeWidth={3} /> Done
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => setSelectedTrip(trip)}
                         className="p-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-westbrook-blue hover:text-white transition-all"
                       >
                         <ArrowUpRight size={16} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Incident Feed */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-red-50 bg-red-50/50 flex justify-between items-center">
             <div>
                <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" />
                  Incidents
                </h3>
                <p className="text-xs text-red-400">Requires attention</p>
             </div>
             <span className="bg-white text-red-600 border border-red-100 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">{MOCK_INCIDENTS.length} New</span>
          </div>
          <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
             {MOCK_INCIDENTS.length === 0 ? (
               <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                       <Check size={32} className="text-gray-300" />
                   </div>
                   No incidents reported today.
               </div>
             ) : (
               <ul className="divide-y divide-gray-50">
                 {MOCK_INCIDENTS.map(inc => (
                   <li key={inc.id} className="p-6 hover:bg-gray-50 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          inc.severity === 'High' ? 'bg-red-100 text-red-700' : 
                          inc.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {inc.severity} Severity
                        </span>
                        <span className="text-xs text-gray-400">{new Date(inc.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>
                     <h4 className="font-bold text-gray-800 mb-1">{inc.type} • {inc.busId}</h4>
                     <p className="text-sm text-gray-600 leading-relaxed mb-3">"{inc.description}"</p>
                     
                     <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                             {inc.driverName.charAt(0)}
                         </div>
                         <p className="text-xs text-gray-400">Reported by {inc.driverName}</p>
                     </div>
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </div>

      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">{selectedTrip.busName}</h2>
                 <p className="text-sm text-gray-500 font-medium">{selectedTrip.date} • {selectedTrip.routeType}</p>
               </div>
               <button 
                onClick={() => setSelectedTrip(null)}
                className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
               >
                 <X size={20} />
               </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
               {/* Stats Row */}
               <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                    <div className="text-xs text-blue-400 font-bold uppercase mb-2">Total Time</div>
                    <div className="text-xl font-black text-blue-900 flex items-center gap-2">
                       <Clock size={20} className="opacity-50" />
                       <span className="text-base font-medium text-blue-700">{selectedTrip.startTime} - {selectedTrip.endTime}</span>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-100 p-5 rounded-2xl">
                    <div className="text-xs text-green-500 font-bold uppercase mb-2">Attendance</div>
                    <div className="text-3xl font-black text-green-900 flex items-center gap-2">
                       {selectedTrip.logs.filter(l => l.status === 'ON_BUS' || l.status === 'DROPPED_OFF').length}
                       <span className="text-sm font-medium text-green-600 opacity-70">Present</span>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 p-5 rounded-2xl">
                    <div className="text-xs text-red-400 font-bold uppercase mb-2">Incidents</div>
                    <div className="text-3xl font-black text-red-900 flex items-center gap-2">
                       {selectedTrip.incidents.length}
                       <span className="text-sm font-medium text-red-600 opacity-70">Reported</span>
                    </div>
                  </div>
               </div>

               {/* Student Manifest Table */}
               <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                   <User size={16} /> Student Manifest
               </h3>
               <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Student Name</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Time Logged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedTrip.logs.map(log => {
                        const student = getStudentById(log.studentId);
                        return (
                          <tr key={log.studentId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-bold text-gray-700">{student?.name || log.studentId}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                log.status === 'ABSENT' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                 </table>
               </div>

               {selectedTrip.incidents.length > 0 && (
                 <div className="mt-8">
                   <h3 className="font-bold text-red-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                     <AlertTriangle size={16} /> Trip Incidents
                   </h3>
                   <div className="space-y-3">
                      {selectedTrip.incidents.map((inc, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-100 p-5 rounded-2xl">
                           <div className="flex justify-between items-start mb-2">
                             <span className="font-bold text-red-900 text-sm">{inc.type}</span>
                             <span className="text-[10px] font-bold bg-white text-red-800 px-2 py-1 rounded border border-red-100 uppercase">{inc.severity}</span>
                           </div>
                           <p className="text-sm text-red-800 leading-relaxed opacity-90">{inc.description}</p>
                        </div>
                      ))}
                   </div>
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
