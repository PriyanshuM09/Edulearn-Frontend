import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Plus, Edit, Trash2, Eye, Video, Send, AlertCircle, CheckCircle, Clock, MessageSquare, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { courseApi } from '../../api/courseApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import CertificationsModal from '../../components/instructor/CertificationsModal';

const ManageCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseForCert, setSelectedCourseForCert] = useState(null);

  const fetchInstructorCourses = async () => {
    setLoading(true);
    try {
      const res = await courseApi.getByInstructor(user.userId);
      setCourses(res.data || []);
    } catch (err) {
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) fetchInstructorCourses();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseApi.delete(id);
        setCourses(courses.filter(c => (c.id || c.courseId) !== id));
        toast.success('Course deleted');
      } catch {
        toast.error('Failed to delete course');
      }
    }
  };

  const handleSubmitForReview = async (id) => {
    try {
      await courseApi.submitForReview(id);
      toast.success('Course submitted for review!');
      fetchInstructorCourses(); // Refresh
    } catch (err) {
      toast.error('Failed to submit course for review');
    }
  };

  const getStatusBadge = (course) => {
    const status = course.approvalStatus || 'PENDING';
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center gap-1 text-green-600 font-bold text-xs"><CheckCircle className="w-3 h-3" /> Published</span>;
      case 'PENDING':
        return <span className="flex items-center gap-1 text-amber-600 font-bold text-xs"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1 text-red-600 font-bold text-xs"><AlertCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="text-gray-500 font-bold text-xs">Draft</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
            <p className="text-sm text-gray-500">Create, edit and manage your course content and publishing status.</p>
          </div>
          <Link to="/instructor/courses/create" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Course
          </Link>
        </div>
        
        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Course Detail</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map(course => (
                  <tr key={course.courseId || course.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{course.title}</span>
                        <span className="text-xs text-gray-500 mt-1">{course.category} • {course.level}</span>
                        {course.rejectionReason && course.approvalStatus === 'REJECTED' && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex gap-2">
                             <AlertCircle className="w-4 h-4 flex-shrink-0" />
                             <span><strong>Reason:</strong> {course.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                       <span className="font-bold text-gray-900">${course.price}</span>
                    </td>
                    <td className="p-4">
                       <span className="text-sm font-medium">{course.enrollmentCount || 0}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(course)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {course.approvalStatus !== 'APPROVED' && course.approvalStatus !== 'PENDING' && (
                          <button 
                            onClick={() => handleSubmitForReview(course.courseId || course.id)}
                            className="p-2 text-amber-600 hover:text-white hover:bg-amber-600 border border-amber-200 rounded-lg transition-all" 
                            title="Submit for Review"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <Link to={`/instructor/courses/${course.courseId || course.id}/lessons`} className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm" title="Manage Lessons">
                          <Video className="w-4 h-4" />
                        </Link>
                        <Link to={`/instructor/courses/${course.courseId || course.id}/discussions`} className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg shadow-sm" title="View Discussions">
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                        <Link to={`/courses/${course.courseId || course.id}`} className="p-2 text-gray-400 hover:text-green-600 bg-white border border-gray-200 rounded-lg shadow-sm" title="View Course Detail">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => setSelectedCourseForCert(course)}
                          className="p-2 text-gray-400 hover:text-amber-600 bg-white border border-gray-200 rounded-lg shadow-sm" 
                          title="View Certifications"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(course.courseId || course.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-lg shadow-sm" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {courses.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No courses found</h3>
              <p className="text-gray-500 mt-1 mb-6">Start sharing your knowledge with the world.</p>
              <Link to="/instructor/courses/create" className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all">
                Create First Course
              </Link>
            </div>
          )}
        </div>
        )}
      </div>
      <Footer />

      {selectedCourseForCert && (
        <CertificationsModal 
          course={selectedCourseForCert} 
          onClose={() => setSelectedCourseForCert(null)} 
        />
      )}
    </div>
  );
};

export default ManageCoursesPage;
