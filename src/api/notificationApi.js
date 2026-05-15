import api from './axios';

export const notificationApi = {
  send: (data) => api.post('/notifications', data),
  
  sendBulk: (data) => api.post('/notifications/bulk', data),
  
  getByRecipient: (recipientId) => api.get(`/notifications/recipient/${recipientId}`),
  
  getUnread: (recipientId) => api.get(`/notifications/recipient/${recipientId}/unread`),
  
  getUnreadCount: (recipientId) => api.get(`/notifications/recipient/${recipientId}/unread-count`),
  
  getById: (id) => api.get(`/notifications/${id}`),
  
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  
  markAllAsRead: (recipientId) => api.put(`/notifications/recipient/${recipientId}/read-all`),
  
  delete: (id) => api.delete(`/notifications/${id}`)
};
