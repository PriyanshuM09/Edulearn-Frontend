import api from './axios';

export const progressApi = {
  // Progress endpoints
  updateProgress: (data) => api.post('/progress/watch', data),
  
  getByStudent: (studentId) => api.get(`/progress/student/${studentId}/lessons`),
  
  getByStudentAndCourse: (studentId, courseId) => 
    api.get(`/progress/student/${studentId}/course/${courseId}`),
  
  getSummary: (studentId, courseId) => 
    api.get(`/progress/summary/${studentId}/${courseId}`),

  forceCertificate: (studentId, courseId) => 
    api.post('/progress/force-certificate', { studentId, courseId }),

  // Certificate endpoints
  getCertificatesByStudent: (studentId) => 
    api.get(`/progress/certificates/student/${studentId}`),
  
  downloadCertificate: (id) => 
    api.get(`/progress/certificates/${id}/download`, { responseType: 'blob' }),
  
  verifyCertificate: (code) => api.get(`/progress/certificates/verify/${code}`)
};
