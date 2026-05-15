import api from './axios';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  googleLogin: (idToken) => api.post('/auth/google-login', { idToken }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: (userId) => api.get(`/auth/profile/${userId}`),
  updateProfile: (userId, data) => api.put(`/auth/profile/${userId}`, data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  
  // Admin Endpoints
  getAllUsers: () => api.get('/auth/admin/users'),
  suspendUser: (userId) => api.put(`/auth/admin/users/${userId}/suspend`),
  deleteUserAdmin: (userId) => api.delete(`/auth/admin/users/${userId}`),
  getPendingInstructors: () => api.get('/auth/admin/instructors/pending'),
  approveInstructor: (userId) => api.put(`/auth/admin/instructors/${userId}/approve`),
  getUsersBatch: (userIds) => api.post('/auth/users/batch', userIds),
};
