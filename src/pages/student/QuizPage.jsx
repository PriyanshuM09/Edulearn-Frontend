import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi } from '../../api/assessmentApi';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, ChevronRight, Trophy, AlertCircle } from 'lucide-react';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState('loading'); // loading | quiz | submitted
  const [result, setResult] = useState(null);
  const timerStarted = useRef(false); // tracks if countdown has actually begun (prevents init auto-submit)

  useEffect(() => {
    const init = async () => {
      try {
        const [quizRes, qRes, attemptRes] = await Promise.all([
          assessmentApi.getQuizById(quizId),
          assessmentApi.getQuestions(quizId),
          assessmentApi.startAttempt(user.userId, quizId),
        ]);
        setQuiz(quizRes.data);
        
        // Normalize backend questions to UI structure
        const normalizedQs = (qRes.data || []).map(q => ({
          ...q,
          questionText: q.text,
          optionA: q.options?.[0] || '',
          optionB: q.options?.[1] || '',
          optionC: q.options?.[2] || '',
          optionD: q.options?.[3] || '',
        }));
        
        setQuestions(normalizedQs);
        const currentAttemptId = attemptRes.data.attemptId;
        setAttemptId(currentAttemptId);
        
        // 1. Try to load from LocalStorage first (most robust against refresh)
        const localData = localStorage.getItem(`quiz_attempt_${currentAttemptId}`);
        let loadedFromLocal = false;
        
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (parsed.answers) {
              setAnswers(parsed.answers);
            }
            if (parsed.endTime) {
              const rem = Math.floor((parsed.endTime - Date.now()) / 1000);
              if (rem > 0) {
                setTimeLeft(rem);
                loadedFromLocal = true;
              }
            }
          } catch (e) {
            console.error("Failed to parse local storage quiz data", e);
          }
        }

        // 2. Load existing answers from DB/API if not locally found
        if (!loadedFromLocal && attemptRes.data.answers) {
          setAnswers(attemptRes.data.answers);
        }
        
        // 3. Sync with Redis timer (fallback if local storage is missing/expired)
        try {
          const timerRes = await assessmentApi.getRemainingTime(currentAttemptId, user.userId);
          const rem = timerRes.data.remainingSeconds;
          
          if (!loadedFromLocal) {
            if (rem !== undefined && rem !== null) {
              if (rem > 0) {
                setTimeLeft(rem);
                if (timerRes.data.answers) {
                  setAnswers(a => ({ ...a, ...timerRes.data.answers }));
                }
              } else if (timerRes.data.expired) {
                setTimeLeft((quizRes.data.timeLimitMinutes || 15) * 60);
                if (timerRes.data.answers) {
                  setAnswers(a => ({ ...a, ...timerRes.data.answers }));
                }
              }
            } else {
              setTimeLeft((quizRes.data.timeLimitMinutes || 15) * 60);
            }
          } else {
            // Even if loaded locally, sync answers from backend just in case it has more
            if (timerRes.data.answers) {
              setAnswers(a => ({ ...timerRes.data.answers, ...a })); // Local takes precedence
            }
          }
        } catch (timerErr) {
          console.warn("Failed to sync with Redis timer");
          if (!loadedFromLocal) {
            setTimeLeft((quizRes.data.timeLimitMinutes || 15) * 60);
          }
        }

        setPhase('quiz');
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load quiz');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [quizId, user.userId, navigate]);

  // countdown timer
  useEffect(() => {
    if (phase !== 'quiz' || timeLeft === null) return;

    // Auto-submit only when the countdown has been running and naturally reaches 0
    if (timeLeft <= 0) {
      if (timerStarted.current) {
        handleSubmit();
      }
      return;
    }

    // Mark timer as started once we begin the first real tick
    timerStarted.current = true;
    
    // Backup to local storage to survive refreshes
    if (attemptId) {
      const endTime = Date.now() + (timeLeft * 1000);
      localStorage.setItem(`quiz_attempt_${attemptId}`, JSON.stringify({
        answers,
        endTime
      }));
    }

    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, attemptId]); // Intentionally not including answers to avoid timer reset, but answers are saved in auto-save below

  // Auto-save progress to Redis & LocalStorage
  useEffect(() => {
    if (phase !== 'quiz' || !attemptId || Object.keys(answers).length === 0) return;
    
    // Update local storage immediately on answer change
    const localData = localStorage.getItem(`quiz_attempt_${attemptId}`);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        localStorage.setItem(`quiz_attempt_${attemptId}`, JSON.stringify({
          ...parsed,
          answers
        }));
      } catch (e) {}
    } else if (timeLeft) {
      localStorage.setItem(`quiz_attempt_${attemptId}`, JSON.stringify({
        answers,
        endTime: Date.now() + (timeLeft * 1000)
      }));
    }
    
    const timer = setTimeout(() => {
      assessmentApi.saveProgress(attemptId, user.userId, answers)
        .catch(err => console.error("Failed to auto-save progress:", err));
    }, 1000); // Debounce 1s

    return () => clearTimeout(timer);
  }, [answers, attemptId, user.userId, phase, timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answersMap = {};
      questions.forEach(q => {
        const selectedLetter = answers[q.questionId];
        const selectedText = selectedLetter ? q[`option${selectedLetter}`] : null;
        if (selectedText) {
          answersMap[q.questionId] = selectedText;
        }
      });
      
      const res = await assessmentApi.submitAttempt(attemptId, { 
        studentId: user.userId,
        quizId: parseInt(quizId),
        answers: answersMap 
      });
      
      // Clear local storage on successful submit
      localStorage.removeItem(`quiz_attempt_${attemptId}`);

      setResult(res.data);
      setPhase('submitted');
      toast.success('Quiz submitted!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, questions, answers, attemptId]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const answered = Object.keys(answers).length;
  const pct = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  if (loading || phase === 'loading') return <LoadingSpinner fullPage />;

  if (phase === 'submitted') {
    const score = result?.earnedMarks ?? result?.score ?? 0;
    const total = result?.totalMarks ?? result?.totalQuestions ?? questions.length;
    const pass = result?.passed;
    const percentage = result?.score ?? (total ? Math.round((score / total) * 100) : 0);
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${pass ? 'bg-green-100' : 'bg-red-100'}`}>
              {pass
                ? <Trophy className="w-10 h-10 text-green-600" />
                : <AlertCircle className="w-10 h-10 text-red-500" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {pass ? 'Congratulations!' : 'Keep Practicing!'}
            </h1>
            <p className="text-gray-500 mb-8">{quiz?.title}</p>
            
            <div className="mb-8">
              <p className="text-5xl font-black text-indigo-600 mb-1">{percentage}%</p>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Final Score</p>
            </div>

            <div className="flex justify-center gap-12 mb-8 bg-gray-50 py-4 rounded-2xl border border-gray-100">
              <div>
                <p className="text-2xl font-bold text-gray-900">{score}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Correct</p>
              </div>
              <div className="w-px h-8 bg-gray-200 self-center"></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Total Questions</p>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3 mb-8 overflow-hidden shadow-inner">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ease-out ${pass ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/student/quiz/${quizId}/results`)}
                className="flex-1 btn-secondary"
              >
                View History
              </button>
              <button
                onClick={() => navigate('/student/courses')}
                className="flex-1 btn-primary"
              >
                My Learning
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-bold text-gray-900 text-base leading-tight">{quiz?.title}</h1>
            <p className="text-xs text-gray-500">{answered}/{questions.length} answered</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1.5 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-700'}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary text-sm px-4 py-2"
            >
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-indigo-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex-grow max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
        {questions.map((q, idx) => (
          <div
            key={q.questionId}
            className={`bg-white rounded-xl border shadow-sm p-6 transition-all ${answers[q.questionId] !== undefined ? 'border-indigo-200' : 'border-gray-200'}`}
          >
            <div className="flex items-start gap-3 mb-5">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <p className="text-gray-900 font-medium leading-relaxed">{q.questionText}</p>
            </div>
            <div className="space-y-3 ml-11">
              {['optionA', 'optionB', 'optionC', 'optionD'].map((opt) => {
                const label = opt.replace('option', '');
                const val = q[opt];
                if (!val) return null;
                const selected = answers[q.questionId] === label;
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none
                      ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.questionId}`}
                      className="hidden"
                      checked={selected}
                      onChange={() => setAnswers(a => ({ ...a, [q.questionId]: label }))}
                    />
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                      {selected && <CheckCircle className="w-4 h-4 text-white" />}
                    </span>
                    <span className="text-gray-800 text-sm">{label}. {val}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
          >
            {submitting ? 'Submitting…' : 'Submit Quiz'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
