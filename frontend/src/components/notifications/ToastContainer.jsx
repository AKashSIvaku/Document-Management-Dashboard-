import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './ToastContainer.css';

function getToastEmoji(type) {
  switch (type) {
    case 'SUCCESS': return '✅';
    case 'ERROR': return '❌';
    case 'WARNING': return '⚠️';
    case 'INFO':
    default: return 'ℹ️';
  }
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-overlay">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-alert toast-alert--${toast.type}`}>
          {/* Icon */}
          <span className="toast-alert__icon">
            {getToastEmoji(toast.type)}
          </span>

          {/* Body */}
          <div className="toast-alert__body">
            <p className="toast-alert__message">{toast.message}</p>
          </div>

          {/* Close button */}
          <button
            className="toast-alert__close"
            onClick={() => dismissToast(toast.id)}
            title="Dismiss toast"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
