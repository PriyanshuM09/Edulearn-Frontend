import { useState, useEffect } from 'react';
import { paymentApi } from '../../api/paymentApi';
import { walletApi } from '../../api/walletApi';
import { enrollmentApi } from '../../api/enrollmentApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { IndianRupee, TrendingUp, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const STATUS_TABS = ['ALL', 'CREATED', 'SUCCESS', 'FAILED', 'REFUNDED'];

const STATUS_STYLE = {
  SUCCESS: 'bg-green-100 text-green-700',
  CREATED: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-600',
  REFUNDED: 'bg-yellow-100 text-yellow-700',
};

const PaymentOverviewPage = () => {
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(null);
  const [walletRefunding, setWalletRefunding] = useState(null);

  const fetchPayments = async (status) => {
    setLoading(true);
    try {
      const res = status === 'ALL'
        ? await paymentApi.getPaymentsByStatus('SUCCESS')
          .then(r => r)
          .catch(() => ({ data: [] }))
        : await paymentApi.getPaymentsByStatus(status);

      if (status === 'ALL') {
        // Fetch all statuses in parallel
        const [s, c, f, r] = await Promise.allSettled([
          paymentApi.getPaymentsByStatus('SUCCESS'),
          paymentApi.getPaymentsByStatus('CREATED'),
          paymentApi.getPaymentsByStatus('FAILED'),
          paymentApi.getPaymentsByStatus('REFUNDED'),
        ]);
        const all = [
          ...(s.value?.data || []),
          ...(c.value?.data || []),
          ...(f.value?.data || []),
          ...(r.value?.data || []),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPayments(all);
      } else {
        setPayments(res.data || []);
      }
    } catch {
      toast.error('Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(activeTab); }, [activeTab]);

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Process refund for this payment?')) return;
    setRefunding(paymentId);
    try {
      const res = await paymentApi.refundPayment(paymentId);
      setPayments(prev => prev.map(p => p.paymentId === paymentId ? res.data : p));
      toast.success('Refund processed successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Refund failed');
    } finally {
      setRefunding(null);
    }
  };

  const handleWalletRefund = async (p) => {
    if (!window.confirm(`Refund ₹${p.amount} to student ${p.studentId}'s wallet? This will also unenroll the student from the course.`)) return;
    setWalletRefunding(p.paymentId);
    try {
      // 1. Process Refund
      await walletApi.adminRefund(p.studentId, p.courseId, p.amount);
      
      // 2. Process Unenrollment
      try {
        const enrollRes = await enrollmentApi.getStudentEnrollments(p.studentId);
        const enrollment = enrollRes.data.find(e => String(e.courseId) === String(p.courseId));
        if (enrollment) {
          await enrollmentApi.unenroll(enrollment.enrollmentId || enrollment.id);
        }
      } catch (enrollErr) {
        console.error("Auto-unenrollment failed", enrollErr);
        toast.error("Refunded, but automatic unenrollment failed. Please remove manually.");
      }

      setPayments(prev => prev.map(item => 
        item.paymentId === p.paymentId ? { ...item, status: 'REFUNDED' } : item
      ));
      toast.success('Refunded and student unenrolled successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Wallet refund failed');
    } finally {
      setWalletRefunding(null);
    }
  };

  const successPayments = payments.filter(p => p.status === 'SUCCESS');
  const totalRevenue = successPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const successCount = successPayments.length;
  const failedCount = payments.filter(p => p.status === 'FAILED').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor transactions and process refunds</p>
          </div>
          <button onClick={() => fetchPayments(activeTab)} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-white shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Revenue (INR)', value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'bg-green-100 text-green-600' },
            { label: 'Successful Payments', value: successCount, icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
            { label: 'Failed Transactions', value: failedCount, icon: AlertCircle, color: 'bg-red-100 text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16"><LoadingSpinner /></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Filter className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              No payments found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['ID', 'Student', 'Course', 'Amount (₹)', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.paymentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-gray-500 text-xs">#{p.paymentId}</td>
                      <td className="px-5 py-4 text-gray-900 font-medium">{p.studentId}</td>
                      <td className="px-5 py-4 text-gray-600">{p.courseId}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">₹{p.amount?.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(p.createdAt)}</td>
                      <td className="px-5 py-4">
                        {p.status === 'SUCCESS' && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleRefund(p.paymentId)}
                              disabled={refunding === p.paymentId || walletRefunding === p.paymentId}
                              className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-semibold disabled:opacity-50"
                            >
                              {refunding === p.paymentId ? '…' : 'Refund to Bank'}
                            </button>
                            <button
                              onClick={() => handleWalletRefund(p)}
                              disabled={refunding === p.paymentId || walletRefunding === p.paymentId}
                              className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors font-semibold disabled:opacity-50"
                            >
                              {walletRefunding === p.paymentId ? '…' : 'Refund to Wallet'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentOverviewPage;
