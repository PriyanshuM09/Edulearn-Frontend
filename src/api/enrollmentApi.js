import api from './axios';

export const enrollmentApi = {
  enroll: (studentId, courseId, additionalData = {}) => 
    api.post('/enrollments', { studentId, courseId, ...additionalData }),
  unenroll: (enrollmentId) => api.delete(`/enrollments/${enrollmentId}`),
  getStudentEnrollments: (studentId) => api.get(`/enrollments/student/${studentId}`),
  getByStudent: (studentId) => api.get(`/enrollments/student/${studentId}`),
  getCourseEnrollments: (courseId) => api.get(`/enrollments/course/${courseId}`),
  getByCourse: (courseId) => api.get(`/enrollments/course/${courseId}`),
  checkEnrollment: (studentId, courseId) =>
    api.get(`/enrollments/check?studentId=${studentId}&courseId=${courseId}`),
  updateProgress: (enrollmentId, progressPercent) =>
    api.put(`/enrollments/${enrollmentId}/progress?progressPercent=${progressPercent}`),
  markComplete: (enrollmentId) => api.put(`/enrollments/${enrollmentId}/complete`),
  cancel: (enrollmentId) => api.put(`/enrollments/${enrollmentId}/cancel`),
  issueCertificate: (enrollmentId) => api.post(`/enrollments/${enrollmentId}/certificate`),
  getCourseCount: (courseId) => api.get(`/enrollments/course/${courseId}/count`),
};
