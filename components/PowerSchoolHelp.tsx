import React from 'react';
import { X, ExternalLink, ShieldCheck, Key, Settings } from 'lucide-react';
import PowerSchoolConnect from './PowerSchoolConnect';

interface PowerSchoolHelpProps {
  onClose: () => void;
}

const PowerSchoolHelp: React.FC<PowerSchoolHelpProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <div className="flex items-center gap-3">
               <div className="bg-blue-100 p-2 rounded-xl text-westbrook-blue">
                   <Settings size={24} />
               </div>
               <div>
                   <h2 className="text-xl font-bold text-gray-900">PowerSchool API Setup</h2>
                   <p className="text-xs text-gray-500">Step-by-step connection guide</p>
               </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
               <X size={20} className="text-gray-500" />
           </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
            
            {/* Action Section */}
            <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-blue-900 font-bold mb-2">Connect Your Account</h3>
                <p className="text-blue-800 text-sm mb-4">
                    Click below to initiate the OAuth handshake with the Westbrook PowerSchool instance.
                </p>
                <PowerSchoolConnect />
            </section>

            <section>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="bg-gray-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                    Enable Data Access
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    You must install a <b>Plugin</b> in your PowerSchool SIS instance to allow this application to read student transportation data.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Log in to the <b>PowerSchool Admin Console</b>.</li>
                        <li>Navigate to <b>System</b> &gt; <b>System Settings</b>.</li>
                        <li>Click on <b>Plugin Management Configuration</b>.</li>
                        <li>Click <b>Install</b> and upload the <code className="bg-gray-200 px-1 rounded text-xs">Westbrook_Bus_Plugin.xml</code> file.</li>
                        <li>Once installed, ensure the checkbox next to the plugin is <b>Checked (Enabled)</b>.</li>
                    </ol>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="bg-gray-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                    Configuration Values
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-100 rounded-xl p-4">
                        <ShieldCheck className="text-green-500 mb-2" size={24} />
                        <h4 className="font-bold text-gray-800 text-sm">Client ID</h4>
                        <code className="text-[10px] text-gray-500 mt-1 block break-all">38ea32b7-691b...</code>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-4">
                        <Key className="text-blue-500 mb-2" size={24} />
                        <h4 className="font-bold text-gray-800 text-sm">Client Secret</h4>
                        <code className="text-[10px] text-gray-500 mt-1 block break-all">b8a16e05-0e89...</code>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="bg-gray-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                    Connection URL
                </h3>
                <code className="block bg-gray-900 text-white p-3 rounded-lg font-mono text-xs">
                    https://lapf.powerschool.com
                </code>
            </section>

        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default PowerSchoolHelp;