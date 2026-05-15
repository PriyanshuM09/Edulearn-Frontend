import api from './axios';

export const assessmentApi = {
  // ── Quiz ──────────────────────────────────────────────────────────
  createQuiz: (data) => api.post('/quizzes', data),
  getQuizById: (quizId) => api.get(`/quizzes/${quizId}`),
  getQuizzesByCourse: (courseId) => api.get(`/quizzes/course/${courseId}`),
  updateQuiz: (quizId, data) => api.put(`/quizzes/${quizId}`, data),
  publishQuiz: (quizId) => api.put(`/quizzes/${quizId}/publish`),
  deleteQuiz: (quizId) => api.delete(`/quizzes/${quizId}`),

  // ── Questions ─────────────────────────────────────────────────────
  addQuestion: (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data),
  getQuestions: (quizId) => api.get(`/quizzes/${quizId}/questions`),
  updateQuestion: (questionId, data) => api.put(`/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/questions/${questionId}`),

  // ── Attempts ──────────────────────────────────────────────────────
  startAttempt: (studentId, quizId) =>
    api.post(`/attempts/start?studentId=${studentId}&quizId=${quizId}`),
  submitAttempt: (attemptId, data) =>
    api.post(`/attempts/${attemptId}/submit`, data),
  getAttemptsByStudent: (studentId) =>
    api.get(`/attempts/student/${studentId}`),
  getAttemptsByStudentAndQuiz: (studentId, quizId) =>
    api.get(`/attempts/student/${studentId}/quiz/${quizId}`),
  getBestAttempt: (studentId, quizId) =>
    api.get(`/attempts/student/${studentId}/quiz/${quizId}/best`),
  getBestScore: (studentId, quizId) =>
    api.get(`/attempts/student/${studentId}/quiz/${quizId}/score`),
  getRemainingTime: (attemptId, studentId) =>
    api.get(`/attempts/${attemptId}/timer?studentId=${studentId}`),
  saveProgress: (attemptId, studentId, answers) =>
    api.post(`/attempts/${attemptId}/progress?studentId=${studentId}`, answers),
};
