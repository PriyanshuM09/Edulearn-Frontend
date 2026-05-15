import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentApi } from '../../api/paymentApi';
import { walletApi } from '../../api/walletApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Crown, CheckCircle, XCircle, Calendar, Zap, Wallet, CreditCard, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const PLANS = [
  {
    key: 'FREE',
    label: 'Free',
    price: '₹0',
    numericPrice: 0,
    period: 'forever',
    color: 'from-slate-50 to-slate-100 border-slate-200',
    btnClass: 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-200',
    features: ['Access free courses', 'Community support', 'Basic certificates'],
  },
  {
    key: 'MONTHLY',
    label: 'Monthly',
    price: '₹3,999',
    numericPrice: 3999,
    period: 'per month',
    color: 'from-indigo-50 to-blue-50 border-indigo-200',
    btnClass: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-200',
    badge: 'Popular',
    features: ['Access 2 courses for free', 'Priority support', 'Premium certificates', 'Download resources'],
  },
  {
    key: 'ANNUAL',
    label: 'Annual',
    price: '₹15,999',
    numericPrice: 15999,
    period: 'per year',
    color: 'from-purple-50 to-fuchsia-50 border-purple-200',
    btnClass: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-200',
    badge: 'Best Value',
    features: ['Access 5 courses for free', 'Everything in Monthly', 'Career mentorship', 'Live sessions access'],
  },
];

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

