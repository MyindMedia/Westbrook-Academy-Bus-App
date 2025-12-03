import React, { useState } from 'react';
import { Link2, AlertTriangle } from 'lucide-react';

const PowerSchoolConnect: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    // Quick check if backend is listening before trying to open popup
    try {
        const check = await fetch('/api/powerschool/status');
        if (!check.ok) throw new Error("Backend not running");
    } catch (e) {
        setError("Backend Server is not running. Please start it using 'npm run server' in a separate terminal.");
        return;
    }

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Open the auth window
    const popup = window.open(
      "/api/powerschool/connect", 
      "PowerSchoolAuth", 
      `width=${width},height=${height},top=${top},left=${left}`
    );

    // Listen for close or success
    const timer = setInterval(() => {
        if (popup && popup.closed) {
            clearInterval(timer);
            // Reload page or re-check diagnostics
            window.location.reload();
        }
    }, 1000);
  };

  return (
    <div className="space-y-3">
        {error && (
            <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
            </div>
        )}
        <button
        onClick={handleConnect}
        className="w-full py-3 px-4 bg-[#2D67AA] hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
        <Link2 size={18} />
        Connect PowerSchool Account
        </button>
    </div>
  );
};

export default PowerSchoolConnect;