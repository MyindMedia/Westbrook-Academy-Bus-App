import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest, isMsalConfigured } from "./services/authConfig";
import { UserRole, RouteType, Student, StudentStatus, Bus, AttendanceLog, GeoPoint, Incident } from './types';
import { BUSES, STUDENTS } from './services/mockData';
import { generateTripReport } from './services/geminiService';
import { PowerSchoolService } from './services/powerSchool';
import { LiveTrackingService, LiveTripState } from './services/liveTracking';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import { 
  Bus as BusIcon, 
  MapPin, 
  CheckCircle2, 
  QrCode, 
  LogOut, 
  ChevronRight, 
  Search,
  Loader2,
  Users,
  Navigation,
  AlertTriangle,
  Siren,
  X,
  Square,
  UserPlus,
  Check
} from 'lucide-react';

// --- Helper Functions ---

const getCurrentLocation = (): Promise<GeoPoint | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        console.error("Geo error", error);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

const formatDuration = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// --- Branding Component ---

const WestbrookLogo = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 395 395" 
    className={className}
    role="img"
    aria-label="Westbrook Academy Logo"
  >
    <path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M0 0L225 0L225 225L0 225L0 0Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M99.3594 39.8117C100.379 40.2036 114.912 54.9049 117.073 57.0166C113.671 66.0454 109.836 75.241 106.228 84.2198L87.2384 131.491C84.1712 139.128 80.8717 146.989 77.9966 154.667L52.2514 154.62L52.2558 147.875L52.2232 130.943C57.5341 128.933 63.8314 125.965 69.163 123.747C72.8174 122.227 79.5918 119.51 82.8564 117.754C83.8264 116.248 84.7429 113.483 85.4831 111.79C87.5406 107.086 89.4897 100.68 91.8965 96.2379C86.9899 98.6839 78.8416 101.876 73.5529 104.133L89.6556 64.1296C92.8609 56.1531 96.3464 47.8355 99.3594 39.8117Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M114.216 31.0659C119.317 30.6669 128.864 30.9974 134.421 30.997L175.509 30.9989L175.532 92.0994C171.698 88.7965 165.626 82.3502 161.814 78.5678L133.354 50.2493L120.239 37.2176C119.246 36.2368 114.81 31.9982 114.216 31.0659Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M129.597 69.6634C131.684 71.328 136.699 76.58 138.826 78.7014L157.158 96.9946C160.113 99.9435 164.513 104.58 167.595 107.199C164.258 108.318 158.26 111.095 154.776 112.582L130.061 123.142C122.313 126.555 111.424 131.411 103.683 134.302L120.313 92.9281C123.354 85.3772 126.829 77.2246 129.597 69.6634Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M52.2519 30.9972L85.4078 30.9911C82.9305 36.511 80.229 43.8069 77.9433 49.5027L61.9507 89.2211C58.9503 97.1488 55.4327 105.661 52.2035 113.53C52.608 86.3315 52.2547 58.2617 52.2519 30.9972Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M175.275 121.553C175.709 122.128 175.528 151.253 175.527 154.663C172.815 154.589 169.914 154.623 167.188 154.658C144.466 154.957 121.552 154.238 98.8468 154.757C98.7783 154.703 98.7501 154.533 98.7144 154.419C99.5286 153.844 104.168 151.933 105.376 151.419L119.584 145.379L175.275 121.553Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M150.458 169.317C151.097 164.942 156.46 162.928 160.251 163.96C166.182 165.575 167.724 173.445 162.379 176.898C160.468 178.111 158.151 178.509 155.945 178.003C151.927 177.101 150.445 174.122 150.192 170.329L150.458 169.317Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M156.905 166.101C159.595 165.531 162.235 167.262 162.785 169.956C163.335 172.65 161.586 175.277 158.887 175.807C156.217 176.332 153.624 174.604 153.079 171.938C152.535 169.272 154.243 166.665 156.905 166.101Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M148.403 171.665C147.671 177.059 142.386 179.486 137.507 177.582C131.377 175.191 131.758 166.195 137.86 164.156C142.679 162.545 146.965 164.811 148.382 169.664C148.39 170.235 148.432 171.123 148.403 171.665Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M139.694 166.112C142.355 165.532 144.985 167.205 145.588 169.861C146.19 172.517 144.538 175.162 141.887 175.786C140.419 176.132 138.874 175.791 137.688 174.86C136.501 173.928 135.803 172.508 135.79 171C135.77 168.652 137.4 166.612 139.694 166.112Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M105.88 182.073C109.565 182.347 114.405 181.417 117.481 183.852C120.716 186.413 120.346 191.094 118.008 194.057C114.52 197.037 110.417 196.379 105.947 196.325C105.803 191.705 105.923 186.738 105.88 182.073Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M108.611 184.273C111.155 184.305 113.507 184.194 115.652 185.815C118.243 187.772 117.46 190.709 115.61 192.873C113.851 194.252 110.806 194.044 108.609 194.06L108.611 184.273Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M104.704 163.951C107.648 163.897 115.343 163.059 116.645 166.564C117.136 167.884 116.001 169.462 115.349 170.572C116.273 173.094 118.404 171.925 116.913 175.967C114.478 178.779 108.232 178.015 104.609 177.984C104.859 174.298 104.641 167.909 104.704 163.951Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M107.44 171.991C109.75 171.886 113.119 171.262 114.488 173.361C114.627 174.278 114.499 174.517 114.177 175.397C112.096 176.066 109.634 175.983 107.442 175.996L107.44 171.991Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M107.46 165.974C109.628 165.916 112.504 165.399 113.799 167.362C113.959 168.227 113.809 168.453 113.442 169.269C111.91 169.98 109.203 169.894 107.43 169.943L107.46 165.974Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M47.4323 174.715C48.0901 172.502 49.9892 164.443 51.874 163.657C54.486 164.036 56.577 172.861 56.8042 175.203C57.5641 172.797 59.5543 165.994 60.6253 164.243C61.1656 163.826 62.2754 163.692 62.83 164.169C62.9815 164.971 62.404 166.24 62.1095 167.064C61.4295 169.152 59.132 177.779 57.5131 178.412C54.974 178.49 52.8953 170.302 52.3721 168.219L52.0315 168.109C50.9423 170.476 49.4421 180.639 45.6418 177.523C44.9891 175.836 41.0969 165.091 41.4656 164.046L42.3456 163.703L43.465 163.891C44.5315 164.897 46.7991 172.765 47.4323 174.715Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M119.741 163.969C124.219 163.875 132.955 162.698 131.477 170.39C131.195 171.859 129.705 172.788 128.473 173.451C129.346 174.405 131.361 176.537 131.388 177.809L130.722 178.249C125.832 177.267 129.088 173.402 122.472 173.987C122.463 175.056 122.743 176.925 122.231 177.643C121.571 178.138 120.592 177.964 119.737 177.918L119.741 163.969Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M122.495 166.066C125.939 165.992 130.984 166.254 128.081 171.14C126.203 171.924 124.522 171.766 122.498 171.755L122.495 166.066Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M143.97 191.456C145.194 189.344 148.718 182.501 150.647 181.953C152.654 182.857 151.382 192.681 151.75 194.785C151.913 195.721 151.517 196.117 150.719 196.492C148.464 195.951 149.16 192.817 149.212 190.839C149.075 189.145 149.138 188.283 149.271 186.578C147.786 189.266 145.88 192.95 143.898 195.199C142.895 193.91 139.662 188.423 139.089 187.975C137.699 188.909 140.209 196.151 137.414 196.717C135.583 195.64 136.044 184.319 136.38 182.071C136.87 182.112 137.492 182.215 137.992 182.282C139.605 183.269 142.796 189.439 143.97 191.456Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M95.1134 182.049L97.6349 182.247C98.6628 184.435 103.563 194.448 103.562 196.108L103.163 196.495C101.002 196.798 100.379 194.582 99.8776 193.029L96.9693 192.95L92.6655 193.028C92.2077 194.45 92.0824 195.49 90.8824 196.287C90.0637 196.327 89.9198 196.288 89.1418 196.102L88.9417 195.756C89.2035 194.306 94.1779 183.714 95.1134 182.049Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M96.0915 185.125C96.9051 185.605 98.9561 189.854 98.16 190.885L97.0458 190.95L93.6117 191.002L96.0915 185.125Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M65.6667 182.215C68.3235 182.083 68.327 181.973 69.4515 184.461C71.2468 188.433 73.028 192.415 74.8149 196.391L71.8458 196.241C70.9879 193.802 71.1916 192.94 68.3963 192.953L63.4562 193.034C63.0214 193.98 62.5293 195.393 62.1462 196.4C61.1912 196.338 60.2317 196.331 59.2746 196.315L65.6667 182.215Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M66.8355 185.118C67.4982 185.626 69.2431 189.798 69.4143 190.678C68.756 191.1 68.4542 190.954 67.5393 190.982L64.3533 190.994C65.206 189.046 66.0334 187.087 66.8355 185.118Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M129.186 182.126C130.603 182.114 132.335 181.68 133.05 182.964C132.998 183.74 133.115 183.636 132.726 184.212C131.378 184.51 127.028 184.317 125.328 184.302C125.349 185.507 125.311 186.825 125.3 188.039C127.187 187.996 130.906 187.65 132.405 188.872L132.428 189.359C131.056 190.593 127.168 190.223 125.319 190.156C125.409 191.726 124.87 192.873 125.752 193.992L126.778 194.047C128.433 194.068 132.315 193.424 133.255 194.807C133.192 195.691 133.343 195.701 132.868 196.228C131.238 196.564 124.525 196.315 122.546 196.286C122.648 191.737 122.56 186.798 122.563 182.219L129.186 182.126Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M179.836 163.784L180.481 163.975C180.415 165.013 176.121 169.16 175.003 170.359C176.381 171.699 180.331 176.173 180.63 177.909L180.139 178.348C177.371 177.552 175.101 174.331 173.278 172.126C172.376 173.076 171.422 173.893 171.027 175.125C171.039 175.855 171.023 176.432 170.982 177.162C170.428 177.968 170.725 177.749 169.821 178.13C169.11 178.093 169.034 178.018 168.485 177.553C168.233 175.543 168.23 166.413 168.463 164.382L168.819 164.103C169.509 164.024 170.266 163.839 170.839 164.19C171.199 164.746 171.054 170.004 171.066 171.141C173.363 168.774 176.541 164.059 179.836 163.784Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M65.3488 163.838C67.5938 163.954 74.0621 163.6 75.5995 164.272C75.8199 165.013 75.8216 164.705 75.6045 165.436C74.4281 166.49 69.8668 166.08 67.9737 166.058L67.995 169.774C69.6956 169.736 74.2643 169.394 75.2364 170.908C74.6153 172.268 69.647 171.995 68.2964 171.977L68.1422 172.132C67.8089 172.96 67.968 174.781 67.996 175.754C70.1305 175.782 73.6629 175.328 75.4381 176.049C76.047 176.714 75.8988 176.403 75.9304 177.372L75.5751 177.738C73.7084 178.217 67.5964 178.006 65.2868 177.989C65.5212 174.309 65.3436 167.714 65.3488 163.838Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M82.0302 163.807C83.9278 163.566 87.1688 163.57 88.4054 165.176C88.3803 166.106 88.5179 165.801 87.9695 166.39C86.2477 166.902 80.9134 164.486 80.7128 167.903C81.9248 170.124 88.8048 170 89.2516 173.537C89.6568 176.744 86.7586 177.768 84.2836 178.198C82.7417 178.285 79.0288 178.026 78.1521 176.587C78.106 175.773 78.1861 175.654 78.5456 174.94C79.5497 174.659 86.1678 177.899 86.6056 174.069C85.4035 172.001 79.1238 172.205 78.2697 168.822C77.5194 165.851 79.5488 164.588 82.0302 163.807Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M80.6867 182.04C82.9542 181.867 87.0618 181.887 87.3746 184.914C86.3374 186.417 82.0095 183.441 79.8318 184.699C74.6034 187.719 77.6763 196.268 84.6167 193.56C85.1143 193.197 85.3717 193.087 85.9137 192.834C86.7807 192.91 86.4761 192.777 87.107 193.283C87.9983 197.026 80.6488 196.974 78.0483 195.486C76.3551 194.516 75.1367 192.89 74.6798 190.993C74.2079 189.094 74.519 187.085 75.543 185.418C76.8026 183.373 78.4696 182.548 80.6867 182.04Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M160.576 189.018C161.484 187.419 163.622 183.348 164.909 182.324C165.653 182.123 165.997 181.982 166.76 182.108C166.991 183.354 164.993 186.14 164.233 187.374C161.695 191.375 161.733 191.636 161.778 196.28L159.231 196.425C159.272 194.828 159.229 193.134 159.215 191.528C158.328 190.062 153.975 183.12 153.768 182.047C155.117 182.022 156.072 181.966 156.982 183.093C158.402 184.853 159.456 187.033 160.576 189.018Z"/><path fill="#FEFEFE" transform="scale(1.75556 1.75556)" d="M90.2317 163.979C92.6921 163.937 100.248 163.62 102.165 164.229L102.453 164.809C102.304 165.649 102.467 165.353 101.843 165.925C100.815 166.3 98.8965 166.101 97.7187 166.049L97.7072 174.062C97.7445 175.217 97.9473 177.033 97.361 177.928C96.6278 177.926 95.7234 178.021 95.1577 177.635C94.8184 176.149 94.9847 168.235 94.9936 166.103C93.7138 166.153 91.7753 166.423 90.7206 165.894C90.0751 165.15 90.2837 165.208 90.2317 163.979Z"/><path fill="#2D67AA" transform="scale(1.75556 1.75556)" d="M148.382 169.664L148.461 169.206L148.998 169.087C149.584 169.316 149.83 169.351 150.458 169.317L150.192 170.329C149.983 172.002 150.243 171.523 149.363 172.715L148.976 172.891C148.402 172.479 148.574 172.566 148.403 171.665C148.432 171.123 148.39 170.235 148.382 169.664Z"/></svg>
);

