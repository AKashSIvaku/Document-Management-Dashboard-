import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../../context/NotificationContext';

// Mock useNotifications hook
jest.mock('../../context/NotificationContext', () => ({
  useNotifications: jest.fn(),
}));

describe('NotificationBell & NotificationPanel Components', () => {
  const markAsReadMock = jest.fn();
  const markAllReadMock = jest.fn();
  const removeNotificationMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Renders bell icon', () => {
    useNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      markAsRead: markAsReadMock,
      markAllRead: markAllReadMock,
      removeNotification: removeNotificationMock,
    });

    render(<NotificationBell />);

    // Verify notifications button is rendered
    const button = screen.getByTitle('Notifications');
    expect(button).toBeInTheDocument();
    // Verify bell SVG icon is rendered (via SVG tag)
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  test('Shows unread badge when count > 0', () => {
    useNotifications.mockReturnValue({
      unreadCount: 3,
      notifications: [],
      markAsRead: markAsReadMock,
      markAllRead: markAllReadMock,
      removeNotification: removeNotificationMock,
    });

    render(<NotificationBell />);

    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('notif-bell-btn__badge');
  });

  test('Hides badge when count is 0', () => {
    useNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      markAsRead: markAsReadMock,
      markAllRead: markAllReadMock,
      removeNotification: removeNotificationMock,
    });

    render(<NotificationBell />);

    const badge = screen.queryByClassName ? screen.queryByClassName('notif-bell-btn__badge') : document.querySelector('.notif-bell-btn__badge');
    expect(badge).toBeNull();
  });

  test('Opens panel on bell click', () => {
    useNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      markAsRead: markAsReadMock,
      markAllRead: markAllReadMock,
      removeNotification: removeNotificationMock,
    });

    render(<NotificationBell />);

    const button = screen.getByTitle('Notifications');
    
    // Panel should not be open initially
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(button);

    // Panel should be visible
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  test('Shows notifications list in panel', () => {
    const mockNotifications = [
      { id: 1, message: 'Upload success', type: 'SUCCESS', read: false, createdAt: '2026-05-29 12:00:00' },
      { id: 2, message: 'Disk alert', type: 'WARNING', read: true, createdAt: '2026-05-29 11:30:00' },
    ];

    useNotifications.mockReturnValue({
      unreadCount: 1,
      notifications: mockNotifications,
      markAsRead: markAsReadMock,
      markAllRead: markAllReadMock,
      removeNotification: removeNotificationMock,
    });

    render(<NotificationBell />);

    // Click to open panel
    const button = screen.getByTitle('Notifications');
    fireEvent.click(button);

    // Verify messages are shown
    expect(screen.getByText('Upload success')).toBeInTheDocument();
    expect(screen.getByText('Disk alert')).toBeInTheDocument();
  });

  test('Calls markAsRead when unread notification is clicked', () => {
    const mockNotifications = [
      { id: 1, message: 'Unread message', type: 'INFO', read: false, createdAt: '2026-05-29 12:00:00' },
    ];

    useNotifications.mockReturnValue({
      unreadCount: 1,
      notifications: mockNotifications,
      markAsRead: markAsReadMock,
      markAllRead: markAllReadMock,
      removeNotification: removeNotificationMock,
    });

    render(<NotificationBell />);

    const button = screen.getByTitle('Notifications');
    fireEvent.click(button);

    // Click the notification item
    const notifItem = screen.getByText('Unread message').closest('.notif-panel-item');
    fireEvent.click(notifItem);

    expect(markAsReadMock).toHaveBeenCalledTimes(1);
    expect(markAsReadMock).toHaveBeenCalledWith(1);
  });

  test('Shows empty state when no notifications', () => {
    useNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      markAsRead: markAsReadMock,
      markAllRead: markAllReadMock,
      removeNotification: removeNotificationMock,
    });

    render(<NotificationBell />);

    const button = screen.getByTitle('Notifications');
    fireEvent.click(button);

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });
});
