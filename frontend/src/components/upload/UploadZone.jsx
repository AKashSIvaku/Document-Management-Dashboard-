import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadSingleFile, uploadBulkFiles } from '../../services/api';
import './UploadZone.css';

let fileIdCounter = 0;

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function getFileIcon(type) {
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📕';
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return '📦';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('text') || type.includes('json') || type.includes('xml')) return '📃';
  return '📄';
}

export default function UploadZone({ onUploadComplete }) {
  const [fileItems, setFileItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkBanner, setBulkBanner] = useState(null);

  const updateFileItem = useCallback((id, updates) => {
    setFileItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  // Upload files individually (1-3 files)
  const uploadIndividually = useCallback(async (items) => {
    const uploadPromises = items.map(async (item) => {
      updateFileItem(item.id, { status: 'uploading', progress: 0 });

      try {
        const result = await uploadSingleFile(item.file, (loaded, total) => {
          const percentage = total > 0 ? Math.round((loaded * 100) / total) : 0;
          updateFileItem(item.id, { progress: percentage });
        });

        if (result.success) {
          updateFileItem(item.id, { status: 'complete', progress: 100 });
        } else {
          updateFileItem(item.id, { status: 'failed', progress: 100 });
        }
        return result;
      } catch (err) {
        updateFileItem(item.id, { status: 'failed', progress: 100 });
        return { success: false, message: err.message };
      }
    });

    await Promise.all(uploadPromises);
  }, [updateFileItem]);

  // Upload files in bulk (4+ files)
  const uploadInBulk = useCallback(async (items) => {
    setBulkBanner(`Upload in progress — processing ${items.length} files in background.`);

    // Mark all as uploading
    items.forEach((item) => {
      updateFileItem(item.id, { status: 'uploading', progress: 0 });
    });

    try {
      const files = items.map((item) => item.file);
      const result = await uploadBulkFiles(files, (loaded, total) => {
        let accumulated = 0;
        items.forEach((item) => {
          if (loaded >= accumulated + item.size) {
            updateFileItem(item.id, { progress: 100, status: 'uploading' });
          } else if (loaded > accumulated) {
            const fileLoaded = loaded - accumulated;
            const percentage = item.size > 0 ? Math.round((fileLoaded * 100) / item.size) : 100;
            updateFileItem(item.id, { progress: percentage, status: 'uploading' });
          } else {
            updateFileItem(item.id, { progress: 0, status: 'pending' });
          }
          accumulated += item.size;
        });
      });

      // Mark all files based on result
      const finalStatus = result.success ? 'complete' : 'failed';
      items.forEach((item) => {
        updateFileItem(item.id, { status: finalStatus, progress: 100 });
      });

      // Clear banner after a moment
      setTimeout(() => setBulkBanner(null), 3000);
    } catch (err) {
      items.forEach((item) => {
        updateFileItem(item.id, { status: 'failed', progress: 100 });
      });
      setBulkBanner(null);
    }
  }, [updateFileItem]);

  // Handle dropped/selected files
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0 || isUploading) return;

    // Create file items
    const newItems = acceptedFiles.map((file) => ({
      id: ++fileIdCounter,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
    }));

    setFileItems((prev) => [...newItems, ...prev]);
    setIsUploading(true);

    try {
      if (newItems.length <= 3) {
        await uploadIndividually(newItems);
      } else {
        await uploadInBulk(newItems);
      }
    } finally {
      setIsUploading(false);
      if (onUploadComplete) {
        onUploadComplete();
      }
    }
  }, [isUploading, uploadIndividually, uploadInBulk, onUploadComplete]);

  const clearCompleted = useCallback(() => {
    setFileItems((prev) => prev.filter((item) => item.status !== 'complete' && item.status !== 'failed'));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: isUploading,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  const hasItems = fileItems.length > 0;
  const completedCount = fileItems.filter((f) => f.status === 'complete' || f.status === 'failed').length;

  return (
    <div className="upload-zone-wrapper">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`upload-dropzone ${isDragActive ? 'upload-dropzone--active' : ''} ${isUploading ? 'upload-dropzone--disabled' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="upload-dropzone__content">
          <div className="upload-dropzone__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="upload-dropzone__text">
            {isDragActive
              ? 'Drop files here...'
              : isUploading
                ? 'Upload in progress...'
                : 'Drag & drop files here or click to browse'}
          </p>
          <p className="upload-dropzone__hint">
            Supports PDF files only • Max 100MB per file
          </p>
        </div>
      </div>

      {/* Bulk upload banner */}
      {bulkBanner && (
        <div className="upload-bulk-banner">
          <div className="upload-bulk-banner__spinner" />
          <span>{bulkBanner}</span>
        </div>
      )}

      {/* File list */}
      {hasItems && (
        <div className="upload-file-list">
          <div className="upload-file-list__header">
            <h3 className="upload-file-list__title">
              Uploads ({fileItems.length})
            </h3>
            {completedCount > 0 && (
              <button className="upload-file-list__clear-btn" onClick={clearCompleted}>
                Clear completed
              </button>
            )}
          </div>

          <div className="upload-file-list__items">
            {fileItems.map((item) => (
              <div key={item.id} className={`upload-file-item upload-file-item--${item.status}`}>
                <div className="upload-file-item__icon">
                  {getFileIcon(item.type)}
                </div>

                <div className="upload-file-item__info">
                  <div className="upload-file-item__name-row">
                    <span className="upload-file-item__name" title={item.name}>
                      {item.name}
                    </span>
                    <span className={`upload-file-item__badge upload-file-item__badge--${item.status}`}>
                      {item.status === 'pending' && 'Pending'}
                      {item.status === 'uploading' && `${item.progress}%`}
                      {item.status === 'complete' && 'Complete'}
                      {item.status === 'failed' && 'Failed'}
                    </span>
                  </div>

                  <div className="upload-file-item__meta">
                    <span className="upload-file-item__size">{formatFileSize(item.size)}</span>
                    <span className="upload-file-item__dot">•</span>
                    <span className="upload-file-item__type">{item.type || 'application/pdf'}</span>
                  </div>

                  {/* Per-file progress bar */}
                  <div className="upload-file-item__progress-track">
                    <div
                      className={`upload-file-item__progress-fill upload-file-item__progress-fill--${item.status}`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
