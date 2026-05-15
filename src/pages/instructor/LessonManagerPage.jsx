import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { lessonApi } from '../../api/lessonApi';
import { courseApi } from '../../api/courseApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, Trash2, Video, FileText, ChevronLeft, Paperclip } from 'lucide-react';

const EMPTY_LESSON = { title: '', description: '', contentUrl: '', durationMinutes: 10, contentType: 'VIDEO' };
const EMPTY_RESOURCE = { name: '', fileUrl: '', fileType: 'PDF' };

const LessonManagerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(null); // lessonId
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [resourceForm, setResourceForm] = useState(EMPTY_RESOURCE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, lessonsRes] = await Promise.all([
          courseApi.getById(courseId),
          lessonApi.getByCourse(courseId)
        ]);
        
        // Ensure instructor owns this course
        if (courseRes.data.instructorId !== user.userId) {
          toast.error('Unauthorized access');
          navigate('/instructor/courses');
          return;
        }

        setCourse(courseRes.data);
        setLessons(lessonsRes.data || []);
      } catch (err) {
        toast.error('Failed to load course details');
        navigate('/instructor/courses');
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId && courseId) fetchData();
  }, [courseId, user, navigate]);

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const orderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.orderIndex)) + 1 : 1;
      const res = await lessonApi.create({
        courseId: parseInt(courseId),
        title: lessonForm.title,
        description: lessonForm.description,
        contentUrl: lessonForm.contentUrl,
        contentType: lessonForm.contentType,
        durationMinutes: lessonForm.durationMinutes,
        orderIndex: orderIndex,
        isPreview: false
      });
      setLessons([...lessons, res.data]);
      setShowLessonModal(false);
      setLessonForm(EMPTY_LESSON);
      toast.success('Lesson created successfully');
    } catch (err) {
      toast.error('Failed to create lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await lessonApi.delete(lessonId);
      setLessons(lessons.filter(l => l.lessonId !== lessonId));
      toast.success('Lesson deleted');
    } catch (err) {
      toast.error('Failed to delete lesson');
    }
  };

  const handleAddResource = async (e, lessonId) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await lessonApi.addResource(lessonId, {
        name: resourceForm.name,
        fileUrl: resourceForm.fileUrl,
        fileType: resourceForm.fileType,
        sizeKb: 1024 // Dummy size
      });
      
      setLessons(lessons.map(l => {
        if (l.lessonId === lessonId) {
          return { ...l, resources: [...(l.resources || []), res.data] };
        }
        return l;
      }));
      
      setShowResourceModal(null);
      setResourceForm(EMPTY_RESOURCE);
      toast.success('Resource attached');
    } catch (err) {
      toast.error('Failed to attach resource');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (lessonId, resourceId) => {
    try {
      await lessonApi.removeResource(lessonId, resourceId);
      setLessons(lessons.map(l => {
        if (l.lessonId === lessonId) {
          return { ...l, resources: (l.resources || []).filter(r => r.resourceId !== resourceId) };
        }
        return l;
      }));
      toast.success('Resource removed');
    } catch (err) {
      toast.error('Failed to remove resource');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate('/instructor/courses')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Lessons</h1>
            <p className="text-sm text-gray-500 mt-1">Course: {course?.title}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Curriculum</h2>
          <button onClick={() => setShowLessonModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Lesson
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
            <Video className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            No lessons added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div key={lesson.lessonId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <span className="bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded text-sm mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{lesson.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex gap-3">
                        <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5"/> {lesson.durationMinutes} min</span>
                        <span>{lesson.contentType}</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteLesson(lesson.lessonId)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {lesson.contentUrl && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-blue-600 break-all">
                    <strong>URL:</strong> <a href={lesson.contentUrl} target="_blank" rel="noreferrer" className="hover:underline">{lesson.contentUrl}</a>
                  </div>
                )}
                
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-400" /> Study Materials ({(lesson.resources || []).length})
                    </h4>
                    <button onClick={() => { setShowResourceModal(lesson.lessonId); setResourceForm(EMPTY_RESOURCE); }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Attach Material
                    </button>
                  </div>
                  
                  {lesson.resources && lesson.resources.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {lesson.resources.map(res => (
                        <div key={res.resourceId} className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-lg">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-700 hover:text-blue-600 truncate block">
                              {res.name}
                            </a>
                          </div>
                          <button onClick={() => handleDeleteResource(lesson.lessonId, res.resourceId)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Add New Lesson</h2>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (e.g. YouTube) *</label>
                <input required value={lessonForm.contentUrl} onChange={e => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" min="1" required value={lessonForm.durationMinutes} onChange={e => setLessonForm({ ...lessonForm, durationMinutes: +e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowLessonModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Saving...' : 'Save Lesson'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Attach Study Material</h2>
            <form onSubmit={e => handleAddResource(e, showResourceModal)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
                <input required value={resourceForm.name} onChange={e => setResourceForm({ ...resourceForm, name: e.target.value })}
                  placeholder="e.g. Chapter 1 Slides"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File URL (e.g. Google Drive/S3) *</label>
                <input required value={resourceForm.fileUrl} onChange={e => setResourceForm({ ...resourceForm, fileUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowResourceModal(null)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Attaching...' : 'Attach'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default LessonManagerPage;
