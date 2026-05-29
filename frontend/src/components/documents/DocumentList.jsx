import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { fetchDocuments, downloadDocument, deleteDocument } from '../../services/api';
import './DocumentList.css';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatDate(dateStr) {
  try {
    // Handle "yyyy-MM-dd HH:mm:ss" format from backend
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const date = parseISO(normalized);
    return format(date, "MMM d, yyyy, h:mm a");
  } catch {
    return dateStr;
  }
}

function getFileIcon(type) {
  if (!type) return 'doc-icon--generic';
  if (type === 'application/pdf') return 'doc-icon--pdf';
  if (type.startsWith('image/')) return 'doc-icon--image';
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return 'doc-icon--sheet';
  if (type.includes('word') || type.includes('document')) return 'doc-icon--word';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'doc-icon--slide';
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return 'doc-icon--archive';
  if (type.startsWith('video/')) return 'doc-icon--video';
  if (type.startsWith('audio/')) return 'doc-icon--audio';
  if (type.includes('text') || type.includes('json') || type.includes('xml')) return 'doc-icon--text';
  return 'doc-icon--generic';
}

function getFileEmoji(type) {
  if (!type) return '📄';
  if (type === 'application/pdf') return '📕';
  if (type.startsWith('image/')) return '🖼️';
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return '📊';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return '📦';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('text') || type.includes('json') || type.includes('xml')) return '📃';
  return '📄';
}

function StatusBadge({ status }) {
  const statusMap = {
    COMPLETE: { label: 'Complete', cls: 'complete' },
    UPLOADING: { label: 'Uploading', cls: 'uploading' },
    FAILED: { label: 'Failed', cls: 'failed' },
    PENDING: { label: 'Pending', cls: 'pending' },
  };
  const info = statusMap[status] || statusMap.PENDING;
  return (
    <span className={`doc-status-badge doc-status-badge--${info.cls}`}>
      {info.cls === 'uploading' && <span className="doc-status-badge__dot" />}
      {info.label}
    </span>
  );
}

function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="doc-table__skeleton-row">
      <td><div className="skeleton skeleton--name" /></td>
      <td><div className="skeleton skeleton--small" /></td>
      <td><div className="skeleton skeleton--small" /></td>
      <td><div className="skeleton skeleton--medium" /></td>
      <td><div className="skeleton skeleton--badge" /></td>
      <td><div className="skeleton skeleton--actions" /></td>
    </tr>
  ));
}

function SkeletonCards({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="doc-card doc-card--skeleton">
      <div className="skeleton skeleton--card-icon" />
      <div className="skeleton skeleton--card-name" />
      <div className="skeleton skeleton--card-meta" />
      <div className="skeleton skeleton--card-meta" />
      <div className="skeleton skeleton--card-actions" />
    </div>
  ));
}

