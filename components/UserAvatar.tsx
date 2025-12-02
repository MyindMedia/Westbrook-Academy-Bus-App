
import React, { useEffect, useState } from 'react';
import { useMsal } from "@azure/msal-react";
import { getGraphToken, getGraphProfilePhoto } from '../services/graphService';
import { User, LogOut } from 'lucide-react';

interface UserAvatarProps {
    isDevMode?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showLogout?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ isDevMode = false, size = 'md', showLogout = true }) => {
    const { instance, accounts } = useMsal();
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [name, setName] = useState<string>("User");
    const [isOpen, setIsOpen] = useState(false);

    const user = accounts[0];

    useEffect(() => {
        if (isDevMode) {
            setName("Dev User");
            setPhotoUrl("https://picsum.photos/200"); // Random avatar for dev mode
            return;
        }

        if (user) {
            setName(user.name || "User");
            
            const fetchPhoto = async () => {
                const token = await getGraphToken(instance, accounts);
                if (token) {
                    const url = await getGraphProfilePhoto(token);
                    if (url) setPhotoUrl(url);
                }
            };
            fetchPhoto();
        }
    }, [user, instance, accounts, isDevMode]);

    const handleLogout = () => {
        if (isDevMode) {
            window.location.reload();
        } else {
            instance.logoutRedirect().catch(e => console.error(e));
        }
    };

    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base"
    };

    // Get initials
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 focus:outline-none hover:opacity-90 transition-opacity"
            >
                <div className="text-right hidden sm:block">
                    <p className={`font-bold leading-tight ${size === 'lg' ? 'text-gray-900' : 'text-inherit'}`}>{name}</p>
                    {isDevMode && <span className="text-[10px] opacity-70 uppercase tracking-wider font-medium">Dev Mode</span>}
                </div>
                
                <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/30 shadow-sm flex items-center justify-center bg-gray-600 text-white relative`}>
                    {photoUrl ? (
                        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold tracking-widest">{initials}</span>
                    )}
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && showLogout && (
                <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3 sm:hidden">
                             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs">
                                {initials}
                             </div>
                             <div className="overflow-hidden">
                                <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
                             </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-medium flex items-center gap-2"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserAvatar;