const SubscriptionPage = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsRes, walletRes] = await Promise.all([
          paymentApi.getSubscriptionsByStudent(user.userId),
          walletApi.getWallet(user.userId)
        ]);
        setSubscriptions(subsRes.data);
        setWallet(walletRes.data);
      } catch (err) {
        console.warn("Failed to fetch initial data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    loadRazorpay();
  }, [user.userId]);

  const activeSub = subscriptions.find(s => s.status === 'ACTIVE');

  const handleWalletSubscribe = async (plan) => {
    if (subscribing || (wallet?.balance || 0) < plan.numericPrice) return;
    
    setSubscribing(plan.key + '_WALLET');
    try {
      const res = await walletApi.paySubscriptionWithWallet(user.userId, plan.key, plan.numericPrice);
      setSubscriptions(prev => [...prev, res.data]);
      setWallet(prev => ({ ...prev, balance: prev.balance - plan.numericPrice }));
      toast.success(`Welcome to ${plan.label} Premium! (Paid via Wallet)`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Wallet payment failed');
    } finally {
      setSubscribing(null);
    }
  };

  const handleSubscribe = async (plan) => {
    if (subscribing) return;

    // Direct creation for FREE plan
    if (plan.key === 'FREE') {
      setSubscribing(plan.key);
      try {
        const res = await paymentApi.createSubscription({
          studentId: user.userId,
          planType: plan.key,
          amountPaid: plan.numericPrice,
        });
        setSubscriptions(prev => [...prev, res.data]);
        toast.success(`Subscribed to ${plan.label} plan!`);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Subscription failed');
      } finally {
        setSubscribing(null);
      }
      return;
    }

    // Razorpay flow for paid plans
    setSubscribing(plan.key);
    try {
      const orderRes = await paymentApi.createOrder({
        studentId: user.userId,
        courseId: -2, // Unique ID for subscriptions
        amount: plan.numericPrice,
        currency: 'INR',
      });

      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load');
        setSubscribing(null);
        return;
      }

      const { razorpayOrderId, paymentId: dbPaymentId } = orderRes.data;

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: plan.numericPrice * 100,
        currency: 'INR',
        name: 'EduLearn Premium',
        description: `${plan.label} Subscription`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            // 1. Verify Payment
            await paymentApi.verifyPayment({
              paymentId: dbPaymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // 2. Create Subscription Record
            const subRes = await paymentApi.createSubscription({
              studentId: user.userId,
              planType: plan.key,
              amountPaid: plan.numericPrice,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id
            });

            setSubscriptions(prev => [...prev, subRes.data]);
            toast.success(`Welcome to ${plan.label} Premium!`);
          } catch (err) {
            console.error("Subscription post-payment error:", err);
            toast.error('Payment verified but subscription activation failed. Contact support.');
          } finally {
            setSubscribing(null);
          }
        },
        prefill: { name: user.fullName, email: user.email },
        theme: { color: '#4f46e5' },
        modal: { ondismiss: () => { setSubscribing(null); toast('Payment cancelled.'); } },
      });
      rzp.open();
    } catch (err) {
      console.error("Subscription initiation error:", err);
      toast.error(err?.response?.data?.message || 'Failed to initiate subscription payment');
      setSubscribing(null);
    }
  };

  const handleCancel = async (subId) => {
    if (cancelling) return;
    setCancelling(subId);
    try {
      const res = await paymentApi.cancelSubscription(subId);
      setSubscriptions(prev => prev.map(s => s.subscriptionId === subId ? res.data : s));
      toast.success('Subscription cancelled');
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-indigo-100 animate-pulse">
            <Crown className="w-4 h-4" /> EduLearn Premium Experience
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Invest in Your Future
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-4">
            Choose the plan that fits your learning pace. Unlock unlimited access to premium content and expert-led courses.
          </p>
          <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <Wallet className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-600">Wallet Balance:</span>
            <span className="text-sm font-black text-slate-900">₹{(wallet?.balance || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Active subscription banner */}
        {activeSub && (
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-3xl p-8 mb-12 shadow-2xl shadow-indigo-200 flex items-center justify-between flex-wrap gap-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative flex items-center gap-5">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-1">Current Membership</p>
                <p className="text-2xl font-bold">{activeSub.planType} Plan</p>
                <p className="text-indigo-300 text-sm mt-1">
                  Renews/Expires: {formatDate(activeSub.expiresAt || activeSub.endDate)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCancel(activeSub.subscriptionId)}
              disabled={cancelling === activeSub.subscriptionId}
              className="relative bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all border border-white/10 backdrop-blur-sm disabled:opacity-50"
            >
              {cancelling === activeSub.subscriptionId ? 'Processing…' : 'Cancel Subscription'}
            </button>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {PLANS.map((plan) => {
            const isCurrentPlan = activeSub?.planType === plan.key;
            return (
              <div
                key={plan.key}
                className={`group relative rounded-3xl border-2 p-8 flex flex-col transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br shadow-xl ${plan.color} ${isCurrentPlan ? 'ring-4 ring-indigo-500/20 scale-[1.02]' : 'hover:shadow-2xl hover:shadow-indigo-100'}`}
              >
                {plan.badge && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg shadow-indigo-200 uppercase tracking-widest">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-8">
                  <h3 className="font-black text-slate-900 text-xl mb-4">{plan.label}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 font-medium ml-1">/{plan.period}</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-10 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Includes</p>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-600 list-none font-medium">
                      <div className="mt-0.5 bg-green-100 p-1 rounded-full">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </div>

                {isCurrentPlan ? (
                  <div className="flex items-center justify-center gap-2 text-indigo-700 font-black text-sm bg-indigo-100/50 py-4 rounded-2xl border border-indigo-200 backdrop-blur-sm">
                    <Crown className="w-4 h-4" /> Active Plan
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!subscribing || !!activeSub}
                      className={`${plan.btnClass} w-full py-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                      {subscribing === plan.key ? <LoadingSpinner size="sm" color="white" /> : <CreditCard className="w-4 h-4" />}
                      {subscribing === plan.key ? 'Initializing…' : `Pay with Card`}
                    </button>

                    {plan.numericPrice > 0 && (wallet?.balance || 0) >= plan.numericPrice && (
                      <button
                        onClick={() => handleWalletSubscribe(plan)}
                        disabled={!!subscribing || !!activeSub}
                        className="w-full py-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-white text-slate-900 border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 shadow-sm"
                      >
                        {subscribing === plan.key + '_WALLET' ? <LoadingSpinner size="sm" /> : <Wallet className="w-4 h-4" />}
                        {subscribing === plan.key + '_WALLET' ? 'Processing…' : `Pay with Wallet`}
                      </button>
                    )}
                    
                    {plan.numericPrice > 0 && (wallet?.balance || 0) < plan.numericPrice && plan.key !== 'FREE' && (
                      <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                        Insufficient wallet balance (₹{wallet?.balance || 0})
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Combined History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Billing History (Subscriptions) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-800 text-lg">Plan History</h2>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-50">
              {subscriptions.length > 0 ? (
                subscriptions.map((s) => (
                  <div key={s.subscriptionId} className="px-8 py-5 flex items-center justify-between transition-colors hover:bg-slate-50/30">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${s.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{s.planType}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{formatDate(s.startedAt)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
                      s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-12 text-center text-slate-400 text-sm">No subscription history</p>
              )}
            </div>
          </div>

          {/* Wallet Activity */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-800 text-lg">Wallet Activity</h2>
              <History className="w-5 h-5 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
              {wallet?.transactions?.length > 0 ? (
                wallet.transactions.map((tx) => (
                  <div key={tx.id} className="px-8 py-4 flex items-center justify-between transition-colors hover:bg-slate-50/30">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${tx.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{tx.description}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(tx.timestamp)}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount}
                    </p>
                  </div>
                ))
              ) : (
                <p className="p-12 text-center text-slate-400 text-sm">No wallet activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscriptionPage;

