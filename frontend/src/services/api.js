import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Accept': 'application/json',
  },
});

// ========================
// Document API
// ========================

export const fetchDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

export const uploadSingleFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        onProgress(progressEvent.loaded, progressEvent.total);
      }
    },
  });
  return response.data;
};

export const uploadBulkFiles = async (files, onProgress) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  const response = await api.post('/documents/upload/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        onProgress(progressEvent.loaded, progressEvent.total);
      }
    },
  });
  return response.data;
};

export const downloadDocument = async (id, filename) => {
  const response = await api.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });

  // Trigger browser download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'download');
  document.body.appendChild(link);
  link.click();

  // Cleanup
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

// ========================
// Notification API
// ========================

export const fetchNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const fetchUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export default api;
