import api from './axios';

export const lessonApi = {
  create: (data) => api.post('/lessons', data),
  getByCourse: (courseId) => api.get(`/lessons/course/${courseId}`),
  getById: (lessonId) => api.get(`/lessons/${lessonId}`),
  update: (lessonId, data) => api.put(`/lessons/${lessonId}`, data),
  delete: (lessonId) => api.delete(`/lessons/${lessonId}`),
  reorder: (courseId, lessonOrder) => api.put(`/lessons/course/${courseId}/reorder`, lessonOrder),
  addResource: (lessonId, data) => api.post(`/lessons/${lessonId}/resources`, data),
  removeResource: (lessonId, resourceId) =>
    api.delete(`/lessons/${lessonId}/resources/${resourceId}`),
  getPreview: (courseId) => api.get(`/lessons/course/${courseId}/preview`),
};
