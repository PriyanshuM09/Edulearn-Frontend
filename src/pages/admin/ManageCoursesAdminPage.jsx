import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { courseApi } from '../../api/courseApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CheckCircle, XCircle, Clock, Eye, AlertCircle, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ManageCoursesAdminPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingCourseId, setRejectingCourseId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await courseApi.getAllForAdmin();
      setCourses(res.data || []);
    } catch (err) {
      toast.error('Failed to load courses for admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleApprove = async (id) => {
    if (window.confirm('Are you sure you want to approve this course? It will be published immediately.')) {
      try {
        await courseApi.approve(id);
        toast.success('Course approved and published!');
        fetchCourses();
      } catch (err) {
        toast.error('Failed to approve course');
      }
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await courseApi.reject(rejectingCourseId, rejectionReason);
      toast.success('Course rejected');
      setRejectingCourseId(null);
      setRejectionReason('');
      fetchCourses();
    } catch (err) {
      toast.error('Failed to reject course');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'ALL' || course.approvalStatus === filter;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (course.instructorName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Pending</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">Draft</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Course Review Dashboard</h1>
            <p className="text-sm text-gray-500">Manage and review courses submitted by instructors.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search courses or instructors..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
               />
             </div>
             <div className="flex items-center gap-2 bg-white p-1 border border-gray-200 rounded-xl">
               {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                 <button 
                   key={f}
                   onClick={() => setFilter(f)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                     filter === f ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
                   }`}
                 >
                   {f}
                 </button>
               ))}
             </div>
          </div>
        </div>
        
        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Course & Instructor</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submission Date</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCourses.map(course => (
                    <tr key={course.courseId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{course.title}</span>
                          <span className="text-xs text-gray-500">By {course.instructorName || `Instructor #${course.instructorId}`}</span>
                        </div>
                      </td>
                      <td className="p-4">
                         <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 font-medium">{course.category}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                         {course.createdAt}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(course.approvalStatus)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/courses/${course.courseId}`} className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg" title="View Course">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {course.approvalStatus === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => handleApprove(course.courseId)}
                                className="p-2 text-green-600 hover:text-white hover:bg-green-600 border border-green-200 rounded-lg transition-all" 
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setRejectingCourseId(course.courseId)}
                                className="p-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg transition-all" 
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCourses.length === 0 && (
              <div className="p-20 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold">No courses found matching criteria</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingCourseId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Reject Course</h3>
            <p className="text-gray-500 text-sm mb-6">Please provide a reason for rejection. This will be shared with the instructor.</p>
            
            <textarea 
              rows="4"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Content doesn't meet quality standards, or missing required materials..."
              className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all mb-6"
            ></textarea>
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setRejectingCourseId(null); setRejectionReason(''); }}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ManageCoursesAdminPage;
