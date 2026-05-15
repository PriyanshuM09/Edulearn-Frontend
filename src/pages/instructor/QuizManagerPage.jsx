import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi } from '../../api/assessmentApi';
import { courseApi } from '../../api/courseApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, CheckCircle, BookOpen, ChevronDown, ChevronUp, Eye } from 'lucide-react';

const EMPTY_QUIZ = { title: '', description: '', courseId: '', timeLimitMinutes: 15, passingScore: 60 };
const EMPTY_Q = { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 1 };

const QuizManagerPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [questions, setQuestions] = useState({});

  // Modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQModal, setShowQModal] = useState(null); // quizId
  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ);
  const [qForm, setQForm] = useState(EMPTY_Q);
  const [saving, setSaving] = useState(false);

  // Load instructor courses
  useEffect(() => {
    if (user?.userId) {
      courseApi.getByInstructor(user.userId)
        .then(r => setCourses(r.data || []))
        .catch(() => setCourses([]));
    }
  }, [user]);

  // Load quizzes when course selected
  useEffect(() => {
    if (!selectedCourse) { setQuizzes([]); return; }
    setLoading(true);
    assessmentApi.getQuizzesByCourse(selectedCourse)
      .then(r => setQuizzes(r.data || []))
      .catch(() => { toast.error('Failed to load quizzes'); setQuizzes([]); })
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const toggleQuiz = async (quizId) => {
    if (expandedQuiz === quizId) { setExpandedQuiz(null); return; }
    setExpandedQuiz(quizId);
    if (!questions[quizId]) {
      try {
        const r = await assessmentApi.getQuestions(quizId);
        // Transform backend questions to UI structure
        const uiQs = (r.data || []).map(q => ({
          ...q,
          questionText: q.text,
          optionA: q.options?.[0] || '',
          optionB: q.options?.[1] || '',
          optionC: q.options?.[2] || '',
          optionD: q.options?.[3] || '',
          correctOption: ['A','B','C','D'][q.options?.indexOf(q.correctAnswer)] || 'A'
        }));
        setQuestions(q => ({ ...q, [quizId]: uiQs }));
      } catch { toast.error('Failed to load questions'); }
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await assessmentApi.createQuiz({ ...quizForm, courseId: parseInt(quizForm.courseId) });
      setQuizzes(q => [...q, res.data]);
      setShowQuizModal(false);
      setQuizForm(EMPTY_QUIZ);
      toast.success('Quiz created!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create quiz');
    } finally { setSaving(false); }
  };

  const handlePublish = async (quizId) => {
    try {
      const res = await assessmentApi.publishQuiz(quizId);
      setQuizzes(q => q.map(qz => qz.quizId === quizId ? res.data : qz));
      toast.success('Quiz published!');
    } catch { toast.error('Failed to publish'); }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz and all its questions?')) return;
    try {
      await assessmentApi.deleteQuiz(quizId);
      setQuizzes(q => q.filter(qz => qz.quizId !== quizId));
      toast.success('Quiz deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleAddQuestion = async (e, quizId) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Map frontend form to backend DTO
      const options = [qForm.optionA, qForm.optionB, qForm.optionC, qForm.optionD].filter(Boolean);
      const correctAnswer = qForm[`option${qForm.correctOption}`];

      const backendData = {
        text: qForm.questionText,
        type: 'MCQ',
        options: options,
        correctAnswer: correctAnswer,
        marks: qForm.marks,
        orderIndex: 0
      };

      const res = await assessmentApi.addQuestion(quizId, backendData);
      
      // Update UI state (transform back if needed or just use res.data)
      // Actually, let's transform the response for display compatibility
      const uiQ = {
        ...res.data,
        questionText: res.data.text,
        optionA: res.data.options[0],
        optionB: res.data.options[1],
        optionC: res.data.options[2],
        optionD: res.data.options[3],
        correctOption: ['A','B','C','D'][res.data.options.indexOf(res.data.correctAnswer)] || 'A'
      };

      setQuestions(q => ({ ...q, [quizId]: [...(q[quizId] || []), uiQ] }));
      setShowQModal(null);
      setQForm(EMPTY_Q);
      toast.success('Question added!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add question');
    } finally { setSaving(false); }
  };

  const handleDeleteQuestion = async (quizId, questionId) => {
    try {
      await assessmentApi.deleteQuestion(questionId);
      setQuestions(q => ({ ...q, [quizId]: q[quizId].filter(qn => qn.questionId !== questionId) }));
      toast.success('Question deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage quizzes for your courses</p>
          </div>
          <button onClick={() => setShowQuizModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Quiz
          </button>
        </div>

        {/* Course selector */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">— Choose a course —</option>
            {courses.map(c => <option key={c.id || c.courseId} value={c.id || c.courseId}>{c.title}</option>)}
          </select>
        </div>

        {/* Quiz list */}
        {loading ? <LoadingSpinner /> : (
          <div className="space-y-4">
            {quizzes.length === 0 && selectedCourse && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                No quizzes yet. Create one above.
              </div>
            )}
            {quizzes.map(quiz => (
              <div key={quiz.quizId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleQuiz(quiz.quizId)} className="text-gray-400 hover:text-gray-700">
                      {expandedQuiz === quiz.quizId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-xs text-gray-500">{quiz.timeLimitMinutes}min • Pass: {quiz.passingScore}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${quiz.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {quiz.published ? 'Published' : 'Draft'}
                    </span>
                    {!quiz.published && (
                      <button onClick={() => handlePublish(quiz.quizId)} title="Publish" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteQuiz(quiz.quizId)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedQuiz === quiz.quizId && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Questions ({(questions[quiz.quizId] || []).length})</h4>
                      <button
                        onClick={() => { setShowQModal(quiz.quizId); setQForm(EMPTY_Q); }}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Question
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(questions[quiz.quizId] || []).map((q, idx) => (
                        <div key={q.questionId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-xs font-bold text-gray-400 w-5 mt-0.5">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">{q.questionText}</p>
                            <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                              {['A','B','C','D'].map(opt => q[`option${opt}`] && (
                                <span key={opt} className={`flex items-center gap-1 ${q.correctOption === opt ? 'text-green-600 font-semibold' : ''}`}>
                                  {q.correctOption === opt && <CheckCircle className="w-3 h-3" />}
                                  {opt}. {q[`option${opt}`]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteQuestion(quiz.quizId, q.questionId)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Create New Quiz</h2>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                <input required value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Chapter 1 Quiz" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select required value={quizForm.courseId} onChange={e => setQuizForm(f => ({ ...f, courseId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c.id || c.courseId} value={c.id || c.courseId}>{c.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (min)</label>
                  <input type="number" min="1" value={quizForm.timeLimitMinutes} onChange={e => setQuizForm(f => ({ ...f, timeLimitMinutes: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                  <input type="number" min="0" max="100" value={quizForm.passingScore} onChange={e => setQuizForm(f => ({ ...f, passingScore: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowQuizModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Creating…' : 'Create Quiz'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Add Question</h2>
            <form onSubmit={e => handleAddQuestion(e, showQModal)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea required rows={2} value={qForm.questionText} onChange={e => setQForm(f => ({ ...f, questionText: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
              {['A','B','C','D'].map(opt => (
                <div key={opt}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Option {opt} *</label>
                  <input required value={qForm[`option${opt}`]} onChange={e => setQForm(f => ({ ...f, [`option${opt}`]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option *</label>
                  <select value={qForm.correctOption} onChange={e => setQForm(f => ({ ...f, correctOption: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {['A','B','C','D'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input type="number" min="1" value={qForm.marks} onChange={e => setQForm(f => ({ ...f, marks: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowQModal(null)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Adding…' : 'Add Question'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default QuizManagerPage;
