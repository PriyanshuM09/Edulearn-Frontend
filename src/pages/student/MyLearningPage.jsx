import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentApi } from '../../api/enrollmentApi';
import { courseApi } from '../../api/courseApi';
import { progressApi } from '../../api/progressApi';
import { paymentApi } from '../../api/paymentApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProgressBar from '../../components/ProgressBar';
import { Link } from 'react-router-dom';
import {
  BookOpen, Award, Play, LogOut, Clock, CheckCircle2,
  XCircle, AlertCircle, Wallet, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Unenroll Confirmation Modal ──────────────────────────────────────────────
const UnenrollModal = ({ isOpen, onClose, onConfirm, enrollment }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const isPaid = enrollment?.course?.price > 0;
  const amountINR = enrollment?.course?.price ? Math.round(enrollment.course.price * 84) : 0;

  if (!isOpen || !enrollment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 shrink-0 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Unenroll from Course</h3>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-semibold text-gray-700">{enrollment?.course?.title}</span>
              </p>
            </div>
          </div>

          {isPaid && (
            <div className="bg-indigo-50 rounded-2xl p-4 mb-5 border border-indigo-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-indigo-600 uppercase">Refund Eligible</span>
                <span className="text-lg font-black text-indigo-700">₹{amountINR.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-indigo-500 leading-snug">
                You will be unenrolled <strong>immediately</strong>. A refund request will be created and reviewed by the admin within 24–48 hours.
              </p>
            </div>
          )}

          {!isPaid && (
            <div className="bg-amber-50 rounded-2xl p-4 mb-5 border border-amber-100">
              <p className="text-[11px] text-amber-600 font-medium">
                ⚠️ This is a free course. You will be unenrolled immediately. Your progress will be lost.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">
                Reason for leaving {isPaid && <span className="text-red-500">*</span>}
              </label>
              <textarea
                required={isPaid}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[90px] transition-all"
                placeholder="Tell us why you're leaving..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (isPaid && !reason.trim())}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : isPaid ? 'Unenroll & Request Refund' : 'Yes, Unenroll Me'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Refund Status Badge ──────────────────────────────────────────────────────
const RefundBadge = ({ status }) => {
  const map = {
    PENDING: { icon: Clock, label: 'Refund Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    APPROVED: { icon: CheckCircle2, label: 'Refund Approved', cls: 'bg-green-50 text-green-700 border-green-200' },
    REJECTED: { icon: XCircle, label: 'Refund Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const cfg = map[status] || map.PENDING;
  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border ${cfg.cls}`}>
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </div>
  );
};

// ── My Refunds Panel ─────────────────────────────────────────────────────────
const MyRefundsPanel = ({ studentId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const res = await paymentApi.getAllRefundRequests();
        const myRequests = (res.data || []).filter(r => String(r.studentId) === String(studentId));
        setRequests(myRequests);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    if (studentId) fetchRefunds();
  }, [studentId]);

  if (!loading && requests.length === 0) return null;

  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">My Refund Requests</p>
            <p className="text-xs text-gray-500">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Course ID: {req.courseId}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{req.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <RefundBadge status={req.status} />
                  {req.amount > 0 && (
                    <span className="text-xs text-gray-500">
                      {req.status === 'APPROVED' ? `₹${req.amount.toLocaleString()} credited to wallet` : `Requested: ₹${req.amount.toLocaleString()}`}
                    </span>
                  )}
                  {req.status === 'REJECTED' && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> No refund will be issued
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const MyLearningPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEnrollmentsData = async () => {
      try {
        const res = await enrollmentApi.getStudentEnrollments(user.userId);
        const enrollmentList = res.data || [];

        const enhancedEnrollments = await Promise.all(
          enrollmentList.map(async (e) => {
            // Clean the courseId from any accidental prefixes (like colons)
            const cleanId = String(e.courseId).replace(/[^0-9]/g, '');
            let courseData = e.course;
            let progressPercent = e.progressPercent || 0;

            try {
              // 1. Try fetching course name/details
              const courseRes = await courseApi.getById(cleanId);
              courseData = courseRes.data;
            } catch (err) {
              console.warn(`Failed to fetch details for course ${cleanId}:`, err);
            }

            try {
              // 2. Try fetching updated progress percentage
              const summaryRes = await progressApi.getSummary(user.userId, cleanId);
              progressPercent = summaryRes.data.completionPercentage;
            } catch (err) {
              console.warn(`Failed to fetch progress for course ${cleanId}:`, err);
            }

            return {
              ...e,
              courseId: cleanId,
              course: courseData,
              progressPercent: progressPercent
            };
          })
        );

        setEnrollments(enhancedEnrollments);
      } catch {
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchEnrollmentsData();
  }, [user]);

  const handleDownloadCertificate = async (courseId, courseTitle) => {
    try {
      let certsRes = await progressApi.getCertificatesByStudent(user.userId);
      let cert = certsRes.data.find(c => String(c.courseId) === String(courseId));
      
      if (!cert) {
        // Try to force issue it
        toast.loading("Preparing certificate...", { id: 'cert-loading' });
        await progressApi.forceCertificate(user.userId, courseId);
        certsRes = await progressApi.getCertificatesByStudent(user.userId);
        cert = certsRes.data.find(c => String(c.courseId) === String(courseId));
        toast.dismiss('cert-loading');
      }

      if (!cert) { 
        toast.error("Certificate could not be generated. Ensure course is 100% complete."); 
        return; 
      }

      const res = await progressApi.downloadCertificate(cert.certificateId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${courseTitle.replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Certificate downloaded!");
    } catch {
      toast.dismiss('cert-loading');
      toast.error('Failed to download certificate');
    }
  };

  const handleUnenroll = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  const confirmUnenroll = async (reason) => {
    if (!selectedEnrollment) return;
    const enrollmentId = selectedEnrollment.enrollmentId || selectedEnrollment.id;
    const courseId = selectedEnrollment.courseId || selectedEnrollment.course?.id;
    const isPaid = selectedEnrollment.course?.price > 0;

    try {
      // Step 1: Immediately unenroll
      await enrollmentApi.unenroll(enrollmentId);
      setEnrollments(prev => prev.filter(e => (e.enrollmentId || e.id) !== enrollmentId));

      if (isPaid) {
        // Step 2: Auto-create refund request (PENDING)
        const amountINR = selectedEnrollment.course?.price ? Math.round(selectedEnrollment.course.price * 84) : 0;
        try {
          await paymentApi.createRefundRequest({
            studentId: user.userId,
            courseId: courseId,
            amount: amountINR,
            reason: reason || 'Student requested unenrollment'
          });
          toast.success('Unenrolled! A refund request has been submitted for admin review.');
        } catch {
          toast.success('Unenrolled successfully!');
          toast.error('Could not create refund request. Please contact support.');
        }
      } else {
        toast.success(`Unenrolled from ${selectedEnrollment.course?.title}`);
      }
    } catch {
      toast.error('Failed to unenroll. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Learning</h1>

        {/* Refund Requests Panel */}
        <MyRefundsPanel studentId={user?.userId} />

        {loading ? (
          <LoadingSpinner />
        ) : enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map(enrollment => (
              <div key={enrollment.enrollmentId || enrollment.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-40 relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  {enrollment.course?.thumbnailUrl ? (
                    <img
                      src={enrollment.course.thumbnailUrl}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div style={{ display: enrollment.course?.thumbnailUrl ? 'none' : 'flex' }} className="w-full h-full items-center justify-center">
                    <BookOpen className="w-10 h-10 text-white opacity-80" />
                  </div>
                  {enrollment.course?.price > 0 && (
                    <span className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      PAID
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{enrollment.course?.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{enrollment.course?.instructor}</p>

                  <div className="mt-auto">
                    <ProgressBar percent={enrollment.progressPercent} size="sm" />
                    <div className="mt-4 flex flex-col gap-2">
                      <Link
                        to={`/student/courses/${enrollment.courseId || enrollment.course?.id}/learn`}
                        className="flex items-center justify-center gap-2 w-full text-center btn-primary py-2 text-sm shadow-sm"
                      >
                        {enrollment.progressPercent === 100 ? 'Review Course' : 'Continue Learning'}
                        <Play className="w-3 h-3 fill-white" />
                      </Link>
                      {enrollment.progressPercent === 100 && (
                        <button
                          onClick={() => handleDownloadCertificate(enrollment.courseId || enrollment.course?.id, enrollment.course?.title)}
                          className="flex items-center justify-center gap-2 w-full text-center bg-amber-50 text-amber-700 hover:bg-amber-100 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          <Award className="w-4 h-4" />
                          Download Certificate
                        </button>
                      )}
                      <button
                        onClick={() => handleUnenroll(enrollment)}
                        className="flex items-center justify-center gap-2 w-full text-center text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg text-xs font-semibold transition-colors mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {enrollment.course?.price > 0 ? 'Unenroll & Request Refund' : 'Leave Course'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">You haven't enrolled in any courses yet.</h3>
            <p className="text-gray-500 mb-6">Discover our wide range of courses and start learning today!</p>
            <Link to="/courses" className="btn-primary">Browse Courses</Link>
          </div>
        )}
      </div>

      <UnenrollModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmUnenroll}
        enrollment={selectedEnrollment}
      />
      <Footer />
    </div>
  );
};

export default MyLearningPage;
