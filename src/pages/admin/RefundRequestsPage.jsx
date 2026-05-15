import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '../../api/paymentApi';
import { enrollmentApi } from '../../api/enrollmentApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  ClipboardList, CheckCircle, XCircle, Clock,
  User, BookOpen, IndianRupee, RefreshCw
} from 'lucide-react';

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING: { icon: Clock, label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { icon: CheckCircle, label: 'Approved', cls: 'bg-green-100 text-green-700' },
  REJECTED: { icon: XCircle, label: 'Rejected', cls: 'bg-red-100 text-red-700' },
};

// ── Process Modal ─────────────────────────────────────────────────────────────
const ProcessModal = ({ request, onClose, onDone }) => {
  const [refundAmount, setRefundAmount] = useState(request?.amount ?? 0);
  const [action, setAction] = useState('APPROVED'); // APPROVED | REJECTED
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Single call — backend handles wallet credit internally
      await paymentApi.processRefundRequest(request.id, action, action === 'APPROVED' ? refundAmount : 0);

      toast.success(
        action === 'APPROVED'
          ? `₹${refundAmount.toLocaleString()} will be credited to student's wallet!`
          : 'Request rejected.'
      );
      onDone();
      onClose();
    } catch (err) {
      toast.error('Operation failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Process Refund Request</h3>
          <p className="text-sm text-gray-500 mb-6">
            Student <strong>#{request.studentId}</strong> · Course <strong>#{request.courseId}</strong>
          </p>

          {/* Info Row */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2 text-sm border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Requested amount</span>
              <span className="font-bold text-gray-800">₹{request.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reason</span>
              <span className="font-medium text-gray-700 max-w-[55%] text-right">{request.reason || '—'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Decision */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAction('APPROVED')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${action === 'APPROVED' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                ✓ Approve
              </button>
              <button
                type="button"
                onClick={() => setAction('REJECTED')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${action === 'REJECTED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                ✕ Reject
              </button>
            </div>

            {/* Refund Amount */}
            {action === 'APPROVED' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 ml-1">
                  Refund Amount (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min={0}
                    max={request.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[0.25, 0.5, 0.75, 1].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setRefundAmount(Math.round(request.amount * pct))}
                      className="flex-1 text-[11px] font-semibold py-1 rounded-lg bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-600 transition-colors"
                    >
                      {pct === 1 ? 'Full' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 ${action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Processing...' : action === 'APPROVED' ? 'Confirm Refund' : 'Reject Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const RefundRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAllRefundRequests();
      setRequests(res.data || []);
    } catch {
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filteredRequests = filter === 'ALL'
    ? requests
    : requests.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Refund Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Review and process student unenrollment & refund applications</p>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-white shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {['PENDING', 'APPROVED', 'REJECTED'].map(s => {
            const count = requests.filter(r => r.status === s).length;
            const cfg = STATUS_CFG[s];
            return (
              <div key={s} className={`rounded-2xl p-4 border flex items-center gap-3 ${cfg.cls} border-current/20`}>
                <cfg.icon className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold opacity-70">{cfg.label}</p>
                  <p className="text-2xl font-black">{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20"><LoadingSpinner /></div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} refund requests.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold text-left">Student</th>
                    <th className="px-6 py-4 font-semibold text-left">Course</th>
                    <th className="px-6 py-4 font-semibold text-left">Requested ₹</th>
                    <th className="px-6 py-4 font-semibold text-left">Reason</th>
                    <th className="px-6 py-4 font-semibold text-left">Status</th>
                    <th className="px-6 py-4 font-semibold text-left">Date</th>
                    <th className="px-6 py-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map(req => {
                    const cfg = STATUS_CFG[req.status] || STATUS_CFG.PENDING;
                    return (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-300" />
                            <span className="font-semibold text-gray-800">#{req.studentId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-300" />
                            <span className="text-gray-600">#{req.courseId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          ₹{req.amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-500 max-w-[180px]">
                          <p className="truncate text-xs">{req.reason || '—'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
                            <cfg.icon className="w-3 h-3" />
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {req.status === 'PENDING' ? (
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs italic">
                              {req.processedAt ? new Date(req.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Done'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ProcessModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onDone={fetchRequests}
      />
      <Footer />
    </div>
  );
};

export default RefundRequestsPage;
