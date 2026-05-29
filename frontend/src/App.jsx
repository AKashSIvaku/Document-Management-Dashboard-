import React, { useState, useCallback } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import Header from './components/layout/Header';
import UploadZone from './components/upload/UploadZone';
import DocumentList from './components/documents/DocumentList';
import ToastContainer from './components/notifications/ToastContainer';
import './App.css';

function AppContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="app-layout">
      {/* Sticky Header */}
      <Header />

      {/* Main Content Area */}
      <main className="app-main-content">
        <div className="app-main-content__inner">
          <UploadZone onUploadComplete={triggerRefresh} />
          <DocumentList refresh={refreshKey} />
        </div>
      </main>

      {/* Floating Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#dc2626', background: '#ffffff', border: '1px solid #fca5a5', borderRadius: '10px', margin: 20, fontFamily: 'monospace' }}>
          <h3 style={{ color: '#dc2626', marginBottom: 12 }}>🚨 Render Error:</h3>
          <p style={{ fontWeight: 'bold' }}>{this.state.error ? this.state.error.toString() : 'Unknown error'}</p>
          {this.state.error && this.state.error.stack && (
            <pre style={{ background: '#f8fafc', padding: 16, border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', marginTop: 12, color: '#475569' }}>
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ErrorBoundary>
  );
}
