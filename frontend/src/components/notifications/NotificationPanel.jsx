import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import './NotificationPanel.css';

function getNotificationEmoji(type) {
  switch (type) {
    case 'SUCCESS': return '✅';
    case 'ERROR': return '❌';
    case 'WARNING': return '⚠️';
    case 'INFO':
    default: return 'ℹ️';
  }
}

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    removeNotification,
  } = useNotifications();

  const formatNotifTime = (dateStr) => {
    try {
      if (!dateStr || typeof dateStr !== 'string') return '';
      const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
      return formatDistanceToNow(parseISO(normalized), { addSuffix: true });
    } catch {
      return dateStr || '';
    }
  };

  return (
    <div className="notif-panel">
      {/* Dropdown Header */}
      <div className="notif-panel__header">
        <h3 className="notif-panel__title">
          <span>Notifications</span>
          {unreadCount > 0 && <span className="notif-panel__badge">{unreadCount} unread</span>}
        </h3>
        {unreadCount > 0 && (
          <button className="notif-panel__clear-btn" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {/* List Items */}
      <div className="notif-panel__list">
        {notifications.length === 0 ? (
          <div className="notif-panel__empty">
            <span className="notif-panel__empty-icon">🔔</span>
            <span className="notif-panel__empty-text">No notifications yet</span>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-panel-item notif-panel-item--${notif.type} ${!notif.read ? 'notif-panel-item--unread' : ''}`}
              onClick={() => {
                if (!notif.read) markAsRead(notif.id);
              }}
            >
              {/* Type Colored Indicator & Icon */}
              <div className="notif-panel-item__icon">
                {getNotificationEmoji(notif.type)}
              </div>

              {/* Content block */}
              <div className="notif-panel-item__content">
                <span className="notif-panel-item__message">{notif.message}</span>
                <span className="notif-panel-item__time">{formatNotifTime(notif.createdAt)}</span>
              </div>

              {/* Actions: Mark read indicator / Delete */}
              <div className="notif-panel-item__actions">
                {!notif.read && (
                  <span className="notif-panel-item__unread-dot" title="Mark as read" />
                )}
                <button
                  className="notif-panel-item__delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notif.id);
                  }}
                  title="Delete notification"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
