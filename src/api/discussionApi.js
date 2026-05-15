import api from './axios';

export const discussionApi = {
  // Threads
  createThread: (data) => api.post('/discussions/threads', data),
  
  getThreadsByCourse: (courseId) => api.get(`/discussions/threads/course/${courseId}`),
  
  getThreadById: (id) => api.get(`/discussions/threads/${id}`),
  
  updateThread: (id, data) => api.put(`/discussions/threads/${id}`, data),
  
  deleteThread: (id) => api.delete(`/discussions/threads/${id}`),
  
  pinThread: (id) => api.put(`/discussions/threads/${id}/pin`),
  
  unpinThread: (id) => api.put(`/discussions/threads/${id}/unpin`),
  
  closeThread: (id) => api.put(`/discussions/threads/${id}/close`),
  
  getPinnedThreads: (courseId) => api.get(`/discussions/threads/course/${courseId}/pinned`),
  
  searchThreads: (courseId, keyword) => 
    api.get(`/discussions/threads/course/${courseId}/search?keyword=${keyword}`),

  // Replies
  addReply: (data) => api.post('/discussions/replies', data),
  
  getRepliesByThread: (threadId) => api.get(`/discussions/replies/thread/${threadId}`),
  
  updateReply: (id, content) => api.put(`/discussions/replies/${id}?content=${content}`),
  
  deleteReply: (id) => api.delete(`/discussions/replies/${id}`),
  
  acceptReply: (id) => api.put(`/discussions/replies/${id}/accept`)
};
