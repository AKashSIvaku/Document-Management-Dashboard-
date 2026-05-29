import React from 'react';
import NotificationBell from '../notifications/NotificationBell';
import './Header.css';

export default function Header() {
  return (
    <header className="layout-header">
      <div className="layout-header__container">
        {/* Brand logo & title */}
        <div className="layout-header__brand">
          <div className="layout-header__logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="layout-header__title">DocVault</span>
        </div>

        {/* Action components on the right */}
        <div className="layout-header__actions">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
