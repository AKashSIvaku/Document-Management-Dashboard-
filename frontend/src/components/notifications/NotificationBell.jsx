import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import './NotificationBell.css';

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Trigger shake animation when unread count increases
  useEffect(() => {
    if (unreadCount > 0) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <div className="notif-bell-container" ref={containerRef}>
      <button
        className={`notif-bell-btn ${isOpen ? 'notif-bell-btn--active' : ''} ${shake ? 'notif-bell-btn--shake' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notifications"
      >
        <div className="notif-bell-btn__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        {unreadCount > 0 && (
          <span className="notif-bell-btn__badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && <NotificationPanel />}
    </div>
  );
}
