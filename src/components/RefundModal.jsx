import React, { useState } from 'react';
import { X, AlertCircle, Send, ShieldCheck } from 'lucide-react';

const RefundModal = ({ isOpen, onClose, onConfirm, courseTitle, amount }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Refund</h3>
          <p className="text-gray-500 text-sm mb-6">
            You are requesting a refund for <span className="font-bold text-gray-800">"{courseTitle}"</span>.
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Refund Amount</span>
              <span className="text-xl font-black text-indigo-600">₹{amount?.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Funds will be credited to your EduLearn Wallet upon admin approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">Reason for leaving</label>
              <textarea
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none min-h-[100px]"
                placeholder="Why would you like to unenroll?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-4 px-1">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              This request will be reviewed by an administrator within 24-48 hours.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : <><Send className="w-4 h-4" /> Send Request</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
