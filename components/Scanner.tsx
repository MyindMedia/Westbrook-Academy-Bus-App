import React, { useState, useEffect } from 'react';
import { Scan, X, Camera, Zap } from 'lucide-react';

interface ScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [simulatedCode, setSimulatedCode] = useState<string>('');

  // Simulate scanning process
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (scanning) {
       // Simulate finding a code after 2.5 seconds for demo purposes
       // In a real app, this would be the onResult callback of a library like react-zxing
      timeout = setTimeout(() => {
        // Randomly pick a student ID from mock data to simulate a successful scan
        // This makes the demo playable
        const demoIds = ['S001', 'S002', 'S004', 'S005']; 
        const randomId = demoIds[Math.floor(Math.random() * demoIds.length)];
        setSimulatedCode(randomId);
        setScanning(false);
        
        // Auto submit after a brief pause to show the code
        setTimeout(() => {
            onScan(randomId);
        }, 800);

      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [scanning, onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white"
      >
        <X size={24} />
      </button>

      <div className="text-white mb-6 text-center">
        <h2 className="text-xl font-bold mb-1">Scan Student ID</h2>
        <p className="text-gray-400 text-sm">Align barcode within frame</p>
      </div>

      <div className="relative w-72 h-72 border-2 border-westbrook-orange rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(217,119,6,0.3)]">
        {/* Camera Feed Simulation */}
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            {/* Animated scanning line */}
             <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]" style={{ animationName: 'scanDown' }}></div>
             
             <Camera size={48} className="text-gray-600 opacity-50" />
             <video 
                className="absolute inset-0 w-full h-full object-cover opacity-60" 
                autoPlay 
                muted 
                playsInline
                // Mock source just to show "activity" if permission was granted, but relying on simulation
             />
        </div>

        {/* Reticle */}
        <div className="absolute inset-0 border-[20px] border-black/30 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl m-4"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl m-4"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl m-4"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl m-4"></div>

        {!scanning && simulatedCode && (
           <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center animate-pulse text-white">
               <Zap size={48} fill="currentColor" />
               <p className="font-bold text-2xl mt-2">{simulatedCode}</p>
           </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button 
          className="px-6 py-3 bg-white/10 rounded-full text-white font-medium backdrop-blur-md border border-white/20"
          onClick={() => setScanning(!scanning)}
        >
          {scanning ? 'Scanning...' : 'Reset'}
        </button>
      </div>

      <style>{`
        @keyframes scanDown {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Scanner;