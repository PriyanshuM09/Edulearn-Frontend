import api from './axios';

export const paymentApi = {
  // ── Payments ──────────────────────────────────────────────────────
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  refundPayment: (paymentId) => api.post(`/payments/${paymentId}/refund`),
  getPaymentById: (paymentId) => api.get(`/payments/${paymentId}`),
  getPaymentsByStudent: (studentId) => api.get(`/payments/student/${studentId}`),
  getPaymentsByCourse: (courseId) => api.get(`/payments/course/${courseId}`),
  getPaymentsByStatus: (status) => api.get(`/payments/status/${status}`),

  // ── Subscriptions ─────────────────────────────────────────────────
  createSubscription: (data) => api.post('/payments/subscriptions', data),
  getSubscriptionById: (subscriptionId) =>
    api.get(`/payments/subscriptions/${subscriptionId}`),
  getSubscriptionsByStudent: (studentId) =>
    api.get(`/payments/subscriptions/student/${studentId}`),
  cancelSubscription: (subscriptionId) =>
    api.put(`/payments/subscriptions/${subscriptionId}/cancel`),

  // ── Refund Requests ───────────────────────────────────────────────
  createRefundRequest: (data) => api.post('/payments/refund-requests', data),
  getAllRefundRequests: () => api.get('/payments/refund-requests'),
  processRefundRequest: (requestId, status, refundAmount = 0) => 
    api.post(`/payments/refund-requests/${requestId}/process?status=${status}&refundAmount=${refundAmount}`),
};
