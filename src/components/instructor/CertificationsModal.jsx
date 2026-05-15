import { useState, useEffect } from 'react';
import { X, Award, User, Mail, ExternalLink, Loader2 } from 'lucide-react';
import { enrollmentApi } from '../../api/enrollmentApi';
import { authApi } from '../../api/authApi';
import toast from 'react-hot-toast';

const CertificationsModal = ({ course, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [completedStudents, setCompletedStudents] = useState([]);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchCompletions = async () => {
      setLoading(true);
      try {
        // 1. Get all enrollments for this course
        const enrollRes = await enrollmentApi.getByCourse(course.courseId || course.id);
        const allEnrollments = enrollRes.data || [];

        // 2. Filter for students with 100% progress
        const completions = allEnrollments.filter(e => e.progressPercent === 100);
        
        if (completions.length === 0) {
          setCompletedStudents([]);
          return;
        }

        // 3. Extract unique student IDs
        const studentIds = completions.map(e => e.studentId);

        // 4. Batch fetch student names/profiles from Auth Service
        const usersRes = await authApi.getUsersBatch(studentIds);
        const userProfiles = usersRes.data || [];

        // 5. Merge data
        const merged = completions.map(enrollment => {
          const profile = userProfiles.find(u => u.userId === enrollment.studentId);
          return {
            ...enrollment,
            studentName: profile?.fullName || `Student #${enrollment.studentId}`,
            studentEmail: profile?.email || 'N/A',
            profilePic: profile?.profilePicUrl
          };
        });

        setCompletedStudents(merged);
      } catch (err) {
        console.error('Error fetching completions:', err);
        toast.error('Failed to load completion data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletions();
  }, [course]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Course Completions</h2>
              <p className="text-blue-100 text-xs font-medium mt-0.5 opacity-90">{course.title}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Fetching completion data...</p>
            </div>
          ) : completedStudents.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Student Name</span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Status</span>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {completedStudents.map((student) => (
                  <div key={student.enrollmentId} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {student.profilePic ? (
                          <img src={student.profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{student.studentName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {student.studentEmail}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                        <Award className="w-3 h-3" />
                        Certified
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium italic">
                        {student.completedAt ? new Date(student.completedAt).toLocaleDateString() : 'Auto-marked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Award className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No completions yet</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                Once a student reaches 100% progress, they will automatically appear here as certified.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Total Certified Students: <span className="text-blue-600 font-bold">{completedStudents.length}</span>
          </div>
          <button 
            onClick={handleClose}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificationsModal;
