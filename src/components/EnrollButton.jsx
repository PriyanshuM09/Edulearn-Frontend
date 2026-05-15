import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollmentApi } from '../api/enrollmentApi';
import toast from 'react-hot-toast';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

const EnrollButton = ({ courseId, price, enrollmentId: initialEnrollmentId, isEnrolled: initialEnrolled, onSuccess, activeSubscription, subEnrollmentCount }) => {
  const { isAuthenticated, isStudent, user } = useAuth();
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [enrollmentId, setEnrollmentId] = useState(initialEnrollmentId);
  const [loading, setLoading] = useState(false);

  // Sync state with props
  useEffect(() => {
    setEnrolled(initialEnrolled);
    setEnrollmentId(initialEnrollmentId);
  }, [initialEnrolled, initialEnrollmentId]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll.');
      navigate('/login');
      return;
    }
    if (!isStudent) {
      toast.error('Only students can enroll in courses.');
      return;
    }

    // Logic for tiered subscription limits
    let useSubscription = false;
    if (!enrolled && price > 0) {
      if (activeSubscription && (activeSubscription.planType === 'MONTHLY' || activeSubscription.planType === 'ANNUAL')) {
        const limit = activeSubscription.planType === 'MONTHLY' ? 2 : 5;
        
        if (subEnrollmentCount < limit) {
          useSubscription = true;
        } else {
          // Limit reached for current plan
          toast.error(`Limit reached! Your ${activeSubscription.planType} plan only allows ${limit} free courses.`);
          navigate(`/student/payment/${courseId}`);
          return;
        }
      } else {
        // No premium subscription (either FREE plan or no plan), must pay
        navigate(`/student/payment/${courseId}`);
        return;
      }
    }

    setLoading(true);
    try {
      if (enrolled) {
        if (!enrollmentId) {
          toast.error('Unable to unenroll: enrollment ID not found. Please refresh the page.');
          return;
        }
        await enrollmentApi.unenroll(enrollmentId);
        setEnrolled(false);
        setEnrollmentId(null);
        toast.success('Unenrolled successfully.');
        onSuccess?.('unenrolled');
      } else {
        const enrollData = {
          enrolledViaSubscription: useSubscription
        };
        const { data } = await enrollmentApi.enroll(user.userId, courseId, enrollData);
        setEnrolled(true);
        setEnrollmentId(data.enrollmentId || data.id);
        
        if (useSubscription) {
          toast.success(`Enrolled via ${activeSubscription.planType} plan! (${subEnrollmentCount + 1}/${activeSubscription.planType === 'MONTHLY' ? 2 : 5} used)`);
        } else {
          toast.success('Enrolled successfully! Happy learning 🎉');
        }
        onSuccess?.('enrolled', data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
        enrolled
          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : enrolled ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {loading ? 'Processing...' : enrolled ? 'Unenroll' : 'Enroll Now'}
    </button>
  );
};

export default EnrollButton;
