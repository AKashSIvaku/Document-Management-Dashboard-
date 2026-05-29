package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.NotificationResponse;
import com.example.demo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications — returns all notifications ordered newest first.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAllNotifications() {
        List<NotificationResponse> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(
                ApiResponse.success("Notifications retrieved successfully", notifications)
        );
    }

    /**
     * GET /api/notifications/unread-count — returns the count of unread notifications.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(
                ApiResponse.success("Unread count retrieved", count)
        );
    }

    /**
     * PUT /api/notifications/{id}/read — marks a single notification as read.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable Long id) {
        NotificationResponse response = notificationService.markAsRead(id);
        return ResponseEntity.ok(
                ApiResponse.success("Notification marked as read", response)
        );
    }

    /**
     * PUT /api/notifications/read-all — marks all notifications as read.
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead() {
        int count = notificationService.markAllAsRead();
        return ResponseEntity.ok(
                ApiResponse.success(count + " notifications marked as read", count)
        );
    }

    /**
     * DELETE /api/notifications/{id} — deletes a single notification.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(
                ApiResponse.success("Notification deleted successfully")
        );
    }
}
