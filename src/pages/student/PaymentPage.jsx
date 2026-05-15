import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { paymentApi } from '../../api/paymentApi';
import { courseApi } from '../../api/courseApi';
import { enrollmentApi } from '../../api/enrollmentApi';
import { walletApi } from '../../api/walletApi';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { ShieldCheck, CreditCard, Lock, CheckCircle, Wallet } from 'lucide-react';
import { formatPrice } from '../../utils/helpers';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const RAZORPAY_KEY = 'rzp_test_SgQzLjLta57PRo';

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Guard: Wait for courseId and user to be ready
      if (!courseId || !user?.userId) return;

      try {
        setLoading(true);
        // 2. Fetch critical course and enrollment data
        const [courseRes, enrollmentRes] = await Promise.all([
          courseApi.getById(courseId),
          enrollmentApi.getStudentEnrollments(user.userId).catch(() => ({ data: [] }))
        ]);

        // 3. Check if already enrolled
        const isEnrolled = enrollmentRes.data?.some(e =>
          String(e.courseId) === String(courseId) || (e.course && String(e.course.courseId) === String(courseId))
        );

        if (isEnrolled) {
          toast.success("You are already enrolled!");
          navigate(`/student/courses/${courseId}/learn`);
          return;
        }

        setCourse(courseRes.data);

        // 4. Try to fetch wallet (Non-critical)
        try {
          const walletRes = await walletApi.getWallet(user.userId);
          setWallet(walletRes.data);
        } catch (walletErr) {
          console.warn("Wallet not found or unavailable:", walletErr);
        }

      } catch (err) {
        console.error("Payment Page Load Failure:", err);
        toast.error('Could not load course details');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    loadRazorpay();
  }, [courseId, navigate, user?.userId]);

  const amountINR = course?.price ? Math.round(course.price * 84) : 0;

  const handlePayment = useCallback(async () => {
    if (paying) return;
    setPaying(true);
    try {
      const orderRes = await paymentApi.createOrder({
        studentId: user.userId,
        courseId: parseInt(courseId),
        amount: amountINR,
        currency: 'INR',
      });
      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setPaying(false);
        return;
      }
      const { razorpayOrderId, paymentId: dbPaymentId } = orderRes.data;

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: amountINR * 100,
        currency: 'INR',
        name: 'EduLearn',
        description: course.title,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await paymentApi.verifyPayment({
              paymentId: dbPaymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // CRITICAL: Enrollment is now handled asynchronously via RabbitMQ
            // Wait briefly to allow the background process to complete
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success('Payment successful! You are now enrolled.');
            navigate(`/student/courses/${courseId}/learn`);
          } catch (err) {
            console.error("Post-payment error:", err);
            toast.error(err.response?.data?.message || 'Payment verified but enrollment failed. Contact support.');
          }
        },
        prefill: { name: user.fullName, email: user.email },
        theme: { color: '#4f46e5' },
        modal: { ondismiss: () => { setPaying(false); toast('Payment cancelled.'); } },
      });
      rzp.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to initiate payment';
      toast.error(errorMsg);
      setPaying(false);
    }
  }, [paying, user, courseId, course, navigate, amountINR]);

  const handleWalletPayment = async () => {
    if (paying) return;
    if (!wallet || wallet.balance < amountINR) {
      toast.error(`Insufficient wallet balance. Need ₹${amountINR}, have ₹${wallet?.balance || 0}`);
      return;
    }

    setPaying(true);
    try {
      await walletApi.payWithWallet(user.userId, parseInt(courseId), amountINR);

      // Wait briefly for RabbitMQ enrollment to process
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Payment successful via Wallet!');
      navigate(`/student/courses/${courseId}/learn`);
    } catch (err) {
      console.error("Wallet payment error:", err);
      toast.error("Wallet payment failed");
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Complete Your Purchase</h1>
          <p className="text-gray-500 text-center mb-8 text-sm">Secure checkout powered by Razorpay</p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
            <h2 className="font-semibold text-gray-700 mb-4 text-xs uppercase tracking-wide">Order Summary</h2>
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-extrabold text-xl flex-shrink-0">
                {course?.title?.[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 leading-snug">{course?.title}</p>
                <p className="text-xs text-gray-500 mt-1">{course?.instructor} • {course?.category}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Course Price</span><span>{formatPrice(course?.price)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Amount (INR)</span><span>₹{amountINR}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span><span>₹{amountINR}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
              {[
                { icon: Lock, label: '256-bit SSL' },
                { icon: ShieldCheck, label: 'Secure Payment' },
                { icon: CheckCircle, label: 'Instant Access' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <Icon className="w-5 h-5 text-indigo-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2 rounded-xl disabled:opacity-60"
            >
              <CreditCard className="w-5 h-5" />
              {paying ? 'Processing…' : `Pay ₹${amountINR} via Razorpay`}
            </button>

            {wallet && (
              <button
                onClick={handleWalletPayment}
                disabled={paying || wallet.balance < amountINR}
                className={`w-full py-4 text-base flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all ${wallet.balance >= amountINR
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-sm'
                    : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <Wallet className="w-5 h-5" />
                  {paying ? 'Processing…' : 'Pay with Wallet'}
                </div>
                <span className="text-[10px] opacity-70">
                  Current Balance: ₹{wallet.balance.toLocaleString()}
                </span>
              </button>
            )}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            By completing the purchase you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
