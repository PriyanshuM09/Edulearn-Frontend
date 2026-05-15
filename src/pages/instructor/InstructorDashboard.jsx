import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Users, BookOpen, Star, IndianRupee, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { courseApi } from '../../api/courseApi';
import { enrollmentApi } from '../../api/enrollmentApi';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    activeCourses: 0,
    avgRating: 'N/A'
  });

  // USD to INR conversion rate
  const INR_RATE = 83;

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.userId) return;
      
      try {
        setLoading(true);
        const res = await courseApi.getByInstructor(user.userId);
        const coursesData = res.data || [];
        
        // Use enrollmentCount provided by the backend DTO and convert to INR
        const coursesWithStats = coursesData.map(course => {
          const studentCount = course.enrollmentCount || 0;
          const priceInUSD = course.price || 0;
          const revenueInINR = studentCount * priceInUSD * INR_RATE;
          
          return {
            ...course,
            studentCount,
            revenue: revenueInINR
          };
        });

        setCourses(coursesWithStats);

        // Calculate aggregate stats - ONLY for Published and Approved courses
        const activeCourses = coursesWithStats.filter(c => c.isPublished && c.approvalStatus === 'APPROVED');
        
        const totalStudents = activeCourses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
        const totalRevenue = activeCourses.reduce((sum, c) => sum + (c.revenue || 0), 0);
        const activeCoursesCount = activeCourses.length;

        setStats({
          totalStudents,
          totalRevenue,
          activeCourses: activeCoursesCount,
          avgRating: 'N/A'
        });
      } catch (error) {
        console.error("Error fetching instructor stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);
  
  const statCards = [
    { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600 bg-green-100' },
    { label: 'Active Courses', value: stats.activeCourses.toString(), icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
    { label: 'Avg. Rating', value: stats.avgRating, icon: Star, color: 'text-amber-600 bg-amber-100' },
  ];

  const getStatusBadge = (status, published) => {
    if (!published) return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">Draft</span>;
    
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Published</span>;
      case 'PENDING':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">In Review</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-rose-100 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Instructor Dashboard</h1>
            <p className="mt-1 text-slate-500">Welcome back! Here's how your courses are performing.</p>
          </div>
          <Link 
            to="/instructor/courses" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            Manage Courses
          </Link>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-black text-slate-900">{loading ? '...' : s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Course Performance Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Course Performance</h2>
            {loading && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Students</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && courses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="w-10 h-10 text-slate-300" />
                        <p>No courses found. Start by creating your first course!</p>
                        <Link to="/instructor/create-course" className="mt-2 text-indigo-600 font-semibold hover:underline">
                          Create Course
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.courseId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {course.thumbnailUrl ? (
                            <img 
                              src={course.thumbnailUrl} 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = ''; // Clear src
                                e.target.parentElement.innerHTML = '<div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div>';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <BookOpen className="w-6 h-6" />
                            </div>
                          )}
                          <div className="font-semibold text-slate-900 line-clamp-1">{course.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(course.approvalStatus, course.isPublished)}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-700 font-medium font-mono">
                        {(course.studentCount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 font-bold font-mono">
                        ₹{(course.revenue || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
                {loading && courses.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p>Loading course performance data...</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default InstructorDashboard;

