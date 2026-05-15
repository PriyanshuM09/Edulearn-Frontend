import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, PlayCircle, FileText, CheckCircle, 
  MessageSquare, Info, Download, Award, ChevronRight,
  Menu, X, Lock, Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { courseApi } from '../../api/courseApi';
import { lessonApi } from '../../api/lessonApi';
import { progressApi } from '../../api/progressApi';
import { enrollmentApi } from '../../api/enrollmentApi';
import { assessmentApi } from '../../api/assessmentApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProgressBar from '../../components/ProgressBar';
import DiscussionBoard from '../../components/DiscussionBoard';
import VideoPlayer from '../../components/VideoPlayer';
import toast from 'react-hot-toast';

const LearnPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const processingLessons = useRef(new Set());
  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [userReview, setUserReview] = useState({ rating: 5, comment: '' });

  const fetchInitialData = useCallback(async () => {
    // Clean courseId to remove any accidental colons or prefixes from the URL
    const cleanCourseId = courseId?.replace(/[^0-9]/g, '');
    if (!cleanCourseId) return;
    
    setLoading(true);
    try {
      // Use cleanCourseId for all subsequent calls
      const cid = parseInt(cleanCourseId);
      // 1. Fetch Course & Lessons (Crucial)
      let courseData, lessonsData;
      try {
        const [courseRes, lessonsRes] = await Promise.all([
          courseApi.getById(cid),
          lessonApi.getByCourse(cid)
        ]);
        courseData = courseRes.data;
        lessonsData = lessonsRes.data;
        setCourse(courseData);
      } catch (err) {
        console.error("Critical LearnPage error (Course/Lessons):", err);
        throw err; // Re-throw to hit the main catch block for critical failure
      }

      // 2. Fetch Optional Data (Non-blocking)
      let quizData = [], enrollmentData = [], progressData = [], summaryData = null;
      try {
        const [quizRes, enrollmentRes] = await Promise.all([
          assessmentApi.getQuizzesByCourse(cid).catch(() => ({ data: [] })),
          enrollmentApi.getStudentEnrollments(user.userId).catch(() => ({ data: [] }))
        ]);
        quizData = quizRes.data || [];
        enrollmentData = enrollmentRes.data || [];

        // Check Enrollment
        const isEnrolled = enrollmentData.some(e => String(e.courseId) === String(cid));
        if (!isEnrolled) {
          toast.error("You are not enrolled in this course.");
          navigate(`/courses/${cid}`);
          return;
        }

        const [progressRes, summaryRes] = await Promise.all([
          progressApi.getByStudentAndCourse(user.userId, cid).catch(() => ({ data: [] })),
          progressApi.getSummary(user.userId, cid).catch(() => ({ data: { completionPercentage: 0 } }))
        ]);
        progressData = progressRes.data || [];
        summaryData = summaryRes.data;
        
        console.log("[LearnPage] Loaded Progress:", progressData);
        console.log("[LearnPage] Loaded Summary:", summaryData);
        
        setProgress(progressData);
        setSummary(summaryData);
      } catch (err) {
        console.warn("Non-critical LearnPage data failed to load:", err);
      }

      // Combine lessons and quizzes
      const combinedContent = [
        ...(lessonsData || []).map(l => ({ 
          ...l, 
          id: l.lessonId || l.id, 
          type: l.contentType || 'VIDEO' 
        })),
        ...(quizData || []).map(q => ({
          id: `quiz-${q.quizId}`,
          quizId: q.quizId,
          title: q.title,
          type: 'QUIZ',
          duration: q.timeLimitMinutes,
          isPublished: q.published
        }))
      ];
      setLessons(combinedContent);

      // 3. Fetch Reviews
      try {
        const reviewsRes = await courseApi.getReviews(cid);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.warn("Failed to load reviews:", err);
      }

      // 4. Set Initial Lesson
      if (!currentLesson) {
        const initialId = location.state?.initialLessonId;
        if (initialId) {
          const found = combinedContent.find(l => String(l.id) === String(initialId));
          setCurrentLesson(found || combinedContent[0]);
        } else {
          const uncompleted = combinedContent.find(l => 
            !progressData?.some(p => String(p.lessonId) === String(l.id) && p.completed)
          );
          setCurrentLesson(uncompleted || combinedContent[0]);
        }
      }

    } catch (err) {
      console.error("LearnPage Critical Failure:", err);
      // Fallback to mock data ONLY if critical course data is missing
      setCourse({
        title: "Introduction to React Development (Fallback)",
        description: "Backend connection failed. Showing sample data.",
        enrollmentCount: 0,
        rating: 0
      });
      const mockLessons = [
        { id: 1, title: "Backend Unavailable", sectionOrder: 1, lessonOrder: 1, type: "VIDEO", duration: 0, content: "Please ensure all microservices are running." }
      ];
      setLessons(mockLessons);
      setCurrentLesson(mockLessons[0]);
      setProgress([]);
      setSummary({ completionPercentage: 0 });
    } finally {
      setLoading(false);
    }
  }, [courseId, user.userId, location.state]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const isCompleted = useCallback((lessonId) => {
    return progress.some(p => String(p.lessonId) === String(lessonId) && p.completed);
  }, [progress]);

  const markAsCompleted = useCallback(async (lessonId) => {
    if (!lessonId || !user?.userId) return;
    
    const cleanId = String(courseId).replace(/[^0-9]/g, '');
    const numericLessonId = parseInt(lessonId);

    if (processingLessons.current.has(lessonId)) return;
    
    // 1. OPTIMISTIC UPDATE: Update UI immediately
    setProgress(prev => {
      const alreadyDone = prev.some(p => String(p.lessonId) === String(lessonId));
      if (alreadyDone) return prev;
      return [...prev, { lessonId: numericLessonId, completed: true }];
    });

    // Manually increment summary locally to avoid race condition
    setSummary(prev => {
      const total = lessons.length || 1;
      const currentDone = progress.filter(p => p.completed).length + 1;
      const newPercent = Math.min(100, Math.round((currentDone / total) * 100));
      return { ...prev, completionPercentage: newPercent };
    });

    try {
      processingLessons.current.add(lessonId);
      console.log(`[Progress] Processing completion for Lesson ${numericLessonId}...`);
      
      toast.success("Lesson completed!", { id: 'progress-update' });

      await progressApi.updateProgress({
        studentId: user.userId,
        courseId: parseInt(cleanId),
        lessonId: numericLessonId,
        watchedSeconds: 999999,
      });
      
      console.log(`[Progress] Successfully saved Lesson ${numericLessonId}`);

      const currentIndex = lessons.findIndex(l => String(l.id) === String(lessonId));
      if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
        setTimeout(() => {
          setCurrentLesson(lessons[currentIndex + 1]);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);
      }
    } catch (err) {
      console.error(`[Progress] Failed to save Lesson ${numericLessonId}:`, err);
    } finally {
      // Ensure the lock is released so it can be retried if needed
      setTimeout(() => {
        processingLessons.current.delete(lessonId);
      }, 5000); // 5s cooldown
    }
  }, [courseId, user?.userId, lessons, progressApi]);

  // SMART TRACKING: Mark as completed based on watch percentage
  const handleVideoProgress = useCallback((percent, lessonId) => {
    // Threshold set to 50% as requested. 
    // Guard: Only trigger if not already completed, not loading, and NOT ALREADY PROCESSING
    if (percent >= 50 && lessonId && !isCompleted(lessonId) && !loading && !processingLessons.current.has(lessonId)) {
      console.log(`Smart-tracking: Lesson ${lessonId} reached ${percent}%. Marking as completed.`);
      markAsCompleted(lessonId);
    }
  }, [loading, isCompleted, markAsCompleted]);

  const calculateProgress = () => {
    const videoLessons = lessons.filter(l => l.type !== 'QUIZ');
    if (!videoLessons.length) return 0;
    const completedCount = videoLessons.filter(l => isCompleted(l.id)).length;
    return Math.round((completedCount / videoLessons.length) * 100);
  };

  const completionPercentage = calculateProgress();


  const handleDownloadCertificate = async () => {
    try {
      let certId;
      try {
        let certsRes = await progressApi.getCertificatesByStudent(user.userId);
        let existing = certsRes.data.find(c => String(c.courseId) === String(courseId));
        
        if (!existing) {
          toast.loading("Issuing certificate...", { id: 'cert-loading' });
          await progressApi.forceCertificate(user.userId, courseId);
          certsRes = await progressApi.getCertificatesByStudent(user.userId);
          existing = certsRes.data.find(c => String(c.courseId) === String(courseId));
          toast.dismiss('cert-loading');
        }

        if (existing) {
          certId = existing.certificateId;
        } else {
          toast.error("Certificate could not be issued. Ensure 100% completion.");
          return;
        }
      } catch (e) {
         toast.dismiss('cert-loading');
         toast.error("Failed to prepare certificate");
         return;
      }

      const res = await progressApi.downloadCertificate(certId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${course.title.replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Certificate downloaded!");
    } catch (err) {
      toast.error('Failed to download certificate');
    }
  };
  
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!userReview.comment.trim()) {
      toast.error("Please add a comment to your review.");
      return;
    }
    setReviewLoading(true);
    try {
      const res = await courseApi.addReview({
        courseId: parseInt(courseId),
        userId: user.userId,
        userName: user.fullName,
        rating: userReview.rating,
        comment: userReview.comment
      });
      setReviews([res.data, ...reviews]);
      setUserReview({ rating: 5, comment: '' });
      toast.success("Review submitted! Thank you.");
    } catch (err) {
      toast.error("Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!course) return <div className="text-center p-20 text-xl">Course not found.</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="hidden md:block">
            <h1 className="font-bold text-sm text-gray-200 line-clamp-1">{course.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="w-32">
                 <ProgressBar percent={completionPercentage} size="xs" showLabel={false} />
               </div>
               <span className="text-[10px] text-gray-400 font-medium">
                 {completionPercentage}% Complete
               </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {completionPercentage >= 100 && (
            <button 
              onClick={handleDownloadCertificate}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              <Award className="w-4 h-4" />
              Get Certificate
            </button>
          )}
          <button 
            className="md:hidden p-2 hover:bg-gray-800 rounded-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col overflow-y-auto bg-black transition-all ${sidebarOpen ? 'md:mr-0' : ''}`}>
          {/* Player Section */}
          <div className="aspect-video bg-black flex items-center justify-center relative group">
            {currentLesson?.type === 'QUIZ' ? (
              <div className="text-center p-10 max-w-lg">
                <FileText className="w-20 h-20 text-blue-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">{currentLesson.title}</h2>
                <p className="text-gray-400 mb-8">Ready to test your knowledge? This quiz will help you solidify what you've learned.</p>
                <button 
                  onClick={() => navigate(`/student/quiz/${currentLesson.quizId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold text-lg transition-all"
                >
                  Start Quiz
                </button>
              </div>
            ) : currentLesson?.contentUrl ? (
              <VideoPlayer 
                url={currentLesson.contentUrl} 
                lessonId={currentLesson.id} 
                onEnded={(id) => markAsCompleted(id)} 
                onProgress={(percent, id) => handleVideoProgress(percent, id)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                <PlayCircle className="w-24 h-24 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-2xl font-bold">{currentLesson?.title}</h3>
                  <p className="text-gray-300">Section {currentLesson?.sectionOrder || 1} • Lesson {currentLesson?.lessonOrder || 1}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabbed Content Area */}
          <div className="flex-1 bg-white text-gray-900">
            <div className="border-b border-gray-200">
              <div className="max-w-4xl mx-auto px-4 flex gap-8">
                {['overview', 'discussions', 'reviews', 'resources'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 text-sm font-bold capitalize relative transition-colors ${
                      activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
              {activeTab === 'overview' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-extrabold text-gray-900">{currentLesson?.title}</h2>
                    {currentLesson && currentLesson.type !== 'QUIZ' && isCompleted(currentLesson?.id) && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-green-100 text-green-700">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </div>
                    )}
                  </div>
                  <div className="prose max-w-none text-gray-700">
                    <p>{currentLesson?.content || "No description available for this lesson."}</p>
                  </div>
                  
                  <div className="mt-12 pt-12 border-t border-gray-100">
                    <h3 className="text-lg font-bold mb-4">About this course</h3>
                    <p className="text-gray-600 leading-relaxed">{course.description}</p>
                  </div>
                </div>
              )}

              {activeTab === 'discussions' && (
                <DiscussionBoard courseId={courseId} />
              )}

              {activeTab === 'reviews' && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-6">Course Reviews</h2>
                  
                  {completionPercentage >= 100 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
                      <h3 className="text-lg font-bold mb-2">Write a Review</h3>
                      <p className="text-sm text-gray-600 mb-4">Congratulations on completing the course! Let others know what you think.</p>
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserReview({ ...userReview, rating: star })}
                              className="focus:outline-none"
                            >
                              <Star className={`w-8 h-8 ${star <= userReview.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                          rows="3"
                          placeholder="What did you like or dislike about this course?"
                          value={userReview.comment}
                          onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                        ></textarea>
                        <button
                          type="submit"
                          disabled={reviewLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                          {reviewLoading ? 'Submitting...' : 'Post Review'}
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((r, i) => (
                        <div key={i} className="pb-6 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                {r.userName[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{r.userName}</h4>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star key={idx} className={`w-3 h-3 ${idx < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed pl-13">{r.comment}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-bold">No reviews yet</h4>
                        <p className="text-gray-500">Be the first to review this course!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div>
                  {currentLesson?.resources && currentLesson.resources.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold mb-4">Study Materials</h3>
                      <div className="grid gap-3">
                        {currentLesson.resources.map(res => (
                          <a 
                            key={res.resourceId} 
                            href={res.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-red-100 text-red-500 p-2 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{res.name}</h4>
                                <p className="text-xs text-gray-500 uppercase">{res.fileType}</p>
                              </div>
                            </div>
                            <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <Download className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-bold">No resources yet</h4>
                      <p className="text-gray-500">Instructor hasn't uploaded any materials for this lesson.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Course Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'w-80 border-l border-gray-800' : 'w-0'}
          fixed md:relative inset-y-0 right-0 z-40 bg-gray-900 transition-all duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:opacity-0'}
        `}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900">
            <h3 className="font-bold text-sm">Course Content</h3>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            {lessons.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setCurrentLesson(lesson);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-4 flex gap-3 transition-colors border-l-4 ${
                  currentLesson?.id === lesson.id 
                    ? 'bg-blue-600/10 border-blue-500' 
                    : 'hover:bg-gray-800 border-transparent'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted(lesson.id) ? (
                    <div className="bg-green-500 rounded-full p-0.5"><CheckCircle className="w-4 h-4 text-white" /></div>
                  ) : (
                    lesson.type === 'QUIZ' ? <FileText className="w-5 h-5 text-amber-500" /> : <PlayCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium line-clamp-2 ${currentLesson?.id === lesson.id ? 'text-blue-400' : 'text-gray-300'}`}>
                    {idx + 1}. {lesson.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      {lesson.type === 'QUIZ' ? 'Quiz' : 'Video'}
                    </span>
                    <span>•</span>
                    <span>{lesson.duration || 10} min</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 bg-gray-800/50 mt-auto border-t border-gray-700">
             {!isCompleted(currentLesson?.id) && currentLesson?.type !== 'QUIZ' && (
               <div className="mb-4 p-2 bg-blue-900/30 rounded-lg border border-blue-500/30">
                 <div className="flex items-center gap-2 text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-1">
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                   Smart-Tracking Active
                 </div>
                 <p className="text-[10px] text-gray-400">Watch 50% to complete lesson</p>
               </div>
             )}
             
             <div className="flex items-center justify-between mb-2">
               <span className="text-xs font-bold text-gray-400">YOUR PROGRESS</span>
               <span className="text-xs font-bold text-blue-400">{completionPercentage}%</span>
             </div>
             <ProgressBar percent={completionPercentage} size="xs" color="blue" showLabel={false} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LearnPage;
