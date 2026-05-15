import api from './axios';

export const walletApi = {
  getWallet: (studentId) => api.get(`/payments/wallet/${studentId}`),
  addFunds: (data) => api.post('/payments/wallet/add-funds', data),
  verifyFunds: (data) => api.post('/payments/wallet/verify-funds', data),
  payWithWallet: (studentId, courseId, amount) => 
    api.post(`/payments/wallet/pay?studentId=${studentId}&courseId=${courseId}&amount=${amount}`),
  paySubscriptionWithWallet: (studentId, planType, amount) =>
    api.post(`/payments/subscriptions/wallet-pay?studentId=${studentId}&planType=${planType}&amount=${amount}`),
  adminRefund: (studentId, courseId, amount) =>
    api.post(`/payments/wallet/admin/refund?studentId=${studentId}&courseId=${courseId}&amount=${amount}`),
};
