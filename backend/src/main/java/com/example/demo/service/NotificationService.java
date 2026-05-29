package com.example.demo.service;

import com.example.demo.dto.NotificationResponse;
import com.example.demo.dto.WebSocketNotification;
import com.example.demo.model.Notification;
import com.example.demo.model.NotificationType;
import com.example.demo.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Creates a notification with a related batch ID, saves it, and pushes via WebSocket.
     */
    public Notification createNotification(String message, NotificationType type, String batchId) {
        Notification notification = Notification.builder()
                .message(message)
                .type(type)
                .read(false)
                .relatedBatchId(batchId)
                .build();
        notification = notificationRepository.save(notification);

        // Push to WebSocket immediately
        WebSocketNotification wsNotification = WebSocketNotification.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType().name())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt().format(FORMATTER))
                .relatedBatchId(notification.getRelatedBatchId())
                .action("NEW")
                .build();

        messagingTemplate.convertAndSend("/topic/notifications", wsNotification);
        return notification;
    }

    /**
     * Creates a notification without a batch ID.
     */
    public Notification createNotification(String message, NotificationType type) {
        return createNotification(message, type, null);
    }

    /**
     * Returns all notifications ordered newest first.
     */
    public List<NotificationResponse> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns the count of unread notifications.
     */
    public long getUnreadCount() {
        return notificationRepository.countByReadFalse();
    }

    /**
     * Marks a single notification as read.
     */
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return toResponse(notification);
    }

    /**
     * Marks all notifications as read. Returns the count of updated rows.
     */
    @Transactional
    public int markAllAsRead() {
        return notificationRepository.markAllAsRead();
    }

    /**
     * Deletes a notification by ID.
     */
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }

    /**
     * Converts a Notification entity to a NotificationResponse DTO.
     */
    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType().name())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt().format(FORMATTER))
                .relatedBatchId(notification.getRelatedBatchId())
                .build();
    }
}