export default function DocumentList({ refresh }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDocuments();
      if (response.success) {
        setDocuments(response.data || []);
      } else {
        setError(response.message || 'Failed to load documents');
      }
    } catch (err) {
      setError('Failed to load documents. Please try again.');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount and when refresh prop changes
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refresh]);

  const handleDownload = async (doc) => {
    try {
      await downloadDocument(doc.id, doc.originalName);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDeleteClick = (doc) => {
    setDeleteConfirm(doc);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const docId = deleteConfirm.id;
    setDeleting(docId);
    setDeleteConfirm(null);

    try {
      const response = await deleteDocument(docId);
      if (response.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } else {
        setError('Failed to delete document: ' + (response.message || 'Unknown error'));
        setTimeout(() => setError(null), 4000);
      }
    } catch (err) {
      setError('Failed to delete document. Please try again.');
      setTimeout(() => setError(null), 4000);
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  // ---- Render ----

  return (
    <div className="doc-list-wrapper">
      {/* Header */}
      <div className="doc-list-header">
        <div className="doc-list-header__left">
          <h2 className="doc-list-header__title">Documents</h2>
          {!loading && (
            <span className="doc-list-header__count">{documents.length} files</span>
          )}
        </div>
        <button className="doc-list-header__refresh-btn" onClick={loadDocuments} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'spin' : ''}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="doc-list-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
          <button className="doc-list-error__dismiss" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="doc-delete-overlay" onClick={handleDeleteCancel}>
          <div className="doc-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doc-delete-modal__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="doc-delete-modal__title">Delete Document</h3>
            <p className="doc-delete-modal__text">
              Are you sure you want to delete <strong>"{deleteConfirm.originalName}"</strong>?
              This action cannot be undone.
            </p>
            <div className="doc-delete-modal__actions">
              <button className="doc-delete-modal__cancel" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="doc-delete-modal__confirm" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <React.Fragment key="loading-state">
          {/* Table skeleton for desktop */}
          <table key="table-skeleton" className="doc-table doc-table--skeleton">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRows count={5} />
            </tbody>
          </table>
          {/* Card skeleton for mobile */}
          <div key="cards-skeleton" className="doc-cards doc-cards--skeleton">
            <SkeletonCards count={4} />
          </div>
        </React.Fragment>
      )}

      {/* Empty state */}
      {!loading && documents.length === 0 && (
        <div key="empty-state" className="doc-empty">
          <div className="doc-empty__illustration">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3 className="doc-empty__title">No documents yet</h3>
          <p className="doc-empty__text">
            Upload your first document using the drop zone above.
          </p>
        </div>
      )}

      {/* Documents table (desktop) */}
      {!loading && documents.length > 0 && (
        <table key="table-data" className="doc-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Size</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className={`doc-table__row ${deleting === doc.id ? 'doc-table__row--deleting' : ''}`}>
                <td className="doc-table__name-cell">
                  <span className={`doc-icon ${getFileIcon(doc.fileType)}`}>
                    {getFileEmoji(doc.fileType)}
                  </span>
                  <span className="doc-table__name" title={doc.originalName}>
                    {doc.originalName}
                  </span>
                </td>
                <td className="doc-table__size">{formatFileSize(doc.fileSize)}</td>
                <td className="doc-table__type">{doc.fileType || '—'}</td>
                <td className="doc-table__date">{formatDate(doc.uploadedAt)}</td>
                <td><StatusBadge status={doc.status} /></td>
                <td className="doc-table__actions">
                  <button
                    className="doc-action-btn doc-action-btn--download"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <button
                    className="doc-action-btn doc-action-btn--delete"
                    onClick={() => handleDeleteClick(doc)}
                    disabled={deleting === doc.id}
                    title="Delete"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Documents cards (mobile) */}
      {!loading && documents.length > 0 && (
        <div key="cards-data" className="doc-cards">
          {documents.map((doc) => (
            <div key={doc.id} className={`doc-card ${deleting === doc.id ? 'doc-card--deleting' : ''}`}>
              <div className="doc-card__header">
                <span className={`doc-icon ${getFileIcon(doc.fileType)}`}>
                  {getFileEmoji(doc.fileType)}
                </span>
                <div className="doc-card__title-block">
                  <span className="doc-card__name" title={doc.originalName}>
                    {doc.originalName}
                  </span>
                  <StatusBadge status={doc.status} />
                </div>
              </div>
              <div className="doc-card__meta">
                <div className="doc-card__meta-item">
                  <span className="doc-card__meta-label">Size</span>
                  <span className="doc-card__meta-value">{formatFileSize(doc.fileSize)}</span>
                </div>
                <div className="doc-card__meta-item">
                  <span className="doc-card__meta-label">Type</span>
                  <span className="doc-card__meta-value">{doc.fileType || '—'}</span>
                </div>
                <div className="doc-card__meta-item">
                  <span className="doc-card__meta-label">Uploaded</span>
                  <span className="doc-card__meta-value">{formatDate(doc.uploadedAt)}</span>
                </div>
              </div>
              <div className="doc-card__actions">
                <button
                  className="doc-card-btn doc-card-btn--download"
                  onClick={() => handleDownload(doc)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button
                  className="doc-card-btn doc-card-btn--delete"
                  onClick={() => handleDeleteClick(doc)}
                  disabled={deleting === doc.id}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
