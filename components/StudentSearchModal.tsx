import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Loader2, X } from 'lucide-react';
import { PowerSchoolService } from '../services/powerSchool';
import { Student } from '../types';

interface StudentSearchModalProps {
  onClose: () => void;
  onAddStudent: (student: Student) => void;
}

const StudentSearchModal: React.FC<StudentSearchModalProps> = ({ onClose, onAddStudent }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  
  const psService = PowerSchoolService.getInstance();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setSearching(true);
        try {
            const data = await psService.searchStudents(query);
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-full">
                <Search size={20} className="text-gray-500" />
            </div>
            <input 
                autoFocus
                type="text" 
                placeholder="Search database by name or ID..." 
                className="flex-1 text-lg outline-none bg-transparent placeholder-gray-400 font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} className="text-gray-500" />
            </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 min-h-[200px] bg-gray-50">
            {searching ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <span className="text-xs font-bold">Searching PowerSchool...</span>
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-2">
                    {results.map(student => (
                        <div key={student.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                             <div className="flex items-center gap-3">
                                 <img src={student.photoUrl} className="w-10 h-10 rounded-full bg-gray-100 object-cover" alt="" />
                                 <div>
                                     <p className="font-bold text-gray-900">{student.name}</p>
                                     <p className="text-xs text-gray-500">
                                        ID: {student.id} • Grade {student.grade} • <span className="text-blue-600">{student.busId}</span>
                                     </p>
                                 </div>
                             </div>
                             <button 
                                onClick={() => onAddStudent(student)}
                                className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                             >
                                 <Plus size={20} />
                             </button>
                        </div>
                    ))}
                </div>
            ) : query.length >= 2 ? (
                <div className="text-center py-10 text-gray-400">
                    <User size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No students found.</p>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-400">
                    <p className="text-sm">Type at least 2 characters to search.</p>
                </div>
            )}
        </div>
        
        <div className="p-3 bg-gray-100 text-center text-[10px] text-gray-400 font-medium">
            Connected to PowerSchool SIS Database
        </div>
      </div>
    </div>
  );
};

export default StudentSearchModal;