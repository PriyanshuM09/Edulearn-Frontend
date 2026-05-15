import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { walletApi } from '../../api/walletApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import toast from 'react-hot-toast';

const RAZORPAY_KEY = 'rzp_test_SgQzLjLta57PRo';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);

  useEffect(() => {
    fetchWalletData();
    loadRazorpay(); // Pre-load SDK so it's ready when user clicks Add Funds
  }, [user]);

  const fetchWalletData = async () => {
    if (!user?.userId) return;
    try {
      const res = await walletApi.getWallet(user.userId);
      setWallet(res.data);
    } catch (err) {
      console.error("Failed to fetch wallet", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(amountToAdd);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setAddingFunds(true);
    try {
      const res = await walletApi.addFunds({
        studentId: user.userId,
        amount: amount
      });

      const options = {
        key: RAZORPAY_KEY,
        amount: Math.round(amount * 100), // in paise, matches backend order
        currency: "INR",
        name: "EduLearn Wallet",
        description: "Add funds to your wallet",
        order_id: res.data.razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyRes = await walletApi.verifyFunds({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            setWallet(verifyRes.data);
            setAmountToAdd('');
            toast.success(`₹${amount} added to your wallet!`);
          } catch (err) {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {
          name: user.fullName,
          email: user.email
        },
        theme: {
          color: "#4F46E5"
        },
        modal: {
          ondismiss: () => {
            setAddingFunds(false);
            toast('Payment cancelled.');
          }
        }
      };

      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setAddingFunds(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
      // Note: setAddingFunds(false) is handled in handler/ondismiss
    } catch (err) {
      toast.error("Failed to initiate payment");
    } finally {
      setAddingFunds(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-indigo-600" />
          My Wallet
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 font-medium mb-1 opacity-80">Available Balance</p>
              <h2 className="text-5xl font-black mb-6">₹{wallet?.balance?.toLocaleString() || '0'}</h2>
              <div className="flex items-center gap-2 text-sm text-indigo-100 opacity-90 bg-white/10 w-fit px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Securely encrypted
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-purple-400/20 rounded-full blur-2xl"></div>
          </div>

          {/* Quick Add Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-gray-900 mb-4">Add Funds</h3>
            <div className="space-y-4 flex-grow">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input 
                  type="number"
                  value={amountToAdd}
                  onChange={(e) => setAmountToAdd(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg font-semibold"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setAmountToAdd(amt.toString())}
                    className="py-2 text-xs font-bold border border-gray-100 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors bg-gray-50 text-gray-600"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={handleAddFunds}
              disabled={addingFunds}
              className="w-full btn-primary py-3 rounded-xl mt-6 flex items-center justify-center gap-2"
            >
              {addingFunds ? <LoadingSpinner size="sm" /> : <Plus className="w-5 h-5" />}
              Proceed to Pay
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              Transaction History
            </h3>
          </div>
          
          <div className="divide-y divide-gray-50">
            {wallet?.transactions?.length > 0 ? (
              wallet.transactions.map((tx) => (
                <div key={tx.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{tx.description}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">{tx.razorpayPaymentId || 'WALLET'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No transactions yet</p>
                <p className="text-sm text-gray-400">Your wallet activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WalletPage;