// --- Sub-components for Main App Structure ---

const Header = ({ user, onLogout, transparent = false }: { user: any, onLogout: () => void, transparent?: boolean }) => (
  <header className={`z-10 sticky top-0 transition-colors duration-300 ${transparent ? 'bg-transparent text-white' : 'bg-white shadow-sm text-gray-900'}`}>
    <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className={`relative ${transparent ? 'bg-white/20 p-1 rounded' : ''}`}>
             <WestbrookLogo className="w-10 h-10 rounded" />
        </div>
        <div>
          <h1 className={`text-lg font-black leading-none tracking-tight ${transparent ? 'text-white' : 'text-gray-900'}`}>WESTBROOK <span className={transparent ? 'text-white/80' : 'text-westbrook-orange'}>ACADEMY</span></h1>
          <p className={`text-[10px] uppercase tracking-widest font-medium ${transparent ? 'text-blue-100' : 'text-gray-500'}`}>Operated by LA Promise Fund</p>
        </div>
      </div>
      <button onClick={onLogout} className={`p-2 rounded-full ${transparent ? 'text-white/70 hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100'}`}>
        <LogOut size={20} />
      </button>
    </div>
  </header>
);

interface StudentCardProps {
  student: Student;
  status: StudentStatus;
  onStatusChange: (s: StudentStatus) => void;
  disabled: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, status, onStatusChange, disabled }) => {
  const isPresent = status === StudentStatus.ON_BUS || status === StudentStatus.DROPPED_OFF;
  
  return (
    <div className={`group relative p-4 rounded-2xl mb-3 flex items-center gap-4 transition-all duration-300 border overflow-hidden ${isPresent ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-100 shadow-sm'}`}>
      
      {/* Selection Highlight */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${isPresent ? 'bg-green-500' : 'bg-gray-200'}`}></div>

      <div className="relative">
        <img src={student.photoUrl} alt={student.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
        {isPresent && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                <Check size={10} strokeWidth={4} />
            </div>
        )}
      </div>

      <div className="flex-1">
        <h4 className={`font-bold text-base ${isPresent ? 'text-green-900' : 'text-gray-800'}`}>{student.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
           <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">ID: {student.id}</span>
           <span className="text-xs text-gray-400">Gr {student.grade}</span>
           {/* Helper tag to show if they are a guest (added) student */}
           {student.busId === 'GUEST' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">GUEST</span>}
        </div>
      </div>

      <button 
         disabled={disabled}
         onClick={() => onStatusChange(isPresent ? StudentStatus.PENDING : StudentStatus.ON_BUS)} 
         className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isPresent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-400'}`}
      >
         {isPresent ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-current"></div>}
      </button>
    </div>
  );
};

// --- Auth Components ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = () => {
    setLoading(true);

    if (isMsalConfigured) {
      // Real O365 Authentication
      instance.loginPopup(loginRequest)
        .then((response) => {
            console.log("Logged in:", response);
            // In a real app, you would validate response.account
            onLogin();
        })
        .catch((e) => {
            console.error("Login failed", e);
            setLoading(false);
            alert("Authentication failed. Please check console or try simulation.");
        });
    } else {
      // Fallback Simulation (If no Azure keys configured)
      console.warn("MSAL not configured. Using Simulation.");
      setTimeout(() => {
        setLoading(false);
        onLogin();
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-westbrook-blue flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-westbrook-orange/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

       <div className="relative z-10 w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
           <div className="flex justify-center mb-6">
              <WestbrookLogo className="w-24 h-24 shadow-xl transform -rotate-3" />
           </div>

           <div className="text-center mb-8">
             <h1 className="text-2xl font-bold mb-2">Westbrook Academy</h1>
             <p className="text-blue-200 text-sm">Staff & Transport Portal</p>
           </div>

           <button
             onClick={handleMicrosoftLogin}
             disabled={loading}
             className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3"
           >
              {loading ? (
                <Loader2 className="animate-spin text-gray-500" />
              ) : (
                <>
                  {/* Microsoft Logo SVG */}
                  <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  <span>Sign in with Microsoft 365</span>
                </>
              )}
           </button>
           
           <div className="mt-6 text-center">
              <p className="text-xs text-blue-300">Authorized personnel only.</p>
              {!isMsalConfigured ? (
                  <p className="text-[10px] text-yellow-300 mt-2 opacity-70">Dev Mode: Azure Keys Missing</p>
              ) : (
                  <p className="text-[10px] text-green-300 mt-2 opacity-70 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Azure AD Connected
                  </p>
              )}
           </div>
       </div>
    </div>
  );
};

const RoleSelectionScreen = ({ onSelect, onLogout }: { onSelect: (role: UserRole) => void, onLogout: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
    <div className="max-w-md w-full">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-4">
           <WestbrookLogo className="w-full h-full shadow-lg shadow-blue-200 rounded-xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome, Staff Member</h2>
        <p className="text-gray-500">Select an application to continue</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => onSelect(UserRole.DRIVER)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-westbrook-blue transition-all group text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-50 text-westbrook-blue rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <BusIcon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 group-hover:text-westbrook-blue transition-colors">Bus Tracker</h3>
            <p className="text-sm text-gray-500">Manage routes and student attendance</p>
          </div>
          <ChevronRight className="ml-auto text-gray-300 group-hover:text-westbrook-blue" />
        </button>

        <button
          onClick={() => onSelect(UserRole.ADMIN)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-westbrook-orange transition-all group text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-orange-50 text-westbrook-orange rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 group-hover:text-westbrook-orange transition-colors">Admin Dashboard</h3>
            <p className="text-sm text-gray-500">Monitor fleet status and reports</p>
          </div>
          <ChevronRight className="ml-auto text-gray-300 group-hover:text-westbrook-orange" />
        </button>
      </div>

      <button onClick={onLogout} className="mt-8 text-sm text-gray-400 hover:text-gray-600 w-full text-center">
        Sign Out
      </button>
    </div>
  </div>
);

// --- Main Application Component ---

export default function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // Internal state to track if we've passed the login screen (for simulation fallback)
  const [internalAuth, setInternalAuth] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.NONE);
  
  // Master Data State (Initialized from Mock, updated by PowerSchool)
  const [masterStudentList, setMasterStudentList] = useState<Student[]>(STUDENTS);

  // App States
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [routeType, setRouteType] = useState<RouteType>(RouteType.AM_PICKUP);
  
  const [tripActive, setTripActive] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false); // Loading state for GPS acquisition
  
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [guestStudents, setGuestStudents] = useState<Student[]>([]);
  
  // UI States
  const [showScanner, setShowScanner] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [manualId, setManualId] = useState("");
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [tripSummary, setTripSummary] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Trip Statistics State
  const [tripStats, setTripStats] = useState<{start: GeoPoint | null, end: GeoPoint | null}>({
    start: null,
    end: null
  });

  // Incident Form State
  const [incidentForm, setIncidentForm] = useState({
      type: 'Behavior',
      severity: 'Low',
      description: ''
  });

  // Watch ID for Geoloc
  const watchId = useRef<number | null>(null);

  // Derived state: Combine assigned students with any added guests
  const allManifestStudents = useMemo(() => {
    if (!selectedBus) return [];
    const assigned = masterStudentList.filter(s => s.busId === selectedBus.id);
    const guests = guestStudents.filter(g => !assigned.find(a => a.id === g.id));
    return [...assigned, ...guests];
  }, [selectedBus, guestStudents, masterStudentList]);

  // Derived state: Group students by check-in status
  const pendingStudents = useMemo(() => {
      return allManifestStudents.filter(s => !logs.find(l => l.studentId === s.id && (l.status === 'ON_BUS' || l.status === 'DROPPED_OFF')));
  }, [allManifestStudents, logs]);

  const boardedStudents = useMemo(() => {
      return allManifestStudents.filter(s => logs.find(l => l.studentId === s.id && (l.status === 'ON_BUS' || l.status === 'DROPPED_OFF')));
  }, [allManifestStudents, logs]);
  
  // LIVE TRACKING SYNC EFFECT
  useEffect(() => {
    if (tripActive && selectedBus) {
       const liveService = LiveTrackingService.getInstance();
       const state: LiveTripState = {
         busId: selectedBus.id,
         driverName: selectedBus.driverName,
         routeType: routeType,
         startTime: tripStats.start?.timestamp || new Date().toISOString(),
         lastUpdated: new Date().toISOString(),
         currentLocation: tripStats.start, // Initial loc, will update via watchPosition logic below
         logs: logs,
         studentCount: logs.filter(l => l.status === StudentStatus.ON_BUS).length,
         totalStudents: allManifestStudents.length,
         status: 'ACTIVE'
       };
       liveService.updateTripState(state);
    }
  }, [tripActive, logs, selectedBus, routeType, allManifestStudents.length]); 

  // GPS WATCHER during active trip
  useEffect(() => {
    if (tripActive && selectedBus) {
       if (navigator.geolocation) {
         watchId.current = navigator.geolocation.watchPosition(
           (pos) => {
             // Create updated GeoPoint
             const newPoint: GeoPoint = {
               lat: pos.coords.latitude,
               lng: pos.coords.longitude,
               timestamp: new Date().toISOString()
             };
             
             // Update the LiveService directly with new location
             const liveService = LiveTrackingService.getInstance();
             const currentData = liveService.getAllTrips();
             if (currentData[selectedBus.id]) {
               currentData[selectedBus.id].currentLocation = newPoint;
               currentData[selectedBus.id].lastUpdated = new Date().toISOString();
               liveService.updateTripState(currentData[selectedBus.id]);
             }
           },
           (err) => console.warn("GPS Watch Error", err),
           { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
         );
       }
    } else {
       if (watchId.current !== null) {
         navigator.geolocation.clearWatch(watchId.current);
         watchId.current = null;
       }
    }
    return () => {
       if (watchId.current !== null) {
         navigator.geolocation.clearWatch(watchId.current);
       }
    };
  }, [tripActive, selectedBus]);

  // Clear guests when bus changes
  useEffect(() => {
      setGuestStudents([]);
  }, [selectedBus]);

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (tripActive) {
        interval = setInterval(() => {
            setElapsedTime(prev => prev + 1000);
        }, 1000);
    } else {
        setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [tripActive]);

  // Sync Check Effect
  useEffect(() => {
      const checkSync = setInterval(async () => {
          const service = PowerSchoolService.getInstance();
          if (service.getLastSyncTime()) {
               const result = await service.syncStudents();
               setMasterStudentList(result.students);
          }
      }, 5000);
      return () => clearInterval(checkSync);
  }, []);

  const handleLogout = () => {
    if (isAuthenticated) {
        instance.logoutPopup().catch(e => console.error(e));
    }
    setInternalAuth(false);
    setUserRole(UserRole.NONE);
    setTripActive(false);
    setSelectedBus(null);
    setLogs([]);
    setGuestStudents([]);
    setReportSent(false);
  };

  const handleStartTrip = async () => {
    if (selectedBus) {
      setStartingTrip(true);
      const startLoc = await getCurrentLocation();
      setStartingTrip(false);

      setTripStats({
        start: startLoc,
        end: null
      });
      setTripActive(true);
      setIncidents([]);
      setReportSent(false);
      setTripSummary("");
    }
  };

  const handleCheckIn = (studentId: string, status: StudentStatus = StudentStatus.ON_BUS) => {
    const student = masterStudentList.find(s => s.id.toLowerCase() === studentId.toLowerCase() || s.name.toLowerCase().includes(studentId.toLowerCase()));
    
    if (!student) {
        alert("Student not found!");
        return;
    }

    const isAssigned = student.busId === selectedBus?.id;
    if (!isAssigned) {
        const alreadyGuest = guestStudents.find(g => g.id === student.id);
        
        if (!alreadyGuest) {
            if (!window.confirm(`⚠️ Student ${student.name} is assigned to ${student.busId}.\n\nAdd to this bus manifest?`)) {
                return;
            }
            setGuestStudents(prev => [student, ...prev]);
        }
    }

    if (logs.find(l => l.studentId === student.id && l.status === status)) return;

    const newLog: AttendanceLog = {
      studentId: student.id,
      status,
      timestamp: new Date().toISOString(),
      location: { lat: 0, lng: 0 }
    };
    
    setLogs(prev => [...prev, newLog]);
  };

  const handleEndTrip = async () => {
    setReportGenerating(true);
    
    const endLoc = await getCurrentLocation();
    const finalStats = { ...tripStats, end: endLoc };
    setTripStats(finalStats);

    if (selectedBus) {
      LiveTrackingService.getInstance().endTrip(selectedBus.id);
    }

    if (selectedBus) {
        const report = await generateTripReport(
            selectedBus, 
            routeType, 
            logs, 
            allManifestStudents,
            finalStats,
            incidents
        );
        setTripSummary(report);
        setReportSent(true);
        console.log("Sending to Teams channel:", report);
    }
    
    setTripActive(false);
    setReportGenerating(false);
  };

  const handleScan = (code: string) => {
    handleCheckIn(code);
    setShowScanner(false);
  };

  const handleIncidentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBus) return;

      const newIncident: Incident = {
          id: `INC-${Date.now()}`,
          busId: selectedBus.id,
          driverName: selectedBus.driverName,
          timestamp: new Date().toISOString(),
          type: incidentForm.type as any,
          severity: incidentForm.severity as any,
          description: incidentForm.description
      };

      setIncidents(prev => [...prev, newIncident]);
      setShowIncidentModal(false);
      setIncidentForm({ type: 'Behavior', severity: 'Low', description: '' });
      alert("Incident logged successfully.");
  };

  // --- RENDER LOGIC ---

  const isLoggedIn = isAuthenticated || internalAuth;

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setInternalAuth(true)} />;
  }

  if (userRole === UserRole.NONE) {
    return <RoleSelectionScreen onSelect={setUserRole} onLogout={handleLogout} />;
  }

  if (userRole === UserRole.ADMIN) {
    return (
      <>
        <Header user={{ name: accounts[0]?.name || "Admin" }} onLogout={handleLogout} />
        <Dashboard />
      </>
    );
  }

  // --- DRIVER VIEW ---

  const progressPercentage = allManifestStudents.length > 0 ? (logs.filter(l => l.status === StudentStatus.ON_BUS).length / allManifestStudents.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Dynamic Header */}
      {tripActive ? (
        <div className="bg-westbrook-blue text-white pt-4 pb-6 px-4 rounded-b-3xl shadow-lg sticky top-0 z-20">
             <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                     <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur">
                        <BusIcon size={20} />
                     </div>
                     <div>
                        <h2 className="font-bold leading-none">{selectedBus?.name}</h2>
                        <span className="text-[10px] opacity-80 uppercase tracking-wider">{routeType === RouteType.AM_PICKUP ? 'AM Pickup' : 'PM Dropoff'}</span>
                     </div>
                 </div>
                 <div className="text-right">
                     <div className="text-2xl font-mono font-bold leading-none">{formatDuration(elapsedTime)}</div>
                     <span className="text-[10px] opacity-80 uppercase flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        Live
                     </span>
                 </div>
             </div>

             {/* Progress Bar */}
             <div className="bg-black/20 rounded-full h-3 w-full overflow-hidden relative">
                 <div className="absolute top-0 left-0 bottom-0 bg-green-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
             </div>
             <div className="flex justify-between mt-1.5">
                 <span className="text-xs font-medium opacity-80">Progress</span>
                 <span className="text-xs font-bold">{logs.filter(l => l.status === StudentStatus.ON_BUS).length} / {allManifestStudents.length} Students</span>
             </div>
        </div>
      ) : (
        <Header user={{ name: accounts[0]?.name || "Driver" }} onLogout={handleLogout} />
      )}

      {/* VIEW 1: BUS SELECTION */}
      {!selectedBus ? (
          <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-xl font-bold mb-6 text-gray-800">Select Your Route</h2>
             
             {/* Route Toggle */}
             <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-8">
               <button 
                  onClick={() => setRouteType(RouteType.AM_PICKUP)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${routeType === RouteType.AM_PICKUP ? 'bg-westbrook-orange text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  AM Pickup
               </button>
               <button 
                  onClick={() => setRouteType(RouteType.PM_DROPOFF)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${routeType === RouteType.PM_DROPOFF ? 'bg-westbrook-orange text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                   PM Dropoff
               </button>
             </div>

             <div className="grid grid-cols-1 gap-4">
               {BUSES.map(bus => (
                 <button
                   key={bus.id}
                   onClick={() => setSelectedBus(bus)}
                   className="relative group w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-westbrook-blue transition-all active:scale-[0.98]"
                 >
                   <div className="w-14 h-14 bg-blue-50 text-westbrook-blue rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-westbrook-blue group-hover:text-white transition-colors shadow-inner">
                     {bus.id.split('-')[1]}
                   </div>
                   <div className="flex-1 text-left">
                     <h3 className="font-bold text-gray-900 text-lg">{bus.name}</h3>
                     <p className="text-xs text-gray-500">{bus.driverName}</p>
                     <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                       <MapPin size={12} />
                       <span className="truncate max-w-[180px]">{bus.endpointAddress}</span>
                     </div>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-westbrook-blue">
                       <ChevronRight size={18} />
                   </div>
                 </button>
               ))}
             </div>
          </div>
      ) : (
          /* VIEW 2: ACTIVE ROUTE DASHBOARD */
          <div className="max-w-md mx-auto p-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
             
             {!tripActive && (
               <div className="mb-6 sticky top-20 z-10">
                    {/* Pre-Trip Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => setSelectedBus(null)} className="flex items-center gap-1 text-gray-500 font-medium">
                            <ChevronRight className="rotate-180" size={16} /> Back
                        </button>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">Pre-Trip Mode</span>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedBus.name}</h2>
                        <p className="text-gray-500 mb-6">{selectedBus.endpointAddress}</p>
                        
                        <button
                            onClick={handleStartTrip}
                            disabled={startingTrip}
                            className="w-full bg-westbrook-blue text-white py-4 rounded-2xl shadow-lg shadow-blue-200 font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            {startingTrip ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Starting Engines...
                                </>
                            ) : (
                                <>
                                    <Navigation /> START TRIP
                                </>
                            )}
                        </button>
                    </div>
               </div>
             )}

             {/* Student Lists - Grouped */}
             <div className="space-y-6">
                
                {/* Pending List */}
                {pendingStudents.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                             Pending Boarding 
                             <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{pendingStudents.length}</span>
                        </h3>
                        {pendingStudents.map(student => (
                            <StudentCard 
                                key={student.id} 
                                student={student}
                                status={StudentStatus.PENDING}
                                onStatusChange={(s) => handleCheckIn(student.id, s)}
                                disabled={false} // Always enabled to allow pre-checkin
                            />
                        ))}
                    </div>
                )}

                {/* Empty State if All Boarded */}
                {pendingStudents.length === 0 && allManifestStudents.length > 0 && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-green-800 font-bold">All Aboard!</h3>
                        <p className="text-green-600 text-xs">Every assigned student is checked in.</p>
                    </div>
                )}

                {/* Boarded List (Collapsible visually by being below) */}
                {boardedStudents.length > 0 && (
                    <div className="opacity-80">
                         <div className="flex items-center gap-4 my-4">
                             <div className="h-px bg-gray-200 flex-1"></div>
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Boarded ({boardedStudents.length})</span>
                             <div className="h-px bg-gray-200 flex-1"></div>
                         </div>
                         {boardedStudents.map(student => {
                            const log = logs.find(l => l.studentId === student.id);
                            return (
                                <StudentCard 
                                    key={student.id} 
                                    student={student}
                                    status={log ? log.status : StudentStatus.ON_BUS}
                                    onStatusChange={(s) => handleCheckIn(student.id, s)}
                                    disabled={false} 
                                />
                            );
                         })}
                    </div>
                )}

                {/* Initial Empty State */}
                {allManifestStudents.length === 0 && (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-100">
                        <UserPlus className="mx-auto mb-2 opacity-30" size={32} />
                        <p className="font-medium">No students assigned.</p>
                        <p className="text-xs mt-1">Add guest students using search.</p>
                    </div>
                )}
             </div>
          </div>
      )}

      {/* --- FLOATING BOTTOM ACTION BAR (Active Trip Only) --- */}
      {tripActive && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent z-40">
               <div className="max-w-md mx-auto flex items-center gap-3">
                   {/* Main Scan Button */}
                   <button 
                      onClick={() => setShowScanner(true)}
                      className="flex-1 bg-gray-900 text-white h-16 rounded-2xl shadow-xl flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-transform"
                   >
                       <QrCode size={24} /> SCAN ID
                   </button>
                   
                   {/* Secondary Actions */}
                   <button 
                      onClick={() => setShowSearchModal(true)}
                      className="w-16 h-16 bg-white text-gray-700 border border-gray-100 rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                   >
                       <Search size={24} />
                   </button>
                   
                   <button 
                      onClick={() => setShowIncidentModal(true)}
                      className="w-16 h-16 bg-white text-red-500 border border-gray-100 rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                   >
                       <AlertTriangle size={24} />
                   </button>

                   <button 
                      onClick={handleEndTrip}
                      className="w-16 h-16 bg-red-100 text-red-600 border border-red-200 rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                   >
                       <Square fill="currentColor" size={20} />
                   </button>
               </div>
          </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Scanner Modal */}
      {showScanner && (
        <Scanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Manual Search Modal */}
      {showSearchModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
               <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg">Manual Check-In</h3>
                       <button onClick={() => setShowSearchModal(false)}><X size={20} className="text-gray-400" /></button>
                   </div>
                   <input 
                      autoFocus
                      type="text" 
                      placeholder="Enter Student Name or ID..." 
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-westbrook-blue focus:ring-2 focus:ring-blue-100"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                   />
                   <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => setShowSearchModal(false)} className="py-3 font-bold text-gray-500">Cancel</button>
                       <button 
                          onClick={() => {
                              if(manualId) {
                                  handleCheckIn(manualId);
                                  setManualId("");
                                  setShowSearchModal(false);
                              }
                          }}
                          className="py-3 bg-westbrook-blue text-white rounded-xl font-bold shadow-md"
                       >
                           Check In
                       </button>
                   </div>
               </div>
          </div>
      )}

      {/* Incident Modal */}
      {showIncidentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <Siren className="text-red-500" /> Report Incident
                      </h3>
                      <button onClick={() => setShowIncidentModal(false)} className="p-2 bg-gray-100 rounded-full">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleIncidentSubmit}>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                              <div className="grid grid-cols-2 gap-2">
                                  {['Behavior', 'Mechanical', 'Medical', 'Delay'].map(t => (
                                      <button
                                        type="button"
                                        key={t}
                                        onClick={() => setIncidentForm({...incidentForm, type: t})}
                                        className={`py-2 text-sm rounded-lg font-medium border ${incidentForm.type === t ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                      >
                                          {t}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Severity</label>
                              <div className="flex bg-gray-100 p-1 rounded-lg">
                                  {['Low', 'Medium', 'High'].map(s => (
                                      <button
                                        type="button"
                                        key={s}
                                        onClick={() => setIncidentForm({...incidentForm, severity: s})}
                                        className={`flex-1 py-1 text-sm rounded-md transition-all ${incidentForm.severity === s ? 'bg-white shadow text-gray-800 font-bold' : 'text-gray-400'}`}
                                      >
                                          {s}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                              <textarea 
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-westbrook-blue"
                                  rows={3}
                                  placeholder="Describe what happened..."
                                  value={incidentForm.description}
                                  onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})}
                                  required
                              />
                          </div>
                      </div>
                      
                      <button 
                        type="submit"
                        className="w-full bg-red-600 text-white font-bold py-4 rounded-xl mt-6 shadow-lg shadow-red-200"
                      >
                          Submit Report
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Report Loading / Success Modal */}
      {(reportGenerating || reportSent) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
             {reportGenerating ? (
                <div className="text-center py-8">
                    <Loader2 size={48} className="animate-spin text-westbrook-orange mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800">Ending Trip...</h3>
                    <p className="text-gray-500 mt-2">Generating Microsoft Teams Report</p>
                </div>
             ) : (
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Trip Complete!</h3>
                    <p className="text-sm text-gray-500 mb-6">Report sent to #Transport-Log</p>
                    
                    <div className="bg-gray-50 rounded-xl p-4 text-left max-h-48 overflow-y-auto border border-gray-100 mb-6">
                        <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans">{tripSummary}</pre>
                    </div>

                    <button 
                      onClick={() => { setReportSent(false); setSelectedBus(null); }}
                      className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl"
                    >
                        Return to Home
                    </button>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}