

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest, isMsalConfigured } from "./services/authConfig";
import { UserRole, RouteType, Student, StudentStatus, Bus, AttendanceLog, GeoPoint, Incident } from './types';
import { BUSES, STUDENTS, getStudentById } from './services/mockData';
import { generateTripReport } from './services/geminiService';
import { PowerSchoolService } from './services/powerSchool';
import { LiveTrackingService, LiveTripState } from './services/liveTracking';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import UserAvatar from './components/UserAvatar';
import StudentSearchModal from './components/StudentSearchModal';
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
  Check,
  ShieldAlert,
  Terminal,
  MousePointerClick,
  Copy,
  Settings,
  HelpCircle
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

// --- Components ---

const LoginScreen: React.FC<{ onLogin: () => void, onBypass: () => void }> = ({ onLogin, onBypass }) => {
  const [error, setError] = useState<string | null>(null);
  const [azureErrorDetails, setAzureErrorDetails] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const handleLogin = async () => {
    setError(null);
    setAzureErrorDetails(null);
    try {
      await onLogin();
    } catch (e: any) {
      console.error("Login Failed", e);
      let errorMessage = "Login failed. Please check your credentials.";
      let detail = e.message || JSON.stringify(e);
      
      if (e.errorCode === 'invalid_request') {
        errorMessage = "Azure Configuration Error: Platform Mismatch";
        detail = "The 'Redirect URI' is likely registered under the 'Web' platform in Azure. It MUST be registered under 'Single-page application'.";
      } else if (e.name === 'BrowserAuthError') {
        errorMessage = "Browser Auth Error";
      }
      
      setError(errorMessage);
      setAzureErrorDetails(detail);
      setShowConfig(true); // Auto show config on error
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-westbrook-blue opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-westbrook-orange opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg z-10 border border-gray-100 relative">
        <div className="flex flex-col items-center mb-10">
          <WestbrookLogo className="w-24 h-24 mb-6 shadow-sm rounded-full bg-white p-1" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight text-center">Westbrook Academy</h1>
          <p className="text-gray-500 mt-2 text-center text-sm font-medium uppercase tracking-wider">Transportation Command Center</p>
        </div>
        
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-3 text-red-700 font-bold text-sm">
                    <ShieldAlert size={18} />
                    {error}
                </div>
                {azureErrorDetails && (
                   <div className="text-xs text-red-600 bg-red-100/50 p-3 rounded-lg font-mono break-all leading-relaxed">
                      {azureErrorDetails}
                   </div>
                )}
            </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button 
            onClick={handleLogin}
            className="w-full bg-[#2F2F2F] text-white py-4 rounded-xl hover:bg-black transition-all font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95"
          >
            <img src="https://learn.microsoft.com/en-us/azure/active-directory/develop/media/howto-add-branding-in-azure-ad-apps/ms-symbollockup_mssymbol_19.png" alt="Microsoft" className="w-5 h-5" />
            Sign in with Microsoft 365
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold tracking-widest">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button 
            onClick={onBypass}
            className="w-full bg-white text-gray-700 border-2 border-gray-100 py-3.5 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all font-bold text-sm flex items-center justify-center gap-2 group"
          >
             <Terminal size={18} className="text-gray-400 group-hover:text-gray-600" />
             Launch Dev Mode
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex justify-center">
             <button 
               onClick={() => setShowConfig(!showConfig)}
               className="text-xs text-gray-400 hover:text-westbrook-blue flex items-center gap-1.5 transition-colors"
             >
                {showConfig ? <X size={12}/> : <Settings size={12}/>}
                {showConfig ? "Hide Configuration" : "Troubleshoot Configuration"}
             </button>
        </div>

        {/* Debugging Configuration Panel */}
        {showConfig && (
            <div className="mt-6 pt-6 border-t border-dashed border-gray-200 animate-in slide-in-from-top-4 fade-in duration-300">
               <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <HelpCircle size={14} className="text-westbrook-orange" />
                  Azure Setup Guide
               </h3>
               
               <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-blue-500 uppercase">Required Platform</span>
                          <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded text-blue-700 border border-blue-200">SPA</span>
                      </div>
                      <p className="text-xs text-blue-800 leading-relaxed mb-3">
                         Go to <b>App Registrations</b> &gt; <b>Authentication</b>. If you see "Web", delete it. Click "Add a platform" and choose <b>Single-page application</b>.
                      </p>
                  </div>

                   <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                      <h4 className="text-[10px] font-bold text-yellow-600 uppercase mb-2">Redirect URI to Copy</h4>
                      <div className="flex items-center gap-2 bg-white border border-yellow-200 rounded-lg p-2">
                          <code className="text-xs font-mono text-gray-600 break-all flex-1">
                             {redirectUri}
                          </code>
                          <button 
                             onClick={() => navigator.clipboard.writeText(redirectUri)}
                             className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                             title="Copy to clipboard"
                          >
                             <Copy size={14} />
                          </button>
                      </div>
                      <p className="text-[10px] text-yellow-600 mt-2 opacity-80">
                         *Paste this EXACT URL into the Redirect URIs list in Azure.
                      </p>
                  </div>
               </div>
            </div>
        )}
      </div>
      
      <div className="absolute bottom-6 text-gray-400 text-xs font-medium">
         © {new Date().getFullYear()} Westbrook Academy Transportation Dept.
      </div>
    </div>
  );
};

// --- Main App Component ---

const AppContent: React.FC<{ isDevMode: boolean }> = ({ isDevMode }) => {
  const { instance } = useMsal();
  
  // STATE
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  const [selectedBusId, setSelectedBusId] = useState<string>("");
  const [routeType, setRouteType] = useState<RouteType>(RouteType.AM_PICKUP);
  const [tripActive, setTripActive] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  
  const [tripLogs, setTripLogs] = useState<AttendanceLog[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tripStartLocation, setTripStartLocation] = useState<GeoPoint | null>(null);
  const [tripEndLocation, setTripEndLocation] = useState<GeoPoint | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);

  // UI STATE
  const [showScanner, setShowScanner] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string>("");

  const liveService = LiveTrackingService.getInstance();
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Derived State ---
  const currentBus = BUSES.find(b => b.id === selectedBusId);
  const assignedStudents = useMemo(() => {
     return STUDENTS.filter(s => s.busId === selectedBusId);
  }, [selectedBusId]);

  // Combined list of all students involved in this trip (assigned + ad-hoc added)
  const allTripStudents = useMemo(() => {
    // Start with assigned
    const map = new Map<string, Student>();
    assignedStudents.forEach(s => map.set(s.id, s));
    
    // Add any from logs that aren't assigned (Ad-hoc adds)
    tripLogs.forEach(log => {
        if (!map.has(log.studentId)) {
            const student = getStudentById(log.studentId);
            if (student) map.set(student.id, student);
        }
    });
    
    return Array.from(map.values());
  }, [assignedStudents, tripLogs]);

  const boardedStudents = useMemo(() => {
    return allTripStudents.filter(s => {
        const log = tripLogs.find(l => l.studentId === s.id);
        return log && log.status === StudentStatus.ON_BUS;
    });
  }, [allTripStudents, tripLogs]);

  const pendingStudents = useMemo(() => {
    return allTripStudents.filter(s => {
        const log = tripLogs.find(l => l.studentId === s.id);
        // Only show pending if they were originally assigned. Ad-hoc students appear when added.
        return (!log || log.status === StudentStatus.PENDING) && s.busId === selectedBusId;
    });
  }, [allTripStudents, tripLogs, selectedBusId]);

  // --- Effects ---

  // Location Polling during Trip
  useEffect(() => {
    if (tripActive && selectedBusId) {
        locationInterval.current = setInterval(async () => {
            const loc = await getCurrentLocation();
            if (loc) {
                setCurrentLocation(loc);
                
                // Update Live Tracking Service
                liveService.updateTripState({
                    busId: selectedBusId,
                    driverName: currentBus?.driverName || 'Unknown',
                    routeType,
                    startTime: tripStartTime?.toISOString() || new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    currentLocation: loc,
                    logs: tripLogs,
                    studentCount: tripLogs.filter(l => l.status === StudentStatus.ON_BUS).length,
                    totalStudents: allTripStudents.length,
                    status: 'ACTIVE'
                });
            }
        }, 5000); // 5 seconds
    } else {
        if (locationInterval.current) clearInterval(locationInterval.current);
    }
    return () => {
        if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [tripActive, selectedBusId, routeType, tripLogs, allTripStudents]);


  // --- Handlers ---

  const handleStartTrip = async () => {
    const loc = await getCurrentLocation();
    setTripStartLocation(loc);
    setTripStartTime(new Date());
    setTripActive(true);
    setTripLogs([]);
    setIncidents([]);
  };

  const handleEndTrip = async () => {
    const loc = await getCurrentLocation();
    setTripEndLocation(loc);
    setTripActive(false);
    
    // Stop Live Tracking
    liveService.endTrip(selectedBusId);

    // Generate Report
    setLoadingReport(true);
    const report = await generateTripReport(
      currentBus!,
      routeType,
      tripLogs,
      allTripStudents,
      { start: tripStartLocation, end: loc },
      incidents
    );
    setGeneratedReport(report);
    setLoadingReport(false);
  };

  const handleScan = async (studentId: string) => {
    setShowScanner(false);
    // Find student
    const student = getStudentById(studentId);
    
    if (student) {
        // Validate Bus Assignment (Warning only for ad-hoc)
        if (student.busId !== selectedBusId) {
             // In real app, might ask for confirmation. For now, we allow adding them (Ad-Hoc)
             // but maybe show a different toast
             console.log("Ad-hoc boarding");
        }

        const loc = await getCurrentLocation();
        
        // Toggle Status logic (On Bus vs Off Bus)
        const existingLogIndex = tripLogs.findIndex(l => l.studentId === studentId);
        let newStatus = StudentStatus.ON_BUS;
        
        if (existingLogIndex >= 0) {
            // If already on bus, mark as dropped off
            if (tripLogs[existingLogIndex].status === StudentStatus.ON_BUS) {
                newStatus = StudentStatus.DROPPED_OFF;
            }
        }

        const newLog: AttendanceLog = {
            studentId: student.id,
            status: newStatus,
            timestamp: new Date().toISOString(),
            location: loc || { lat: 0, lng: 0 }
        };

        // Update Logs
        setTripLogs(prev => {
            const filtered = prev.filter(l => l.studentId !== studentId);
            return [...filtered, newLog];
        });

        setScannedStudent(student);
        setTimeout(() => setScannedStudent(null), 3000); // Clear toast
    } else {
        alert("Student ID not found in local manifest.");
    }
  };

  const handleManualCheckIn = (student: Student) => {
      handleScan(student.id);
  };

  const handleAddStudentFromSearch = (student: Student) => {
      setShowSearchModal(false);
      handleScan(student.id); // Re-use scan logic to add them to log
  };

  const handleReportIncident = (type: Incident['type'], desc: string, severity: Incident['severity']) => {
      const newIncident: Incident = {
          id: Math.random().toString(36).substr(2, 9),
          busId: selectedBusId,
          driverName: currentBus?.driverName || "Unknown",
          timestamp: new Date().toISOString(),
          type,
          description: desc,
          severity
      };
      setIncidents([...incidents, newIncident]);
      setShowIncidentModal(false);
  };

  // --- Renders ---

  // 1. Role Selection
  if (role === UserRole.NONE) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-md space-y-8">
                  <div className="text-center">
                       <WestbrookLogo className="w-20 h-20 mx-auto mb-4" />
                       <h2 className="text-3xl font-black text-gray-900">Welcome</h2>
                       <p className="text-gray-500">Select your workspace to continue</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => setRole(UserRole.DRIVER)}
                        className="group relative flex items-center p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-westbrook-blue transition-all shadow-sm hover:shadow-lg text-left"
                      >
                          <div className="p-4 bg-blue-50 text-westbrook-blue rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                              <BusIcon size={32} />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-gray-900">Driver App</h3>
                              <p className="text-sm text-gray-500">Route management & Check-in</p>
                          </div>
                      </button>

                      <button 
                        onClick={() => setRole(UserRole.ADMIN)}
                        className="group relative flex items-center p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-westbrook-orange transition-all shadow-sm hover:shadow-lg text-left"
                      >
                          <div className="p-4 bg-orange-50 text-westbrook-orange rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                              <ShieldAlert size={32} />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-gray-900">Admin Console</h3>
                              <p className="text-sm text-gray-500">Live fleet tracking & Reports</p>
                          </div>
                      </button>
                  </div>

                  <div className="pt-8 text-center">
                    <button 
                      onClick={() => {
                          if (isDevMode) window.location.reload();
                          else instance.logoutRedirect();
                      }}
                      className="text-gray-400 text-sm hover:text-red-500 font-medium flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                  </div>
              </div>
          </div>
      );
  }

  // 2. Admin Dashboard
  if (role === UserRole.ADMIN) {
      return (
        <div className="relative">
             <button 
                onClick={() => setRole(UserRole.NONE)}
                className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-black transition-colors"
                title="Exit Admin Mode"
             >
                 <LogOut size={20} />
             </button>
             <Dashboard isDevMode={isDevMode} />
        </div>
      );
  }

  // 3. Driver App Flow
  
  // 3a. Trip Setup (Bus Selection)
  if (!selectedBusId) {
      return (
          <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <button onClick={() => setRole(UserRole.NONE)} className="text-gray-500 hover:text-gray-900">
                    <ChevronRight className="rotate-180" /> Back
                </button>
                <WestbrookLogo className="w-10 h-10" />
              </div>

              <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900">Select Your Bus</h1>
                <p className="text-gray-500">Choose the vehicle for today's route.</p>
              </div>

              <div className="space-y-3">
                  {BUSES.map(bus => (
                      <button 
                        key={bus.id}
                        onClick={() => setSelectedBusId(bus.id)}
                        className="w-full p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-westbrook-blue hover:shadow-md transition-all group text-left"
                      >
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  {bus.id.split('-')[1]}
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-900">{bus.name}</h3>
                                  <p className="text-xs text-gray-500">{bus.driverName}</p>
                              </div>
                          </div>
                          <ChevronRight className="text-gray-300" />
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  // 3b. Route Config (AM/PM)
  if (!tripActive && !generatedReport) {
      return (
          <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => setSelectedBusId("")} className="text-gray-500 hover:text-gray-900">
                        <ChevronRight className="rotate-180" /> Change Bus
                    </button>
                     {/* Driver Header with Avatar */}
                     <UserAvatar isDevMode={isDevMode} size="sm" />
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 text-center">
                    <h2 className="text-4xl font-black text-westbrook-blue mb-2">{selectedBusId}</h2>
                    <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Vehicle Ready</p>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 ml-2">Select Route Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setRouteType(RouteType.AM_PICKUP)}
                            className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                routeType === RouteType.AM_PICKUP 
                                ? 'border-westbrook-blue bg-blue-50 text-westbrook-blue' 
                                : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                            }`}
                        >
                            <span className="text-lg font-black">AM</span>
                            <span className="text-xs font-bold">Pickup</span>
                        </button>
                        <button 
                            onClick={() => setRouteType(RouteType.PM_DROPOFF)}
                            className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                routeType === RouteType.PM_DROPOFF 
                                ? 'border-westbrook-orange bg-orange-50 text-westbrook-orange' 
                                : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                            }`}
                        >
                            <span className="text-lg font-black">PM</span>
                            <span className="text-xs font-bold">Dropoff</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 bg-white p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-600">Manifest Preview</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{assignedStudents.length} Students</span>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden py-2">
                        {assignedStudents.slice(0, 6).map(s => (
                            <img key={s.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src={s.photoUrl} alt=""/>
                        ))}
                        {assignedStudents.length > 6 && (
                            <div className="h-8 w-8 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                +{assignedStudents.length - 6}
                            </div>
                        )}
                    </div>
                </div>
              </div>

              <button 
                onClick={handleStartTrip}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                  <Navigation size={20} />
                  Start Route
              </button>
          </div>
      );
  }

  // 3c. Active Trip View
  if (tripActive) {
      return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Top Bar */}
            <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 flex justify-between items-center z-20">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-westbrook-blue text-white rounded-full flex items-center justify-center font-bold text-sm">
                         {selectedBusId.split('-')[1]}
                     </div>
                     <div>
                         <h2 className="font-bold text-gray-900 leading-tight">
                             {routeType === RouteType.AM_PICKUP ? 'AM Pickup' : 'PM Dropoff'}
                         </h2>
                         <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                             Live Tracking
                         </p>
                     </div>
                 </div>
                 
                 {/* Replaced Logout with UserAvatar */}
                 <div className="flex items-center gap-2">
                    <UserAvatar isDevMode={isDevMode} size="sm" showLogout={false} />
                    <button 
                        onClick={() => setShowIncidentModal(true)}
                        className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                    >
                        <AlertTriangle size={20} />
                    </button>
                 </div>
            </div>

            {/* Scrollable List Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
                
                {/* To Board Section */}
                {pendingStudents.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
                            To Board ({pendingStudents.length})
                        </h3>
                        <div className="space-y-3">
                            {pendingStudents.map(student => (
                                <div key={student.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={student.photoUrl} className="w-10 h-10 rounded-full object-cover bg-gray-100" alt="" />
                                        <div>
                                            <p className="font-bold text-gray-800">{student.name}</p>
                                            <p className="text-xs text-gray-400">Grade {student.grade}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleManualCheckIn(student)}
                                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-100 hover:text-green-700 transition-colors"
                                    >
                                        Check In
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Boarded Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1 flex justify-between">
                        <span>On Board ({boardedStudents.length})</span>
                        {boardedStudents.length > 0 && <CheckCircle2 size={14} className="text-green-500" />}
                    </h3>
                    
                    {boardedStudents.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-400">No students checked in yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                             {boardedStudents.map(student => (
                                <div key={student.id} className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3 opacity-80">
                                        <img src={student.photoUrl} className="w-10 h-10 rounded-full object-cover grayscale" alt="" />
                                        <div>
                                            <p className="font-bold text-green-900 line-through decoration-green-500/50">{student.name}</p>
                                            <p className="text-xs text-green-700">On Board • {new Date(tripLogs.find(l=>l.studentId===student.id)?.timestamp || '').toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                            {student.busId !== selectedBusId && <span className="ml-1 text-[10px] bg-orange-200 text-orange-800 px-1 rounded">AD-HOC</span>}
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-green-700" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Sticky Action Bar */}
            <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30">
                 {/* Progress Bar */}
                 <div className="w-full h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${allTripStudents.length > 0 ? (boardedStudents.length / allTripStudents.length) * 100 : 0}%` }}
                    ></div>
                 </div>

                 <div className="grid grid-cols-4 gap-2">
                     <button 
                        onClick={() => setShowScanner(true)}
                        className="col-span-2 bg-westbrook-blue text-white h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                     >
                         <QrCode size={20} />
                         Scan ID
                     </button>
                     <button 
                        onClick={() => setShowSearchModal(true)}
                        className="col-span-1 bg-gray-100 text-gray-700 h-14 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-gray-200"
                     >
                        <UserPlus size={18} />
                        Add
                     </button>
                     <button 
                        onClick={handleEndTrip}
                        className="col-span-1 bg-gray-100 text-red-600 h-14 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-red-50"
                     >
                        <Square size={18} fill="currentColor" />
                        End
                     </button>
                 </div>
            </div>

            {/* Modals */}
            {showScanner && (
                <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}

            {showSearchModal && (
                <StudentSearchModal onClose={() => setShowSearchModal(false)} onAddStudent={handleAddStudentFromSearch} />
            )}

            {scannedStudent && (
                 <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 z-50">
                    <div className="bg-green-500 p-2 rounded-full">
                        <Check size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-lg">{scannedStudent.name}</p>
                        <p className="text-xs text-gray-300 uppercase font-bold tracking-wider">Successfully Boarded</p>
                    </div>
                 </div>
            )}

            {showIncidentModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
                    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" /> Report Incident
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {['Behavior', 'Medical', 'Delay', 'Mechanical'].map(type => (
                                <button 
                                    key={type}
                                    onClick={() => handleReportIncident(type as any, `Reported via App`, 'Medium')}
                                    className="p-4 rounded-xl bg-gray-50 border border-gray-100 font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowIncidentModal(false)} className="w-full py-3 bg-gray-100 rounded-xl font-bold text-gray-500">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // 3d. Trip Summary Report
  if (generatedReport) {
      return (
          <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
              <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-gray-100 bg-green-50">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="bg-green-100 p-2 rounded-full text-green-700">
                              <CheckCircle2 size={24} />
                          </div>
                          <h1 className="text-2xl font-black text-green-900">Trip Complete</h1>
                      </div>
                      <p className="text-green-700 opacity-80 pl-1">Report generated successfully.</p>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                      <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 leading-relaxed">{generatedReport}</pre>
                      </div>
                  </div>
              </div>

              <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black"
              >
                  Start New Route
              </button>
          </div>
      );
  }

  // Loading State (Report Gen)
  if (loadingReport) {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-50"></div>
                  <div className="bg-blue-50 p-6 rounded-full relative z-10">
                      <Loader2 size={48} className="text-westbrook-blue animate-spin" />
                  </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Generating Report</h2>
              <p className="text-gray-500 max-w-xs mx-auto">Analyzing attendance logs and creating Teams summary with Gemini AI...</p>
          </div>
      );
  }

  return <div>Unknown State</div>;
}

// --- Root App Wrapper ---

function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Basic auto-login attempt if not authenticated and not in dev mode
    // (Optional: usually better to let user click login)
  }, [isAuthenticated, isDevMode]);

  const handleLogin = async () => {
      await instance.loginPopup(loginRequest);
  };

  if (!isAuthenticated && !isDevMode) {
      return <LoginScreen onLogin={handleLogin} onBypass={() => setIsDevMode(true)} />;
  }

  return <AppContent isDevMode={isDevMode} />;
}

export default App;