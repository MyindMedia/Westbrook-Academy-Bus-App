import React from 'react';
import { Link2 } from 'lucide-react';

const PowerSchoolConnect: React.FC = () => {
  const handleConnect = () => {
    // Navigate to the backend auth route
    // Using window.open to keep the app open while auth happens
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      "/api/powerschool/connect", 
      "PowerSchoolAuth", 
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  return (
    <button
      onClick={handleConnect}
      className="w-full py-3 px-4 bg-[#2D67AA] hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
    >
      <Link2 size={18} />
      Connect PowerSchool Account
    </button>
  );
};

export default PowerSchoolConnect;
