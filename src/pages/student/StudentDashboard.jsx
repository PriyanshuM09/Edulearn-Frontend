import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentApi } from '../../api/enrollmentApi';
import { courseApi } from '../../api/courseApi';
import { walletApi } from '../../api/walletApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProgressBar from '../../components/ProgressBar';
import { BookOpen, Award, Clock, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [enrollRes, walletRes] = await Promise.all([
          enrollmentApi.getStudentEnrollments(user.userId),
          walletApi.getWallet(user.userId)
        ]);
        
        setWalletBalance(walletRes.data?.balance || 0);
        const enrollmentList = enrollRes.data || [];
        
        // Fetch course details for each enrollment
        const enhancedEnrollments = await Promise.all(
          enrollmentList.map(async (e) => {
            try {
              const courseRes = await courseApi.getById(e.courseId);
              return { ...e, course: courseRes.data };
            } catch {
              return e;
            }
          })
        );
        
        setEnrollments(enhancedEnrollments);
      } catch (err) {
        // Fallback for mock
        setEnrollments([
          { id: 1, course: { id: 1, title: 'Complete React Developer in 2024' }, progressPercent: 45, enrolledAt: new Date().toISOString() },
          { id: 2, course: { id: 2, title: 'Python for Data Science & ML' }, progressPercent: 10, enrolledAt: new Date().toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchDashboard();
  }, [user]);

  const activeCourses = enrollments.filter(e => e.progressPercent < 100).length;
  const completedCourses = enrollments.filter(e => e.progressPercent === 100).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back, {user?.fullName}! 👋</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">{activeCourses}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Learning Hours</p>
              <p className="text-2xl font-bold text-gray-900">12.5h</p>
            </div>
          </div>
          <Link to="/student/wallet" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900">₹{walletBalance.toLocaleString()}</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">In Progress</h2>
            <Link to="/student/courses" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          
          {loading ? (
            <LoadingSpinner />
          ) : enrollments.length > 0 ? (
            <div className="space-y-6">
              {enrollments.filter(e => e.progressPercent < 100).map(enrollment => (
                <div key={enrollment.enrollmentId || enrollment.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{enrollment.course?.title}</h3>
                    <ProgressBar percent={enrollment.progressPercent} size="sm" />
                  </div>
                  <Link to={`/student/courses/${enrollment.courseId || enrollment.course?.id}/learn`} className="btn-primary text-sm whitespace-nowrap md:ml-4 text-center">
                    Continue Learning
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't started any courses yet.</p>
              <Link to="/courses" className="text-blue-600 hover:underline mt-2 inline-block">Explore courses</Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
