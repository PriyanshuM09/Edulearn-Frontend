import api from './axios';

export const courseApi = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  getFeatured: () => api.get('/courses/featured'),
  search: (keyword) => api.get(`/courses/search?keyword=${encodeURIComponent(keyword)}`),
  getByCategory: (category) => api.get(`/courses/category/${encodeURIComponent(category)}`),
  getByInstructor: (instructorId) => api.get(`/courses/instructor/${instructorId}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  
  // New Publishing Flow
  submitForReview: (id) => api.put(`/courses/${id}/submit-for-review`),
  unpublish: (id) => api.put(`/courses/${id}/unpublish`),
  
  // Admin Operations
  getPending: () => api.get('/courses/admin/pending'),
  getAllForAdmin: () => api.get('/courses/admin/all'),
  approve: (id) => api.put(`/courses/admin/${id}/approve`),
  reject: (id, reason) => api.put(`/courses/admin/${id}/reject`, { rejectionReason: reason }),

  // Reviews
  getReviews: (courseId) => api.get(`/courses/${courseId}/reviews`),
  addReview: (data) => api.post('/courses/reviews', data)
};
