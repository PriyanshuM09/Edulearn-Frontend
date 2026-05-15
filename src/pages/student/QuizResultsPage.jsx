import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi } from '../../api/assessmentApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Trophy, Star, Clock, BarChart2, ArrowLeft, RefreshCw } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const QuizResultsPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [bestScore, setBestScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, attemptsRes, scoreRes] = await Promise.all([
          assessmentApi.getQuizById(quizId),
          assessmentApi.getAttemptsByStudentAndQuiz(user.userId, quizId),
          assessmentApi.getBestScore(user.userId, quizId),
        ]);
        setQuiz(quizRes.data);
        setAttempts(attemptsRes.data);
        setBestScore(scoreRes.data.bestScore);
      } catch (err) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [quizId, user.userId]);

  if (loading) return <LoadingSpinner fullPage />;

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz?.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{attempts.length} attempt{attempts.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link
            to={`/student/quiz/${quizId}`}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retake Quiz
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Best Score', value: bestScore ?? '—', icon: Trophy, color: 'bg-amber-100 text-amber-600' },
            { label: 'Average Score', value: attempts.length ? avgScore : '—', icon: BarChart2, color: 'bg-blue-100 text-blue-600' },
            { label: 'Total Attempts', value: attempts.length, icon: RefreshCw, color: 'bg-purple-100 text-purple-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}{typeof s.value === 'number' ? '%' : ''}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Attempts Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Attempt History</h2>
          </div>
          {attempts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No attempts yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {attempts.map((a, idx) => {
                const pct = a.score;
                const isBest = a.score === bestScore;
                return (
                  <div key={a.attemptId} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-400 font-medium w-6">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {a.earnedMarks} / {a.totalMarks}
                        </span>
                        {isBest && (
                          <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            <Star className="w-3 h-3" /> Best
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {a.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${a.passed ? 'bg-green-500' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(a.submittedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default QuizResultsPage;
