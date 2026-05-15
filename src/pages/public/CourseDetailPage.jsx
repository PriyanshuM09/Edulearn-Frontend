import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, PlayCircle, Shield, Award, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import EnrollButton from '../../components/EnrollButton';
import LessonList from '../../components/LessonList';
import { useAuth } from '../../context/AuthContext';
import { courseApi } from '../../api/courseApi';
import { lessonApi } from '../../api/lessonApi';
import { enrollmentApi } from '../../api/enrollmentApi';
import { assessmentApi } from '../../api/assessmentApi';
import { paymentApi } from '../../api/paymentApi';
import { formatPrice, getLevelColor, formatDuration, MOCK_COURSES, MOCK_LESSONS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isStudent } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState({ isEnrolled: false, enrollmentId: null });
  const [quizzes, setQuizzes] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subEnrollmentCount, setSubEnrollmentCount] = useState(0);

  useEffect(() => {
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // Fetch from real APIs
      if (!id) return;
      
      const [courseRes, lessonsRes, quizRes] = await Promise.all([
        courseApi.getById(id),
        lessonApi.getByCourse(id),
        assessmentApi.getQuizzesByCourse(id)
      ]);
      
      setCourse(courseRes.data);

      // Check subscription status and counts
      if (isAuthenticated && isStudent && user?.userId) {
        try {
          const [subRes, enrollmentsRes] = await Promise.all([
            paymentApi.getSubscriptionsByStudent(user.userId),
            enrollmentApi.getStudentEnrollments(user.userId)
          ]);
          
          const active = subRes.data?.find(s => s.status === 'ACTIVE');
          setActiveSubscription(active);

          const count = enrollmentsRes.data?.filter(e => e.enrolledViaSubscription).length || 0;
          setSubEnrollmentCount(count);

          // Check if already enrolled
          const currentEnrollment = enrollmentsRes.data?.find(e => 
            String(e.courseId) === String(id) || 
            (e.course && String(e.course.courseId) === String(id))
          );
          
          if (currentEnrollment) {
            setEnrollmentStatus({ 
              isEnrolled: true, 
              enrollmentId: currentEnrollment.enrollmentId || currentEnrollment.id 
            });
          }
        } catch (err) {
          console.warn("Failed to check subscription/enrollments", err);
        }
      }
      
      // Combine lessons and quizzes into one list
      const combinedContent = [
        ...(lessonsRes.data || []).map(l => ({ ...l, type: l.contentType || 'VIDEO' })),
        ...(quizRes.data || []).map(q => ({
          id: `quiz-${q.quizId}`,
          quizId: q.quizId,
          title: q.title,
          type: 'QUIZ',
          duration: q.timeLimitMinutes,
          free: false,
          isPublished: q.published
        }))
      ];
      
      setLessons(combinedContent);
      setQuizzes(quizRes.data || []);

    } catch (err) {
      console.warn('Backend API failed for course details, falling back to mock data');
      const found = MOCK_COURSES.find(c => (c.id || c.courseId) == id) || MOCK_COURSES[0];
      setCourse(found);
      setLessons(MOCK_LESSONS);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentSuccess = (action, data) => {
    if (action === 'enrolled') {
      setEnrollmentStatus({ isEnrolled: true, enrollmentId: data?.enrollmentId || data?.id });
    } else {
      setEnrollmentStatus({ isEnrolled: false, enrollmentId: null });
    }
    // Re-fetch everything to update counts strictly
    fetchCourseData();
  };

  const handleLessonClick = async (lesson) => {
    if (!enrollmentStatus.isEnrolled && !lesson.free) {
      toast.error('Please enroll to view this lesson');
      return;
    }

    if (lesson.type === 'QUIZ') {
      const targetQuizId = lesson.quizId;
      if (targetQuizId) {
        navigate(`/student/quiz/${targetQuizId}`);
        return;
      }
      
      // Fallback
      try {
        const res = await assessmentApi.getQuizzesByCourse(course.courseId || course.id);
        const quiz = res.data?.[0]; 
        if (quiz) {
          navigate(`/student/quiz/${quiz.quizId}`);
        } else {
          toast.error('No quiz found for this course.');
        }
      } catch (err) {
        toast.error('Failed to load quiz information.');
      }
      return;
    }

    // Navigate to learning view
    navigate(`/student/courses/${course.courseId || course.id}/learn`, { state: { initialLessonId: lesson.id } });
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!course) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex gap-2 mb-4">
                <span className={`badge ${getLevelColor(course.level)}`}>
                  {course.level?.replace('_', ' ')}
                </span>
                <span className="badge badge-blue">{course.category}</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-lg text-gray-300 mb-6 max-w-2xl">
                {course.description || "Master the concepts and build real-world projects with this comprehensive guide."}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 mb-6">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Star className="w-5 h-5 fill-amber-400" />
                  <span>{course.rating || 4.5}</span>
                  <span className="text-gray-400 font-normal ml-1">({(course.enrollmentCount / 10).toFixed(0)} ratings)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-5 h-5" /> {course.enrollmentCount?.toLocaleString()} students
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-5 h-5" /> {formatDuration(course.totalDuration || course.duration)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                  {course.instructor?.[0] || 'I'}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created by</p>
                  <p className="font-semibold text-white">{course.instructor || `Instructor #${course.instructorId}`}</p>
                </div>
              </div>
            </div>

            {/* Floating Action Card - Desktop */}
            <div className="hidden md:block w-80 bg-white rounded-2xl p-6 shadow-xl text-gray-900 border border-gray-100 flex-shrink-0">
              <div className="text-3xl font-extrabold mb-6">
                {formatPrice(course.price)}
              </div>
              
              {enrollmentStatus.isEnrolled ? (
                <button 
                  onClick={() => navigate(`/student/courses/${course.courseId || course.id}/learn`)}
                  className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition-all shadow-md active:scale-95"
                >
                  <PlayCircle className="w-4 h-4" />
                  Go to Course
                </button>
              ) : (
                <EnrollButton 
                  courseId={course.courseId || course.id}
                  price={course.price}
                  isEnrolled={enrollmentStatus.isEnrolled}
                  enrollmentId={enrollmentStatus.enrollmentId}
                  onSuccess={handleEnrollmentSuccess}
                  activeSubscription={activeSubscription}
                  subEnrollmentCount={subEnrollmentCount}
                />
              )}

              <div className="mt-6 space-y-3">
                <h4 className="font-semibold text-sm">This course includes:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2"><PlayCircle className="w-4 h-4" /> {formatDuration(course.duration)} on-demand video</li>
                  <li className="flex items-center gap-2"><Award className="w-4 h-4" /> Certificate of completion</li>
                  <li className="flex items-center gap-2"><Shield className="w-4 h-4" /> Full lifetime access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col md:flex-row gap-12">
        <div className="flex-1 max-w-3xl">
          
          <div className="mb-12 border border-gray-200 rounded-2xl p-6 md:p-8 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              {[
                "Master the core concepts of the subject",
                "Build real-world applications from scratch",
                "Learn industry best practices and standards",
                "Prepare for technical interviews and certifications"
              ].map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Content</h2>
            <p className="text-sm text-gray-500 mb-6">
              {lessons.length} sections • {formatDuration(course.totalDuration || course.duration)} total length
            </p>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <LessonList 
                lessons={lessons}
                isEnrolled={enrollmentStatus.isEnrolled}
                onLessonClick={handleLessonClick}
              />
            </div>
          </div>
        </div>

          {/* Mobile Action Card */}
          <div className="md:hidden mt-8 border-t border-gray-100 pt-8 pb-4 sticky bottom-0 bg-white z-10 px-4 -mx-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-extrabold text-gray-900">{formatPrice(course.price)}</span>
            </div>
          {enrollmentStatus.isEnrolled ? (
            <button 
              onClick={() => navigate(`/student/courses/${course.courseId || course.id}/learn`)}
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              Go to Course
            </button>
          ) : (
            <EnrollButton 
              courseId={course.courseId || course.id}
              price={course.price}
              isEnrolled={enrollmentStatus.isEnrolled}
              enrollmentId={enrollmentStatus.enrollmentId}
              onSuccess={handleEnrollmentSuccess}
              activeSubscription={activeSubscription}
              subEnrollmentCount={subEnrollmentCount}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CourseDetailPage;
