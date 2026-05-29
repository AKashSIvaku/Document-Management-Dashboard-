package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketNotification {
    private Long id;
    private String message;
    private String type;
    private boolean read;
    private String createdAt;
    private String relatedBatchId;
    private String action;
}
