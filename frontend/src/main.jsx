if (typeof global === 'undefined') {
  window.global = window;
}

// Global error catcher to display runtime issues directly on screen
window.onerror = function (message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 24px; color: #f87171; background: #1e1b4b; border: 1px solid rgba(248, 113, 113, 0.2); border-radius: 12px; font-family: monospace; white-space: pre-wrap; margin: 20px;">
      <h3 style="margin-bottom: 12px; color: #ef4444;">🚨 Runtime JavaScript Error:</h3>
      <p style="font-weight: bold; margin-bottom: 8px;">${message}</p>
      <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 12px;">Source: ${source} (Line ${lineno}:${colno})</p>
      <pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; color: #cbd5e1;">${error ? error.stack : 'No stack trace available'}</pre>
    </div>`;
  }
  return false;
};

window.onunhandledrejection = function (event) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 24px; color: #f87171; background: #1e1b4b; border: 1px solid rgba(248, 113, 113, 0.2); border-radius: 12px; font-family: monospace; white-space: pre-wrap; margin: 20px;">
      <h3 style="margin-bottom: 12px; color: #ef4444;">🚨 Unhandled Promise Rejection:</h3>
      <p style="font-weight: bold; margin-bottom: 8px;">${event.reason}</p>
      <pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; color: #cbd5e1;">${event.reason && event.reason.stack ? event.reason.stack : 'No stack trace available'}</pre>
    </div>`;
  }
};

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
