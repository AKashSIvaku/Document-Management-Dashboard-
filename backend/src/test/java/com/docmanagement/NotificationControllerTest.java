package com.docmanagement;

import com.example.demo.controller.GlobalExceptionHandler;
import com.example.demo.controller.NotificationController;
import com.example.demo.dto.NotificationResponse;
import com.example.demo.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private MockMvc mockMvc;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    public void testGetAllNotifications_ReturnsList() throws Exception {
        // Arrange
        List<NotificationResponse> list = new ArrayList<>();
        list.add(NotificationResponse.builder().id(1L).message("Notification 1").type("SUCCESS").read(false).build());
        list.add(NotificationResponse.builder().id(2L).message("Notification 2").type("ERROR").read(true).build());
        when(notificationService.getAllNotifications()).thenReturn(list);

        // Act & Assert
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].id", is(1)))
                .andExpect(jsonPath("$.data[0].message", is("Notification 1")))
                .andExpect(jsonPath("$.data[0].type", is("SUCCESS")))
                .andExpect(jsonPath("$.data[1].id", is(2)));
    }

    @Test
    public void testGetUnreadCount_ReturnsCorrectNumber() throws Exception {
        // Arrange
        when(notificationService.getUnreadCount()).thenReturn(5L);

        // Act & Assert
        mockMvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(5)));
    }

    @Test
    public void testGetUnreadCount_ReturnsZeroWhenAllRead() throws Exception {
        // Arrange
        when(notificationService.getUnreadCount()).thenReturn(0L);

        // Act & Assert
        mockMvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(0)));
    }

    @Test
    public void testMarkAsRead_Returns200WithUpdatedNotification() throws Exception {
        // Arrange
        Long notifId = 1L;
        NotificationResponse updated = NotificationResponse.builder()
                .id(notifId)
                .message("Notification 1")
                .type("SUCCESS")
                .read(true)
                .build();
        when(notificationService.markAsRead(notifId)).thenReturn(updated);

        // Act & Assert
        mockMvc.perform(put("/api/notifications/{id}/read", notifId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.read", is(true)));
    }

    @Test
    public void testMarkAsRead_Returns404WhenNotFound() throws Exception {
        // Arrange
        Long notifId = 999L;
        when(notificationService.markAsRead(notifId)).thenThrow(new RuntimeException("Notification not found with id: " + notifId));

        // Act & Assert
        mockMvc.perform(put("/api/notifications/{id}/read", notifId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Notification not found with id: " + notifId)));
    }

    @Test
    public void testMarkAllAsRead_ReturnsCount() throws Exception {
        // Arrange
        when(notificationService.markAllAsRead()).thenReturn(3);

        // Act & Assert
        mockMvc.perform(put("/api/notifications/read-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(3)));
    }

    @Test
    public void testDeleteNotification_Returns200OnSuccess() throws Exception {
        // Arrange
        Long notifId = 1L;
        doNothing().when(notificationService).deleteNotification(notifId);

        // Act & Assert
        mockMvc.perform(delete("/api/notifications/{id}", notifId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Notification deleted successfully")));
    }

    @Test
    public void testDeleteNotification_Returns404WhenNotFound() throws Exception {
        // Arrange
        Long notifId = 999L;
        doThrow(new RuntimeException("Notification not found with id: " + notifId)).when(notificationService).deleteNotification(notifId);

        // Act & Assert
        mockMvc.perform(delete("/api/notifications/{id}", notifId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Notification not found with id: " + notifId)));
    }
}
