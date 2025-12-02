import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BUSES, MOCK_TRIPS, MOCK_INCIDENTS, getStudentById } from '../services/mockData';
import { CompletedTrip, Incident } from '../types';
import { PowerSchoolService } from '../services/powerSchool';
import { LiveTrackingService, LiveTripState } from '../services/liveTracking';
import MapView from './MapView';
import { MapPin, Bus as BusIcon, AlertTriangle, Clock, Calendar, ChevronRight, X, User, RefreshCw, Check, Link, Database, Radio } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [selectedTrip, setSelectedTrip] = useState<CompletedTrip | null>(null);
  
  // PowerSchool State
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  
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

  // Poll for Live Data (Simulating a websocket subscription via local storage polling)
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Operations Dashboard</h1>
        
        {/* PowerSchool Status Pill */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
           <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
           <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">PowerSchool SIS</span>
              <span className="text-[10px] text-gray-400">
                {lastSync ? `Synced: ${lastSync.toLocaleTimeString()}` : 'Connected'}
              </span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* PowerSchool Sync Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
            
            <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <Database size={20} className="text-westbrook-blue" />
                    Student Database
                </h3>
                <p className="text-sm text-gray-500 mb-6">Manage data sync between PowerSchool SIS and Westbrook Transportation.</p>
            </div>

            <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-600">Connection</span>
                     <span className="text-green-600 font-medium flex items-center gap-1"><Check size={14} /> Active</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-600">Environment</span>
                     <span className="text-gray-800 font-medium">Production (v2.4)</span>
                 </div>
                 
                 <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className={`w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        syncStatus === 'SUCCESS' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                 >
                    {syncing ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Syncing...
                        </>
                    ) : syncStatus === 'SUCCESS' ? (
                        <>
                           <Check size={18} />
                           Sync Complete
                        </>
                    ) : (
                        <>
                           <RefreshCw size={18} />
                           Refresh Data
                        </>
                    )}
                 </button>
            </div>
        </div>

        {/* Live Map Card */}
        <div className="bg-white p-0 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-bold text-gray-700">Live Map View</span>
          </div>
          <div className="h-[300px] w-full bg-gray-100 relative">
             <MapView activeTrips={activeTrips} />
          </div>
        </div>
      </div>
      
      {/* Active Trips Section */}
      {Object.keys(activeTrips).length > 0 && (
          <div className="mb-8">
             <h3 className="text-lg font-semibold text-gray-700 mb-3">Active Trips</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {(Object.values(activeTrips) as LiveTripState[]).map(trip => (
                     <div key={trip.busId} className="bg-white p-4 rounded-xl border-l-4 border-green-500 shadow-sm flex items-center justify-between">
                         <div>
                             <h4 className="font-bold text-gray-800">{trip.busId}</h4>
                             <p className="text-xs text-gray-500">{trip.driverName}</p>
                             <div className="mt-2 flex items-center gap-2">
                                 <span className="text-xs font-mono bg-gray-100 px-1 rounded">{new Date(trip.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 <ChevronRight size={10} className="text-gray-300" />
                                 <span className="text-xs text-green-600 font-bold">In Progress</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="text-2xl font-black text-gray-800">{trip.studentCount}<span className="text-sm text-gray-400 font-normal">/{trip.totalStudents}</span></div>
                             <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Students</p>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trip History Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <h3 className="text-lg font-semibold text-gray-700">Today's Completed Trips</h3>
             <span className="text-xs text-gray-400">{new Date().toLocaleDateString()}</span>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                 <tr>
                   <th className="px-4 py-3 font-medium">Bus</th>
                   <th className="px-4 py-3 font-medium">Route</th>
                   <th className="px-4 py-3 font-medium">Driver</th>
                   <th className="px-4 py-3 font-medium">Time</th>
                   <th className="px-4 py-3 font-medium">Status</th>
                   <th className="px-4 py-3 font-medium">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 text-sm">
                 {MOCK_TRIPS.map(trip => (
                   <tr key={trip.id} className="hover:bg-blue-50/50 transition-colors">
                     <td className="px-4 py-3 font-medium text-gray-800">{trip.busId}</td>
                     <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${trip.routeType.includes('AM') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {trip.routeType === 'AM_PICKUP' ? 'AM Pickup' : 'PM Dropoff'}
                        </span>
                     </td>
                     <td className="px-4 py-3 text-gray-600">{trip.driverName}</td>
                     <td className="px-4 py-3 text-gray-600 font-mono text-xs">{trip.startTime} - {trip.endTime}</td>
                     <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex w-fit items-center gap-1">
                          Completed
                        </span>
                     </td>
                     <td className="px-4 py-3">
                       <button 
                         onClick={() => setSelectedTrip(trip)}
                         className="text-westbrook-blue hover:text-blue-800 font-medium text-xs flex items-center gap-1"
                       >
                         View Details <ChevronRight size={12} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Incident Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
             <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
               <AlertTriangle size={20} />
               Incident Reports
             </h3>
             <span className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">{MOCK_INCIDENTS.length} New</span>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
             {MOCK_INCIDENTS.length === 0 ? (
               <div className="p-8 text-center text-gray-400">No incidents reported today.</div>
             ) : (
               <ul className="divide-y divide-gray-100">
                 {MOCK_INCIDENTS.map(inc => (
                   <li key={inc.id} className="p-4 hover:bg-gray-50">
                     <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          inc.severity === 'High' ? 'bg-red-100 text-red-700' : 
                          inc.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {inc.severity} Severity
                        </span>
                        <span className="text-xs text-gray-400">{new Date(inc.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>
                     <h4 className="font-bold text-sm text-gray-800 mb-1">{inc.type} - {inc.busId}</h4>
                     <p className="text-xs text-gray-600 leading-relaxed">"{inc.description}"</p>
                     <p className="text-xs text-gray-400 mt-2">Reported by: {inc.driverName}</p>
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </div>

      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div>
                 <h2 className="text-xl font-bold text-gray-800">{selectedTrip.busName}</h2>
                 <p className="text-sm text-gray-500">{selectedTrip.date} • {selectedTrip.routeType}</p>
               </div>
               <button 
                onClick={() => setSelectedTrip(null)}
                className="p-2 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300 transition-colors"
               >
                 <X size={20} />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
               {/* Stats Row */}
               <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="text-xs text-blue-400 font-bold uppercase mb-1">Total Time</div>
                    <div className="text-lg font-bold text-blue-900 flex items-center gap-2">
                       <Clock size={18} />
                       {selectedTrip.startTime} - {selectedTrip.endTime}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="text-xs text-green-400 font-bold uppercase mb-1">Present</div>
                    <div className="text-lg font-bold text-green-900 flex items-center gap-2">
                       <User size={18} />
                       {selectedTrip.logs.filter(l => l.status === 'ON_BUS' || l.status === 'DROPPED_OFF').length}
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl">
                    <div className="text-xs text-red-400 font-bold uppercase mb-1">Incidents</div>
                    <div className="text-lg font-bold text-red-900 flex items-center gap-2">
                       <AlertTriangle size={18} />
                       {selectedTrip.incidents.length}
                    </div>
                  </div>
               </div>

               {/* Student Manifest Table */}
               <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Student Manifest</h3>
               <div className="border border-gray-100 rounded-xl overflow-hidden">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-2">Student</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Time Logged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedTrip.logs.map(log => {
                        const student = getStudentById(log.studentId);
                        return (
                          <tr key={log.studentId}>
                            <td className="px-4 py-3 font-medium">{student?.name || log.studentId}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                log.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">
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
                   <h3 className="font-bold text-red-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                     <AlertTriangle size={16} /> Trip Incidents
                   </h3>
                   <div className="space-y-3">
                      {selectedTrip.incidents.map((inc, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-100 p-4 rounded-xl">
                           <div className="flex justify-between items-start mb-2">
                             <span className="font-bold text-red-900 text-sm">{inc.type}</span>
                             <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">{inc.severity}</span>
                           </div>
                           <p className="text-sm text-red-800">{inc.description}</p>
                        </div>
                      ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;