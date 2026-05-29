import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchNotifications as apiFetchNotifications,
  fetchUnreadCount as apiFetchUnreadCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllRead,
  deleteNotification as apiDeleteNotification,
} from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const NotificationContext = createContext(null);

let toastIdCounter = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef({});

  // ========================
  // Load initial data from API
  // ========================
  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiFetchNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await apiFetchUnreadCount();
      if (response.success) {
        setUnreadCount(response.data || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // ========================
  // Toast management
  // ========================
  const showToast = useCallback((message, type = 'INFO', duration = 5000) => {
    const id = ++toastIdCounter;
    const toast = { id, message, type, createdAt: Date.now() };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete toastTimersRef.current[id];
      }, duration);
      toastTimersRef.current[id] = timer;
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (toastTimersRef.current[id]) {
      clearTimeout(toastTimersRef.current[id]);
      delete toastTimersRef.current[id];
    }
  }, []);

  // Cleanup all toast timers on unmount
  useEffect(() => {
    return () => {
      Object.values(toastTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  // ========================
  // WebSocket handler
  // ========================
  const handleWebSocketNotification = useCallback((data) => {
    if (data.action === 'NEW') {
      // Add new notification to the top of the list
      const notification = {
        id: data.id,
        message: data.message,
        type: data.type,
        read: data.read,
        createdAt: data.createdAt,
        relatedBatchId: data.relatedBatchId,
      };

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show a toast for the new notification
      showToast(data.message, data.type);
    }
  }, [showToast]);

  useWebSocket(handleWebSocketNotification);

  // ========================
  // Notification actions
  // ========================
  const markAsRead = useCallback(async (id) => {
    try {
      const response = await apiMarkAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const response = await apiMarkAllRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const removeNotification = useCallback(async (id) => {
    try {
      const response = await apiDeleteNotification(id);
      if (response.success) {
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === id);
          if (notification && !notification.read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.id !== id);
        });
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  // ========================
  // Context value
  // ========================
  const value = {
    notifications,
    unreadCount,
    toasts,
    loadNotifications,
    markAsRead,
    markAllRead,
    removeNotification,
    showToast,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification state and actions.
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
