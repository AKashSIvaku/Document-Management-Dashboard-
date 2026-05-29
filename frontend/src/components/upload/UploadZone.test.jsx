import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadZone from './UploadZone';
import { uploadSingleFile, uploadBulkFiles } from '../../services/api';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, disabled }) => ({
    getRootProps: () => ({
      onClick: jest.fn(),
      'data-testid': 'dropzone-root',
    }),
    getInputProps: () => ({
      onChange: (e) => {
        if (!disabled && e.target.files) {
          onDrop(Array.from(e.target.files));
        }
      },
      'data-testid': 'dropzone-input',
      type: 'file',
      multiple: true,
    }),
    isDragActive: false,
  }),
}));

// Mock api services
jest.mock('../../services/api', () => ({
  uploadSingleFile: jest.fn(),
  uploadBulkFiles: jest.fn(),
}));

describe('UploadZone Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Renders drop zone with correct text', () => {
    render(<UploadZone onUploadComplete={jest.fn()} />);

    expect(screen.getByText(/Drag & drop files here or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/Supports PDF files only • Max 100MB per file/i)).toBeInTheDocument();
  });

  test('Shows file list after files are selected', async () => {
    uploadSingleFile.mockResolvedValue({ success: true });

    render(<UploadZone onUploadComplete={jest.fn()} />);

    const file1 = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const input = screen.getByTestId('dropzone-input');

    // Simulate selecting file
    fireEvent.change(input, { target: { files: [file1] } });

    // Verify file name is shown in list
    await waitFor(() => {
      expect(screen.getByText('hello.txt')).toBeInTheDocument();
    });
  });

  test('Shows per-file progress bars', async () => {
    // Custom mock that reports progress and then resolves
    uploadSingleFile.mockImplementation((file, onProgress) => {
      onProgress(45, 100); // Simulate 45% progress
      return Promise.resolve({ success: true });
    });

    render(<UploadZone onUploadComplete={jest.fn()} />);

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const input = screen.getByTestId('dropzone-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });
  });

  test('Shows bulk banner when more than 3 files are dropped', async () => {
    uploadBulkFiles.mockResolvedValue({ success: true });

    render(<UploadZone onUploadComplete={jest.fn()} />);

    const files = [
      new File(['file1'], 'file1.txt', { type: 'text/plain' }),
      new File(['file2'], 'file2.txt', { type: 'text/plain' }),
      new File(['file3'], 'file3.txt', { type: 'text/plain' }),
      new File(['file4'], 'file4.txt', { type: 'text/plain' }),
    ];

    const input = screen.getByTestId('dropzone-input');
    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(screen.getByText(/Upload in progress — processing 4 files in background/i)).toBeInTheDocument();
    });
  });

  test('Calls onUploadComplete after all files finish', async () => {
    uploadSingleFile.mockResolvedValue({ success: true });
    const onUploadCompleteMock = jest.fn();

    render(<UploadZone onUploadComplete={onUploadCompleteMock} />);

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const input = screen.getByTestId('dropzone-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUploadCompleteMock).toHaveBeenCalledTimes(1);
    });
  });
});
